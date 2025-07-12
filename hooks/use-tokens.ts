"use client"

import { useState, useEffect, useCallback } from "react"
import { useSocket } from "./use-socket"
import type { TokenData } from "@/components/game/tactical-grid"
import { toast } from "sonner"

interface UseTokensProps {
  campaignId: string
  userRole?: 'GM' | 'PLAYER'
  userId?: string
}

interface UseTokensReturn {
  tokens: TokenData[]
  selectedTokenIds: string[]
  isLoading: boolean
  error: string | null
  selectToken: (tokenId: string) => void
  selectMultipleTokens: (tokenIds: string[]) => void
  clearSelection: () => void
  moveToken: (tokenId: string, position: { top: number; left: number }) => void
  createToken: (tokenData: Omit<TokenData, 'id'>) => Promise<void>
  removeToken: (tokenId: string) => void
  refreshTokens: () => Promise<void>
}

export function useTokens({ 
  campaignId, 
  userRole = 'PLAYER',
  userId 
}: UseTokensProps): UseTokensReturn {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { socket, tokenMoves, clearTokenMoves, isConnected } = useSocket(campaignId)

  // Carregar tokens do servidor
  const loadTokens = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/campaigns/${campaignId}/tokens`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Não autorizado - verifique se você está logado')
        }
        if (response.status === 403) {
          throw new Error('Acesso negado - você não tem permissão para esta campanha')
        }
        if (response.status === 404) {
          throw new Error('Campanha não encontrada')
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Se há um erro na resposta
      if (data.error) {
        throw new Error(data.error)
      }
      
      const loadedTokens = data.tokens || []
      
      // Garantir que cada token tem um ID único
      const tokensWithIds = loadedTokens.map((token: any, index: number) => ({
        ...token,
        id: token.id || `token-${Date.now()}-${index}`
      }))

      setTokens(tokensWithIds)
      console.log('✅ Tokens carregados com sucesso:', tokensWithIds.length)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('❌ Erro ao carregar tokens:', err)
      
      // Se não conseguir carregar, inicializar com array vazio
      setTokens([])
    } finally {
      setIsLoading(false)
    }
  }, [campaignId])

  // Carregar tokens iniciais
  useEffect(() => {
    if (campaignId) {
      console.log('🎯 useTokens: Loading tokens for campaign:', campaignId)
      loadTokens()
    }
  }, [campaignId, loadTokens])

  // Processar movimentos de tokens recebidos via WebSocket
  useEffect(() => {
    if (tokenMoves.length > 0) {
      tokenMoves.forEach(tokenMove => {
        setTokens(prevTokens => 
          prevTokens.map(token => 
            token.id === tokenMove.tokenId 
              ? { ...token, position: tokenMove.position }
              : token
          )
        )
      })
      
      // Limpar movimentos processados
      clearTokenMoves()
    }
  }, [tokenMoves, clearTokenMoves])

  // Seleção de tokens
  const selectToken = useCallback((tokenId: string) => {
    setSelectedTokenIds(prev => {
      if (prev.includes(tokenId)) {
        return prev.filter(id => id !== tokenId)
      } else {
        return [tokenId] // Seleção única por padrão
      }
    })
  }, [])

  const selectMultipleTokens = useCallback((tokenIds: string[]) => {
    setSelectedTokenIds(tokenIds)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTokenIds([])
  }, [])

  // Movimento de tokens - SEM PERMISSÕES (movimento livre)
  const moveToken = useCallback((tokenId: string, position: { top: number; left: number }) => {
    const token = tokens.find(t => t.id === tokenId)
    if (!token) return

    console.log('🎯 useTokens.moveToken:', { tokenId, position })

    // Atualizar localmente (optimistic update)
    setTokens(prevTokens => 
      prevTokens.map(t => 
        t.id === tokenId 
          ? { ...t, position }
          : t
      )
    )

    // Enviar via WebSocket para persistência
    if (socket && isConnected) {
      console.log('📡 Sending token_move via WebSocket:', { campaignId, tokenId, position })
      socket.emit('token_move', {
        campaignId,
        tokenId,
        position
      })
    }
  }, [tokens, socket, isConnected, campaignId])

  // Criar token
  const createToken = useCallback(async (tokenData: Omit<TokenData, 'id'>) => {
    try {
      const newToken: TokenData = {
        ...tokenData,
        id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      // Atualizar localmente primeiro
      setTokens(prevTokens => [...prevTokens, newToken])

      // Salvar no servidor
      const currentTokens = [...tokens, newToken]
      
      const response = await fetch(`/api/campaigns/${campaignId}/game-state`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens: currentTokens
        })
      })

      if (!response.ok) {
        // Reverter mudança local se falhou
        setTokens(prevTokens => prevTokens.filter(t => t.id !== newToken.id))
        throw new Error('Erro ao salvar token no servidor')
      }

      // Notificar outros usuários via WebSocket
      if (socket && isConnected) {
        socket.emit('game:update-state', {
          campaignId,
          gameState: { tokens: currentTokens }
        })
      }

    } catch (error) {
      console.error('Erro ao criar token:', error)
      throw error
    }
  }, [tokens, campaignId, socket, isConnected])

  // Remover token
  const removeToken = useCallback(async (tokenId: string) => {
    try {
      // Verificar permissões
      const token = tokens.find(t => t.id === tokenId)
      if (!token) return

      const canRemove = userRole === 'GM' || token.ownerId === userId

      if (!canRemove) {
        toast.error('Você não tem permissão para remover este token')
        return
      }

      // Atualizar localmente primeiro
      const newTokens = tokens.filter(t => t.id !== tokenId)
      setTokens(newTokens)

      // Remover da seleção se estiver selecionado
      setSelectedTokenIds(prev => prev.filter(id => id !== tokenId))

      // Salvar no servidor
      const response = await fetch(`/api/campaigns/${campaignId}/game-state`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens: newTokens
        })
      })

      if (!response.ok) {
        // Reverter mudança local se falhou
        setTokens(tokens)
        throw new Error('Erro ao remover token do servidor')
      }

      // Notificar outros usuários via WebSocket
      if (socket && isConnected) {
        socket.emit('game:update-state', {
          campaignId,
          gameState: { tokens: newTokens }
        })
      }

      toast.success('Token removido com sucesso')

    } catch (error) {
      console.error('Erro ao remover token:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao remover token')
    }
  }, [tokens, userRole, userId, campaignId, socket, isConnected])

  return {
    tokens,
    selectedTokenIds,
    isLoading,
    error,
    selectToken,
    selectMultipleTokens,
    clearSelection,
    moveToken,
    createToken,
    removeToken,
    refreshTokens: loadTokens
  }
}