import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { SheetTemplateEditor } from "./sheet-template-editor"
import { SheetTemplate, CreateTemplateData, CharacterType, TemplateField } from "@/types/sheet-template"
import { Plus, Edit } from "lucide-react"
import { toast } from "sonner"

interface TemplateDialogProps {
  campaignId: string
  type: CharacterType
  template?: SheetTemplate
  onSave: (data: CreateTemplateData) => Promise<void>
  trigger?: React.ReactNode
}

export function TemplateDialog({ campaignId, type, template, onSave, trigger }: TemplateDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: template?.name || '',
    isDefault: template?.isDefault || false
  })
  const [fields, setFields] = useState<TemplateField[]>(template?.fields || [])

  const isEdit = !!template

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Nome do template é obrigatório")
      return
    }

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

    setLoading(true)
    try {
      await onSave({
        name: formData.name,
        type,
        fields,
        isDefault: formData.isDefault
      })
      
      toast.success(isEdit ? "Template atualizado com sucesso" : "Template criado com sucesso")
      setOpen(false)
      
      // Reset form se for criação
      if (!isEdit) {
        setFormData({ name: '', isDefault: false })
        setFields([])
      }
    } catch (error) {
      toast.error("Erro ao salvar template")
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      {isEdit ? (
        <>
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </>
      )}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Editar Template: ${template.name}` : 'Novo Template'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome do Template</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Ficha Básica de Personagem"
                required
              />
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
              <Label htmlFor="isDefault" className="text-sm">
                Definir como template padrão
              </Label>
            </div>
          </div>

          <SheetTemplateEditor
            description="Configure os campos que aparecerão na ficha dos personagens"
            fields={fields}
            onUpdateFields={setFields}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Template')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}