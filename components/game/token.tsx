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
  zoomLevel = 1
}: TokenProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const tokenRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!tokenRef.current?.parentElement) return

      const parentRect = tokenRef.current.parentElement.getBoundingClientRect()
      
      // Simple calculation - no zoom complications
      const newX = e.clientX - parentRect.left - dragOffset.x
      const newY = e.clientY - parentRect.top - dragOffset.y
      
      // Keep within bounds
      const maxX = parentRect.width - 40
      const maxY = parentRect.height - 40
      
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
      
      const maxX = parentRect.width - 40
      const maxY = parentRect.height - 40
      
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

  return (
    <div
      ref={tokenRef}
      className={`absolute rounded-full border-2 cursor-pointer transition-all duration-150 ${
        isDragging ? 'border-blue-500 scale-110 z-50' : 'border-white z-10'
      } hover:scale-105`}
      style={{
        left: position.left,
        top: position.top,
        width: '40px',
        height: '40px'
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(token.id)
      }}
    >
      <Image
        src={token.src || "/placeholder.svg"}
        alt={token.alt}
        width={40}
        height={40}
        className="rounded-full pointer-events-none"
        draggable={false}
      />
      
      {/* Simple name label */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-1 rounded whitespace-nowrap pointer-events-none">
        {token.name || token.alt}
      </div>
    </div>
  )
}