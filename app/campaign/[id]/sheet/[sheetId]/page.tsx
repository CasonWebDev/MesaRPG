"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { ArrowLeft, Edit, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CharacterSheetView } from "@/components/character-sheet-view"
import type { UserRole } from "@/app/campaign/[id]/play/page"
import { toast } from "sonner"

export default function SheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; sheetId: string }>
  searchParams: Promise<{ role?: UserRole; type?: "player" | "npc" | "creature" }>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [sheetData, setSheetData] = useState<Record<string, any> | null>(null)
  const [initialData, setInitialData] = useState<Record<string, any> | null>(null)
  const [template, setTemplate] = useState<any[] | null>(null)
  const [character, setCharacter] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  
  const userRole = resolvedSearchParams.role || "Jogador"
  const type = resolvedSearchParams.type || "player"

  useEffect(() => {
    const loadCharacterData = async () => {
      try {
        setLoading(true)
        
        // Buscar dados do personagem
        const characterResponse = await fetch(`/api/campaigns/${resolvedParams.id}/characters/${resolvedParams.sheetId}`)
        if (!characterResponse.ok) {
          throw new Error('Personagem não encontrado')
        }
        
        const characterData = await characterResponse.json()
        const characterInfo = characterData.character
        
        if (!characterInfo) {
          throw new Error('Personagem não encontrado')
        }
        
        setCharacter(characterInfo)
        
        // Parsear dados do personagem
        let parsedData: Record<string, any> = {}
        if (characterInfo.data) {
          parsedData = typeof characterInfo.data === 'string' 
            ? JSON.parse(characterInfo.data) 
            : characterInfo.data
        }
        
        // Parsear template
        let parsedTemplate: any[] = []
        if (characterInfo.template && characterInfo.template.fields) {
          parsedTemplate = typeof characterInfo.template.fields === 'string' 
            ? JSON.parse(characterInfo.template.fields) 
            : characterInfo.template.fields
        }
        
        setSheetData(parsedData)
        setInitialData(parsedData)
        setTemplate(parsedTemplate)
        
      } catch (error) {
        console.error('Erro ao carregar personagem:', error)
        toast.error('Erro ao carregar dados do personagem')
      } finally {
        setLoading(false)
      }
    }
    
    loadCharacterData()
  }, [resolvedParams.id, resolvedParams.sheetId])

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl">Carregando ficha...</h1>
      </div>
    )
  }

  if (!sheetData || !initialData || !template || !character) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl">Personagem não encontrado</h1>
        <Link href={`/campaign/${resolvedParams.id}/play?role=${userRole}`}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a campanha
          </Button>
        </Link>
      </div>
    )
  }

  const handleDataChange = (fieldName: string, value: string | number | boolean) => {
    setSheetData((prev) => (prev ? { ...prev, [fieldName]: value } : null))
  }

  const handleSaveChanges = async () => {
    if (!sheetData) return
    
    try {
      const response = await fetch(`/api/campaigns/${resolvedParams.id}/characters/${resolvedParams.sheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: character.name,
          data: sheetData,
          templateId: character.templateId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar personagem')
      }

      setInitialData(sheetData)
      setIsEditing(false)
      toast.success('Personagem salvo com sucesso!')
      
    } catch (error) {
      console.error('Erro ao salvar personagem:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar personagem')
    }
  }

  const handleCancelChanges = () => {
    setSheetData(initialData)
    setIsEditing(false)
  }

  const sheetName = character.name || "Ficha"

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-secondary/50 p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-heading text-primary truncate pr-4">{sheetName}</h1>
          <div className="flex items-center gap-2">
            <Link href={`/campaign/${resolvedParams.id}/play?role=${userRole}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancelChanges}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={handleSaveChanges}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto py-8">
        <CharacterSheetView
          template={template}
          characterData={sheetData}
          isEditing={isEditing}
          onDataChange={handleDataChange}
          characterType={character?.type as 'PC' | 'NPC' | 'CREATURE'}
        />
      </main>
    </div>
  )
}
