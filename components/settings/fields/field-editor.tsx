import { TemplateField } from "@/types/sheet-template"
import { TextField } from "./text-field"
import { TextareaField } from "./textarea-field"
import { NumberField } from "./number-field"
import { BooleanField } from "./boolean-field"
import { ImageField } from "./image-field"
import { SelectField } from "./select-field"
import { AttributesField } from "./attributes-field"

interface FieldEditorProps {
  field: TemplateField
  onUpdate: (field: TemplateField) => void
  onDelete: (fieldId: string) => void
}

export function FieldEditor({ field, onUpdate, onDelete }: FieldEditorProps) {
  switch (field.type) {
    case 'text':
      return <TextField field={field} onUpdate={onUpdate} onDelete={onDelete} />
    case 'textarea':
      return <TextareaField field={field} onUpdate={onUpdate} onDelete={onDelete} />
    case 'number':
      return <NumberField field={field} onUpdate={onUpdate} onDelete={onDelete} />
    case 'boolean':
      return <BooleanField field={field} onUpdate={onUpdate} onDelete={onDelete} />
    case 'image':
      return <ImageField field={field} onUpdate={onUpdate} onDelete={onDelete} />
    case 'select':
      return <SelectField field={field} onUpdate={onUpdate} onDelete={onDelete} />
    case 'attributes':
      return <AttributesField field={field} onUpdate={onUpdate} onDelete={onDelete} />
    default:
      return null
  }
}