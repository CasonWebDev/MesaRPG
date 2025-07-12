"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, GripVertical, Save, Eye } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

interface SheetField {
  id: string
  name: string
  type: 'Texto Curto' | 'Texto Longo' | 'Número' | 'Sim/Não' | 'Imagem'
  required?: boolean
  order?: number
}

interface Template {
  id?: string
  name: string
  type: 'player' | 'npc' | 'creature'
  fields: SheetField[]
}

interface TemplateBuilderProps {
  template?: Template
  onSave: (template: Template) => void
  onCancel: () => void
  campaignId: string
}

export function TemplateBuilder({ template, onSave, onCancel, campaignId }: TemplateBuilderProps) {
  const [templateName, setTemplateName] = useState(template?.name || '')
  const [templateType, setTemplateType] = useState<'player' | 'npc' | 'creature'>(template?.type || 'player')
  const [fields, setFields] = useState<SheetField[]>(template?.fields || [])
  const [isPreview, setIsPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (template) {
      setTemplateName(template.name)
      setTemplateType(template.type)
      setFields(template.fields)
    }
  }, [template])

  const fieldTypes = [
    { value: 'Texto Curto', label: 'Texto Curto' },
    { value: 'Texto Longo', label: 'Texto Longo' },
    { value: 'Número', label: 'Número' },
    { value: 'Sim/Não', label: 'Sim/Não' },
    { value: 'Imagem', label: 'Imagem' }
  ]

  const templateTypes = [
    { value: 'player', label: 'Personagem do Jogador' },
    { value: 'npc', label: 'Personagem Não-Jogador (NPC)' },
    { value: 'creature', label: 'Criatura' }
  ]

  const addField = () => {
    const newField: SheetField = {
      id: `field_${Date.now()}`,
      name: `Novo Campo ${fields.length + 1}`,
      type: 'Texto Curto',
      required: false,
      order: fields.length
    }
    setFields([...fields, newField])
  }

  const removeField = (fieldId: string) => {
    setFields(fields.filter(field => field.id !== fieldId))
  }

  const updateField = (fieldId: string, updates: Partial<SheetField>) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(fields)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order property
    const updatedFields = items.map((field, index) => ({
      ...field,
      order: index
    }))

    setFields(updatedFields)
  }

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Por favor, informe um nome para o template')
      return
    }

    if (fields.length === 0) {
      alert('Por favor, adicione pelo menos um campo')
      return
    }

    setIsSaving(true)
    try {
      const templateData: Template = {
        id: template?.id,
        name: templateName,
        type: templateType,
        fields: fields.map((field, index) => ({
          ...field,
          order: index
        }))
      }

      await onSave(templateData)
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const renderFieldPreview = (field: SheetField) => {
    switch (field.type) {
      case 'Texto Curto':
        return (
          <div className="space-y-2">
            <Label>{field.name}</Label>
            <Input placeholder={`Digite ${String(field.name).toLowerCase()}`} disabled />
          </div>
        )
      case 'Texto Longo':
        return (
          <div className="space-y-2">
            <Label>{field.name}</Label>
            <div className="min-h-[80px] p-2 bg-secondary/20 rounded-md flex items-center">
              <span className="text-muted-foreground">Área de texto longo</span>
            </div>
          </div>
        )
      case 'Número':
        return (
          <div className="space-y-2">
            <Label>{field.name}</Label>
            <Input type="number" placeholder="0" disabled />
          </div>
        )
      case 'Sim/Não':
        return (
          <div className="space-y-2">
            <Label>{field.name}</Label>
            <div className="flex items-center space-x-2">
              <Switch disabled />
              <Label className="text-sm">Sim/Não</Label>
            </div>
          </div>
        )
      case 'Imagem':
        return (
          <div className="space-y-2">
            <Label>{field.name}</Label>
            <div className="min-h-[80px] p-2 bg-secondary/20 rounded-md flex items-center">
              <span className="text-muted-foreground">Área de imagem</span>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (isPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Preview do Template</h2>
            <p className="text-muted-foreground">{templateName}</p>
          </div>
          <Button onClick={() => setIsPreview(false)} variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Voltar à Edição
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exemplo de Ficha</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{templateTypes.find(t => t.value === templateType)?.label}</Badge>
              <Badge variant="secondary">{templateName}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map(renderFieldPreview)}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {template ? 'Editar Template' : 'Criar Template'}
          </h2>
          <p className="text-muted-foreground">
            Configure os campos que aparecerão na ficha
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsPreview(true)} variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Ficha D&D 5e"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-type">Tipo de Template</Label>
              <Select value={templateType} onValueChange={setTemplateType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {templateTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Campos da Ficha</CardTitle>
          <Button onClick={addField} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Campo
          </Button>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum campo adicionado ainda. Clique em "Adicionar Campo" para começar.
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="fields">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="p-4 border rounded-lg bg-background"
                          >
                            <div className="flex items-center gap-4">
                              <div {...provided.dragHandleProps} className="cursor-move">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label>Nome do Campo</Label>
                                  <Input
                                    value={field.name}
                                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                                    placeholder="Nome do campo"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Tipo de Campo</Label>
                                  <Select
                                    value={field.type}
                                    onValueChange={(value) => updateField(field.id, { type: value as any })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {fieldTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label>Opções</Label>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={field.required}
                                      onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                                    />
                                    <Label className="text-sm">Obrigatório</Label>
                                  </div>
                                </div>
                              </div>
                              
                              <Button
                                onClick={() => removeField(field.id)}
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>
    </div>
  )
}