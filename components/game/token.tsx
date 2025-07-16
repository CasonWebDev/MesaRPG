"use client"

import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import type { TokenData } from "./tactical-grid"

interface TokenProps {
  token: TokenData
  isSelected: boolean
  onSelect: (tokenId: string) => void
  onMove?: (tokenId: string, position: { top: number; left: number }) => void
  canMove?: boolean
  role?: 'GM' | 'PLAYER'
  userId?: string
  campaignId?: string
  zoomLevel?: number
  onDelete?: (tokenId: string) => void
  onLinkCharacter?: (tokenId: string) => void
  onSizeChange?: (tokenId: string, size: 'small' | 'medium' | 'large') => void
}

export function Token({
  token,
  isSelected,
  onSelect,
  onMove,
  canMove = true,
  role = 'PLAYER',
  userId,
  campaignId,
  zoomLevel = 1,
  onDelete,
  onLinkCharacter,
  onSizeChange
}: TokenProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  })
  const tokenRef = useRef<HTMLDivElement>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Simple position calculation
  const position = {
    left: token.position.left,
    top: token.position.top
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // No permission check - anyone can move any token!
    
    e.preventDefault()
    e.stopPropagation()
    
    const rect = tokenRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setIsDragging(true)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true
    })
  }

  const handleLinkCharacter = () => {
    onLinkCharacter?.(token.id)
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  // Check if token is already linked to a character
  const isLinkedToCharacter = token.characterId && token.characterId !== null

  // Calculate token size (default 40px = medium)
  const tokenSize = token.tokenSize || 40
  const currentSizeType = token.sizeType || 'medium'

  const handleDeleteToken = () => {
    onDelete?.(token.id)
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    onSizeChange?.(token.id, size)
    setContextMenu(prev => ({ ...prev, visible: false }))
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!tokenRef.current?.parentElement) return

      const parentRect = tokenRef.current.parentElement.getBoundingClientRect()
      
      // Simple calculation - no zoom complications
      const newX = e.clientX - parentRect.left - dragOffset.x
      const newY = e.clientY - parentRect.top - dragOffset.y
      
      // Keep within bounds (considering token size)
      const maxX = parentRect.width - tokenSize
      const maxY = parentRect.height - tokenSize
      
      const finalPosition = {
        left: Math.max(0, Math.min(newX, maxX)),
        top: Math.max(0, Math.min(newY, maxY))
      }

      // Update position immediately
      if (tokenRef.current) {
        tokenRef.current.style.left = `${finalPosition.left}px`
        tokenRef.current.style.top = `${finalPosition.top}px`
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!tokenRef.current?.parentElement) {
        setIsDragging(false)
        return
      }

      const parentRect = tokenRef.current.parentElement.getBoundingClientRect()
      
      const newX = e.clientX - parentRect.left - dragOffset.x
      const newY = e.clientY - parentRect.top - dragOffset.y
      
      const maxX = parentRect.width - tokenSize
      const maxY = parentRect.height - tokenSize
      
      const finalPosition = {
        left: Math.max(0, Math.min(newX, maxX)),
        top: Math.max(0, Math.min(newY, maxY))
      }

      // Call the move handler
      onMove?.(token.id, finalPosition)
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, token.id, onMove])

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

  return (
    <>
      <div
        ref={tokenRef}
        data-token-id={token.id}
        className={`absolute rounded-full border-2 cursor-pointer transition-all duration-150 ${
          isDragging ? 'border-blue-500 scale-110 z-50' : 'border-white z-10'
        } hover:scale-105`}
        style={{
          left: position.left,
          top: position.top,
          width: `${tokenSize}px`,
          height: `${tokenSize}px`
        }}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(token.id)
        }}
      >
      <Image
        src={token.src || "/placeholder.svg"}
        alt={token.alt}
        width={tokenSize}
        height={tokenSize}
        className="w-full h-full rounded-full object-cover pointer-events-none"
        draggable={false}
      />
      
        {/* Simple name label */}
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-1 rounded whitespace-nowrap pointer-events-none">
          {token.name || token.alt}
        </div>
      </div>

      {/* Token Context Menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="fixed bg-background border border-border rounded-md shadow-lg py-1 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={handleLinkCharacter}
            disabled={isLinkedToCharacter}
            className={`block w-full text-left px-4 py-2 text-sm ${
              isLinkedToCharacter 
                ? 'text-muted-foreground bg-muted/30 cursor-not-allowed' 
                : 'text-foreground hover:bg-muted/50'
            }`}
            title={isLinkedToCharacter ? 'Este token já está vinculado a um personagem' : 'Vincular a Ficha de Personagem'}
          >
            {isLinkedToCharacter ? 'Já Vinculado' : 'Vincular a Ficha de Personagem'}
          </button>
          
          {/* Divisor */}
          <div className="border-t border-border my-1"></div>
          
          {/* Size Options */}
          <div className="px-4 py-1 text-xs text-muted-foreground font-medium">Tamanho do Token</div>
          <button
            onClick={() => handleSizeChange('small')}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-muted/50 ${
              currentSizeType === 'small' ? 'bg-blue-50 text-blue-700' : 'text-foreground'
            }`}
          >
            Token Pequeno (20px)
          </button>
          <button
            onClick={() => handleSizeChange('medium')}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-muted/50 ${
              currentSizeType === 'medium' ? 'bg-blue-50 text-blue-700' : 'text-foreground'
            }`}
          >
            Token Médio (40px)
          </button>
          <button
            onClick={() => handleSizeChange('large')}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-muted/50 ${
              currentSizeType === 'large' ? 'bg-blue-50 text-blue-700' : 'text-foreground'
            }`}
          >
            Token Grande (60px)
          </button>
          
          {/* Divisor */}
          <div className="border-t border-border my-1"></div>
          
          <button
            onClick={handleDeleteToken}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Deletar Token
          </button>
        </div>
      )}
    </>
  )
}