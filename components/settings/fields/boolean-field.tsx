import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { TemplateField } from "@/types/sheet-template"

interface BooleanFieldProps {
  field: TemplateField
  onUpdate: (field: TemplateField) => void
  onDelete: (fieldId: string) => void
}

export function BooleanField({ field, onUpdate, onDelete }: BooleanFieldProps) {
  return (
    <div className="space-y-3 p-3 border rounded-lg bg-stone-50/30">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Campo Sim/Não</Label>
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
          <Label htmlFor={`name-${field.id}`} className="text-xs">Nome do Campo</Label>
          <Input
            id={`name-${field.id}`}
            value={field.name}
            onChange={(e) => onUpdate({ ...field, name: e.target.value })}
            className="h-8 text-sm bg-white"
            placeholder="Ex: Tem Magia"
          />
        </div>
        
        <div>
          <Label htmlFor={`default-${field.id}`} className="text-xs">Valor Padrão</Label>
          <select
            id={`default-${field.id}`}
            value={field.defaultValue === true ? 'true' : field.defaultValue === false ? 'false' : ''}
            onChange={(e) => {
              const value = e.target.value === '' ? undefined : e.target.value === 'true'
              onUpdate({ ...field, defaultValue: value })
            }}
            className="h-8 text-sm rounded-md border border-input bg-white px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Sem padrão</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`required-${field.id}`}
          checked={field.required || false}
          onCheckedChange={(checked) => onUpdate({ ...field, required: checked as boolean })}
        />
        <Label htmlFor={`required-${field.id}`} className="text-xs">Campo obrigatório</Label>
      </div>
    </div>
  )
}