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
import { getRPGSystem } from "@/lib/rpg-systems"

interface CreatureListProps {
  campaignId: string
}

export function CreatureList({ campaignId }: CreatureListProps) {
  const [deletingCharacter, setDeletingCharacter] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const { 
    characters: creatures, 
    loading, 
    error, 
    deleteCharacter,
    searchCharacters
  } = useCharacters({ 
    campaignId, 
    type: 'CREATURE',
    createdBy: 'gm'
  })

  const filteredCreatures = searchQuery 
    ? searchCharacters(searchQuery).filter(char => char.type === 'CREATURE')
    : creatures.filter(char => char.type === 'CREATURE')

  const handleCreateCreature = () => {
    window.open(`/campaign/${campaignId}/sheet/new?type=CREATURE&role=gm&system=dnd5e`, '_blank', 'noopener,noreferrer')
  }

  const handleDelete = async () => {
    if (!deletingCharacter) return
    
    try {
      await deleteCharacter(deletingCharacter.id)
      setDeletingCharacter(null)
      toast.success('Criatura excluída com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir criatura')
    }
  }

  if (error) {
    return (
      <div className="space-y-2 p-1">
        <div className="text-sm text-destructive text-center py-4">
          Erro ao carregar criaturas: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-1">
      <Button size="sm" className="w-full" onClick={handleCreateCreature}>
        <PlusCircle className="mr-2 h-4 w-4" /> Criar Criatura D&D 5e
      </Button>

      {creatures.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar criaturas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8"
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando criaturas...</span>
        </div>
      ) : filteredCreatures.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          {searchQuery ? 'Nenhuma criatura encontrada' : 'Nenhuma criatura criada ainda'}
        </div>
      ) : (
        <div className="space-y-2">
          <TooltipProvider delayDuration={0}>
            {filteredCreatures.map((creature) => {
              // Usar sistema RPG para obter resumo da criatura
              const creatureData = typeof creature.data === 'string' ? JSON.parse(creature.data) : creature.data
              const rpgSystem = getRPGSystem('dnd5e')
              const { name, level, race, class: creatureClass } = rpgSystem.getCharacterSummary(creatureData)
              
              const description = race && creatureClass 
                ? `${race} ${creatureClass} ${level ? `- Nível ${level}` : ''}`
                : 'Criatura D&D 5e'

              return (
                <ContentListItem 
                  key={creature.id} 
                  title={creature.name} 
                  description={description}
                  showImage={false}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/campaign/${campaignId}/sheet/${creature.id}?role=gm`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>Editar Ficha</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => setDeletingCharacter(creature)}
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