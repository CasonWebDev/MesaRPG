import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Upload, Image } from "lucide-react"
import { TemplateField } from "@/types/sheet-template"

interface FieldPreviewProps {
  field: TemplateField
}

export function FieldPreview({ field }: FieldPreviewProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            value={field.defaultValue || ''}
            placeholder={`Digite ${String(field.name).toLowerCase()}...`}
            className="h-8 text-sm"
            disabled
          />
        )
      
      case 'textarea':
        return (
          <Textarea
            value={field.defaultValue || ''}
            placeholder={`Digite ${String(field.name).toLowerCase()}...`}
            className="text-sm min-h-[60px]"
            disabled
          />
        )
      
      case 'number':
        const min = field.options?.[0] ? Number(field.options[0]) : undefined
        const max = field.options?.[1] ? Number(field.options[1]) : undefined
        return (
          <Input
            type="number"
            value={field.defaultValue || ''}
            min={min}
            max={max}
            className="h-8 text-sm"
            disabled
          />
        )
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={field.defaultValue || false}
              disabled
            />
            <Label className="text-sm">Sim</Label>
          </div>
        )
      
      case 'image':
        return (
          <div className="space-y-2">
            {field.defaultValue && (
              <div className="w-16 h-16 rounded border bg-stone-100 flex items-center justify-center">
                <Image className="h-6 w-6 text-stone-400" />
              </div>
            )}
            <Button variant="outline" size="sm" className="h-8" disabled>
              <Upload className="h-4 w-4 mr-2" />
              Carregar Imagem
            </Button>
          </div>
        )
      
      case 'select':
        return (
          <select
            value={field.defaultValue || ''}
            className="h-8 text-sm rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            disabled
          >
            <option value="">Selecione uma opção</option>
            {field.options?.filter(opt => opt.trim()).map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        )
      
      case 'attributes':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {field.attributes?.map((attribute) => (
                <div key={attribute.id} className="border rounded-md p-2 bg-stone-50/50">
                  <div className="text-xs font-medium text-center mb-1">{attribute.name || 'Atributo'}</div>
                  <div className="text-center">
                    <Input
                      type="number"
                      value={attribute.defaultValue || ''}
                      className="h-8 text-sm text-center bg-white"
                      disabled
                    />
                  </div>
                </div>
              ))}
            </div>
            {(!field.attributes || field.attributes.length === 0) && (
              <div className="text-center py-4 text-stone-500 text-sm">
                Nenhum atributo configurado
              </div>
            )}
          </div>
        )
      
      default:
        return <div className="text-sm text-stone-500">Tipo de campo não suportado</div>
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">{field.name}</Label>
        {field.required && <span className="text-red-500 text-xs">*</span>}
      </div>
      {renderField()}
    </div>
  )
}