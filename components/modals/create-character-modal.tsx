"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { CharacterType } from "@prisma/client"
import { DynamicCharacterForm } from "./dynamic-character-form"
import { useCharacterTemplates } from "@/hooks/use-characters"

interface CreateCharacterModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: any) => Promise<void>
  campaignId: string
  characterType: CharacterType
}

export function CreateCharacterModal({
  isOpen,
  onClose,
  onConfirm,
  campaignId,
  characterType
}: CreateCharacterModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const { 
    templates, 
    loading: templatesLoading, 
    getTemplateForType,
    getDefaultFields
  } = useCharacterTemplates(campaignId, characterType)

  const template = getTemplateForType(characterType)

  // Inicializar dados padrão quando o template for carregado
  useEffect(() => {
    if (template) {
      const defaultData = getDefaultFields(characterType)
      setFormData(defaultData)
    }
  }, [template, characterType, getDefaultFields])

  const handleSubmit = async () => {
    if (!template || !formData.Nome && !formData['Nome do NPC'] && !formData['Nome da Criatura'] && !formData.Espécie) {
      return
    }

    setIsLoading(true)
    try {
      // Extrair nome baseado no tipo de character
      const name = formData.Nome || 
                   formData['Nome do NPC'] || 
                   formData['Nome da Criatura'] || 
                   formData.Espécie || 
                   'Sem nome'

      await onConfirm({
        name,
        data: formData,
        templateId: template.id
      })
      
      // Reset form
      const defaultData = getDefaultFields(characterType)
      setFormData(defaultData)
    } finally {
      setIsLoading(false)
    }
  }

  const getModalTitle = () => {
    switch (characterType) {
      case 'NPC':
        return 'Criar Novo NPC'
      case 'CREATURE':
        return 'Criar Nova Criatura'
      case 'PC':
        return 'Criar Novo Personagem'
      default:
        return 'Criar Character'
    }
  }

  const getModalDescription = () => {
    switch (characterType) {
      case 'NPC':
        return 'Preencha os dados para criar um novo NPC para sua campanha.'
      case 'CREATURE':
        return 'Preencha os dados para criar uma nova criatura para sua campanha.'
      case 'PC':
        return 'Preencha os dados para criar um novo personagem.'
      default:
        return 'Preencha os dados para criar um novo character.'
    }
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>
            {getModalDescription()}
          </DialogDescription>
        </DialogHeader>

        {templatesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando template...</span>
          </div>
        ) : !template ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum template encontrado para {characterType === 'NPC' ? 'NPCs' : characterType === 'CREATURE' ? 'Criaturas' : 'Personagens'}.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Configure um template nas configurações da campanha primeiro.
            </p>
          </div>
        ) : (
          <>
            <DynamicCharacterForm
              template={template}
              data={formData}
              onChange={setFormData}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar {characterType === 'NPC' ? 'NPC' : characterType === 'CREATURE' ? 'Criatura' : 'Personagem'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}