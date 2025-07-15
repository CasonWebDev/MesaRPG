"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FilePlus2, BookUser, Shield } from "lucide-react"
import { useCharacters } from "@/hooks/use-characters"
import { toast } from "sonner"
import { getRPGSystem } from "@/lib/rpg-systems"

interface PlayerCharacterSheetPanelProps {
  campaignId: string
  playerCharacterId?: string
  rpgSystem?: string
}

export function PlayerCharacterSheetPanel({ campaignId, playerCharacterId, rpgSystem = 'dnd5e' }: PlayerCharacterSheetPanelProps) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  
  // Usar hook para buscar personagens do jogador
  const { characters, getPCs } = useCharacters({ 
    campaignId, 
    type: 'PC'
  })
  
  // Buscar o personagem do jogador atual
  const character = characters.find(char => char.type === 'PC' && char.userId)
  const hasCharacter = !!character

  // Obter sistema RPG
  const rpgSystemInstance = getRPGSystem(rpgSystem)

  useEffect(() => {
    setIsLoading(false)
  }, [])

  const handleCreateClick = () => {
    window.open(`/campaign/${campaignId}/sheet/new?type=PC&role=Jogador&system=dnd5e`, '_blank', 'noopener,noreferrer')
  }

  if (hasCharacter && character) {
    // Parsear dados do personagem
    const characterData = typeof character.data === 'string' ? JSON.parse(character.data) : character.data
    
    // Extrair nome do personagem
    const characterName = character.name || 'Personagem'
    
    // Usar sistema RPG para obter dados do personagem
    const { name, level, race, class: characterClass, avatar } = rpgSystemInstance.getCharacterSummary(characterData)
    
    return (
      <div className="p-3 space-y-3">
        {/* Título */}
        <h3 className="font-semibold text-sm">Resumo da Ficha</h3>
        
        {/* Header com Avatar */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {avatar ? (
              <AvatarImage src={avatar} alt={characterName} />
            ) : (
              <AvatarFallback className="bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <h4 className="font-medium text-sm">{name}</h4>
            <p className="text-xs text-muted-foreground">{race} {characterClass}</p>
            {level && <p className="text-xs text-muted-foreground">Nível {level}</p>}
          </div>
        </div>
        
        {/* Mini resumo dos atributos principais */}
        <div className="space-y-2">
          {characterData.attributes && Object.entries(characterData.attributes).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-medium">{key.toUpperCase()}:</span>
              <span className="text-xs font-medium">{value}</span>
            </div>
          ))}
        </div>
        
        {/* Botão para abrir ficha completa */}
        <div className="mt-4">
          <Link href={`/campaign/${campaignId}/sheet/${character.id}?role=player`} className="w-full" target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="w-full">
              <BookUser className="mr-2 h-3 w-3" />
              Ver Ficha Completa
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center space-y-3">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <>
      <div className="p-4 text-center space-y-3">
        <p className="text-sm text-muted-foreground">
          Você ainda não criou um personagem para esta campanha.
        </p>
        <Button 
          className="w-full" 
          disabled={isLoading}
          onClick={handleCreateClick}
        >
          <FilePlus2 className="mr-2 h-4 w-4" />
          Criar Personagem D&D 5e
        </Button>
      </div>
    </>
  )
}