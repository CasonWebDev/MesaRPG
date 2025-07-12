"use client"

import Image from "next/image"
import { Token } from "./token"
import { UserRoleDisplay } from "@/types/roles"
import { useActiveMap } from "@/hooks/use-active-map"
import { useTokens } from "@/hooks/use-tokens"
import { useSocket } from "@/hooks/use-socket"
import { LinkCharacterModal } from "@/components/modals/link-character-modal"
import { useState, useEffect, useRef } from "react"

export interface TokenData {
  id: string
  src: string
  alt: string
  name?: string
  position: { top: number; left: number }
  borderColor: string
  canPlayerMove?: boolean
  ownerId?: string
  characterId?: string
  characterType?: 'PC' | 'NPC' | 'CREATURE'
  hidden?: boolean
  locked?: boolean
  scale?: number
  rotation?: number
  opacity?: number
  tokenSize?: number
  sizeType?: 'small' | 'medium' | 'large'
}

interface TacticalGridProps {
  campaignId: string
  userRole: UserRoleDisplay
  userId: string
}

export function TacticalGrid({
  campaignId,
  userRole,
  userId
}: TacticalGridProps) {
  const { activeMap, isLoading, error: mapError } = useActiveMap(campaignId)
  const { 
    tokens, 
    loading, 
    moveToken,
    createToken,
    updateToken,
    removeToken 
  } = useTokens({ campaignId, userRole: userRole === 'Mestre' ? 'GM' : 'PLAYER', userId })
  const { socket, isConnected } = useSocket(campaignId)
  
  const isGM = userRole === 'Mestre' || userRole === 'GM'
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  })
  
  // Link character modal state
  const [linkCharacterModal, setLinkCharacterModal] = useState<{
    isOpen: boolean
    tokenId: string | null
    tokenName: string | null
  }>({
    isOpen: false,
    tokenId: null,
    tokenName: null
  })
  
  const contextMenuRef = useRef<HTMLDivElement>(null)
  
  console.log('🎮 TacticalGrid using integrated useTokens with persistence')
  
  // Listen for token moves from other users (useTokens handles this too, but keeping for safety)
  useEffect(() => {
    if (!socket || !isConnected) return
    
    const handleTokenMove = (data: { tokenId: string; position: { top: number; left: number }; userId: string }) => {
      console.log('📨 TacticalGrid received token move:', data)
      
      // useTokens should handle this, but we can log for debugging
      if (data.userId !== userId) {
        console.log('📨 Token move from other user - useTokens should handle this')
      }
    }
    
    socket.on('game:token-move', handleTokenMove)
    
    return () => {
      socket.off('game:token-move', handleTokenMove)
    }
  }, [socket, isConnected, userId])

  // Handle token movement using useTokens (with persistence)
  const handleTokenMove = (tokenId: string, position: { top: number; left: number }) => {
    console.log('🎯 TacticalGrid.handleTokenMove - calling useTokens.moveToken')
    
    // Use the moveToken from useTokens which handles persistence
    moveToken(tokenId, position)
  }

  // Handle right-click context menu for grid (only if not on a token)
  const handleContextMenu = (e: React.MouseEvent) => {
    // Check if the click is on a token (has data-token-id attribute)
    const target = e.target as HTMLElement
    const isOnToken = target.closest('[data-token-id]')
    
    if (isOnToken) {
      // Let the token handle its own context menu
      return
    }
    
    e.preventDefault()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true
    })
    
    // Store click position for token creation
    setContextMenu(prev => ({ ...prev, gridX: x, gridY: y }))
  }

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }))
      }
    }

    if (contextMenu.visible) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu.visible])

  // Handle creating generic token
  const handleCreateGenericToken = async () => {
    try {
      const position = {
        top: (contextMenu as any).gridY || 100,
        left: (contextMenu as any).gridX || 100
      }

      const tokenData: Omit<TokenData, 'id'> = {
        src: '/placeholder-generic.png',
        alt: 'Token Genérico',
        name: 'Token Genérico',
        position,
        borderColor: 'border-gray-500',
        canPlayerMove: true,
        ownerId: userId,
        characterId: null,
        characterType: 'GENERIC' as any,
        hidden: false,
        locked: false,
        scale: 1,
        rotation: 0,
        opacity: 1,
        tokenSize: 40,
        sizeType: 'medium' as 'medium'
      }

      await createToken(tokenData)
      
      // Close context menu
      setContextMenu(prev => ({ ...prev, visible: false }))
      
      console.log('✅ Token genérico criado na posição:', position)
    } catch (error) {
      console.error('❌ Erro ao criar token genérico:', error)
    }
  }

  // Handle clearing all tokens from grid
  const handleClearGrid = async () => {
    try {
      const confirmClear = window.confirm(
        `Tem certeza que deseja limpar o grid?\n\nIsso irá remover todos os ${tokens?.length || 0} tokens do mapa.\n\nEsta ação não pode ser desfeita.`
      )
      
      if (!confirmClear) {
        setContextMenu(prev => ({ ...prev, visible: false }))
        return
      }

      console.log('🧹 Clearing grid - removing all tokens')
      
      // Clear tokens locally first (optimistic update)
      const previousTokens = tokens || []
      
      // Update local state immediately
      // This will be handled by the useTokens hook through WebSocket
      
      // Send clear grid command via WebSocket
      if (socket && isConnected) {
        console.log('📡 Sending token_clear_all via WebSocket')
        socket.emit('token_clear_all', {
          campaignId
        })
      } else {
        console.log('❌ No socket connection, falling back to HTTP')
        // Fallback para HTTP se WebSocket não estiver disponível
        const response = await fetch(`/api/campaigns/${campaignId}/game-state`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tokens: []
          })
        })

        if (!response.ok) {
          throw new Error('Erro ao limpar tokens no servidor')
        }
        
        // Force reload tokens from server
        window.location.reload()
      }
      
      // Close context menu
      setContextMenu(prev => ({ ...prev, visible: false }))
      
      console.log('✅ Grid clearing initiated successfully')

    } catch (error) {
      console.error('❌ Erro ao limpar grid:', error)
      alert('Erro ao limpar grid. Tente novamente.')
    }
  }

  // Handle token context menu actions
  const handleDeleteToken = async (tokenId: string) => {
    console.log('🗑️ Delete token requested:', tokenId)
    
    try {
      const confirmDelete = window.confirm('Tem certeza que deseja deletar este token?')
      
      if (!confirmDelete) {
        return
      }

      // Use the removeToken function from useTokens
      await removeToken(tokenId)
      
      console.log('✅ Token deleted successfully:', tokenId)
    } catch (error) {
      console.error('❌ Erro ao deletar token:', error)
      alert('Erro ao deletar token. Tente novamente.')
    }
  }

  // Handle token size changes
  const handleTokenSizeChange = async (tokenId: string, size: 'small' | 'medium' | 'large') => {
    console.log(`📏 Token size change requested: ${tokenId} to ${size}`)
    
    try {
      let tokenSize = 40 // medium (default)
      
      switch (size) {
        case 'small':
          tokenSize = 20 // 50% smaller
          break
        case 'medium':
          tokenSize = 40 // default
          break
        case 'large':
          tokenSize = 60 // 50% larger
          break
      }

      await updateToken(tokenId, { 
        tokenSize,
        sizeType: size
      })
      
      console.log(`✅ Token size changed successfully: ${tokenId} to ${size} (${tokenSize}px)`)
    } catch (error) {
      console.error('❌ Erro ao alterar tamanho do token:', error)
      alert('Erro ao alterar tamanho do token. Tente novamente.')
    }
  }

  const handleLinkCharacterToToken = (tokenId: string) => {
    console.log('🔗 Link character to token requested:', tokenId)
    
    // Find the token to get its name
    const token = tokens?.find(t => t.id === tokenId)
    const tokenName = token?.name || token?.alt || 'Token'
    
    // Open link character modal
    setLinkCharacterModal({
      isOpen: true,
      tokenId,
      tokenName
    })
  }

  const handleSelectCharacter = async (characterId: string) => {
    console.log('🎯 Character selected for linking:', characterId, 'to token:', linkCharacterModal.tokenId)
    
    try {
      if (!linkCharacterModal.tokenId) {
        throw new Error('Token ID não encontrado')
      }

      // Buscar dados do personagem
      const response = await fetch(`/api/campaigns/${campaignId}/characters/${characterId}?includeTemplate=true`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro ao buscar personagem: ${response.status}`)
      }

      const characterData = await response.json()
      const character = characterData.character

      console.log('📋 Character data loaded:', character)

      // Função para obter avatar do personagem (mesma lógica do modal)
      const getCharacterAvatar = (char: any) => {
        try {
          const template = char.template
          if (!template?.fields) {
            return getTypePlaceholder(char.type)
          }
          
          const templateFields = Array.isArray(template.fields) 
            ? template.fields 
            : (typeof template.fields === 'string' ? JSON.parse(template.fields) : [])
          
          const imageField = templateFields.find((field: any) => field.type === 'image')
          if (!imageField) {
            return getTypePlaceholder(char.type)
          }
          
          const charData = typeof char.data === 'string' ? JSON.parse(char.data) : char.data
          const savedAvatar = charData[imageField.name]
          
          if (savedAvatar) {
            return savedAvatar
          }
          
          return getTypePlaceholder(char.type)
        } catch (error) {
          console.error('Error getting character avatar:', error)
          return getTypePlaceholder(char.type)
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

      // Obter avatar do personagem
      const characterAvatar = getCharacterAvatar(character)

      // Atualizar o token com os dados do personagem
      const tokenUpdates = {
        name: character.name,
        alt: character.name,
        src: characterAvatar,
        characterId: characterId,
        characterType: character.type as 'PC' | 'NPC' | 'CREATURE'
      }

      console.log('🔗 Updating token with character data:', tokenUpdates)

      await updateToken(linkCharacterModal.tokenId, tokenUpdates)

      console.log('✅ Token successfully linked to character')
      
      // Close modal
      setLinkCharacterModal({
        isOpen: false,
        tokenId: null,
        tokenName: null
      })

    } catch (error) {
      console.error('❌ Erro ao vincular personagem ao token:', error)
      alert('Erro ao vincular personagem ao token. Tente novamente.')
    }
  }

  const handleCloseLinkModal = () => {
    setLinkCharacterModal({
      isOpen: false,
      tokenId: null,
      tokenName: null
    })
  }

  // Get map image with cache busting
  const getMapImage = () => {
    if (activeMap?.imageUrl) {
      return `${activeMap.imageUrl}?t=${Date.now()}`
    }
    return "/placeholder.svg"
  }

  return (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      {/* Simple container */}
      <div 
        className="relative bg-gray-800 border border-gray-600"
        style={{
          width: '800px',
          height: '600px',
          overflow: 'hidden'
        }}
        onContextMenu={handleContextMenu}
      >
        {/* Loading */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-white">Carregando...</div>
          </div>
        )}

        {/* Error */}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-red-400">Erro: {mapError}</div>
          </div>
        )}

        {/* Map Image */}
        {activeMap && (
          <Image
            src={getMapImage()}
            alt={activeMap.name || "Mapa"}
            fill
            className="object-contain"
            priority
            unoptimized
          />
        )}

        {/* No Map */}
        {!activeMap && !isLoading && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white">Nenhum mapa ativo</div>
          </div>
        )}

        {/* Tokens - Only generic tokens, clean grid if no previous session */}
        {!loading && tokens?.map((token) => (
          <Token 
            key={token.id} 
            token={token} 
            isSelected={false}
            onSelect={() => {}}
            onMove={handleTokenMove}
            canMove={true}
            role={isGM ? 'GM' : 'PLAYER'}
            userId={userId}
            campaignId={campaignId}
            zoomLevel={1}
            onDelete={handleDeleteToken}
            onLinkCharacter={handleLinkCharacterToToken}
            onSizeChange={handleTokenSizeChange}
          />
        ))}
        
        {/* Show clean grid message when no tokens */}
        {!loading && (!tokens || tokens.length === 0) && activeMap && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded text-sm">
            Grid limpo - Clique com botão direito para adicionar tokens
          </div>
        )}
        
        {/* Context Menu */}
        {contextMenu.visible && (
          <div
            ref={contextMenuRef}
            className="fixed bg-white border border-gray-300 rounded-md shadow-lg py-1 z-50"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              onClick={handleCreateGenericToken}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Adicionar token genérico
            </button>
            {tokens && tokens.length > 0 && (
              <button
                onClick={handleClearGrid}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Limpar Grid
              </button>
            )}
          </div>
        )}
      </div>

      {/* Link Character Modal */}
      <LinkCharacterModal
        isOpen={linkCharacterModal.isOpen}
        onClose={handleCloseLinkModal}
        onSelectCharacter={handleSelectCharacter}
        campaignId={campaignId}
        userRole={isGM ? 'GM' : 'PLAYER'}
        userId={userId}
        tokenName={linkCharacterModal.tokenName || undefined}
      />
    </div>
  )
}