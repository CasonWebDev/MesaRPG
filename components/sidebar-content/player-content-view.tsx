import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollText, FileText } from "lucide-react"
import { PlayerHandoutList } from "./player-handout-list"
import { PlayerCharacterSheetPanel } from "./player-character-sheet-panel"

interface PlayerContentViewProps {
  campaignId: string
  playerCharacterId?: string
  sharedHandoutIds: string[]
  rpgSystem?: string
}

export function PlayerContentView({ campaignId, playerCharacterId, sharedHandoutIds, rpgSystem = 'dnd5e' }: PlayerContentViewProps) {
  return (
    <Accordion type="multiple" className="w-full" defaultValue={["my-sheet"]}>
      <AccordionItem value="my-sheet">
        <AccordionTrigger className="text-lg font-heading">
          <FileText className="mr-2 h-4 w-4" /> Minha Ficha
        </AccordionTrigger>
        <AccordionContent>
          <PlayerCharacterSheetPanel campaignId={campaignId} playerCharacterId={playerCharacterId} rpgSystem={rpgSystem} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="handouts">
        <AccordionTrigger className="text-lg font-heading">
          <ScrollText className="mr-2 h-4 w-4" /> Utilitários Compartilhados
        </AccordionTrigger>
        <AccordionContent>
          <PlayerHandoutList campaignId={campaignId} sharedIds={sharedHandoutIds} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
