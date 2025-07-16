"use client"

import { useState } from "react"
import { UniversalCharacterSheet } from '@/components/character/universal-character-sheet'
import { TemplateField } from "@/types/sheet-template"

// Wrapper para manter compatibilidade com o sistema existente
interface CharacterSheetViewProps {
  template?: TemplateField[]
  character?: any
  characterData?: Record<string, any>
  isEditing: boolean
  onDataChange?: (fieldName: string, value: any) => void
  onUpdate?: (data: any) => void
  characterType?: 'PC' | 'NPC' | 'CREATURE'
  campaignId?: string
  systemId?: string
}

export function CharacterSheetView({ 
  template, 
  character,
  characterData, 
  isEditing, 
  onDataChange,
  onUpdate,
  characterType,
  campaignId,
  systemId = 'generic'
}: CharacterSheetViewProps) {
  const [data, setData] = useState(characterData || {})
  
  // Se temos um character object, usar o sistema universal
  if (character && campaignId) {
    return (
      <UniversalCharacterSheet
        character={character}
        onUpdate={onUpdate || ((newData) => {})}
        isEditing={isEditing}
        campaignId={campaignId}
        systemId={systemId}
      />
    )
  }
  
  // Fallback para compatibilidade com template-based system
  return (
    <LegacyCharacterSheetView
      template={template || []}
      characterData={data}
      isEditing={isEditing}
      onDataChange={(fieldName, value) => {
        const newData = { ...data, [fieldName]: value }
        setData(newData)
        onDataChange?.(fieldName, value)
      }}
      characterType={characterType}
    />
  )
}

// Componente legado para compatibilidade
function LegacyCharacterSheetView({ template, characterData, isEditing, onDataChange, characterType }: {
  template: TemplateField[]
  characterData: Record<string, any>
  isEditing: boolean
  onDataChange: (fieldName: string, value: any) => void
  characterType?: 'PC' | 'NPC' | 'CREATURE'
}) {
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({})
  
  // Implementação simplificada para compatibilidade
  const renderField = (field: TemplateField) => {
    const value = characterData[field.name]
    
    if (isEditing) {
      switch (field.type) {
        case "text":
          return (
            <input
              type="text"
              value={value || ''}
              onChange={(e) => onDataChange(field.name, e.target.value)}
              className="w-full p-2 border rounded"
            />
          )
        case "number":
          return (
            <input
              type="number"
              value={value || 0}
              onChange={(e) => onDataChange(field.name, e.target.valueAsNumber || 0)}
              className="w-full p-2 border rounded"
            />
          )
        case "textarea":
          return (
            <textarea
              value={value || ''}
              onChange={(e) => onDataChange(field.name, e.target.value)}
              className="w-full p-2 border rounded min-h-[120px]"
            />
          )
        case "boolean":
          return (
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onDataChange(field.name, e.target.checked)}
              className="h-4 w-4"
            />
          )
        default:
          return <div className="p-2 bg-muted/50 rounded">{value?.toString()}</div>
      }
    }
    
    // View mode
    return <div className="p-2 bg-muted/30 rounded">{value?.toString() || '-'}</div>
  }
  
  return (
    <div className="space-y-4 p-4 bg-background rounded-lg shadow">
      <h2 className="text-2xl font-bold">Ficha de Personagem</h2>
      {template.map((field) => (
        <div key={field.id} className="space-y-2">
          <label className="text-lg font-semibold">{field.name}</label>
          {renderField(field)}
        </div>
      ))}
    </div>
  )
}