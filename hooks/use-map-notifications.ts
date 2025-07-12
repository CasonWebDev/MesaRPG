"use client"

import { useEffect } from "react"
import { useSocket } from "./use-socket"
import { toast } from "sonner"

interface MapNotificationData {
  mapId: string
  map: {
    id: string
    name: string
    description?: string
  }
  userId: string
}

export function useMapNotifications(campaignId: string, currentUserId: string) {
  const { socket } = useSocket(campaignId)

  useEffect(() => {
    if (!socket) return

    const handleMapActivated = (data: MapNotificationData) => {
      // Não mostrar notificação para o próprio usuário que ativou o mapa
      if (data.userId === currentUserId) return

      toast.success(
        `Mapa "${data.map.name}" foi ativado`,
        {
          description: data.map.description || "O mestre ativou um novo mapa",
          duration: 5000,
        }
      )

      console.log('Map activated notification:', data)
    }

    const handleMapDeactivated = (data: { previousMapId: string; userId: string }) => {
      // Não mostrar notificação para o próprio usuário que desativou o mapa
      if (data.userId === currentUserId) return

      toast.info(
        "Mapa foi desativado",
        {
          description: "O mestre desativou o mapa atual",
          duration: 3000,
        }
      )

      console.log('Map deactivated notification:', data)
    }

    socket.on('map:activated', handleMapActivated)
    socket.on('map:deactivated', handleMapDeactivated)

    return () => {
      socket.off('map:activated', handleMapActivated)
      socket.off('map:deactivated', handleMapDeactivated)
    }
  }, [socket, currentUserId])
}