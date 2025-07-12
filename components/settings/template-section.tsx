import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"
import { SheetTemplateEditor } from "./sheet-template-editor"
import { SheetTemplate, CharacterType, TemplateField } from "@/types/sheet-template"
import { useTemplates } from "@/hooks/use-templates"
import { toast } from "sonner"

interface TemplateSectionProps {
  campaignId: string
  type: CharacterType
  title: string
  description: string
}

export function TemplateSection({ campaignId, type, title, description }: TemplateSectionProps) {
  const { templates, loading, error, createTemplate, updateTemplate, refetch } = useTemplates({ 
    campaignId, 
    type 
  })
  
  const [fields, setFields] = useState<TemplateField[]>([])
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Template único (primeiro da lista ou undefined)
  const template = templates[0]

  // Inicializar dados quando o template for carregado
  useEffect(() => {
    if (template) {
      setFields(template.fields)
      setHasChanges(false)
    } else {
      // Valores padrão para novo template
      setFields([])
      setHasChanges(false)
    }
  }, [template, type])

  // Detectar mudanças
  useEffect(() => {
    if (template) {
      const fieldsChanged = JSON.stringify(fields) !== JSON.stringify(template.fields)
      setHasChanges(fieldsChanged)
    } else {
      const hasContent = fields.length > 0
      setHasChanges(hasContent)
    }
  }, [fields, template])

  const handleSave = async () => {
    if (fields.length === 0) {
      toast.error("Pelo menos um campo é obrigatório")
      return
    }

    // Validar se todos os campos têm nome
    const invalidFields = fields.filter(field => !field.name.trim())
    if (invalidFields.length > 0) {
      toast.error("Todos os campos devem ter um nome")
      return
    }

    setSaving(true)
    try {
      const templateData = {
        name: getDefaultName(type),
        type,
        fields,
        isDefault: true // Sempre padrão já que é único por tipo
      }

      if (template) {
        await updateTemplate(template.id, templateData)
        toast.success("Template atualizado com sucesso")
      } else {
        await createTemplate(templateData)
        toast.success("Template criado com sucesso")
      }
      
      setHasChanges(false)
    } catch (error) {
      toast.error("Erro ao salvar template")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Carregando template...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Erro ao carregar template: {error}</p>
        <button 
          onClick={refetch}
          className="mt-2 text-sm underline"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {description}
      </p>

      {/* Editor de campos */}
      <SheetTemplateEditor
        description="Configure os campos que aparecerão na ficha"
        fields={fields}
        onUpdateFields={setFields}
      />

      {/* Botão de salvar */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Template
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

function getDefaultName(type: CharacterType): string {
  switch (type) {
    case 'PC':
      return 'Ficha de Personagem'
    case 'NPC':
      return 'Ficha de NPC'
    case 'CREATURE':
      return 'Ficha de Criatura'
    default:
      return 'Ficha'
  }
}