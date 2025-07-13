"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, Shield, Trash2 } from "lucide-react"
import { ContentListItem } from "./content-list-item"
import { DeleteCharacterModal } from "../modals/delete-character-modal"
import { useCharacters } from "@/hooks/use-characters"
import { toast } from "sonner"

function getCharacterAvatar(character: any) {
  if (!character.template?.fields) {
    // Se não há template, usar placeholder baseado no tipo
    return getTypePlaceholder(character.type)
  }
  
  const templateFields = Array.isArray(character.template.fields) 
    ? character.template.fields 
    : (typeof character.template.fields === 'string' ? JSON.parse(character.template.fields) : [])
  
  const imageField = templateFields.find((field: any) => field.type === 'image')
  if (!imageField) {
    // Se não há campo de imagem, usar placeholder baseado no tipo
    return getTypePlaceholder(character.type)
  }
  
  const characterData = typeof character.data === 'string' ? JSON.parse(character.data) : character.data
  const savedAvatar = characterData[imageField.name]
  
  // Se há avatar salvo, usar ele; senão usar placeholder baseado no tipo
  return savedAvatar || getTypePlaceholder(character.type)
}

function getTypePlaceholder(type: string) {
  switch (type) {
    case 'PC':
      return '/placeholder-PC-token.png'
    case 'NPC':
      return '/placeholder-NPC-token.png'
    case 'CREATURE':
      return '/placeholder-Creature-token.png'
    default:
      return '/placeholder.svg'
  }
}

function getCharacterSummary(character: any) {
  if (!character.template?.fields) return 'Personagem'
  
  const templateFields = Array.isArray(character.template.fields) 
    ? character.template.fields 
    : (typeof character.template.fields === 'string' ? JSON.parse(character.template.fields) : [])
  
  const characterData = typeof character.data === 'string' ? JSON.parse(character.data) : character.data
  
  // Pegar os 2 primeiros campos (excluindo imagem) para criar resumo
  const summaryFields = templateFields
    .filter((field: any) => field.type !== 'image')
    .slice(0, 2)
  
  const summaryParts = summaryFields
    .map((field: any) => {
      const value = characterData[field.name]
      return value ? `${field.label || field.name}: ${value}` : null
    })
    .filter(Boolean)
  
  return summaryParts.length > 0 ? summaryParts.join(', ') : 'Personagem'
}

interface PlayerSheetListProps {
  campaignId: string
}

export function PlayerSheetList({ campaignId }: PlayerSheetListProps) {
  const [deletingCharacter, setDeletingCharacter] = useState<any>(null)
  
  const { loading, getPlayerCharacters, deleteCharacter } = useCharacters({ 
    campaignId, 
    type: 'PC',
    createdBy: 'player'
  })

  const playerCharacters = getPlayerCharacters()

  const handleDelete = async () => {
    if (!deletingCharacter) return
    
    try {
      await deleteCharacter(deletingCharacter.id)
      setDeletingCharacter(null)
      toast.success('Personagem excluído com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir personagem')
    }
  }

  if (loading) {
    return (
      <div className="space-y-2 p-1">
        <div className="text-sm text-muted-foreground text-center py-4">
          Carregando fichas...
        </div>
      </div>
    )
  }

  if (playerCharacters.length === 0) {
    return (
      <div className="space-y-2 p-1">
        <div className="text-sm text-muted-foreground text-center py-4">
          Nenhuma ficha de jogador encontrada
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-1">
      <TooltipProvider delayDuration={0}>
        {playerCharacters.map((character) => {
          const avatarUrl = getCharacterAvatar(character)
          const summary = getCharacterSummary(character)
          const playerName = character.user?.name || character.user?.email || 'Jogador'
          
          return (
            <ContentListItem 
              key={character.id} 
              title={character.name}
              description={`Jogador: ${playerName} • ${summary}`}
              imageUrl={avatarUrl}
              fallbackIcon={Shield}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/campaign/${campaignId}/sheet/${character.id}?role=gm`}>
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
                    onClick={() => setDeletingCharacter(character)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir Personagem</TooltipContent>
              </Tooltip>
            </ContentListItem>
          )
        })}
      </TooltipProvider>

      {/* Modal de confirmação de exclusão */}
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
