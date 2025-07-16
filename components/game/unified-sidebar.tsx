"use client"

import type { UserRole } from "@/app/campaign/[id]/play/page"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, MessageCircle } from "lucide-react"
import { ChatPanel } from "./chat-panel"
import { PlayersPanel } from "./players-panel"
import { GmContentView } from "../sidebar-content/gm-content-view"
import { PlayerContentView } from "../sidebar-content/player-content-view"
import type { PlayerUpdate } from "@/hooks/use-socket"

interface UnifiedSidebarProps {
  userRole: UserRole
  campaignId: string
  playerCharacterId?: string // ID do personagem do jogador logado
  sharedHandoutIds: string[]
  onShareHandout: (id: string) => void
  currentUserId?: string // ID do usuário logado
  connectedPlayers: PlayerUpdate[]
  isConnected: boolean
  rpgSystem?: string
}

export function UnifiedSidebar({
  userRole,
  campaignId,
  playerCharacterId,
  sharedHandoutIds,
  onShareHandout,
  currentUserId,
  connectedPlayers,
  isConnected,
  rpgSystem = 'dnd5e',
}: UnifiedSidebarProps) {
  return (
    <div className="h-full flex flex-col bg-card p-2">
      <Tabs defaultValue="comunicacao" className="flex flex-col flex-grow min-h-0">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comunicacao">
            <MessageCircle className="mr-2 h-4 w-4" />
            Comunicação
          </TabsTrigger>
          <TabsTrigger value="conteudo">
            <BookOpen className="mr-2 h-4 w-4" />
            Conteúdo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comunicacao" className="flex-grow mt-2 overflow-y-auto min-h-0 pr-2">
          <div className="w-full h-full flex flex-col space-y-2">
            {/* Jogadores em Accordion */}
            <Accordion type="single" collapsible defaultValue="jogadores" className="w-full">
              <AccordionItem value="jogadores">
                <AccordionTrigger className="text-lg font-heading">Jogadores</AccordionTrigger>
                <AccordionContent>
                  <PlayersPanel 
                    campaignId={campaignId} 
                    connectedPlayers={connectedPlayers}
                    isConnected={isConnected}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            {/* Chat sempre aberto */}
            <div className="flex-grow flex flex-col min-h-0">
              <h3 className="text-lg font-heading mb-2">Chat</h3>
              <div className="flex-grow overflow-y-auto">
                <ChatPanel 
                  campaignId={campaignId}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conteudo" className="flex-grow mt-2 overflow-y-auto min-h-0 pr-1">
          {userRole === "Mestre" ? (
            <GmContentView
              campaignId={campaignId}
              onShareHandout={onShareHandout}
              sharedHandoutIds={sharedHandoutIds}
              rpgSystem={rpgSystem}
            />
          ) : (
            <PlayerContentView
              campaignId={campaignId}
              playerCharacterId={playerCharacterId}
              sharedHandoutIds={sharedHandoutIds}
              rpgSystem={rpgSystem}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}