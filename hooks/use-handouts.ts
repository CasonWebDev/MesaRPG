"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from './use-socket'

export interface Handout {
  id: string
  name: string
  content: string
  attachments: string[]
  sharedWith: string[]
  campaignId: string
  createdAt: string
  updatedAt: string
}

interface UseHandoutsReturn {
  handouts: Handout[]
  isLoading: boolean
  error: string | null
  createHandout: (data: { name: string; content: string; attachments?: string[]; sharedWith?: string[] }) => Promise<void>
  updateHandout: (id: string, data: { name: string; content: string; attachments?: string[] }) => Promise<void>
  deleteHandout: (id: string) => Promise<void>
  shareHandout: (id: string, sharedWith: string[]) => Promise<void>
  refreshHandouts: () => Promise<void>
}

export function useHandouts(campaignId: string): UseHandoutsReturn {
  const [handouts, setHandouts] = useState<Handout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()
  const { socket } = useSocket(campaignId)

  const fetchHandouts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/campaigns/${campaignId}/handouts`)
      if (!response.ok) {
        throw new Error('Erro ao carregar handouts')
      }
      
      const data = await response.json()
      setHandouts(data.handouts.map((handout: any) => ({
        ...handout,
        attachments: typeof handout.attachments === 'string' 
          ? JSON.parse(handout.attachments || '[]') 
          : handout.attachments || [],
        sharedWith: typeof handout.sharedWith === 'string' 
          ? JSON.parse(handout.sharedWith || '[]') 
          : handout.sharedWith || []
      })))
    } catch (err) {
      console.error('Erro ao buscar handouts:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }, [campaignId])

  const createHandout = useCallback(async (data: { 
    name: string; 
    content: string; 
    attachments?: string[]; 
    sharedWith?: string[] 
  }) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/campaigns/${campaignId}/handouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar handout')
      }
      
      const result = await response.json()
      const newHandout = {
        ...result.handout,
        attachments: typeof result.handout.attachments === 'string' 
          ? JSON.parse(result.handout.attachments || '[]') 
          : result.handout.attachments || [],
        sharedWith: typeof result.handout.sharedWith === 'string' 
          ? JSON.parse(result.handout.sharedWith || '[]') 
          : result.handout.sharedWith || []
      }
      
      setHandouts(prev => [newHandout, ...prev])
      
      // Emitir evento via WebSocket
      if (socket) {
        socket.emit('handout-created', { campaignId, handout: newHandout })
      }
    } catch (err) {
      console.error('Erro ao criar handout:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    }
  }, [campaignId, socket])

  const updateHandout = useCallback(async (id: string, data: { 
    name: string; 
    content: string; 
    attachments?: string[] 
  }) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/campaigns/${campaignId}/handouts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar handout')
      }
      
      const result = await response.json()
      const updatedHandout = {
        ...result.handout,
        attachments: typeof result.handout.attachments === 'string' 
          ? JSON.parse(result.handout.attachments || '[]') 
          : result.handout.attachments || [],
        sharedWith: typeof result.handout.sharedWith === 'string' 
          ? JSON.parse(result.handout.sharedWith || '[]') 
          : result.handout.sharedWith || []
      }
      
      setHandouts(prev => prev.map(handout => 
        handout.id === id ? updatedHandout : handout
      ))
      
      // Emitir evento via WebSocket
      if (socket) {
        socket.emit('handout-updated', { campaignId, handout: updatedHandout })
      }
    } catch (err) {
      console.error('Erro ao atualizar handout:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    }
  }, [campaignId, socket])

  const deleteHandout = useCallback(async (id: string) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/campaigns/${campaignId}/handouts/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao deletar handout')
      }
      
      setHandouts(prev => prev.filter(handout => handout.id !== id))
      
      // Emitir evento via WebSocket
      if (socket) {
        socket.emit('handout-deleted', { campaignId, handoutId: id })
      }
    } catch (err) {
      console.error('Erro ao deletar handout:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    }
  }, [campaignId, socket])

  const shareHandout = useCallback(async (id: string, sharedWith: string[]) => {
    try {
      setError(null)
      
      const response = await fetch(`/api/campaigns/${campaignId}/handouts/${id}/share`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sharedWith })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao compartilhar handout')
      }
      
      const result = await response.json()
      const updatedHandout = {
        ...result.handout,
        attachments: typeof result.handout.attachments === 'string' 
          ? JSON.parse(result.handout.attachments || '[]') 
          : result.handout.attachments || [],
        sharedWith: typeof result.handout.sharedWith === 'string' 
          ? JSON.parse(result.handout.sharedWith || '[]') 
          : result.handout.sharedWith || []
      }
      
      setHandouts(prev => prev.map(handout => 
        handout.id === id ? updatedHandout : handout
      ))
      
      // Emitir evento via WebSocket
      if (socket) {
        socket.emit('handout-shared', { campaignId, handout: updatedHandout })
        
        // Emitir notificação específica para jogadores afetados
        socket.emit('handout:shared', {
          handoutId: id,
          handoutName: updatedHandout.name,
          sharedWith: sharedWith,
          sharedBy: session?.user?.name || 'GM',
          campaignId
        })
      }
    } catch (err) {
      console.error('Erro ao compartilhar handout:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      throw err
    }
  }, [campaignId, socket])

  const refreshHandouts = useCallback(async () => {
    await fetchHandouts()
  }, [fetchHandouts])

  // Carregar handouts na inicialização
  useEffect(() => {
    fetchHandouts()
  }, [fetchHandouts])

  // Escutar eventos WebSocket
  useEffect(() => {
    if (!socket) return

    const handleHandoutCreated = (data: { handout: Handout }) => {
      setHandouts(prev => {
        // Verificar se já existe para evitar duplicatas
        if (prev.some(h => h.id === data.handout.id)) return prev
        return [data.handout, ...prev]
      })
    }

    const handleHandoutUpdated = (data: { handout: Handout }) => {
      setHandouts(prev => prev.map(handout => 
        handout.id === data.handout.id ? data.handout : handout
      ))
    }

    const handleHandoutDeleted = (data: { handoutId: string }) => {
      setHandouts(prev => prev.filter(handout => handout.id !== data.handoutId))
    }

    const handleHandoutShared = (data: { handout: Handout }) => {
      setHandouts(prev => prev.map(handout => 
        handout.id === data.handout.id ? data.handout : handout
      ))
    }

    socket.on('handout-created', handleHandoutCreated)
    socket.on('handout-updated', handleHandoutUpdated)
    socket.on('handout-deleted', handleHandoutDeleted)
    socket.on('handout-shared', handleHandoutShared)

    return () => {
      socket.off('handout-created', handleHandoutCreated)
      socket.off('handout-updated', handleHandoutUpdated)
      socket.off('handout-deleted', handleHandoutDeleted)
      socket.off('handout-shared', handleHandoutShared)
    }
  }, [socket])

  return {
    handouts,
    isLoading,
    error,
    createHandout,
    updateHandout,
    deleteHandout,
    shareHandout,
    refreshHandouts
  }
}