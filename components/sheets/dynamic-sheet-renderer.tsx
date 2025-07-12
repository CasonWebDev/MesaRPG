"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Save, Edit3, Eye } from "lucide-react"

interface SheetField {
  id: string
  name: string
  type: 'Texto Curto' | 'Texto Longo' | 'Número' | 'Sim/Não' | 'Imagem'
  value?: any
  required?: boolean
  order?: number
}

interface Template {
  id: string
  name: string
  type: 'player' | 'npc' | 'creature'
  fields: SheetField[]
}

interface Character {
  id: string
  name: string
  type: 'PC' | 'NPC' | 'CREATURE'
  description?: string
  imageUrl?: string
  stats: Record<string, any>
  userId?: string
  templateId?: string
}

interface DynamicSheetRendererProps {
  character: Character
  template: Template
  isEditable?: boolean
  onSave?: (data: Record<string, any>) => void
  onEdit?: () => void
}

export function DynamicSheetRenderer({ 
  character, 
  template, 
  isEditable = false,
  onSave,
  onEdit
}: DynamicSheetRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isEditing, setIsEditing] = useState(isEditable)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Initialize form data with character stats and template fields
    const initialData: Record<string, any> = {}
    
    template.fields.forEach(field => {
      initialData[field.id] = character.stats[field.id] || getDefaultValue(field.type)
    })
    
    setFormData(initialData)
  }, [character, template])

  const getDefaultValue = (type: string) => {
    switch (type) {
      case 'Texto Curto':
      case 'Texto Longo':
        return ''
      case 'Número':
        return 0
      case 'Sim/Não':
        return false
      case 'Imagem':
        return ''
      default:
        return ''
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleSave = async () => {
    if (!onSave) return
    
    setIsSaving(true)
    try {
      await onSave(formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving character:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    }
    setIsEditing(true)
  }

  const renderField = (field: SheetField) => {
    const value = formData[field.id] || getDefaultValue(field.type)
    
    switch (field.type) {
      case 'Texto Curto':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.name}</Label>
            {isEditing ? (
              <Input
                id={field.id}
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={`Digite ${String(field.name).toLowerCase()}`}
              />
            ) : (
              <div className="min-h-[40px] p-2 bg-secondary/20 rounded-md flex items-center">
                {value || <span className="text-muted-foreground">Não informado</span>}
              </div>
            )}
          </div>
        )
      
      case 'Texto Longo':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.name}</Label>
            {isEditing ? (
              <Textarea
                id={field.id}
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                placeholder={`Digite ${String(field.name).toLowerCase()}`}
                rows={3}
              />
            ) : (
              <div className="min-h-[80px] p-2 bg-secondary/20 rounded-md">
                {value ? (
                  <p className="whitespace-pre-wrap">{value}</p>
                ) : (
                  <span className="text-muted-foreground">Não informado</span>
                )}
              </div>
            )}
          </div>
        )
      
      case 'Número':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.name}</Label>
            {isEditing ? (
              <Input
                id={field.id}
                type="number"
                value={value}
                onChange={(e) => handleFieldChange(field.id, parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            ) : (
              <div className="min-h-[40px] p-2 bg-secondary/20 rounded-md flex items-center">
                <Badge variant="outline" className="text-lg">
                  {value}
                </Badge>
              </div>
            )}
          </div>
        )
      
      case 'Sim/Não':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.name}</Label>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.id}
                  checked={value}
                  onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
                />
                <Label htmlFor={field.id} className="text-sm">
                  {value ? 'Sim' : 'Não'}
                </Label>
              </div>
            ) : (
              <div className="min-h-[40px] p-2 bg-secondary/20 rounded-md flex items-center">
                <Badge variant={value ? 'default' : 'secondary'}>
                  {value ? 'Sim' : 'Não'}
                </Badge>
              </div>
            )}
          </div>
        )
      
      case 'Imagem':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.name}</Label>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  id={field.id}
                  type="url"
                  value={value}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  placeholder="URL da imagem"
                />
                {value && (
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={value} alt={field.name} />
                    <AvatarFallback>{field.name[0]}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ) : (
              <div className="min-h-[80px] p-2 bg-secondary/20 rounded-md flex items-center">
                {value ? (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={value} alt={field.name} />
                    <AvatarFallback>{field.name[0]}</AvatarFallback>
                  </Avatar>
                ) : (
                  <span className="text-muted-foreground">Nenhuma imagem</span>
                )}
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  const getCharacterTypeLabel = (type: string) => {
    switch (type) {
      case 'PC':
        return 'Personagem do Jogador'
      case 'NPC':
        return 'Personagem Não-Jogador'
      case 'CREATURE':
        return 'Criatura'
      default:
        return 'Desconhecido'
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">{character.name}</CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{getCharacterTypeLabel(character.type)}</Badge>
            <Badge variant="secondary">{template.name}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} variant="outline">
              <Edit3 className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {character.description && (
          <div className="space-y-2">
            <Label>Descrição</Label>
            <div className="p-3 bg-secondary/20 rounded-md">
              <p className="text-sm">{character.description}</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {template.fields
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(renderField)}
        </div>
      </CardContent>
    </Card>
  )
}