"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { Token } from "./token"
import { TokenManager } from "./token-manager"
import { useSocket } from "@/hooks/use-socket"
import { useActiveMap } from "@/hooks/use-active-map"
import { useTokens } from "@/hooks/use-tokens"
import { useEffect, useState } from "react"
import { toast } from "sonner"

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
}

interface TacticalGridProps {
  cursor?: string
  gridSize: number
  campaignId: string
  userRole?: 'GM' | 'PLAYER'
  userId?: string
  showTokenManager?: boolean
}

export function TacticalGrid({
  cursor = "cursor-default",
  gridSize,
  campaignId,
  userRole = 'PLAYER',
  userId,
  showTokenManager = false,
}: TacticalGridProps) {
  const { socket } = useSocket(campaignId)
  const { activeMap, isLoading, error, refreshKey } = useActiveMap(campaignId)
  const [imageKey, setImageKey] = useState(0)
  const [currentMapId, setCurrentMapId] = useState<string | null>(null)
  const [isTokenManagerOpen, setIsTokenManagerOpen] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; email: string }>>([])
  
  // Hook para gerenciar tokens
  const {
    tokens,
    selectedTokenIds,
    isLoading: tokensLoading,
    error: tokensError,
    selectToken,
    selectMultipleTokens,
    clearSelection,
    moveToken,
    createToken,
    removeToken,
    refreshTokens
  } = useTokens({ campaignId, userRole, userId })
  
  console.log('🎮 TacticalGrid rendered:', { 
    userRole, 
    campaignId, 
    tokensCount: tokens.length, 
    tokensLoading, 
    tokensError
  })

  // Forçar refresh da imagem quando o mapa muda
  useEffect(() => {
    if (activeMap?.id !== currentMapId) {
      setCurrentMapId(activeMap?.id || null)
      setImageKey(prev => {
        const newKey = prev + 1
        console.log('🔄 Forced image refresh - New map:', activeMap?.name, 'Key:', newKey)
        return newKey
      })
    }
  }, [activeMap?.id, currentMapId])

  // Forçar refresh quando refreshKey muda
  useEffect(() => {
    if (refreshKey > 0) {
      setImageKey(prev => {
        const newKey = prev + 1
        console.log('🔄 Forced image refresh - RefreshKey changed:', refreshKey, 'ImageKey:', newKey)
        return newKey
      })
    }
  }, [refreshKey])

  // Lidar com clique no grid para deselecionar tokens
  const handleGridClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection()
    }
  }

  // Lidar com remoção de tokens selecionados
  const handleRemoveSelectedTokens = () => {
    if (selectedTokenIds.length === 0) {
      toast.error('Nenhum token selecionado')
      return
    }

    selectedTokenIds.forEach(tokenId => {
      removeToken(tokenId)
    })
  }

  // Funções para manipulação de tokens
  const handleEditToken = (token: TokenData) => {
    // TODO: Implementar edição de token
    console.log('Edit token:', token)
    toast.info('Edição de token será implementada em breve')
  }

  const handleDuplicateToken = (token: TokenData) => {
    const duplicatedToken = {
      ...token,
      id: undefined,
      name: `${token.name} (Cópia)`,
      position: {
        top: token.position.top + 40,
        left: token.position.left + 40
      }
    }
    createToken(duplicatedToken)
  }

  const handleToggleVisibility = (tokenId: string) => {
    // TODO: Implementar toggle de visibilidade
    console.log('Toggle visibility:', tokenId)
    toast.info('Controle de visibilidade será implementado em breve')
  }

  const handleToggleLock = (tokenId: string) => {
    // TODO: Implementar toggle de bloqueio
    console.log('Toggle lock:', tokenId)
    toast.info('Controle de bloqueio será implementado em breve')
  }

  const handleChangeOwnership = (tokenId: string, newOwnerId: string) => {
    // TODO: Implementar mudança de propriedade
    console.log('Change ownership:', tokenId, newOwnerId)
    toast.info('Mudança de propriedade será implementada em breve')
  }

  const handleChangeBorderColor = (tokenId: string, color: string) => {
    // TODO: Implementar mudança de cor
    console.log('Change border color:', tokenId, color)
    toast.info('Mudança de cor será implementada em breve')
  }

  // Determinar qual imagem usar
  const getMapImage = () => {
    if (activeMap?.imageUrl) {
      // Adicionar timestamp para evitar cache
      const timestamp = Date.now()
      const separator = activeMap.imageUrl.includes('?') ? '&' : '?'
      return `${activeMap.imageUrl}${separator}t=${timestamp}&refresh=${imageKey}`
    }
    return "/placeholder.svg?width=2000&height=2000"
  }

  // Usar o gridSize do mapa ativo se disponível
  const effectiveGridSize = activeMap?.gridSize || gridSize

  return (
    <div key={refreshKey} className={cn("h-full w-full relative overflow-hidden bg-stone-800", cursor)} onClick={handleGridClick}>

      {/* Loading State */}
      {(isLoading || tokensLoading) && (
        <div className="absolute inset-0 bg-stone-800 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white text-sm">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {(error || tokensError) && (
        <div className="absolute inset-0 bg-stone-800 flex items-center justify-center z-10">
          <div className="text-center">
            <p className="text-red-400 text-sm mb-2">
              {error ? 'Erro ao carregar mapa' : 'Erro ao carregar tokens'}
            </p>
            <p className="text-gray-400 text-xs">{error || tokensError}</p>
          </div>
        </div>
      )}

      {/* Map Image */}
      <Image
        key={`map-${activeMap?.id}-${refreshKey}-${imageKey}`}
        src={getMapImage()}
        alt={activeMap?.name || "Mapa tático"}
        fill
        className={cn(
          "object-cover transition-opacity duration-300",
          activeMap?.imageUrl ? "opacity-90" : "opacity-50"
        )}
        priority
        unoptimized
      />

      {/* Map Info Overlay */}
      {activeMap && (
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 z-20">
          <h3 className="text-white font-medium text-sm">{activeMap.name}</h3>
          {activeMap.description && (
            <p className="text-gray-300 text-xs mt-1">{activeMap.description}</p>
          )}
        </div>
      )}

      {/* No Active Map State */}
      {!activeMap && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-white text-lg mb-2">Nenhum mapa ativo</p>
            <p className="text-gray-400 text-sm">O mestre precisa ativar um mapa primeiro</p>
          </div>
        </div>
      )}

      {/* Grid Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: `${effectiveGridSize}px ${effectiveGridSize}px`,
        }}
      />

      {/* Tokens */}
      {tokens.map((token) => {
        // Determinar se o usuário pode mover este token
        const canMoveThisToken = userRole === 'GM' || 
                                (token.ownerId === userId) || 
                                (token.canPlayerMove !== false && userRole === 'PLAYER')
        
        return (
          <Token 
            key={token.id} 
            token={token} 
            isSelected={selectedTokenIds.includes(token.id)} 
            onSelect={selectToken}
            onMove={moveToken}
            onEditToken={handleEditToken}
            onRemoveToken={removeToken}
            onDuplicateToken={handleDuplicateToken}
            onToggleVisibility={handleToggleVisibility}
            onToggleLock={handleToggleLock}
            onChangeOwnership={handleChangeOwnership}
            onChangeBorderColor={handleChangeBorderColor}
            gridSize={effectiveGridSize}
            canMove={canMoveThisToken}
            role={userRole}
            userId={userId}
            availableUsers={availableUsers}
          />
        )
      })}

      {/* Token Manager Modal */}
      <TokenManager
        isOpen={isTokenManagerOpen}
        onClose={() => setIsTokenManagerOpen(false)}
        onCreateToken={createToken}
        campaignId={campaignId}
        userRole={userRole}
        userId={userId}
      />
    </div>
  )
}