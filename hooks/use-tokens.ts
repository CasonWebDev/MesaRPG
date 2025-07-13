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
  updateToken: (tokenId: string, updates: Partial<TokenData>) => Promise<void>
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

  const { socket, tokenMoves, tokenCreations, tokenUpdates, tokenRefreshes, tokensCleared, tokensDeleted, clearTokenMoves, clearTokenCreations, clearTokenUpdates, clearTokenRefreshes, clearTokensCleared, clearTokensDeleted, isConnected } = useSocket(campaignId)

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
      
      // Debug: Check if tokens have size properties after loading
      tokensWithIds.forEach(token => {
        if (token.tokenSize || token.sizeType) {
          console.log(`📏 Client: Token loaded with size:`, {
            id: token.id,
            name: token.name,
            tokenSize: token.tokenSize,
            sizeType: token.sizeType
          })
        }
      })
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

  // Processar criações de tokens recebidas via WebSocket
  useEffect(() => {
    if (tokenCreations.length > 0) {
      tokenCreations.forEach(tokenCreation => {
        console.log('🎯 Processing token creation from WebSocket:', tokenCreation.token)
        setTokens(prevTokens => {
          // Verificar se o token já existe (evitar duplicatas)
          const exists = prevTokens.some(token => token.id === tokenCreation.token.id)
          if (exists) {
            console.log('Token already exists, skipping:', tokenCreation.token.id)
            return prevTokens
          }
          
          console.log('Adding new token to local state:', tokenCreation.token.id)
          return [...prevTokens, tokenCreation.token]
        })
      })
      
      // Limpar criações processadas
      clearTokenCreations()
    }
  }, [tokenCreations, clearTokenCreations])

  // Processar atualizações de tokens recebidas via WebSocket
  useEffect(() => {
    if (tokenUpdates.length > 0) {
      tokenUpdates.forEach(tokenUpdate => {
        console.log('🔄 Processing token update from WebSocket:', tokenUpdate)
        
        // Debug: Check if this is a size update
        const isSizeUpdate = tokenUpdate.updates?.tokenSize || tokenUpdate.updates?.sizeType
        if (isSizeUpdate) {
          console.log(`📏 Client: Size update for token ${tokenUpdate.tokenId}:`, {
            tokenSize: tokenUpdate.updates.tokenSize,
            sizeType: tokenUpdate.updates.sizeType
          })
        }
        
        // Debug: Check if this is a large avatar update
        const hasLargeAvatar = tokenUpdate.updates?.src && tokenUpdate.updates.src.length > 1000
        if (hasLargeAvatar) {
          console.log(`🖼️ Client: Large avatar update for token ${tokenUpdate.tokenId}, size: ${tokenUpdate.updates.src.length}`)
        }
        
        setTokens(prevTokens => {
          const updatedTokens = prevTokens.map(token => 
            token.id === tokenUpdate.tokenId 
              ? { ...token, ...tokenUpdate.updates }
              : token
          )
          
          if (hasLargeAvatar) {
            const updatedToken = updatedTokens.find(t => t.id === tokenUpdate.tokenId)
            console.log(`🖼️ Client: Token updated with avatar, final src length: ${updatedToken?.src?.length || 0}`)
          }
          
          return updatedTokens
        })
      })
      
      // Limpar atualizações processadas
      clearTokenUpdates()
    }
  }, [tokenUpdates, clearTokenUpdates])

  // Processar notificações de refresh de tokens (para dados grandes)
  useEffect(() => {
    if (tokenRefreshes.length > 0) {
      tokenRefreshes.forEach(tokenRefresh => {
        console.log('🔔 Processing token refresh notification from WebSocket:', tokenRefresh)
        
        // Reload tokens from server to get updated data including large avatars
        loadTokens()
      })
      
      // Limpar notificações processadas
      clearTokenRefreshes()
    }
  }, [tokenRefreshes, clearTokenRefreshes, loadTokens])

  // Processar limpeza de tokens recebida via WebSocket
  useEffect(() => {
    if (tokensCleared.length > 0) {
      tokensCleared.forEach(tokensClear => {
        console.log('🧹 Processing tokens clear from WebSocket:', tokensClear)
        console.log(`Clearing all tokens for campaign ${tokensClear.campaignId} by ${tokensClear.userName}`)
        setTokens([])
      })
      
      // Limpar eventos processados
      clearTokensCleared()
    }
  }, [tokensCleared, clearTokensCleared])

  // Processar tokens deletados recebidos via WebSocket
  useEffect(() => {
    if (tokensDeleted.length > 0) {
      tokensDeleted.forEach(tokenDelete => {
        console.log('🗑️ Processing token delete from WebSocket:', tokenDelete)
        console.log(`Removing token ${tokenDelete.tokenId} for campaign ${tokenDelete.campaignId} by ${tokenDelete.userId}`)
        setTokens(prev => prev.filter(token => token.id !== tokenDelete.tokenId))
        setSelectedTokenIds(prev => prev.filter(id => id !== tokenDelete.tokenId))
      })
      
      // Limpar eventos processados
      clearTokensDeleted()
    }
  }, [tokensDeleted, clearTokensDeleted])

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

      console.log('🎯 Creating token:', newToken)

      // Atualizar localmente primeiro (optimistic update)
      setTokens(prevTokens => [...prevTokens, newToken])

      // Enviar via WebSocket para persistência e sincronização
      if (socket && isConnected) {
        console.log('📡 Sending token_create via WebSocket')
        socket.emit('token_create', {
          campaignId,
          tokenData: newToken
        })
      } else {
        console.log('❌ No socket connection, falling back to HTTP')
        // Fallback para HTTP se WebSocket não estiver disponível
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
      }

      console.log('✅ Token creation initiated successfully')

    } catch (error) {
      console.error('❌ Erro ao criar token:', error)
      // Reverter mudança local em caso de erro
      setTokens(prevTokens => prevTokens.filter(t => t.id !== newToken.id))
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

      // Notificar outros usuários via WebSocket sobre a remoção específica do token
      if (socket && isConnected) {
        console.log('📡 Broadcasting token removal via WebSocket:', tokenId)
        socket.emit('token_delete', {
          campaignId,
          tokenId,
          userId
        })
      }

      toast.success('Token removido com sucesso')

    } catch (error) {
      console.error('Erro ao remover token:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao remover token')
    }
  }, [tokens, userRole, userId, campaignId, socket, isConnected])

  // Atualizar token
  const updateToken = useCallback(async (tokenId: string, updates: Partial<TokenData>) => {
    try {
      const token = tokens.find(t => t.id === tokenId)
      if (!token) {
        throw new Error('Token não encontrado')
      }

      // Criar token atualizado
      const updatedToken = { ...token, ...updates }

      console.log('🎯 Updating token:', { tokenId, updates })

      // Atualizar localmente primeiro (optimistic update)
      setTokens(prevTokens => 
        prevTokens.map(t => 
          t.id === tokenId 
            ? updatedToken
            : t
        )
      )

      // Always use WebSocket for token updates (players can't use HTTP API)
      if (socket && isConnected) {
        // Check if updates contain large data (base64 images)
        const hasLargeData = JSON.stringify(updates).length > 50000 // 50KB limit
        
        if (hasLargeData) {
          console.log('🖼️ Large data detected, using WebSocket notification approach for players')
          
          // Send lightweight notification via WebSocket for sync
          console.log('📡 Sending lightweight update notification via WebSocket')
          socket.emit('token_update_notification', {
            campaignId,
            tokenId,
            updateType: 'character_link',
            characterId: updates.characterId,
            characterName: updates.name,
            characterType: updates.characterType
          })
        } else {
          console.log('📡 Sending token_update via WebSocket')
          socket.emit('token_update', {
            campaignId,
            tokenId,
            updates: updates
          })
        }
      } else {
        console.log('❌ No socket connection available')
        throw new Error('Conexão WebSocket necessária para atualizar tokens')
      }

      console.log('✅ Token update initiated successfully')

    } catch (error) {
      console.error('❌ Erro ao atualizar token:', error)
      // Reverter mudança local em caso de erro
      const originalToken = tokens.find(t => t.id === tokenId)
      if (originalToken) {
        setTokens(prevTokens => 
          prevTokens.map(t => t.id === tokenId ? originalToken : t)
        )
      }
      throw error
    }
  }, [tokens, campaignId, socket, isConnected])

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
    updateToken,
    removeToken,
    refreshTokens: loadTokens
  }
}