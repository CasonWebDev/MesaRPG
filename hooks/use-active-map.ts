"use client"

import { useState, useEffect } from "react"
import { useSocket } from "./use-socket"

interface ActiveMap {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  gridSize: number
  settings: Record<string, any>
}

interface UseActiveMapReturn {
  activeMap: ActiveMap | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  refreshKey: number
}

export function useActiveMap(campaignId: string): UseActiveMapReturn {
  const [activeMap, setActiveMap] = useState<ActiveMap | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const { socket } = useSocket(campaignId)

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const fetchActiveMap = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/campaigns/${campaignId}/maps`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar mapas')
      }
      
      const data = await response.json()
      const maps = data.maps || []
      
      // Encontrar o mapa ativo
      const active = maps.find((map: any) => map.isActive)
      
      if (active) {
        setActiveMap({
          id: active.id,
          name: active.name,
          description: active.description,
          imageUrl: active.imageUrl,
          gridSize: active.gridSize,
          settings: active.settings ? JSON.parse(active.settings) : {}
        })
      } else {
        setActiveMap(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro ao carregar mapa ativo:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar mapa inicial
  useEffect(() => {
    if (campaignId) {
      fetchActiveMap()
    }
  }, [campaignId])

  // Polling de backup caso o WebSocket falhe (desabilitado - WebSocket funcionando)
  // useEffect(() => {
  //   if (!campaignId) return

  //   const interval = setInterval(async () => {
  //     try {
  //       const response = await fetch(`/api/campaigns/${campaignId}/maps`)
  //       if (response.ok) {
  //         const data = await response.json()
  //         const maps = data.maps || []
  //         const active = maps.find((map: any) => map.isActive)
          
  //         // Verificar se mudou o mapa ativo
  //         if (active?.id !== activeMap?.id) {
  //           console.log('🔄 Polling detectou mudança de mapa:', active?.name || 'nenhum')
            
  //           if (active) {
  //             setActiveMap({
  //               id: active.id,
  //               name: active.name,
  //               description: active.description,
  //               imageUrl: active.imageUrl,
  //               gridSize: active.gridSize,
  //               settings: active.settings ? JSON.parse(active.settings) : {}
  //             })
  //           } else {
  //             setActiveMap(null)
  //           }
            
  //           forceRefresh()
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Erro no polling de mapas:', error)
  //     }
  //   }, 2000) // Verifica a cada 2 segundos

  //   return () => clearInterval(interval)
  // }, [campaignId, activeMap?.id])

  // Escutar mudanças de mapa via WebSocket
  useEffect(() => {
    if (!socket) return

    const handleMapActivated = (data: { mapId: string; map: any }) => {
      console.log('🗺️ Mapa ativado via WebSocket:', data)
      console.log('🔄 Forçando refresh do grid...')
      
      if (data.map) {
        setActiveMap({
          id: data.map.id,
          name: data.map.name,
          description: data.map.description,
          imageUrl: data.map.imageUrl,
          gridSize: data.map.gridSize,
          settings: data.map.settings ? JSON.parse(data.map.settings) : {}
        })
        console.log('✅ Novo mapa setado:', data.map.name)
      } else {
        // Se não há dados do mapa, fazer fetch
        console.log('⚠️ Sem dados do mapa, fazendo fetch...')
        fetchActiveMap()
      }
      
      // Forçar refresh do grid
      forceRefresh()
    }

    const handleMapDeactivated = () => {
      console.log('🗺️ Mapa desativado via WebSocket')
      setActiveMap(null)
      // Forçar refresh do grid
      forceRefresh()
    }

    socket.on('map:activated', handleMapActivated)
    socket.on('map:deactivated', handleMapDeactivated)

    return () => {
      socket.off('map:activated', handleMapActivated)
      socket.off('map:deactivated', handleMapDeactivated)
    }
  }, [socket])

  return {
    activeMap,
    isLoading,
    error,
    refetch: fetchActiveMap,
    refreshKey
  }
}