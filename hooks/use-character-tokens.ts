"use client"

import { useState, useEffect, useCallback } from "react"
import { useSocket } from "./use-socket"
import type { TokenData } from "@/components/game/tactical-grid"
import { toast } from "sonner"

interface UseCharacterTokensProps {
  campaignId: string
  userRole?: 'GM' | 'PLAYER'
  userId?: string
}

interface UseCharacterTokensReturn {
  tokens: TokenData[]
  selectedTokenIds: string[]
  isLoading: boolean
  error: string | null
  selectToken: (tokenId: string) => void
  selectMultipleTokens: (tokenIds: string[]) => void
  clearSelection: () => void
  moveToken: (tokenId: string, position: { top: number; left: number }) => void
  toggleTokenVisibility: (tokenId: string) => void
  toggleTokenLock: (tokenId: string) => void
  changeTokenOwner: (tokenId: string, ownerId: string) => void
  refreshTokens: () => Promise<void>
}

export function useCharacterTokens({ 
  campaignId, 
  userRole = 'PLAYER',
  userId 
}: UseCharacterTokensProps): UseCharacterTokensReturn {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, { type: string, originalValue: any, timeout: NodeJS.Timeout }>>(new Map())

  const { socket, tokenMoves, clearTokenMoves, isConnected } = useSocket(campaignId)

  // Listen for real-time token property updates
  useEffect(() => {
    if (!socket) return

    const handleVisibilityToggle = (data: any) => {
      if (data.campaignId === campaignId) {
        // Clear pending update for this token
        setPendingUpdates(prev => {
          const updated = new Map(prev)
          const pendingKey = `${data.tokenId}-visibility`
          if (updated.has(pendingKey)) {
            clearTimeout(updated.get(pendingKey)!.timeout)
            updated.delete(pendingKey)
          }
          return updated
        })

        setTokens(prevTokens => 
          prevTokens.map(token => 
            token.id === data.tokenId 
              ? { ...token, hidden: data.hidden }
              : token
          )
        )
      }
    }

    const handleLockToggle = (data: any) => {
      if (data.campaignId === campaignId) {
        // Clear pending update for this token
        setPendingUpdates(prev => {
          const updated = new Map(prev)
          const pendingKey = `${data.tokenId}-lock`
          if (updated.has(pendingKey)) {
            clearTimeout(updated.get(pendingKey)!.timeout)
            updated.delete(pendingKey)
          }
          return updated
        })

        setTokens(prevTokens => 
          prevTokens.map(token => 
            token.id === data.tokenId 
              ? { ...token, canPlayerMove: !data.locked }
              : token
          )
        )
      }
    }

    const handleOwnershipChange = (data: any) => {
      if (data.campaignId === campaignId) {
        // Clear pending update for this token
        setPendingUpdates(prev => {
          const updated = new Map(prev)
          const pendingKey = `${data.tokenId}-ownership`
          if (updated.has(pendingKey)) {
            clearTimeout(updated.get(pendingKey)!.timeout)
            updated.delete(pendingKey)
          }
          return updated
        })

        setTokens(prevTokens => 
          prevTokens.map(token => 
            token.id === data.tokenId 
              ? { ...token, ownerId: data.newOwnerId }
              : token
          )
        )
      }
    }

    const handlePropertiesUpdate = (data: any) => {
      if (data.campaignId === campaignId) {
        // Clear any pending updates for properties changed
        setPendingUpdates(prev => {
          const updated = new Map(prev)
          Object.keys(data.properties).forEach(prop => {
            const pendingKey = `${data.tokenId}-${prop}`
            if (updated.has(pendingKey)) {
              clearTimeout(updated.get(pendingKey)!.timeout)
              updated.delete(pendingKey)
            }
          })
          return updated
        })

        setTokens(prevTokens => 
          prevTokens.map(token => 
            token.id === data.tokenId 
              ? { ...token, ...data.properties }
              : token
          )
        )
      }
    }

    socket.on('token:visibility:toggle', handleVisibilityToggle)
    socket.on('token:lock:toggle', handleLockToggle)
    socket.on('token:ownership:change', handleOwnershipChange)
    socket.on('token:properties:update', handlePropertiesUpdate)

    return () => {
      socket.off('token:visibility:toggle', handleVisibilityToggle)
      socket.off('token:lock:toggle', handleLockToggle)
      socket.off('token:ownership:change', handleOwnershipChange)
      socket.off('token:properties:update', handlePropertiesUpdate)
    }
  }, [socket, campaignId])

  // Load tokens from API
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
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      const loadedTokens = data.tokens || []
      setTokens(loadedTokens)
      console.log('✅ Character tokens loaded successfully:', loadedTokens.length)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('❌ Error loading character tokens:', err)
      setTokens([])
    } finally {
      setIsLoading(false)
    }
  }, [campaignId])

  // Load tokens on mount
  useEffect(() => {
    if (campaignId) {
      console.log('🎯 useCharacterTokens: Loading tokens for campaign:', campaignId)
      loadTokens()
    }
  }, [campaignId, loadTokens])

  // Process token moves from WebSocket
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
      clearTokenMoves()
    }
  }, [tokenMoves, clearTokenMoves])

  // Token selection functions
  const selectToken = useCallback((tokenId: string) => {
    setSelectedTokenIds(prev => {
      if (prev.includes(tokenId)) {
        return prev.filter(id => id !== tokenId)
      } else {
        return [tokenId] // Single selection by default
      }
    })
  }, [])

  const selectMultipleTokens = useCallback((tokenIds: string[]) => {
    setSelectedTokenIds(tokenIds)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTokenIds([])
  }, [])

  // Token movement
  const moveToken = useCallback((tokenId: string, position: { top: number; left: number }) => {
    const token = tokens.find(t => t.id === tokenId)
    if (!token) return

    const canMove = userRole === 'GM' || 
                   (token.ownerId === userId) || 
                   (token.canPlayerMove !== false && userRole === 'PLAYER')

    if (!canMove) {
      toast.error('Você não tem permissão para mover este token')
      return
    }

    // Optimistic update
    setTokens(prevTokens => 
      prevTokens.map(t => 
        t.id === tokenId 
          ? { ...t, position }
          : t
      )
    )

    // Send via WebSocket
    if (socket && isConnected) {
      socket.emit('token_move', {
        campaignId,
        tokenId,
        position
      })
    }
  }, [tokens, userRole, userId, socket, isConnected, campaignId])

  // Toggle token visibility (GM only) with optimistic updates
  const toggleTokenVisibility = useCallback(async (tokenId: string) => {
    if (userRole !== 'GM') {
      toast.error('Apenas o mestre pode alterar a visibilidade dos tokens')
      return
    }

    // Get current token state for rollback
    const currentToken = tokens.find(t => t.id === tokenId)
    if (!currentToken) return

    const originalHidden = (currentToken as any).hidden || false

    try {
      // Optimistic update
      setTokens(prevTokens => 
        prevTokens.map(token => 
          token.id === tokenId 
            ? { ...token, hidden: !originalHidden }
            : token
        )
      )

      // Send WebSocket event for real-time sync
      if (socket && isConnected) {
        socket.emit('token:toggle-visibility', {
          campaignId,
          tokenId
        })
        
        // Note: Timeout removed to prevent infinite loops
        // WebSocket should handle confirmation directly
        
        console.log('🔄 Visibility toggle sent via WebSocket:', tokenId)
      } else {
        throw new Error('Não conectado ao servidor')
      }

    } catch (error) {
      console.error('Error toggling token visibility:', error)
      
      // Rollback optimistic update
      setTokens(prevTokens => 
        prevTokens.map(token => 
          token.id === tokenId 
            ? { ...token, hidden: originalHidden }
            : token
        )
      )
      
      toast.error('Erro ao alterar visibilidade do token')
    }
  }, [tokens, userRole, campaignId, socket, isConnected])

  // Toggle token lock (GM only) with optimistic updates
  const toggleTokenLock = useCallback(async (tokenId: string) => {
    if (userRole !== 'GM') {
      toast.error('Apenas o mestre pode bloquear/desbloquear tokens')
      return
    }

    // Get current token state for rollback
    const currentToken = tokens.find(t => t.id === tokenId)
    if (!currentToken) return

    const originalCanMove = currentToken.canPlayerMove !== false

    try {
      // Optimistic update
      setTokens(prevTokens => 
        prevTokens.map(token => 
          token.id === tokenId 
            ? { ...token, canPlayerMove: !originalCanMove }
            : token
        )
      )

      // Send WebSocket event for real-time sync
      if (socket && isConnected) {
        socket.emit('token:toggle-lock', {
          campaignId,
          tokenId
        })
        
        console.log('🔒 Lock toggle sent via WebSocket:', tokenId)
      } else {
        throw new Error('Não conectado ao servidor')
      }

    } catch (error) {
      console.error('Error toggling token lock:', error)
      
      // Rollback optimistic update
      setTokens(prevTokens => 
        prevTokens.map(token => 
          token.id === tokenId 
            ? { ...token, canPlayerMove: originalCanMove }
            : token
        )
      )
      
      toast.error('Erro ao alterar bloqueio do token')
    }
  }, [tokens, userRole, campaignId, socket, isConnected])

  // Change token owner (GM only) with optimistic updates
  const changeTokenOwner = useCallback(async (tokenId: string, newOwnerId: string) => {
    if (userRole !== 'GM') {
      toast.error('Apenas o mestre pode alterar a propriedade dos tokens')
      return
    }

    // Get current token state for rollback
    const currentToken = tokens.find(t => t.id === tokenId)
    if (!currentToken) return

    const originalOwnerId = currentToken.ownerId

    try {
      // Optimistic update
      setTokens(prevTokens => 
        prevTokens.map(token => 
          token.id === tokenId 
            ? { ...token, ownerId: newOwnerId }
            : token
        )
      )

      // Send WebSocket event for real-time sync
      if (socket && isConnected) {
        socket.emit('token:change-ownership', {
          campaignId,
          tokenId,
          newOwnerId
        })
        
        console.log('👥 Ownership change sent via WebSocket:', tokenId, 'to', newOwnerId)
      } else {
        throw new Error('Não conectado ao servidor')
      }

    } catch (error) {
      console.error('Error changing token owner:', error)
      
      // Rollback optimistic update
      setTokens(prevTokens => 
        prevTokens.map(token => 
          token.id === tokenId 
            ? { ...token, ownerId: originalOwnerId }
            : token
        )
      )
      
      toast.error('Erro ao alterar proprietário do token')
    }
  }, [tokens, userRole, campaignId, socket, isConnected])

  return {
    tokens,
    selectedTokenIds,
    isLoading,
    error,
    selectToken,
    selectMultipleTokens,
    clearSelection,
    moveToken,
    toggleTokenVisibility,
    toggleTokenLock,
    changeTokenOwner,
    refreshTokens: loadTokens
  }
}