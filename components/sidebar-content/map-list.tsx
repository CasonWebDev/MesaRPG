"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PlusCircle, Play, Pencil, Trash2 } from "lucide-react"
import { ContentListItem } from "./content-list-item"
import { EditContentModal } from "../modals/edit-content-modal"
import { DeleteContentModal } from "../modals/delete-content-modal"
import { AddContentModal } from "../modals/add-content-modal"
import { useSocket } from "@/hooks/use-socket"
interface MapItem {
  id: string
  name: string
  description: string
  imageUrl?: string
  isActive: boolean
  gridSize: number
  createdAt: string
}

interface MapListProps {
  campaignId: string
}

export function MapList({ campaignId }: MapListProps) {
  const [maps, setMaps] = useState<MapItem[]>([])
  const [activeMap, setActiveMap] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<MapItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<MapItem | null>(null)
  const { socket } = useSocket(campaignId)

  // Load maps from API
  useEffect(() => {
    const loadMaps = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/maps`)
        if (response.ok) {
          const data = await response.json()
          setMaps(data.maps || [])
          
          // Find the active map
          const activeMaps = data.maps?.filter((map: MapItem) => map.isActive)
          if (activeMaps && activeMaps.length > 0) {
            setActiveMap(activeMaps[0].id)
          }
        }
      } catch (error) {
        console.error('Error loading maps:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (campaignId) {
      loadMaps()
    }
  }, [campaignId])

  // Listen for map activation events from other users
  useEffect(() => {
    if (!socket) return

    const handleMapActivated = (data: { mapId: string; map: any; userId: string }) => {
      console.log('🗺️ Mapa ativado por outro usuário:', data.map.name)
      
      // Update local state to reflect the change
      setActiveMap(data.mapId)
      setMaps(prevMaps => 
        prevMaps.map(map => ({
          ...map,
          isActive: map.id === data.mapId
        }))
      )
    }

    socket.on('map:activated', handleMapActivated)

    return () => {
      socket.off('map:activated', handleMapActivated)
    }
  }, [socket])

  const handleActivateMap = async (mapId: string) => {
    try {
      console.log('🎯 Ativando mapa:', mapId)
      
      // Try WebSocket first (faster real-time activation)
      if (socket) {
        console.log('🔌 Sending map activation via WebSocket')
        socket.emit('game:map-activate', {
          campaignId,
          mapId
        })
        
        // Update local state optimistically
        setActiveMap(mapId)
        setMaps(prevMaps => 
          prevMaps.map(map => ({
            ...map,
            isActive: map.id === mapId
          }))
        )
        
        console.log('✅ Mapa ativado via WebSocket')
        return
      }
      
      // Fallback to HTTP if WebSocket is not available
      console.log('⚠️ WebSocket não disponível, usando HTTP como fallback')
      const response = await fetch(`/api/campaigns/${campaignId}/maps/${mapId}/activate`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Mapa ativado com sucesso via HTTP:', result.map.name)
        
        setActiveMap(mapId)
        
        // Update the maps state to reflect the change
        setMaps(prevMaps => 
          prevMaps.map(map => ({
            ...map,
            isActive: map.id === mapId
          }))
        )
      } else {
        console.error('❌ Erro ao ativar mapa via HTTP:', response.status)
      }
    } catch (error) {
      console.error('❌ Erro ao ativar mapa:', error)
    }
  }

  const handleAddMap = async (mapData: any) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/maps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapData)
      })
      
      if (response.ok) {
        const newMap = await response.json()
        setMaps(prevMaps => [newMap.map, ...prevMaps])
        setIsAdding(false)
      }
    } catch (error) {
      console.error('Error adding map:', error)
    }
  }

  const handleEditMap = async (mapData: any) => {
    if (!editingItem) return
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/maps/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapData)
      })
      
      if (response.ok) {
        const updatedMap = await response.json()
        setMaps(prevMaps => 
          prevMaps.map(map => 
            map.id === editingItem.id ? updatedMap.map : map
          )
        )
        setEditingItem(null)
      }
    } catch (error) {
      console.error('Error editing map:', error)
    }
  }

  const handleDeleteMap = async () => {
    if (!deletingItem) return
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/maps/${deletingItem.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setMaps(prevMaps => prevMaps.filter(map => map.id !== deletingItem.id))
        
        // If the deleted map was active, clear the active map
        if (activeMap === deletingItem.id) {
          setActiveMap(null)
        }
        
        setDeletingItem(null)
      }
    } catch (error) {
      console.error('Error deleting map:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-1">
        <div className="text-center text-gray-500 py-4">
          Carregando mapas...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-1">
      <Button size="sm" className="w-full" onClick={() => setIsAdding(true)}>
        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Mapa
      </Button>
      
      <div className="space-y-2">
        {maps.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            Nenhum mapa criado ainda
          </div>
        ) : (
          <TooltipProvider delayDuration={0}>
            {maps.map((map) => (
              <ContentListItem
                key={map.id}
                title={map.name}
                description={map.description}
                imageUrl={map.imageUrl}
                isActive={map.isActive}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => handleActivateMap(map.id)}
                      disabled={map.isActive}
                    >
                      <Play className={`h-4 w-4 ${map.isActive ? 'text-green-400' : 'text-gray-400'}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {map.isActive ? 'Mapa Ativo' : 'Ativar Mapa'}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingItem(map)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeletingItem(map)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir</TooltipContent>
                </Tooltip>
              </ContentListItem>
            ))}
          </TooltipProvider>
        )}
      </div>

      <AddContentModal 
        itemType="Mapa" 
        isOpen={isAdding} 
        onClose={() => setIsAdding(false)}
        onSave={handleAddMap}
      />

      {editingItem && (
        <EditContentModal
          item={editingItem}
          itemType="Mapa"
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleEditMap}
        />
      )}

      {deletingItem && (
        <DeleteContentModal
          item={deletingItem}
          itemType="Mapa"
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDeleteMap}
        />
      )}
    </div>
  )
}