"use client"

import { Separator } from "@/components/ui/separator"
import { TextFieldRenderer } from "./field-renderers/text-field-renderer"
import { NumberFieldRenderer } from "./field-renderers/number-field-renderer"
import { SelectFieldRenderer } from "./field-renderers/select-field-renderer"
import { ImageFieldRenderer } from "./field-renderers/image-field-renderer"
import { AttributesFieldRenderer } from "./field-renderers/attributes-field-renderer"
import { TextareaFieldRenderer } from "./field-renderers/textarea-field-renderer"

interface DynamicCharacterFormProps {
  template: any
  data: Record<string, any>
  onChange: (data: Record<string, any>) => void
}

export function DynamicCharacterForm({ template, data, onChange }: DynamicCharacterFormProps) {
  const fields = typeof template.fields === 'string' 
    ? JSON.parse(template.fields) 
    : template.fields

  const handleFieldChange = (fieldName: string, value: any) => {
    onChange({
      ...data,
      [fieldName]: value
    })
  }

  const handleAttributesChange = (groupName: string, attributesData: Record<string, number>) => {
    onChange({
      ...data,
      [groupName]: attributesData
    })
  }

  // Agrupar campos por tipo e por grupos
  const groupedFields = fields.reduce((groups: any, field: any) => {
    if (field.type === 'attributes' && field.groupName) {
      if (!groups.attributes) groups.attributes = []
      groups.attributes.push(field)
    } else {
      if (!groups.regular) groups.regular = []
      groups.regular.push(field)
    }
    return groups
  }, {})

  const renderField = (field: any) => {
    const value = data[field.name] ?? field.defaultValue ?? ''

    switch (field.type) {
      case 'text':
        return (
          <TextFieldRenderer
            key={field.id}
            field={field}
            value={value}
            onChange={(value) => handleFieldChange(field.name, value)}
          />
        )
      
      case 'long_text':
      case 'textarea':
        return (
          <TextareaFieldRenderer
            key={field.id}
            field={field}
            value={value}
            onChange={(value) => handleFieldChange(field.name, value)}
          />
        )
      
      case 'numeric':
      case 'number':
        return (
          <NumberFieldRenderer
            key={field.id}
            field={field}
            value={value}
            onChange={(value) => handleFieldChange(field.name, value)}
          />
        )
      
      case 'select':
        return (
          <SelectFieldRenderer
            key={field.id}
            field={field}
            value={value}
            onChange={(value) => handleFieldChange(field.name, value)}
          />
        )
      
      case 'image':
        return (
          <ImageFieldRenderer
            key={field.id}
            field={field}
            value={value}
            onChange={(value) => handleFieldChange(field.name, value)}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Campos regulares */}
      {groupedFields.regular && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupedFields.regular.map(renderField)}
        </div>
      )}

      {/* Campos de atributos agrupados */}
      {groupedFields.attributes && groupedFields.attributes.map((attributeField: any) => (
        <AttributesFieldRenderer
          key={`${attributeField.groupName}-attributes`}
          field={attributeField}
          value={data[attributeField.groupName] || {}}
          onChange={(value) => handleAttributesChange(attributeField.groupName, value)}
        />
      ))}
    </div>
  )
}