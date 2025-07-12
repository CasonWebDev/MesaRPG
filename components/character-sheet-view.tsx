"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, X } from "lucide-react"
import { TemplateField, AttributeDefinition } from "@/types/sheet-template"

// Usando TemplateField do sistema de templates importado

interface CharacterSheetViewProps {
  template: TemplateField[]
  characterData: Record<string, any>
  isEditing: boolean
  onDataChange: (fieldName: string, value: any) => void
}

export function CharacterSheetView({ template, characterData, isEditing, onDataChange }: CharacterSheetViewProps) {
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({})

  const handleImageChange = (fieldName: string, file: File | null) => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(prev => ({ ...prev, [fieldName]: result }))
        onDataChange(fieldName, result)
      }
      reader.readAsDataURL(file)
    } else {
      setImagePreview(prev => {
        const newPrev = { ...prev }
        delete newPrev[fieldName]
        return newPrev
      })
      onDataChange(fieldName, '')
    }
  }

  const removeImage = (fieldName: string) => {
    handleImageChange(fieldName, null)
  }

  const renderField = (field: TemplateField) => {
    const value = characterData[field.name]

    if (isEditing) {
      switch (field.type) {
        case "text":
          return (
            <Input
              value={value || ''}
              onChange={(e) => onDataChange(field.name, e.target.value)}
              className="bg-stone-50/50 text-lg"
            />
          )
        case "number":
          return (
            <Input
              type="number"
              value={value || 0}
              onChange={(e) => onDataChange(field.name, e.target.valueAsNumber || 0)}
              className="bg-stone-50/50 text-lg"
            />
          )
        case "textarea":
          return (
            <Textarea
              value={value || ''}
              onChange={(e) => onDataChange(field.name, e.target.value)}
              className="bg-stone-50/50 min-h-[120px] text-base"
            />
          )
        case "boolean":
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={value || false}
                onCheckedChange={(checked) => onDataChange(field.name, checked)}
              />
              <Label htmlFor={field.id} className="text-sm">Sim</Label>
            </div>
          )
        case "select":
          return (
            <Select
              value={value || ''}
              onValueChange={(selectedValue) => onDataChange(field.name, selectedValue)}
            >
              <SelectTrigger className="bg-stone-50/50">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        case "attributes":
          return (
            <div className="space-y-3">
              {field.attributes?.map((attr) => (
                <div key={attr.id} className="flex items-center gap-3">
                  <Label className="min-w-[80px] text-sm font-medium">{attr.name}:</Label>
                  <Input
                    type="number"
                    value={value?.[attr.name] || attr.defaultValue || 0}
                    onChange={(e) => {
                      const newValue = { ...value }
                      newValue[attr.name] = e.target.valueAsNumber || 0
                      onDataChange(field.name, newValue)
                    }}
                    className="bg-stone-50/50 w-20 text-center"
                  />
                </div>
              ))}
            </div>
          )
        case "image":
          const hasPreview = imagePreview[field.name] || value
          const currentImage = imagePreview[field.name] || value
          return (
            <div className="space-y-3">
              {hasPreview ? (
                <div className="relative">
                  <img 
                    src={currentImage} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => removeImage(field.name)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-100">
                  <Upload className="h-8 w-8 text-gray-600" />
                </div>
              )}
              <Button asChild variant="outline" className="w-full cursor-pointer bg-white hover:bg-gray-50">
                <label>
                  <Upload className="mr-2 h-4 w-4" />
                  <span>{hasPreview ? 'Alterar Imagem' : 'Selecionar Imagem'}</span>
                  <Input 
                    type="file" 
                    className="sr-only" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleImageChange(field.name, file)
                      }
                    }}
                  />
                </label>
              </Button>
            </div>
          )
        default:
          return <div className="p-3 mt-1 rounded bg-stone-200/20">{value?.toString()}</div>
      }
    }

    // View Mode
    switch (field.type) {
      case "textarea":
        return <p className="p-3 mt-1 rounded bg-stone-50/30 text-ink-text/80 whitespace-pre-wrap">{value}</p>
      case "boolean":
        return <div className="p-3 mt-1 rounded bg-stone-50/30 text-ink-text text-lg">{value ? 'Sim' : 'Não'}</div>
      case "select":
        return <div className="p-3 mt-1 rounded bg-stone-50/30 text-ink-text text-lg">{value || '-'}</div>
      case "attributes":
        return (
          <div className="p-3 mt-1 rounded bg-stone-50/30 space-y-2">
            {field.attributes?.map((attr) => (
              <div key={attr.id} className="flex justify-between items-center">
                <span className="text-ink-text">{attr.name}:</span>
                <span className="text-ink-text font-semibold">{value?.[attr.name] || attr.defaultValue || 0}</span>
              </div>
            ))}
          </div>
        )
      case "image":
        return null // A imagem é tratada separadamente no topo
      default:
        return <div className="p-3 mt-1 rounded bg-stone-50/30 text-ink-text text-lg">{value?.toString()}</div>
    }
  }

  const avatarField = template.find((f) => f.type === "image")
  const nameField = template.find((f) => f.name && String(f.name).toLowerCase() === "nome")
  const otherFields = template.filter((f) => f.type !== "image")

  return (
    <Card className="bg-parchment text-ink-text p-6 sm:p-8">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
          {avatarField && (
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-stone-300">
                <AvatarImage
                  src={characterData[avatarField.name] || "/placeholder.svg"}
                  alt={characterData[nameField?.name] || "Avatar"}
                />
                <AvatarFallback>{String(characterData[nameField?.name] || "P").charAt(0)}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <div className="absolute bottom-0 right-0">
                  <Button
                    asChild
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 rounded-full cursor-pointer bg-stone-50/80 hover:bg-stone-50"
                  >
                    <label>
                      <Upload className="h-5 w-5" />
                      <Input 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleImageChange(avatarField.name, file)
                          }
                        }}
                      />
                    </label>
                  </Button>
                </div>
              )}
            </div>
          )}
          {nameField && !isEditing && (
            <h1 className="text-5xl font-heading text-center sm:text-left">{characterData[nameField.name]}</h1>
          )}
        </div>

        <div className="space-y-6">
          {template.map((field) => {
            // Pular campos de imagem que são mostrados no topo
            if (field.type === "image") return null
            
            const value = characterData[field.name]
            
            // No modo de edição, mostrar todos os campos do template
            if (isEditing || (value !== undefined && value !== null && value !== '')) {
              return (
                <div key={field.id}>
                  <Label className="text-lg font-bold text-ink-text/90">{field.name}</Label>
                  <div className="mt-1">{renderField(field)}</div>
                </div>
              )
            }
            
            return null
          })}
        </div>
      </CardContent>
    </Card>
  )
}
