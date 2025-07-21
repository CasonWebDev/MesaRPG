import { useState, useEffect } from 'react'
import { useSocket } from './use-socket'

interface MapFreezeState {
  mapFrozen: boolean
  frozenBy: string | null
  frozenByName: string | null
  frozenAt: string | null
  loading: boolean
}

export function useMapFreeze(campaignId: string, isGM: boolean) {
  const [state, setState] = useState<MapFreezeState>({
    mapFrozen: false,
    frozenBy: null,
    frozenByName: null,
    frozenAt: null,
    loading: false
  })
  
  const { socket } = useSocket(campaignId)

  // Debug log para confirmar que o hook está sendo executado
  console.log('🔒 useMapFreeze hook iniciado:', { campaignId, isGM, hasSocket: !!socket })

  // Função para alternar estado do congelamento
  const toggleFreeze = async () => {
    if (!isGM || !socket) return

    setState(prev => ({ ...prev, loading: true }))

    console.log('🔒 toggleFreeze: Emitindo map:freeze via WebSocket:', { campaignId, frozen: !state.mapFrozen })

    try {
      // Usar WebSocket em vez de API para garantir tempo real
      socket.emit('map:freeze', {
        campaignId,
        frozen: !state.mapFrozen
      })

      console.log('🔒 toggleFreeze: Evento map:freeze emitido via WebSocket')
      
      // O estado será atualizado via WebSocket listener quando o servidor responder
      // Remover loading após um timeout para evitar loading infinito
      setTimeout(() => {
        setState(prev => ({ ...prev, loading: false }))
      }, 3000)

    } catch (error) {
      console.error('Erro ao alterar estado do mapa via WebSocket:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // Escutar eventos WebSocket de mudança de estado do mapa
  useEffect(() => {
    if (!socket) {
      console.log('🔒 useMapFreeze: No socket available')
      return
    }

    console.log('🔒 useMapFreeze: Setting up WebSocket listeners for campaign:', campaignId)

    const handleMapFrozenChanged = (data: any) => {
      console.log('🔒 useMapFreeze: Received map:frozen-changed event:', data)
      setState(prev => ({
        ...prev,
        mapFrozen: data.mapFrozen,
        frozenBy: data.frozenBy,
        frozenByName: data.frozenByName,
        frozenAt: data.frozenAt,
        loading: false // Parar loading quando evento for recebido
      }))
    }

    const handleMapFrozenChangedInternal = (data: any) => {
      console.log('🔒 useMapFreeze: Received map:frozen-changed-internal event:', data)
      setState(prev => ({
        ...prev,
        mapFrozen: data.mapFrozen,
        frozenBy: data.frozenBy,
        frozenByName: data.frozenByName,
        frozenAt: data.frozenAt,
        loading: false // Parar loading quando evento for recebido
      }))
    }

    // Escutar ambos os eventos
    socket.on('map:frozen-changed', handleMapFrozenChanged)
    socket.on('map:frozen-changed-internal', handleMapFrozenChangedInternal)

    // Também verificar se já está conectado à campanha
    console.log('🔒 useMapFreeze: Socket connected?', socket.connected)
    console.log('🔒 useMapFreeze: Socket ID:', socket.id)

    return () => {
      console.log('🔒 useMapFreeze: Cleaning up WebSocket listeners')
      socket.off('map:frozen-changed', handleMapFrozenChanged)
      socket.off('map:frozen-changed-internal', handleMapFrozenChangedInternal)
    }
  }, [socket, campaignId])

  // Carregar estado inicial
  useEffect(() => {
    const loadFreezeState = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/freeze-map`)
        if (response.ok) {
          const data = await response.json()
          setState(prev => ({
            ...prev,
            mapFrozen: data.mapFrozen || false,
            frozenBy: data.frozenBy || null,
            frozenByName: data.frozenByName || null,
            frozenAt: data.frozenAt || null
          }))
        }
      } catch (error) {
        console.error('Erro ao carregar estado do mapa:', error)
      }
    }

    if (campaignId) {
      loadFreezeState()
    }
  }, [campaignId])

  return {
    mapFrozen: state.mapFrozen,
    frozenBy: state.frozenBy,
    frozenByName: state.frozenByName,
    frozenAt: state.frozenAt,
    loading: state.loading,
    toggleFreeze
  }
}