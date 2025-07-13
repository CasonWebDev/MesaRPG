"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PlusCircle, Trash2, Eye, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ContentListItem } from "./content-list-item"
import { DeleteCharacterModal } from "../modals/delete-character-modal"
import { useCharacters } from "@/hooks/use-characters"
import { toast } from "sonner"

interface NpcListProps {
  campaignId: string
}

export function NpcList({ campaignId }: NpcListProps) {
  const [deletingCharacter, setDeletingCharacter] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const { 
    characters: npcs, 
    loading, 
    error, 
    deleteCharacter,
    searchCharacters
  } = useCharacters({ 
    campaignId, 
    type: 'NPC',
    createdBy: 'gm'
  })

  const filteredNPCs = searchQuery 
    ? searchCharacters(searchQuery).filter(char => char.type === 'NPC')
    : npcs.filter(char => char.type === 'NPC')

  const handleCreateNPC = () => {
    router.push(`/campaign/${campaignId}/sheet/new?type=NPC&role=Mestre`)
  }


  const handleDelete = async () => {
    if (!deletingCharacter) return
    
    try {
      await deleteCharacter(deletingCharacter.id)
      setDeletingCharacter(null)
      toast.success('NPC excluído com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir NPC')
    }
  }

  if (error) {
    return (
      <div className="space-y-2 p-1">
        <div className="text-sm text-destructive text-center py-4">
          Erro ao carregar NPCs: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-1">
      <Button size="sm" className="w-full" onClick={handleCreateNPC}>
        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar NPC
      </Button>

      {npcs.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar NPCs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando NPCs...</span>
        </div>
      ) : filteredNPCs.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          {searchQuery ? 'Nenhum NPC encontrado' : 'Nenhum NPC criado ainda'}
        </div>
      ) : (
        <div className="space-y-2">
          <TooltipProvider delayDuration={0}>
            {filteredNPCs.map((npc) => {
              // Extrair descrição dos dados do NPC
              const npcData = npc.data || {}
              const description = npcData['Descrição/História'] || 
                                npcData['História/Sintetizado'] || 
                                npcData['Tipo'] || 
                                'NPC sem descrição'

              return (
                <ContentListItem 
                  key={npc.id} 
                  title={npc.name} 
                  description={description}
                  showImage={false}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/campaign/${campaignId}/sheet/${npc.id}?type=npc&role=Mestre`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Visualizar Ficha</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => setDeletingCharacter(npc)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir</TooltipContent>
                  </Tooltip>
                </ContentListItem>
              )
            })}
          </TooltipProvider>
        </div>
      )}

      {/* Modais */}


      {deletingCharacter && (
        <DeleteCharacterModal
          isOpen={!!deletingCharacter}
          onClose={() => setDeletingCharacter(null)}
          onConfirm={handleDelete}
          character={deletingCharacter}
        />
      )}
    </div>
  )
}
