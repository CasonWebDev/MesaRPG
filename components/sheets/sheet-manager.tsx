"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit3, Trash2, Eye, FileText, Users, Swords } from "lucide-react"
import { TemplateBuilder } from "./template-builder"
import { DynamicSheetRenderer } from "./dynamic-sheet-renderer"

interface SheetField {
  id: string
  name: string
  type: 'Texto Curto' | 'Texto Longo' | 'Número' | 'Sim/Não' | 'Imagem'
  required?: boolean
  order?: number
}

interface Template {
  id: string
  name: string
  type: 'player' | 'npc' | 'creature'
  fields: SheetField[]
  createdAt: string
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
  createdAt: string
}

interface SheetManagerProps {
  campaignId: string
  userRole: 'Mestre' | 'Jogador'
}

export function SheetManager({ campaignId, userRole }: SheetManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'preview'>('list')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)

  useEffect(() => {
    loadTemplates()
    loadCharacters()
  }, [campaignId])

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/templates`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadCharacters = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/characters`)
      if (response.ok) {
        const data = await response.json()
        setCharacters(data.characters || [])
      }
    } catch (error) {
      console.error('Error loading characters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTemplate = async (templateData: Template) => {
    try {
      const url = templateData.id 
        ? `/api/campaigns/${campaignId}/templates/${templateData.id}`
        : `/api/campaigns/${campaignId}/templates`
      
      const method = templateData.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData)
      })

      if (response.ok) {
        const result = await response.json()
        
        if (templateData.id) {
          // Update existing template
          setTemplates(prev => prev.map(t => 
            t.id === templateData.id ? result.template : t
          ))
        } else {
          // Add new template
          setTemplates(prev => [result.template, ...prev])
        }
        
        setCurrentView('list')
        setSelectedTemplate(null)
      }
    } catch (error) {
      console.error('Error saving template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId))
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleSaveCharacter = async (characterData: Record<string, any>) => {
    if (!selectedCharacter) return

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/characters/${selectedCharacter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stats: characterData
        })
      })

      if (response.ok) {
        const result = await response.json()
        setCharacters(prev => prev.map(c => 
          c.id === selectedCharacter.id ? result.character : c
        ))
        setSelectedCharacter(result.character)
      }
    } catch (error) {
      console.error('Error saving character:', error)
    }
  }

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'player':
        return <Users className="h-4 w-4" />
      case 'npc':
        return <FileText className="h-4 w-4" />
      case 'creature':
        return <Swords className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'player':
        return 'Jogador'
      case 'npc':
        return 'NPC'
      case 'creature':
        return 'Criatura'
      default:
        return 'Desconhecido'
    }
  }

  const getCharactersByTemplate = (templateId: string) => {
    return characters.filter(char => char.templateId === templateId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    )
  }

  if (currentView === 'create' || currentView === 'edit') {
    return (
      <TemplateBuilder
        template={selectedTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setCurrentView('list')
          setSelectedTemplate(null)
        }}
        campaignId={campaignId}
      />
    )
  }

  if (currentView === 'preview' && selectedCharacter && selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Ficha de Personagem</h2>
          <Button onClick={() => setCurrentView('list')} variant="outline">
            Voltar
          </Button>
        </div>
        
        <DynamicSheetRenderer
          character={selectedCharacter}
          template={selectedTemplate}
          isEditable={userRole === 'Mestre'}
          onSave={handleSaveCharacter}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciador de Fichas</h2>
          <p className="text-muted-foreground">
            Gerencie templates e fichas de personagens
          </p>
        </div>
        {userRole === 'Mestre' && (
          <Button onClick={() => setCurrentView('create')}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Template
          </Button>
        )}
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="characters">Personagens</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="space-y-4">
          {templates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Nenhum template criado ainda.
                </p>
                {userRole === 'Mestre' && (
                  <Button onClick={() => setCurrentView('create')} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Template
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTemplateIcon(template.type)}
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                      </div>
                      <Badge variant="outline">
                        {getTemplateTypeLabel(template.type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        {template.fields.length} campos
                      </div>
                      
                      <div className="text-sm">
                        <strong>Personagens:</strong> {getCharactersByTemplate(template.id).length}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedTemplate(template)
                            setCurrentView('preview')
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                        
                        {userRole === 'Mestre' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTemplate(template)
                                setCurrentView('edit')
                              }}
                            >
                              <Edit3 className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="characters" className="space-y-4">
          {characters.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Nenhum personagem criado ainda.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {characters.map(character => {
                const template = templates.find(t => t.id === character.templateId)
                
                return (
                  <Card key={character.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{character.name}</CardTitle>
                        <Badge variant="outline">
                          {character.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {character.description && (
                          <p className="text-sm text-muted-foreground">
                            {character.description}
                          </p>
                        )}
                        
                        {template && (
                          <div className="text-sm">
                            <strong>Template:</strong> {template.name}
                          </div>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCharacter(character)
                            setSelectedTemplate(template || null)
                            setCurrentView('preview')
                          }}
                          disabled={!template}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Ficha
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}