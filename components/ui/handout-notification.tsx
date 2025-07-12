"use client"

import { useEffect } from 'react'
import { useSocket } from '@/hooks/use-socket'
import { useToast } from '@/hooks/use-toast'
import { ScrollText, Share2, Edit, Trash2 } from 'lucide-react'

interface HandoutNotificationProps {
  campaignId: string
}

export function HandoutNotification({ campaignId }: HandoutNotificationProps) {
  const { socket } = useSocket(campaignId)
  const { toast } = useToast()

  useEffect(() => {
    if (!socket) return

    const handleHandoutShared = (data: {
      handoutId: string
      handoutName: string
      sharedWith: string[]
      sharedBy: string
      campaignId: string
    }) => {
      toast({
        title: "Novo utilitário compartilhado!",
        description: `${data.sharedBy} compartilhou "${data.handoutName}" com ${data.sharedWith.length} jogador(es).`,
        duration: 5000,
      })
    }

    const handleHandoutNotification = (data: {
      type: 'shared' | 'updated' | 'removed'
      handoutId: string
      handoutName: string
      sharedBy: string
      message: string
    }) => {
      const icons = {
        shared: Share2,
        updated: Edit,
        removed: Trash2
      }

      const Icon = icons[data.type]

      toast({
        title: (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>Utilitário {data.type === 'shared' ? 'Compartilhado' : data.type === 'updated' ? 'Atualizado' : 'Removido'}</span>
          </div>
        ),
        description: data.message,
        duration: 4000,
      })
    }

    socket.on('handout:shared', handleHandoutShared)
    socket.on('handout:notification', handleHandoutNotification)

    return () => {
      socket.off('handout:shared', handleHandoutShared)
      socket.off('handout:notification', handleHandoutNotification)
    }
  }, [socket, toast])

  return null // Este componente apenas escuta eventos
}