import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Star } from "lucide-react"
import { SheetTemplate, CharacterType } from "@/types/sheet-template"
import { TemplateDialog } from "./template-dialog"
import { toast } from "sonner"

interface TemplateListProps {
  campaignId: string
  type: CharacterType
  templates: SheetTemplate[]
  onUpdate: (template: SheetTemplate) => void
  onDelete: (templateId: string) => void
  onCreateTemplate: (data: any) => Promise<void>
  onUpdateTemplate: (templateId: string, data: any) => Promise<void>
}

export function TemplateList({ 
  campaignId, 
  type, 
  templates, 
  onUpdate, 
  onDelete, 
  onCreateTemplate, 
  onUpdateTemplate 
}: TemplateListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (templateId: string) => {
    if (!confirm("Tem certeza que deseja deletar este template?")) {
      return
    }

    setDeletingId(templateId)
    try {
      await onDelete(templateId)
      toast.success("Template deletado com sucesso")
    } catch (error) {
      toast.error("Erro ao deletar template")
    } finally {
      setDeletingId(null)
    }
  }

  const handleUpdateTemplate = async (templateId: string, data: any) => {
    await onUpdateTemplate(templateId, data)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Templates Existentes</h3>
        <TemplateDialog
          campaignId={campaignId}
          type={type}
          onSave={onCreateTemplate}
        />
      </div>

      {templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-center mb-4">
              Nenhum template encontrado
            </p>
            <TemplateDialog
              campaignId={campaignId}
              type={type}
              onSave={onCreateTemplate}
              trigger={
                <Button>
                  Criar Primeiro Template
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="bg-parchment/30 border-stone-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.isDefault && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <TemplateDialog
                      campaignId={campaignId}
                      type={type}
                      template={template}
                      onSave={(data) => handleUpdateTemplate(template.id, data)}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      }
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      disabled={deletingId === template.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deletingId === template.id ? 'Deletando...' : 'Deletar'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                  {template.fields.length} campos configurados
                </div>
                <div className="flex flex-wrap gap-2">
                  {template.fields.slice(0, 5).map((field) => (
                    <Badge key={field.id} variant="outline" className="text-xs">
                      {field.name}
                    </Badge>
                  ))}
                  {template.fields.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.fields.length - 5} mais
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}