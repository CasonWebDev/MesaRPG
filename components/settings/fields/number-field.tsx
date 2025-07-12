import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { TemplateField } from "@/types/sheet-template"

interface NumberFieldProps {
  field: TemplateField
  onUpdate: (field: TemplateField) => void
  onDelete: (fieldId: string) => void
}

export function NumberField({ field, onUpdate, onDelete }: NumberFieldProps) {
  return (
    <div className="space-y-3 p-3 border rounded-lg bg-stone-50/30">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Campo Numérico</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(field.id)}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label htmlFor={`name-${field.id}`} className="text-xs">Nome do Campo</Label>
          <Input
            id={`name-${field.id}`}
            value={field.name}
            onChange={(e) => onUpdate({ ...field, name: e.target.value })}
            className="h-8 text-sm bg-white"
            placeholder="Ex: Força"
          />
        </div>
        
        <div>
          <Label htmlFor={`default-${field.id}`} className="text-xs">Valor Padrão</Label>
          <Input
            id={`default-${field.id}`}
            type="number"
            value={field.defaultValue || ''}
            onChange={(e) => onUpdate({ ...field, defaultValue: e.target.value ? Number(e.target.value) : undefined })}
            className="h-8 text-sm bg-white"
            placeholder="0"
          />
        </div>
        
        <div>
          <Label htmlFor={`min-${field.id}`} className="text-xs">Valor Mínimo</Label>
          <Input
            id={`min-${field.id}`}
            type="number"
            value={field.options?.[0] || ''}
            onChange={(e) => {
              const options = field.options || ['', '']
              options[0] = e.target.value
              onUpdate({ ...field, options })
            }}
            className="h-8 text-sm bg-white"
            placeholder="Min"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`max-${field.id}`} className="text-xs">Valor Máximo</Label>
          <Input
            id={`max-${field.id}`}
            type="number"
            value={field.options?.[1] || ''}
            onChange={(e) => {
              const options = field.options || ['', '']
              options[1] = e.target.value
              onUpdate({ ...field, options })
            }}
            className="h-8 text-sm bg-white"
            placeholder="Max"
          />
        </div>
        
        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id={`required-${field.id}`}
            checked={field.required || false}
            onCheckedChange={(checked) => onUpdate({ ...field, required: checked as boolean })}
          />
          <Label htmlFor={`required-${field.id}`} className="text-xs">Campo obrigatório</Label>
        </div>
      </div>
    </div>
  )
}