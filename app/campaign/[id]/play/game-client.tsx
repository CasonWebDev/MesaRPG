"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { UnifiedSidebar } from "@/components/game/unified-sidebar"
import { TacticalGrid } from "@/components/game/tactical-grid"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"
import { useMapNotifications } from "@/hooks/use-map-notifications"
import { HandoutNotification } from "@/components/ui/handout-notification"

export type UserRole = "Mestre" | "Jogador"

interface GameClientProps {
  campaignId: string
  campaignName: string
  userRole: UserRole
  playerCharacterId?: string
  currentUserId: string
  rpgSystem?: string
}

export function GameClient({ 
  campaignId, 
  campaignName, 
  userRole, 
  playerCharacterId,
  currentUserId,
  rpgSystem = 'dnd5e'
}: GameClientProps) {
  const [sharedHandoutIds, setSharedHandoutIds] = useState<string[]>([])
  const [realPlayerCharacterId, setRealPlayerCharacterId] = useState<string | undefined>(playerCharacterId)
  
  // Conectar ao WebSocket da campanha
  const { connectedPlayers, isConnected } = useSocket(campaignId)
  
  // Configurar notificações de mapas
  useMapNotifications(campaignId, currentUserId)
  
  // Verificar se o jogador tem um personagem real
  useEffect(() => {
    if (userRole === "Jogador") {
      const checkPlayerCharacter = async () => {
        try {
          const response = await fetch(`/api/campaigns/${campaignId}/characters`)
          if (response.ok) {
            const data = await response.json()
            setRealPlayerCharacterId(data.character?.id)
          }
        } catch (error) {
          console.error('Erro ao verificar personagem:', error)
        }
      }
      
      checkPlayerCharacter()
    }
  }, [campaignId, userRole])

  const handleShareHandout = (handoutId: string) => {
    setSharedHandoutIds((prevIds) => (prevIds.includes(handoutId) ? prevIds : [...prevIds, handoutId]))
  }

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      <header className="bg-secondary/50 p-2 shadow-md flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-xl font-heading text-primary truncate px-4 text-center">{campaignName}</h1>
        <div className="flex items-center gap-2 justify-end min-w-[150px]">
          {/* Configurações removidas - apenas D&D 5e */}
        </div>
      </header>
      
      {/* Fixed Layout without Responsiveness */}
      <div className="flex-grow flex overflow-hidden">
        {/* Fixed Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-border">
          <UnifiedSidebar
            userRole={userRole}
            campaignId={campaignId}
            playerCharacterId={realPlayerCharacterId}
            sharedHandoutIds={sharedHandoutIds}
            onShareHandout={handleShareHandout}
            currentUserId={currentUserId}
            connectedPlayers={connectedPlayers}
            isConnected={isConnected}
            rpgSystem={rpgSystem}
          />
        </div>
        
        {/* Fixed Map Container */}
        <div className="flex-1 relative bg-stone-900 overflow-hidden">
          <TacticalGrid
            campaignId={campaignId}
            userRole={userRole}
            userId={currentUserId}
          />
        </div>
      </div>
      
      {/* Notificações de utilitários */}
      <HandoutNotification campaignId={campaignId} />
      
      {/* Simplified - no complex modals */}
    </div>
  )
}