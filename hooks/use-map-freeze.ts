"use client"

import { useState, useEffect } from "react"
import { useSocket } from "./use-socket"
import { useToast } from "@/components/ui/use-toast"

interface MapFreezeState {
  mapFrozen: boolean
  frozenBy: string | null
  frozenByName: string | null
  frozenAt: string | null
}

interface UseMapFreezeReturn extends MapFreezeState {
  loading: boolean
  toggleFreeze: () => Promise<void>
  isGM: boolean
}

export function useMapFreeze(campaignId: string, isGM: boolean = false): UseMapFreezeReturn {
  const [mapFrozen, setMapFrozen] = useState(false)
  const [frozenBy, setFrozenBy] = useState<string | null>(null)
  const [frozenByName, setFrozenByName] = useState<string | null>(null)
  const [frozenAt, setFrozenAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const { socket } = useSocket(campaignId)
  const { toast } = useToast()

  // Carregar estado inicial
  useEffect(() => {
    const loadFreezeState = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/freeze-map`)
        if (response.ok) {
          const data = await response.json()
          setMapFrozen(data.mapFrozen || false)
          setFrozenBy(data.frozenBy)
          setFrozenByName(data.frozenByName)
          setFrozenAt(data.frozenAt)
        }
      } catch (error) {
        console.error('❌ Error loading freeze state:', error)
      }
    }

    loadFreezeState()
  }, [campaignId])

  // Escutar mudanças via WebSocket
  useEffect(() => {
    if (!socket) return

    const handleFrozenChanged = (data: {
      mapFrozen: boolean
      frozenBy?: string
      frozenByName?: string
      frozenAt?: string | null
    }) => {
      console.log('🔒 Map freeze state changed (hook):', data)
      setMapFrozen(data.mapFrozen)
      setFrozenBy(data.frozenBy || null)
      setFrozenByName(data.frozenByName || null)
      setFrozenAt(data.frozenAt)
      
      // Notificação apenas para o GM
      if (isGM) {
        toast({
          title: data.mapFrozen ? "Mapa Congelado" : "Mapa Liberado",
          description: data.mapFrozen 
            ? "Os jogadores não verão mudanças no mapa até você liberar"
            : "Os jogadores agora podem ver todas as mudanças no mapa",
          variant: "default"
        })
      }
    }

    socket.on('map:frozen-changed', handleFrozenChanged)

    return () => {
      socket.off('map:frozen-changed', handleFrozenChanged)
    }
  }, [socket, toast, isGM])

  const toggleFreeze = async () => {
    if (loading || !isGM) return
    
    setLoading(true)
    const newFrozenState = !mapFrozen

    try {
      // Tentar via WebSocket primeiro (mais rápido)
      if (socket) {
        socket.emit('map:freeze', {
          campaignId,
          frozen: newFrozenState
        })
      }

      // Fallback HTTP
      const response = await fetch(`/api/campaigns/${campaignId}/freeze-map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ frozen: newFrozenState })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle freeze state')
      }

      const data = await response.json()
      
      // Atualizar estado local (WebSocket também fará isso, mas para garantia)
      setMapFrozen(data.mapFrozen)
      setFrozenBy(data.frozenBy)
      setFrozenByName(data.frozenByName)
      setFrozenAt(data.frozenAt)

    } catch (error) {
      console.error('❌ Error toggling freeze state:', error)
      toast({
        title: "Erro",
        description: "Não foi possível alterar o estado do mapa. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    mapFrozen,
    frozenBy,
    frozenByName,
    frozenAt,
    loading,
    toggleFreeze,
    isGM
  }
}