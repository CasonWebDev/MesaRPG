"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Crown, User, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PlayerUpdate } from "@/hooks/use-socket"

interface Player {
  id: string
  name: string
  email: string
  role: "Mestre" | "Jogador"
  isGM: boolean
}

interface PlayersPanelProps {
  campaignId: string
  connectedPlayers: PlayerUpdate[]
  isConnected: boolean
}

export function PlayersPanel({ campaignId, connectedPlayers, isConnected }: PlayersPanelProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()


  // Buscar lista de jogadores da campanha
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/campaigns/${campaignId}/players`)
        
        if (!response.ok) {
          throw new Error('Erro ao carregar jogadores')
        }
        
        const data = await response.json()
        setPlayers(data.players || [])
      } catch (err) {
        console.error('Erro ao buscar jogadores:', err)
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    if (campaignId) {
      fetchPlayers()
    }
  }, [campaignId])

  // Verificar se um jogador está online
  const isPlayerOnline = (playerEmail: string, playerId: string) => {
    // Se for o usuário atual e estiver conectado, sempre considerar online
    if (session?.user?.id === playerId && isConnected) {
      return true
    }
    
    // Para outros usuários, verificar na lista de conectados
    // O WebSocket agora usa ID como userId, então comparamos com o ID do jogador
    return connectedPlayers.some(cp => cp.userId === playerId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Circle className="h-4 w-4 animate-spin" />
          <span>Carregando jogadores...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4">
        <div className="text-sm text-red-500 text-center">
          {error}
        </div>
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div className="py-4">
        <div className="text-sm text-muted-foreground text-center">
          Nenhum jogador encontrado
        </div>
      </div>
    )
  }

  // Separar GM dos jogadores
  const gm = players.find(p => p.isGM)
  const regularPlayers = players.filter(p => !p.isGM)
  
  // Calcular jogadores online (incluindo o usuário atual)
  const onlinePlayersCount = players.filter(p => isPlayerOnline(p.email, p.id)).length

  return (
    <div className="space-y-3 p-1">
      {/* Status de conexão */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2">
        <span>
          {players.length} {players.length === 1 ? 'jogador' : 'jogadores'}
        </span>
        <div className="flex items-center space-x-1">
          <div className={cn(
            "h-2 w-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          <span>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>

      {/* Mestre */}
      {gm && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Mestre
          </div>
          <div className="flex items-center justify-between py-1 px-2 rounded-md bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">{gm.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                isPlayerOnline(gm.email, gm.id) ? "bg-green-500" : "bg-gray-400"
              )} />
              <span className="text-xs text-muted-foreground">
                {isPlayerOnline(gm.email, gm.id) ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Jogadores */}
      {regularPlayers.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Jogadores
          </div>
          <div className="space-y-1">
            {regularPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{player.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    isPlayerOnline(player.email, player.id) ? "bg-green-500" : "bg-gray-400"
                  )} />
                  <span className="text-xs text-muted-foreground">
                    {isPlayerOnline(player.email, player.id) ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contadores */}
      <div className="pt-2 border-t">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Online: {onlinePlayersCount}
          </span>
          <span>
            Total: {players.length}
          </span>
        </div>
      </div>
    </div>
  )
}