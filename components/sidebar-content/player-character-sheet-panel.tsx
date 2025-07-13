"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FilePlus2, BookUser, Shield } from "lucide-react"
import { SheetTemplate } from "@/types/sheet-template"
import { useCharacters } from "@/hooks/use-characters"
import { toast } from "sonner"

interface PlayerCharacterSheetPanelProps {
  campaignId: string
  playerCharacterId?: string
}

export function PlayerCharacterSheetPanel({ campaignId, playerCharacterId }: PlayerCharacterSheetPanelProps) {
  const [template, setTemplate] = useState<SheetTemplate | null>(null)
  const [canCreateCharacter, setCanCreateCharacter] = useState(false)
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

  // Carregar template e verificar se pode criar personagem
  useEffect(() => {
    const loadTemplateData = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/sheet-templates`)
        if (response.ok) {
          const data = await response.json()
          const playerTemplate = data.templates.find((t: SheetTemplate) => t.type === 'PC' && t.isDefault)
          
          if (playerTemplate) {
            setTemplate(playerTemplate)
            setCanCreateCharacter(data.canCreateCharacter)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar template:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplateData()
  }, [campaignId])

  const handleCreateClick = () => {
    if (!template) {
      toast.error('Nenhum template de personagem encontrado')
      return
    }
    
    if (!canCreateCharacter) {
      toast.error('O mestre precisa criar um template de personagem antes que você possa criar um personagem')
      return
    }
    
    router.push(`/campaign/${campaignId}/sheet/new?type=PC&role=Jogador`)
  }

  if (hasCharacter && character) {
    // Parsear dados do personagem
    const characterData = typeof character.data === 'string' ? JSON.parse(character.data) : character.data
    
    // Extrair nome do personagem
    const characterName = character.name || 'Personagem'
    
    // Buscar campo de imagem no template
    const templateFields = Array.isArray(character.template?.fields) 
      ? character.template.fields 
      : (typeof character.template?.fields === 'string' ? JSON.parse(character.template.fields) : [])
    
    const imageField = templateFields.find((field: any) => field.type === 'image')
    const avatarUrl = imageField ? characterData[imageField.name] : null
    
    // Pegar os primeiros 4 campos (excluindo imagem)
    const firstFourFields = templateFields
      .filter((field: any) => field.type !== 'image')
      .slice(0, 4)
    
    return (
      <div className="p-3 space-y-3">
        {/* Título */}
        <h3 className="font-semibold text-sm">Resumo da Ficha</h3>
        
        {/* Header com Avatar */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={characterName} />
            ) : (
              <AvatarFallback className="bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        
        {/* Mini resumo dos primeiros 4 campos */}
        <div className="space-y-2">
          {firstFourFields.map((field: any) => {
            const value = characterData[field.name]
            if (!value || value === '' || value === 0) return null
            
            let displayValue = value
            
            // Formatação especial para diferentes tipos de campo
            if (field.type === 'boolean') {
              displayValue = value ? 'Sim' : 'Não'
            } else if (field.type === 'attributes' && typeof value === 'object') {
              displayValue = Object.entries(value)
                .map(([key, val]) => `${key}: ${val}`)
                .join(', ')
            } else if (typeof value === 'string' && value.length > 30) {
              displayValue = value.substring(0, 30) + '...'
            }
            
            return (
              <div key={field.id} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">{field.name}:</span>
                <span className="text-xs text-right flex-1 ml-2 truncate">{displayValue}</span>
              </div>
            )
          })}
        </div>
        
        {/* Botão para abrir ficha completa */}
        <div className="mt-4">
          <Link href={`/campaign/${campaignId}/sheet/${character.id}?role=player`} className="w-full">
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
          {!canCreateCharacter 
            ? 'O mestre precisa criar um template de personagem antes que você possa criar um personagem.'
            : 'Você ainda não criou um personagem para esta campanha.'
          }
        </p>
        <Button 
          className="w-full" 
          disabled={!canCreateCharacter || isLoading}
          onClick={handleCreateClick}
        >
          <FilePlus2 className="mr-2 h-4 w-4" />
          Criar Personagem
        </Button>
      </div>
    </>
  )
}
