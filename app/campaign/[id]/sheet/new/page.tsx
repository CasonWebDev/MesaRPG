"use client"

import { useState, useEffect, useRef, use } from "react"
import type { UserRole } from "@/app/campaign/[id]/play/page"
import type { CharacterType } from "@prisma/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useCharacters } from "@/hooks/use-characters"

export default function NewSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ role?: UserRole; type?: CharacterType; system?: string }>
}) {
  const [loading, setLoading] = useState(true)
  const [character, setCharacter] = useState<any>(null)
  const router = useRouter()
  const hasCreated = useRef(false)

  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  
  const userRole = resolvedSearchParams.role || "Jogador"
  const characterType = resolvedSearchParams.type || "PC"
  const systemId = resolvedSearchParams.system || "dnd5e"

  const { createCharacter } = useCharacters({ 
    campaignId: resolvedParams.id, 
    type: characterType
  })

  useEffect(() => {
    const createEmptyCharacter = async () => {
      // Prevenir múltiplas execuções
      if (hasCreated.current) return
      hasCreated.current = true
      
      try {
        console.log('🔄 Criando personagem...', { characterType, campaignId: resolvedParams.id })
        
        // Criar personagem vazio
        const emptyCharacterData = {
          name: "Novo Personagem",
          type: characterType,
          data: {} // Dados vazios - a ficha D&D 5e tem valores padrão
        }
        
        const result = await createCharacter(emptyCharacterData)
        setCharacter(result)
        
        console.log('✅ Personagem criado com sucesso:', result.id)
        
        // Redirecionar para a ficha criada
        router.replace(`/campaign/${resolvedParams.id}/sheet/${result.id}?role=${userRole}`)
        
      } catch (error) {
        console.error('❌ Erro ao criar personagem:', error)
        toast.error(error instanceof Error ? error.message : 'Erro ao criar personagem')
        setLoading(false)
        // Resetar flag em caso de erro para permitir retry
        hasCreated.current = false
      }
    }
    
    createEmptyCharacter()
  }, [resolvedParams.id, characterType, userRole, router]) // Removido createCharacter das dependências

  const getTitle = () => {
    switch(characterType) {
      case 'NPC':
        return 'Criando NPC D&D 5e...'
      case 'CREATURE':
        return 'Criando Criatura D&D 5e...'
      default:
        return 'Criando Personagem D&D 5e...'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl mb-4">{getTitle()}</h1>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <p className="text-muted-foreground mt-4">
          Preparando sua ficha de personagem...
        </p>
      </div>
    </div>
  )
}