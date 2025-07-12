import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { X, Plus, Minus } from "lucide-react"
import { TemplateField, AttributeDefinition } from "@/types/sheet-template"
import { nanoid } from "nanoid"

interface AttributesFieldProps {
  field: TemplateField
  onUpdate: (field: TemplateField) => void
  onDelete: (fieldId: string) => void
}

export function AttributesField({ field, onUpdate, onDelete }: AttributesFieldProps) {
  const attributes = field.attributes || []

  const addAttribute = () => {
    const newAttribute: AttributeDefinition = {
      id: nanoid(),
      name: '',
      defaultValue: 0
    }
    onUpdate({ ...field, attributes: [...attributes, newAttribute] })
  }

  const removeAttribute = (index: number) => {
    const newAttributes = attributes.filter((_, i) => i !== index)
    onUpdate({ ...field, attributes: newAttributes })
  }

  const updateAttribute = (index: number, updatedAttribute: AttributeDefinition) => {
    const newAttributes = [...attributes]
    newAttributes[index] = updatedAttribute
    onUpdate({ ...field, attributes: newAttributes })
  }

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-stone-50/30">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Campo de Atributos</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(field.id)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`name-${field.id}`} className="text-xs">Nome do Grupo</Label>
          <Input
            id={`name-${field.id}`}
            value={field.name}
            onChange={(e) => onUpdate({ ...field, name: e.target.value })}
            className="h-8 text-sm bg-white"
            placeholder="Ex: Atributos Principais"
          />
        </div>
        
        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id={`required-${field.id}`}
            checked={field.required || false}
            onCheckedChange={(checked) => onUpdate({ ...field, required: checked as boolean })}
          />
          <Label htmlFor={`required-${field.id}`} className="text-xs">Grupo obrigatório</Label>
        </div>
      </div>
      
      <div>
        <Label className="text-xs">Atributos</Label>
        <div className="space-y-2 mt-2">
          {attributes.map((attribute, index) => (
            <div key={attribute.id} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  value={attribute.name}
                  onChange={(e) => updateAttribute(index, { ...attribute, name: e.target.value })}
                  className="h-8 text-sm bg-white"
                  placeholder={`Atributo ${index + 1}`}
                />
              </div>
              <div className="w-20">
                <Input
                  type="number"
                  value={attribute.defaultValue || ''}
                  onChange={(e) => updateAttribute(index, { 
                    ...attribute, 
                    defaultValue: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="h-8 text-sm bg-white"
                  placeholder="Valor"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAttribute(index)}
                className="h-8 w-8 p-0"
                disabled={attributes.length === 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={addAttribute}
            className="h-8 px-2 text-xs"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Atributo
          </Button>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        <p>Este campo criará um bloco visual com todos os atributos em formato quadrado.</p>
      </div>
    </div>
  )
}