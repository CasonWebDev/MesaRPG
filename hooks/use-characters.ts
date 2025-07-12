import { useState, useEffect, useCallback } from 'react'
import { CharacterType } from '@prisma/client'
import { toast } from 'sonner'

export interface Character {
  id: string
  campaignId: string
  userId: string
  templateId: string
  name: string
  type: CharacterType
  data: Record<string, any>
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  campaign: any
  template: any
}

export interface CreateCharacterData {
  name: string
  type: CharacterType
  data: Record<string, any>
  templateId?: string
}

export interface UpdateCharacterData {
  name?: string
  data?: Record<string, any>
  templateId?: string
}

interface UseCharactersProps {
  campaignId: string
  type?: CharacterType
  createdBy?: 'gm' | 'player'
}

export function useCharacters({ campaignId, type, createdBy }: UseCharactersProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGM, setIsGM] = useState(false)

  const fetchCharacters = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (type) params.append('type', type)
      if (createdBy) params.append('createdBy', createdBy)
      
      const response = await fetch(`/api/campaigns/${campaignId}/characters?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar characters')
      }
      
      const data = await response.json()
      setCharacters(data.characters || [])
      setIsGM(data.isGM || false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const createCharacter = async (data: CreateCharacterData) => {
    const response = await fetch(`/api/campaigns/${campaignId}/characters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao criar character')
    }

    const result = await response.json()
    setCharacters(prev => [result.character, ...prev])
    return result.character
  }

  const updateCharacter = async (characterId: string, data: UpdateCharacterData) => {
    const response = await fetch(`/api/campaigns/${campaignId}/characters/${characterId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao atualizar character')
    }

    const result = await response.json()
    setCharacters(prev => prev.map(char => 
      char.id === characterId ? result.character : char
    ))
    return result.character
  }

  const deleteCharacter = async (characterId: string) => {
    const response = await fetch(`/api/campaigns/${campaignId}/characters/${characterId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao deletar character')
    }

    setCharacters(prev => prev.filter(char => char.id !== characterId))
  }

  const getCharacter = async (characterId: string) => {
    const response = await fetch(`/api/campaigns/${campaignId}/characters/${characterId}`)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao buscar character')
    }

    const result = await response.json()
    return result.character
  }

  // Search and filter functions
  const searchCharacters = (query: string) => {
    if (!query.trim()) return characters
    
    return characters.filter(char => 
      char.name.toLowerCase().includes(query.toLowerCase()) ||
      char.user.name?.toLowerCase().includes(query.toLowerCase()) ||
      char.user.email.toLowerCase().includes(query.toLowerCase())
    )
  }

  const filterByType = (characterType: CharacterType) => {
    return characters.filter(char => char.type === characterType)
  }

  const getNPCs = () => filterByType('NPC')
  const getCreatures = () => filterByType('CREATURE')
  const getPCs = () => filterByType('PC')
  const getPlayerCharacters = () => {
    return characters.filter(char => 
      char.type === 'PC' && 
      char.userId && 
      char.userId !== char.campaign?.ownerId
    )
  }

  // Stats
  const stats = {
    total: characters.length,
    npcs: characters.filter(c => c.type === 'NPC').length,
    creatures: characters.filter(c => c.type === 'CREATURE').length,
    pcs: characters.filter(c => c.type === 'PC').length
  }

  useEffect(() => {
    fetchCharacters()
  }, [campaignId, type, createdBy])

  return {
    characters,
    loading,
    error,
    isGM,
    stats,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    getCharacter,
    searchCharacters,
    filterByType,
    getNPCs,
    getCreatures,
    getPCs,
    getPlayerCharacters,
    refetch: fetchCharacters
  }
}

// Hook específico para templates de characters
export function useCharacterTemplates(campaignId: string, type?: CharacterType) {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (type) params.append('type', type)
      
      const response = await fetch(`/api/campaigns/${campaignId}/sheet-templates?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar templates')
      }
      
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const getTemplateForType = useCallback((characterType: CharacterType) => {
    return templates.find(template => 
      template.type === characterType && template.isDefault
    )
  }, [templates])

  const getDefaultFields = useCallback((characterType: CharacterType) => {
    const template = getTemplateForType(characterType)
    if (!template) return []
    
    const fields = typeof template.fields === 'string' 
      ? JSON.parse(template.fields) 
      : template.fields
    
    // Retornar objeto com valores padrão baseados no template
    const defaultData: Record<string, any> = {}
    fields.forEach((field: any) => {
      if (field.defaultValue !== undefined) {
        defaultData[field.name] = field.defaultValue
      } else {
        switch (field.type) {
          case 'text':
          case 'textarea':
          case 'image':
            defaultData[field.name] = ''
            break
          case 'number':
            defaultData[field.name] = 0
            break
          case 'boolean':
            defaultData[field.name] = false
            break
          case 'select':
            defaultData[field.name] = field.options?.[0] || ''
            break
          case 'attributes':
            if (field.attributes) {
              field.attributes.forEach((attr: any) => {
                defaultData[attr.name] = attr.defaultValue || 0
              })
            }
            break
          default:
            defaultData[field.name] = ''
        }
      }
    })
    
    return defaultData
  }, [getTemplateForType])

  useEffect(() => {
    fetchTemplates()
  }, [campaignId, type])

  return {
    templates,
    loading,
    error,
    getTemplateForType,
    getDefaultFields,
    refetch: fetchTemplates
  }
}