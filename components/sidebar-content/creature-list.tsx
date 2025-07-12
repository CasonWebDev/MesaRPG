"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PlusCircle, Trash2, Eye, Loader2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ContentListItem } from "./content-list-item"
import { CreateCharacterModal } from "../modals/create-character-modal"
import { DeleteCharacterModal } from "../modals/delete-character-modal"
import { useCharacters } from "@/hooks/use-characters"
import { toast } from "sonner"

interface CreatureListProps {
  campaignId: string
}

export function CreatureList({ campaignId }: CreatureListProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [deletingCharacter, setDeletingCharacter] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const { 
    characters: creatures, 
    loading, 
    error, 
    createCharacter, 
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

  const handleCreate = async (data: any) => {
    try {
      await createCharacter({ ...data, type: 'CREATURE' })
      setIsCreating(false)
      toast.success('Criatura criada com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar criatura')
    }
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
      <Button size="sm" className="w-full" onClick={() => setIsCreating(true)}>
        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Criatura
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
              // Extrair descrição dos dados da criatura
              const creatureData = creature.data || {}
              const description = creatureData['História/Descrição'] || 
                                creatureData['Tipo'] || 
                                creatureData['Tamanho'] || 
                                'Criatura sem descrição'

              return (
                <ContentListItem 
                  key={creature.id} 
                  title={creature.name} 
                  description={description}
                  showImage={false}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/campaign/${campaignId}/sheet/${creature.id}?type=creature&role=Mestre`}>
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
      <CreateCharacterModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onConfirm={handleCreate}
        campaignId={campaignId}
        characterType="CREATURE"
      />


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
