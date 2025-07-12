import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Upload } from "lucide-react"
import { TemplateField, FieldType, FIELD_TYPES } from "@/types/sheet-template"
import { FieldList } from "./fields/field-list"
import { FieldPreview } from "./fields/field-preview"
import { nanoid } from "nanoid"

interface SheetTemplateEditorProps {
  description: string
  fields: TemplateField[]
  onUpdateFields: (fields: TemplateField[]) => void
}

export function SheetTemplateEditor({ description, fields, onUpdateFields }: SheetTemplateEditorProps) {
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>('text')

  const addField = () => {
    const newField: TemplateField = {
      id: nanoid(),
      name: `Novo Campo ${fields.length + 1}`,
      type: selectedFieldType,
      required: false,
      ...(selectedFieldType === 'attributes' && { attributes: [] })
    }
    onUpdateFields([...fields, newField])
  }

  const updateField = (updatedField: TemplateField) => {
    onUpdateFields(fields.map(field => 
      field.id === updatedField.id ? updatedField : field
    ))
  }

  const deleteField = (fieldId: string) => {
    onUpdateFields(fields.filter(field => field.id !== fieldId))
  }

  const reorderFields = (reorderedFields: TemplateField[]) => {
    onUpdateFields(reorderedFields)
  }

  return (
    <Card className="bg-parchment/50 border-stone-400">
      <CardHeader>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-4 text-ink-text">Campos da Ficha</h3>
          
          {fields.length > 0 ? (
            <FieldList
              fields={fields}
              onUpdateField={updateField}
              onDeleteField={deleteField}
              onReorderFields={reorderFields}
            />
          ) : (
            <div className="text-center py-8 text-stone-500">
              <p className="text-sm mb-4">Nenhum campo adicionado ainda</p>
              <p className="text-xs">Adicione campos para criar sua ficha personalizada</p>
            </div>
          )}
          
          <div className="flex gap-2 mt-4">
            <div className="flex-1">
              <Select value={selectedFieldType} onValueChange={(value) => setSelectedFieldType(value as FieldType)}>
                <SelectTrigger className="h-8 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FIELD_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addField} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Campo
            </Button>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4 text-ink-text">Pré-visualização da Ficha</h3>
          <Card className="p-4 bg-stone-50/80">
            <CardTitle className="mb-4">Ficha de Exemplo</CardTitle>
            <div className="space-y-4">
              {fields.length > 0 ? (
                fields.map((field) => (
                  <FieldPreview key={field.id} field={field} />
                ))
              ) : (
                <div className="text-center py-8 text-stone-500">
                  <p className="text-sm">Adicione campos para ver a pré-visualização</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}