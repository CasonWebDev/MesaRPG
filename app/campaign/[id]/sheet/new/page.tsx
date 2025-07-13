"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { ArrowLeft, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CharacterSheetView } from "@/components/character-sheet-view"
import type { UserRole } from "@/app/campaign/[id]/play/page"
import type { CharacterType } from "@prisma/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useCharacterTemplates } from "@/hooks/use-characters"

export default function NewSheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ role?: UserRole; type?: CharacterType }>
}) {
  const [sheetData, setSheetData] = useState<Record<string, any>>({})
  const [template, setTemplate] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  
  const userRole = resolvedSearchParams.role || "Jogador"
  const characterType = resolvedSearchParams.type || "PC"

  const { 
    templates, 
    loading: templatesLoading, 
    getTemplateForType,
    getDefaultFields
  } = useCharacterTemplates(resolvedParams.id, characterType)

  const selectedTemplate = getTemplateForType(characterType)

  useEffect(() => {
    if (selectedTemplate) {
      const defaultData = getDefaultFields(characterType)
      setSheetData(defaultData)
      
      // Parse template fields
      const parsedTemplate = typeof selectedTemplate.fields === 'string' 
        ? JSON.parse(selectedTemplate.fields) 
        : selectedTemplate.fields
      
      setTemplate(parsedTemplate)
      setLoading(false)
    }
  }, [selectedTemplate, characterType, getDefaultFields])

  if (templatesLoading || loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl">Carregando template...</h1>
      </div>
    )
  }

  if (!selectedTemplate || !template) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl">Template não encontrado</h1>
        <p className="text-muted-foreground mt-2">
          Configure um template para {characterType === 'NPC' ? 'NPCs' : characterType === 'CREATURE' ? 'Criaturas' : 'Personagens'} nas configurações da campanha.
        </p>
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
    setSheetData((prev) => ({ ...prev, [fieldName]: value }))
  }

  const getCharacterName = () => {
    // Tentar extrair nome dos dados da ficha
    const name = sheetData.Nome || 
                 sheetData['Nome do NPC'] || 
                 sheetData['Nome da Criatura'] || 
                 sheetData.Espécie || 
                 sheetData.Classe ||
                 `Novo ${characterType === 'NPC' ? 'NPC' : characterType === 'CREATURE' ? 'Criatura' : 'Personagem'}`
    return name
  }

  const handleSave = async () => {
    if (!sheetData) return
    
    const characterName = getCharacterName()
    
    if (!characterName || characterName.includes('Novo ')) {
      toast.error('Por favor, preencha o nome do personagem antes de salvar')
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch(`/api/campaigns/${resolvedParams.id}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: characterName,
          type: characterType,
          data: sheetData,
          templateId: selectedTemplate.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar personagem')
      }

      const result = await response.json()
      toast.success(`${characterType === 'NPC' ? 'NPC' : characterType === 'CREATURE' ? 'Criatura' : 'Personagem'} criado com sucesso!`)
      
      // Redirecionar para a ficha criada
      router.push(`/campaign/${resolvedParams.id}/sheet/${result.character.id}?type=${characterType.toLowerCase()}&role=${userRole}`)
      
    } catch (error) {
      console.error('Erro ao criar personagem:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar personagem')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/campaign/${resolvedParams.id}/play?role=${userRole}`)
  }

  const characterName = getCharacterName()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-secondary/50 p-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-heading text-primary truncate pr-4">
            {characterName}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Criar {characterType === 'NPC' ? 'NPC' : characterType === 'CREATURE' ? 'Criatura' : 'Personagem'}
                </>
              )}
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto py-8">
        <CharacterSheetView
          template={template}
          characterData={sheetData}
          isEditing={true}
          onDataChange={handleDataChange}
          characterType={characterType}
        />
      </main>
    </div>
  )
}