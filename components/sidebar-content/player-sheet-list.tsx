"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Eye, Shield, Trash2, Plus, UserPlus } from "lucide-react"
import { ContentListItem } from "./content-list-item"
import { DeleteCharacterModal } from "../modals/delete-character-modal"
import { TransferCharacterModal } from "../modals/transfer-character-modal"
import { UniversalCharacterCreator } from "@/components/character/universal-character-creator"
import { useCharacters } from "@/hooks/use-characters"
import { toast } from "sonner"
import { getRPGSystem } from "@/lib/rpg-systems"

function getCharacterAvatar(character: any) {
  const characterData = typeof character.data === 'string' ? JSON.parse(character.data) : character.data
  return characterData?.avatar || '/placeholder-PC-token.png'
}

function getCharacterSummary(character: any) {
  const characterData = typeof character.data === 'string' ? JSON.parse(character.data) : character.data
  const rpgSystem = getRPGSystem('dnd5e')
  const { name, level, race, class: characterClass } = rpgSystem.getCharacterSummary(characterData)
  
  return `${race} ${characterClass} - Nível ${level}`
}

interface PlayerSheetListProps {
  campaignId: string
  rpgSystem?: string
}

export function PlayerSheetList({ campaignId, rpgSystem = 'dnd5e' }: PlayerSheetListProps) {
  const [deletingCharacter, setDeletingCharacter] = useState<any>(null)
  const [transferringCharacter, setTransferringCharacter] = useState<any>(null)
  const [showCreator, setShowCreator] = useState(false)
  
  const { loading, getPlayerCharacters, deleteCharacter, createCharacter, refetch } = useCharacters({ 
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

  const handleCreateCharacter = async (characterData: any) => {
    try {
      await createCharacter(characterData)
      setShowCreator(false)
      toast.success('Personagem criado com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar personagem')
    }
  }

  const handleCreateCompleteCharacter = async () => {
    try {
      const system = getRPGSystem(rpgSystem || 'dnd5e')
      const defaultCharacterData = system.getDefaultCharacter()
      
      const characterData = {
        name: "Novo Personagem",
        type: "PC",
        data: defaultCharacterData
      }
      
      await createCharacter(characterData)
      toast.success('Personagem criado com sucesso! Agora você pode transferir para um jogador.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar personagem')
    }
  }


  const handleTransferCharacter = async (characterId: string, newUserId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/characters/${characterId}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newUserId }),
      })

      if (!response.ok) {
        throw new Error('Erro ao transferir personagem')
      }

      setTransferringCharacter(null)
      toast.success('Personagem transferido com sucesso!')
      // Recarregar lista
      await refetch()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao transferir personagem')
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

  if (showCreator) {
    return (
      <div className="space-y-2 p-1">
        <UniversalCharacterCreator
          campaignId={campaignId}
          characterType="PC"
          onSubmit={handleCreateCharacter}
          onCancel={() => setShowCreator(false)}
          systemId={rpgSystem}
        />
      </div>
    )
  }

  if (playerCharacters.length === 0) {
    return (
      <div className="space-y-2 p-1">
        <div className="text-sm text-muted-foreground text-center py-4">
          Nenhuma ficha de jogador encontrada
        </div>
        <div className="space-y-2">
          <Button 
            onClick={handleCreateCompleteCharacter}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Personagem Completo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-1">
      <div className="mb-2">
        <Button 
          onClick={handleCreateCompleteCharacter}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar Personagem Completo
        </Button>
      </div>
      
      <TooltipProvider delayDuration={0}>
        {playerCharacters.map((character) => {
          const avatarUrl = getCharacterAvatar(character)
          const summary = getCharacterSummary(character)
          const playerName = character.user?.name || character.user?.email
          const isUnassigned = !character.userId
          
          return (
            <ContentListItem 
              key={character.id} 
              title={character.name}
              description={isUnassigned ? 
                `⚠️ Não vinculado • ${summary}` : 
                `Jogador: ${playerName} • ${summary}`
              }
              imageUrl={avatarUrl}
              fallbackIcon={Shield}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/campaign/${campaignId}/sheet/${character.id}?role=gm`} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Editar Ficha</TooltipContent>
              </Tooltip>
              
              {isUnassigned ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => setTransferringCharacter(character)}
                    >
                      <UserPlus className="h-4 w-4 text-blue-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Vincular a Jogador</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => setTransferringCharacter(character)}
                    >
                      <UserPlus className="h-4 w-4 text-green-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Transferir para Outro Jogador</TooltipContent>
                </Tooltip>
              )}
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

      {/* Modal de transferência */}
      {transferringCharacter && (
        <TransferCharacterModal
          isOpen={!!transferringCharacter}
          onClose={() => setTransferringCharacter(null)}
          onConfirm={handleTransferCharacter}
          character={transferringCharacter}
          campaignId={campaignId}
        />
      )}
    </div>
  )
}