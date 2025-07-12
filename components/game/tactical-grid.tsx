"use client"

import Image from "next/image"
import { Token } from "./token"
import { UserRoleDisplay } from "@/types/roles"
import { useActiveMap } from "@/hooks/use-active-map"
import { useTokens } from "@/hooks/use-tokens"
import { useSocket } from "@/hooks/use-socket"
import { useState, useEffect } from "react"

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
    moveToken 
  } = useTokens({ campaignId, userRole: userRole === 'Mestre' ? 'GM' : 'PLAYER', userId })
  const { socket, isConnected } = useSocket(campaignId)
  
  const isGM = userRole === 'Mestre' || userRole === 'GM'
  
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

        {/* Tokens - super simple with free movement */}
        {tokens?.map((token) => (
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
          />
        ))}
      </div>
    </div>
  )
}