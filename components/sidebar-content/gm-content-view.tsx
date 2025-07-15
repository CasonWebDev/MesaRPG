import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Map, Shield, ScrollText, FileText, Swords } from "lucide-react"
import { MapList } from "./map-list"
import { NpcList } from "./npc-list"
import { HandoutList } from "./handout-list"
import { CreatureList } from "./creature-list"
import { PlayerSheetList } from "./player-sheet-list"
import { MapFreezeControl } from "@/components/game/map-freeze-control"

interface GmContentViewProps {
  campaignId: string
  sharedHandoutIds: string[]
  onShareHandout: (id: string) => void
  rpgSystem?: string
}

export function GmContentView({ campaignId, sharedHandoutIds, onShareHandout, rpgSystem = 'dnd5e' }: GmContentViewProps) {
  return (
    <Accordion type="multiple" className="w-full" defaultValue={["mapas"]}>
      <AccordionItem value="mapas">
        <AccordionTrigger className="text-lg font-heading">
          <Map className="mr-2 h-4 w-4" /> Mapas
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <MapFreezeControl campaignId={campaignId} isGM={true} />
            <MapList campaignId={campaignId} />
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="npcs">
        <AccordionTrigger className="text-lg font-heading">
          <Shield className="mr-2 h-4 w-4" /> NPCs
        </AccordionTrigger>
        <AccordionContent>
          <NpcList campaignId={campaignId} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="criaturas">
        <AccordionTrigger className="text-lg font-heading">
          <Swords className="mr-2 h-4 w-4" /> Criaturas
        </AccordionTrigger>
        <AccordionContent>
          <CreatureList campaignId={campaignId} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="utilitarios">
        <AccordionTrigger className="text-lg font-heading">
          <ScrollText className="mr-2 h-4 w-4" /> Utilitários
        </AccordionTrigger>
        <AccordionContent>
          <HandoutList campaignId={campaignId} onShare={onShareHandout} sharedIds={sharedHandoutIds} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="fichas">
        <AccordionTrigger className="text-lg font-heading">
          <FileText className="mr-2 h-4 w-4" /> Fichas de Jogador
        </AccordionTrigger>
        <AccordionContent>
          <PlayerSheetList campaignId={campaignId} rpgSystem={rpgSystem} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}