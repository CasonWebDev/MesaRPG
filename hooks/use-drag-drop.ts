import { useState, useCallback, useRef } from 'react'
import { useSocket } from './use-socket'

interface DragState {
  isDragging: boolean
  draggedElement: string | null
  startPosition: { x: number; y: number } | null
  currentPosition: { x: number; y: number } | null
  offset: { x: number; y: number } | null
}

export function useDragDrop(campaignId: string) {
  const { moveToken } = useSocket(campaignId)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedElement: null,
    startPosition: null,
    currentPosition: null,
    offset: null
  })

  const dragStateRef = useRef(dragState)
  dragStateRef.current = dragState

  const handleMouseDown = useCallback((
    elementId: string,
    event: React.MouseEvent,
    elementRect: DOMRect
  ) => {
    event.preventDefault()
    
    const clientX = event.clientX
    const clientY = event.clientY
    
    const offset = {
      x: clientX - elementRect.left,
      y: clientY - elementRect.top
    }

    setDragState({
      isDragging: true,
      draggedElement: elementId,
      startPosition: { x: elementRect.left, y: elementRect.top },
      currentPosition: { x: elementRect.left, y: elementRect.top },
      offset
    })

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging) return

      const newPosition = {
        x: e.clientX - offset.x,
        y: e.clientY - offset.y
      }

      setDragState(prev => ({
        ...prev,
        currentPosition: newPosition
      }))
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragStateRef.current.isDragging) return

      const finalPosition = {
        x: e.clientX - offset.x,
        y: e.clientY - offset.y
      }

      // Enviar posição final para o servidor
      if (dragStateRef.current.draggedElement) {
        moveToken(dragStateRef.current.draggedElement, finalPosition)
      }

      setDragState({
        isDragging: false,
        draggedElement: null,
        startPosition: null,
        currentPosition: null,
        offset: null
      })

      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [moveToken])

  const handleTouchStart = useCallback((
    elementId: string,
    event: React.TouchEvent,
    elementRect: DOMRect
  ) => {
    event.preventDefault()
    
    const touch = event.touches[0]
    const clientX = touch.clientX
    const clientY = touch.clientY
    
    const offset = {
      x: clientX - elementRect.left,
      y: clientY - elementRect.top
    }

    setDragState({
      isDragging: true,
      draggedElement: elementId,
      startPosition: { x: elementRect.left, y: elementRect.top },
      currentPosition: { x: elementRect.left, y: elementRect.top },
      offset
    })

    const handleTouchMove = (e: TouchEvent) => {
      if (!dragStateRef.current.isDragging) return

      const touch = e.touches[0]
      const newPosition = {
        x: touch.clientX - offset.x,
        y: touch.clientY - offset.y
      }

      setDragState(prev => ({
        ...prev,
        currentPosition: newPosition
      }))
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!dragStateRef.current.isDragging) return

      const touch = e.changedTouches[0]
      const finalPosition = {
        x: touch.clientX - offset.x,
        y: touch.clientY - offset.y
      }

      // Enviar posição final para o servidor
      if (dragStateRef.current.draggedElement) {
        moveToken(dragStateRef.current.draggedElement, finalPosition)
      }

      setDragState({
        isDragging: false,
        draggedElement: null,
        startPosition: null,
        currentPosition: null,
        offset: null
      })

      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }, [moveToken])

  const getDragStyle = useCallback((elementId: string) => {
    if (!dragState.isDragging || dragState.draggedElement !== elementId) {
      return {}
    }

    if (!dragState.currentPosition) return {}

    return {
      position: 'fixed' as const,
      left: dragState.currentPosition.x,
      top: dragState.currentPosition.y,
      zIndex: 1000,
      cursor: 'grabbing',
      transition: 'none',
      userSelect: 'none' as const,
      pointerEvents: 'none' as const
    }
  }, [dragState])

  const isDragging = useCallback((elementId: string) => {
    return dragState.isDragging && dragState.draggedElement === elementId
  }, [dragState])

  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedElement: null,
      startPosition: null,
      currentPosition: null,
      offset: null
    })
  }, [])

  return {
    dragState,
    handleMouseDown,
    handleTouchStart,
    getDragStyle,
    isDragging,
    cancelDrag
  }
}

// Hook para elementos que podem ser drop targets
export function useDropZone(onDrop: (elementId: string, position: { x: number; y: number }) => void) {
  const [isOver, setIsOver] = useState(false)

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsOver(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsOver(false)
    
    const elementId = event.dataTransfer.getData('text/plain')
    const rect = event.currentTarget.getBoundingClientRect()
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    
    onDrop(elementId, position)
  }, [onDrop])

  return {
    isOver,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}