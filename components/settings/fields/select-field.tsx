import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { X, Plus, Minus } from "lucide-react"
import { TemplateField } from "@/types/sheet-template"

interface SelectFieldProps {
  field: TemplateField
  onUpdate: (field: TemplateField) => void
  onDelete: (fieldId: string) => void
}

export function SelectField({ field, onUpdate, onDelete }: SelectFieldProps) {
  const options = field.options || ['']

  const addOption = () => {
    const newOptions = [...options, '']
    onUpdate({ ...field, options: newOptions })
  }

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index)
    onUpdate({ ...field, options: newOptions })
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    onUpdate({ ...field, options: newOptions })
  }

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-stone-50/30">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Campo de Seleção</Label>
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
            placeholder="Ex: Classe"
          />
        </div>
        
        <div>
          <Label htmlFor={`default-${field.id}`} className="text-xs">Opção Padrão</Label>
          <select
            id={`default-${field.id}`}
            value={field.defaultValue || ''}
            onChange={(e) => onUpdate({ ...field, defaultValue: e.target.value || undefined })}
            className="h-8 text-sm rounded-md border border-input bg-white px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">Sem padrão</option>
            {options.filter(opt => opt.trim()).map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <Label className="text-xs">Opções</Label>
        <div className="space-y-2 mt-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="h-8 text-sm bg-white"
                placeholder={`Opção ${index + 1}`}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOption(index)}
                className="h-8 w-8 p-0"
                disabled={options.length === 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={addOption}
            className="h-8 px-2 text-xs"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Opção
          </Button>
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