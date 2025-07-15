"use client"

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import Image from 'next/image'

interface Character {
  id: string
  name: string
  type: 'PC' | 'NPC' | 'CREATURE'
  data: string
  userId: string | null
  user?: {
    id: string
    name: string | null
    email: string
  }
}

interface LinkCharacterModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectCharacter: (characterId: string) => void
  campaignId: string
  userRole: 'GM' | 'PLAYER'
  userId: string
  tokenName?: string
}

export function LinkCharacterModal({
  isOpen,
  onClose,
  onSelectCharacter,
  campaignId,
  userRole,
  userId,
  tokenName
}: LinkCharacterModalProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load characters when modal opens
  useEffect(() => {
    if (isOpen && campaignId) {
      loadCharacters()
    }
  }, [isOpen, campaignId])

  const loadCharacters = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/campaigns/${campaignId}/characters?includeTemplate=true`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Filter characters based on user role
      let filteredCharacters = data.characters || []
      
      if (userRole === 'PLAYER') {
        // Players can only see their own PCs
        filteredCharacters = filteredCharacters.filter(
          (char: Character) => char.type === 'PC' && char.userId === userId
        )
      }
      // GMs can see all characters (no filtering needed)

      setCharacters(filteredCharacters)
      console.log(`📋 Loaded ${filteredCharacters.length} characters for ${userRole}`)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar personagens'
      setError(errorMessage)
      console.error('❌ Erro ao carregar personagens:', err)
    } finally {
      setLoading(false)
    }
  }

  const getCharacterAvatar = (character: Character) => {
    try {
      // Parse character data
      const characterData = typeof character.data === 'string' ? JSON.parse(character.data) : character.data
      
      // Para personagens D&D 5e, o avatar está diretamente no campo 'avatar'
      if (characterData?.avatar && characterData.avatar.trim()) {
        return characterData.avatar
      }
      
      // Fallback para sistema de templates (outros sistemas RPG)
      const template = (character as any).template
      if (template?.fields) {
        const templateFields = Array.isArray(template.fields) 
          ? template.fields 
          : (typeof template.fields === 'string' ? JSON.parse(template.fields) : [])
        
        // Find the image field in the template
        const imageField = templateFields.find((field: any) => field.type === 'image')
        if (imageField) {
          const savedAvatar = characterData[imageField.name]
          if (savedAvatar && savedAvatar.trim()) {
            return savedAvatar
          }
        }
      }
      
      // Usar placeholder baseado no tipo
      return getTypePlaceholder(character.type)
    } catch (error) {
      console.error('Error getting character avatar:', error)
      return getTypePlaceholder(character.type)
    }
  }

  const getTypePlaceholder = (type: string) => {
    switch (type) {
      case 'PC':
        return '/placeholder-PC-token.png'
      case 'NPC':
        return '/placeholder-NPC-token.png'
      case 'CREATURE':
        return '/placeholder-Creature-token.png'
      default:
        return '/placeholder.svg'
    }
  }

  const getCharacterTypeColor = (type: string) => {
    switch (type) {
      case 'PC':
        return 'text-blue-600 bg-blue-50'
      case 'NPC':
        return 'text-green-600 bg-green-50'
      case 'CREATURE':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getCharacterTypeLabel = (type: string) => {
    switch (type) {
      case 'PC':
        return 'Personagem'
      case 'NPC':
        return 'NPC'
      case 'CREATURE':
        return 'Criatura'
      default:
        return type
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold">Vincular Ficha de Personagem</h2>
            {tokenName && (
              <p className="text-sm text-gray-600 mt-1">
                Token: <span className="font-medium">{tokenName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-600">Carregando personagens...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {!loading && !error && characters.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-600">
                {userRole === 'PLAYER' 
                  ? 'Você não possui personagens nesta campanha.' 
                  : 'Nenhum personagem encontrado nesta campanha.'
                }
              </div>
            </div>
          )}

          {!loading && !error && characters.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="text-sm text-gray-600 mb-4">
                {userRole === 'GM' 
                  ? `${characters.length} personagem(ns) disponível(is) (PCs, NPCs e Criaturas)`
                  : `${characters.length} personagem(ns) seu(s) disponível(is)`
                }
              </div>

              {characters.map((character) => (
                <div
                  key={character.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    onSelectCharacter(character.id)
                    console.log(`🔗 Character selected: ${character.name} (${character.type})`)
                  }}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <Image
                      src={getCharacterAvatar(character)}
                      alt={character.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full border border-gray-200 object-cover"
                    />
                  </div>

                  {/* Character Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {character.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCharacterTypeColor(character.type)}`}>
                        {getCharacterTypeLabel(character.type)}
                      </span>
                    </div>
                    
                    {character.user && (
                      <p className="text-sm text-gray-600 truncate">
                        Criado por: {character.user.name || character.user.email}
                      </p>
                    )}
                  </div>

                  {/* Selection indicator */}
                  <div className="flex-shrink-0">
                    <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}