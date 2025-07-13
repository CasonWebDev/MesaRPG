"use client"

import Image from "next/image"
import { Token } from "./token"
import { GridCoordinates } from "./grid-coordinates"
import { TacticalToolbar } from "./tactical-toolbar"
import { UserRoleDisplay } from "@/types/roles"
import { useActiveMap } from "@/hooks/use-active-map"
import { useTokens } from "@/hooks/use-tokens"
import { useSocket } from "@/hooks/use-socket"
import { LinkCharacterModal } from "@/components/modals/link-character-modal"
import { useState, useEffect, useRef, useCallback } from "react"

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
  const { activeMap, isLoading: mapLoading, error: mapError } = useActiveMap(campaignId)
  const { 
    tokens, 
    isLoading: tokensLoading, 
    moveToken,
    createToken,
    updateToken,
    removeToken 
  } = useTokens({ campaignId, userRole: userRole === 'Mestre' ? 'GM' : 'PLAYER', userId })
  const { socket, isConnected } = useSocket(campaignId)
  
  const isGM = userRole === 'Mestre' || userRole === 'GM'
  
  // Helper to check if we can emit WebSocket events safely
  const canEmitSocketEvents = useCallback(() => {
    const canEmit = socket && isConnected
    if (!canEmit) {
      console.warn('⚠️ Cannot emit WebSocket events - not connected', { hasSocket: !!socket, isConnected })
      return false
    }
    
    // For now, let's just check basic connectivity to restore sync
    // We'll add campaign validation back later if needed
    return true
  }, [socket, isConnected])
  
  // Grid system state
  const [showGrid, setShowGrid] = useState(false)
  const [showCoordinates, setShowCoordinates] = useState(false)
  const [gridSize, setGridSize] = useState(40) // Padrão: células de 40px
  const [snapToGrid, setSnapToGrid] = useState(false)
  
  // Measurement system state
  const [cellValueInMeters, setCellValueInMeters] = useState(1.5) // Padrão: 1,5m por célula
  const [measurementPoints, setMeasurementPoints] = useState<{ x: number; y: number }[]>([])
  const [activeMeasurement, setActiveMeasurement] = useState<{
    startPoint: { x: number; y: number }
    endPoint: { x: number; y: number }
    distance: number
    id: string
    userId: string
  } | null>(null)
  const [measurementTimer, setMeasurementTimer] = useState<NodeJS.Timeout | null>(null)
  
  // Drawing system state
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [activeDrawings, setActiveDrawings] = useState<{
    id: string
    path: { x: number; y: number }[]
    color: string
    userId: string
    timestamp: number
  }[]>([])
  const [selectedColor, setSelectedColor] = useState('#ef4444') // Vermelho padrão
  const [showColorPalette, setShowColorPalette] = useState(false)
  const [drawingTimers, setDrawingTimers] = useState<Map<string, NodeJS.Timeout>>(new Map())
  
  // Marker system state
  const [activeMarkers, setActiveMarkers] = useState<{
    id: string
    position: { x: number; y: number }
    icon: string
    userId: string
    timestamp: number
  }[]>([])
  const [selectedMarkerIcon, setSelectedMarkerIcon] = useState('💀') // Caveira padrão
  const [showMarkerPalette, setShowMarkerPalette] = useState(false)
  
  // Fog of War types
  type FogType = 'dense' | 'thin' | 'magical'
  
  // Fog of War state
  const [fogAreas, setFogAreas] = useState<{
    id: string
    x: number
    y: number
    width: number
    height: number
    type: FogType
    color?: string
    userId: string
    timestamp: number
  }[]>([])
  const [isCreatingFog, setIsCreatingFog] = useState(false)
  const [fogStartPoint, setFogStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [currentFogArea, setCurrentFogArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [selectedFogType, setSelectedFogType] = useState<FogType>('dense')
  const [selectedFogColor, setSelectedFogColor] = useState('#8b5cf6') // Roxo arcano
  const [showFogTypePalette, setShowFogTypePalette] = useState(false)

  // Toolbar state
  const [activeTool, setActiveTool] = useState<'select' | 'measure' | 'draw' | 'mark' | 'fog' | 'eraser'>('select')
  
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
  
  // Drawing colors
  const drawingColors = [
    { name: 'Vermelho', value: '#ef4444' },
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Amarelo', value: '#f59e0b' },
    { name: 'Roxo', value: '#8b5cf6' }
  ]
  
  // Marker icons
  const markerIcons = [
    { name: 'Caveira', icon: '💀' },
    { name: 'Moeda', icon: '🪙' },
    { name: 'Espada', icon: '⚔️' },
    { name: 'Escudo', icon: '🛡️' },
    { name: 'Fogo', icon: '🔥' }
  ]

  // Fog types
  const fogTypes = [
    { 
      id: 'dense' as FogType, 
      name: 'Névoa Densa', 
      icon: '🌫️', 
      description: 'Bloqueia completamente a visão' 
    },
    { 
      id: 'thin' as FogType, 
      name: 'Névoa Tênue', 
      icon: '🌤️', 
      description: 'Véu semitransparente com blur' 
    },
    { 
      id: 'magical' as FogType, 
      name: 'Névoa Mágica', 
      icon: '✨', 
      description: 'Colorida e configurável' 
    }
  ]

  // Magical fog colors
  const magicalFogColors = [
    { name: 'Arcana', value: '#8b5cf6', icon: '🔮' }, // Roxo
    { name: 'Veneno', value: '#10b981', icon: '☠️' }, // Verde
    { name: 'Divina', value: '#f3f4f6', icon: '✨' }, // Branco
    { name: 'Gelo', value: '#3b82f6', icon: '❄️' }, // Azul
    { name: 'Fogo', value: '#ef4444', icon: '🔥' }  // Vermelho
  ]
  
  console.log('🎮 TacticalGrid using integrated useTokens with persistence')
  console.log('🔍 TacticalGrid WebSocket state:', { 
    hasSocket: !!socket, 
    isConnected, 
    campaignId,
    userRole 
  })
  
  // Load grid configuration from server on mount
  useEffect(() => {
    const loadGridConfig = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/game-state`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          const gridConfig = data.gameState?.gridConfig
          const fogState = data.gameState?.fogAreas
          
          if (gridConfig) {
            console.log('📥 Loading existing grid config:', gridConfig)
            setShowGrid(gridConfig.showGrid || false)
            setShowCoordinates(gridConfig.showCoordinates || false)
            setSnapToGrid(gridConfig.snapToGrid || false)
            setGridSize(gridConfig.gridSize || 40)
            setCellValueInMeters(gridConfig.cellValueInMeters || 1.5)
          }
          
          if (fogState) {
            console.log('🌫️ Loading existing fog areas:', fogState)
            setFogAreas(Array.isArray(fogState) ? fogState : [])
          }
        }
      } catch (error) {
        console.error('❌ Error loading grid config:', error)
      }
    }
    
    if (campaignId) {
      loadGridConfig()
    }
  }, [campaignId])
  
  // Listen for grid configuration updates from GM
  useEffect(() => {
    if (!socket || !isConnected) return
    
    const handleGridConfigUpdate = (data: { 
      config: {
        showGrid: boolean
        showCoordinates: boolean
        snapToGrid: boolean
        gridSize: number
        cellValueInMeters: number
      }
      updatedBy: string
      campaignId: string
    }) => {
      console.log('📨 Received grid config update:', data)
      
      // Only apply if this update is from someone else (avoid feedback loop)
      if (data.updatedBy !== userId) {
        console.log('🔄 Applying grid config from GM:', data.config)
        
        setShowGrid(data.config.showGrid)
        setShowCoordinates(data.config.showCoordinates)
        setSnapToGrid(data.config.snapToGrid)
        setGridSize(data.config.gridSize)
        setCellValueInMeters(data.config.cellValueInMeters || 1.5)
        
        // Show notification to players
        if (!isGM) {
          console.log('📢 Grid configuration updated by GM')
        }
      }
    }
    
    const handleTokenMove = (data: { tokenId: string; position: { top: number; left: number }; userId: string }) => {
      console.log('📨 TacticalGrid received token move:', data)
      
      // useTokens should handle this, but we can log for debugging
      if (data.userId !== userId) {
        console.log('📨 Token move from other user - useTokens should handle this')
      }
    }
    
    const handleMeasurementShow = (data: { 
      measurement: {
        startPoint: { x: number; y: number }
        endPoint: { x: number; y: number }
        distance: number
        id: string
        userId: string
      }
      userId: string
      campaignId: string
    }) => {
      console.log('📨 Received measurement from other user:', data)
      
      // Only show if it's from someone else (avoid showing our own measurements twice)
      if (data.userId !== userId) {
        console.log('📏 Showing measurement from user:', data.userId)
        setActiveMeasurement(data.measurement)
        
        // Clear any existing timer
        if (measurementTimer) {
          clearTimeout(measurementTimer)
        }
        
        // Set timer to hide after 5 seconds
        const timer = setTimeout(() => {
          console.log('⏰ Auto-hiding received measurement after 5 seconds')
          setActiveMeasurement(null)
        }, 5000)
        
        setMeasurementTimer(timer)
      }
    }
    
    const handleMeasurementHide = (data: {
      measurementId: string
      userId: string
      campaignId: string
    }) => {
      console.log('📨 Received measurement hide from user:', data.userId)
      
      // Hide measurement if it matches the current one
      if (activeMeasurement && activeMeasurement.id === data.measurementId) {
        console.log('📏 Hiding measurement:', data.measurementId)
        setActiveMeasurement(null)
        
        if (measurementTimer) {
          clearTimeout(measurementTimer)
          setMeasurementTimer(null)
        }
      }
    }
    
    const handleDrawingShow = (data: {
      drawing: {
        id: string
        path: { x: number; y: number }[]
        color: string
        userId: string
        timestamp: number
      }
      userId: string
      campaignId: string
    }) => {
      console.log('📨 Received drawing from other user:', data)
      
      // Only show if it's from someone else (avoid showing our own drawings twice)
      if (data.userId !== userId) {
        console.log('✏️ Showing drawing from user:', data.userId)
        setActiveDrawings(prev => [...prev, data.drawing])
        
        // Set timer to hide after 15 seconds
        const timer = setTimeout(() => {
          console.log('⏰ Auto-hiding received drawing after 15 seconds')
          setActiveDrawings(prev => prev.filter(d => d.id !== data.drawing.id))
        }, 15000)
        
        setDrawingTimers(prev => new Map(prev.set(data.drawing.id, timer)))
      }
    }
    
    const handleDrawingHide = (data: {
      drawingId: string
      userId: string
      campaignId: string
    }) => {
      console.log('📨 Received drawing hide from user:', data.userId)
      
      // Hide drawing if it matches one of the active ones
      setActiveDrawings(prev => prev.filter(d => d.id !== data.drawingId))
      
      // Clear the timer for this drawing
      const timer = drawingTimers.get(data.drawingId)
      if (timer) {
        clearTimeout(timer)
        setDrawingTimers(prev => {
          const newMap = new Map(prev)
          newMap.delete(data.drawingId)
          return newMap
        })
      }
    }
    
    const handleMarkerShow = (data: {
      marker: {
        id: string
        position: { x: number; y: number }
        icon: string
        userId: string
        timestamp: number
      }
      userId: string
      campaignId: string
    }) => {
      console.log('📨 Received marker from other user:', data)
      console.log('🔍 Current userId:', userId, 'Marker userId:', data.userId)
      
      // Only show if it's from someone else (avoid showing our own markers twice)
      if (data.userId !== userId) {
        console.log('📍 Showing marker from user:', data.userId, 'Marker:', data.marker)
        setActiveMarkers(prev => {
          console.log('📋 Adding marker to existing markers:', prev.length)
          return [...prev, data.marker]
        })
      } else {
        console.log('🚫 Skipping own marker to avoid duplication')
      }
    }
    
    const handleMarkerHide = (data: {
      markerId: string
      userId: string
      campaignId: string
    }) => {
      console.log('📨 Received marker hide from user:', data.userId)
      
      // Hide marker if it matches one of the active ones
      setActiveMarkers(prev => prev.filter(m => m.id !== data.markerId))
    }
    
    const handleFogShow = (data: {
      fogArea: {
        id: string
        x: number
        y: number
        width: number
        height: number
        userId: string
        timestamp: number
      }
      userId: string
      campaignId: string
    }) => {
      console.log('📨 Received fog area from other user:', data)
      
      // Only show if it's from someone else (avoid showing our own fog areas twice)
      if (data.userId !== userId) {
        console.log('🌫️ Showing fog area from user:', data.userId)
        setFogAreas(prev => [...prev, data.fogArea])
      }
    }
    
    const handleFogHide = (data: {
      fogId: string
      userId: string
      campaignId: string
    }) => {
      console.log('📨 Received fog hide from user:', data.userId)
      
      // Hide fog area if it matches one of the active ones
      setFogAreas(prev => prev.filter(f => f.id !== data.fogId))
    }

    const handleFogCellErase = (data: {
      cellX: number
      cellY: number
      newFogAreas: typeof fogAreas
      userId: string
      campaignId: string
    }) => {
      console.log('📨 Received fog cell erase from user:', data.userId, 'at cell:', data.cellX, data.cellY)
      
      // Only apply if this update is from someone else (avoid feedback loop)
      if (data.userId !== userId) {
        console.log('🧹 Applying fog cell erase from other user')
        setFogAreas(data.newFogAreas)
      }
    }
    
    socket.on('grid:config-updated', handleGridConfigUpdate)
    socket.on('game:token-move', handleTokenMove)
    socket.on('measurement:show', handleMeasurementShow)
    socket.on('measurement:hide', handleMeasurementHide)
    socket.on('drawing:show', handleDrawingShow)
    socket.on('drawing:hide', handleDrawingHide)
    socket.on('marker:show', handleMarkerShow)
    socket.on('marker:hide', handleMarkerHide)
    socket.on('fog:show', handleFogShow)
    socket.on('fog:hide', handleFogHide)
    socket.on('fog:cell-erase', handleFogCellErase)
    
    return () => {
      socket.off('grid:config-updated', handleGridConfigUpdate)
      socket.off('game:token-move', handleTokenMove)
      socket.off('measurement:show', handleMeasurementShow)
      socket.off('measurement:hide', handleMeasurementHide)
      socket.off('drawing:show', handleDrawingShow)
      socket.off('drawing:hide', handleDrawingHide)
      socket.off('marker:show', handleMarkerShow)
      socket.off('marker:hide', handleMarkerHide)
      socket.off('fog:show', handleFogShow)
      socket.off('fog:hide', handleFogHide)
      socket.off('fog:cell-erase', handleFogCellErase)
    }
  }, [socket, isConnected, userId, isGM])
  
  // Debug log for marker state
  useEffect(() => {
    console.log('📊 Marker state changed:', { 
      activeMarkersCount: activeMarkers.length, 
      showMarkerPalette, 
      selectedMarkerIcon 
    })
  }, [activeMarkers, showMarkerPalette, selectedMarkerIcon])

  // Snap to grid function
  const snapToGridPosition = useCallback((position: { top: number; left: number }) => {
    if (!snapToGrid || !showGrid) return position
    
    return {
      top: Math.round(position.top / gridSize) * gridSize,
      left: Math.round(position.left / gridSize) * gridSize
    }
  }, [gridSize, snapToGrid, showGrid])

  // Handle grid configuration changes (GM only)
  const handleGridConfigChange = async (configKey: string, value: any) => {
    if (!isGM) {
      console.warn('🚫 Only GM can change grid configuration')
      return
    }

    console.log(`🎯 GM changing grid config: ${configKey} = ${value}`)

    // Update local state immediately (optimistic update)
    switch (configKey) {
      case 'showGrid':
        setShowGrid(value)
        break
      case 'showCoordinates':
        setShowCoordinates(value)
        break
      case 'snapToGrid':
        setSnapToGrid(value)
        break
      case 'gridSize':
        setGridSize(value)
        break
      case 'cellValueInMeters':
        setCellValueInMeters(value)
        break
    }

    // Send grid configuration via WebSocket - only if properly connected and joined
    if (canEmitSocketEvents()) {
      const gridConfig = {
        showGrid: configKey === 'showGrid' ? value : showGrid,
        showCoordinates: configKey === 'showCoordinates' ? value : showCoordinates,
        snapToGrid: configKey === 'snapToGrid' ? value : snapToGrid,
        gridSize: configKey === 'gridSize' ? value : gridSize,
        cellValueInMeters: configKey === 'cellValueInMeters' ? value : cellValueInMeters
      }

      console.log('📡 Broadcasting grid config via WebSocket:', gridConfig)
      
      socket?.emit('grid_config_update', {
        campaignId,
        config: gridConfig,
        updatedBy: userId
      })

      // Also persist in gameState
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/game-state`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gridConfig: gridConfig
          })
        })

        if (!response.ok) {
          console.error('❌ Failed to persist grid config to server')
        } else {
          console.log('✅ Grid config persisted to server')
        }
      } catch (error) {
        console.error('❌ Error persisting grid config:', error)
      }
    } else {
      console.warn('⚠️ No WebSocket connection for grid config sync')
    }
  }

  // Handle token movement using useTokens (with persistence)
  const handleTokenMove = (tokenId: string, position: { top: number; left: number }) => {
    console.log('🎯 TacticalGrid.handleTokenMove - calling useTokens.moveToken')
    
    // Apply snap to grid if enabled
    const finalPosition = snapToGridPosition(position)
    
    // Use the moveToken from useTokens which handles persistence
    moveToken(tokenId, finalPosition)
  }

  // Handle right-click context menu for grid (only if not on a token and not measuring)
  const handleContextMenu = (e: React.MouseEvent) => {
    // Disable context menu when measurement tool is active
    if (activeTool === 'measure') {
      e.preventDefault()
      return
    }
    
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
      let position = {
        top: (contextMenu as any).gridY || 100,
        left: (contextMenu as any).gridX || 100
      }

      // Apply snap to grid if enabled
      position = snapToGridPosition(position)

      const tokenData: Omit<TokenData, 'id'> = {
        src: '/placeholder-generic.png',
        alt: 'Token Genérico',
        name: 'Token Genérico',
        position,
        borderColor: 'border-gray-500',
        canPlayerMove: true,
        ownerId: userId,
        characterId: undefined,
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
      if (canEmitSocketEvents()) {
        console.log('📡 Sending token_clear_all via WebSocket')
        socket?.emit('token_clear_all', {
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

  // Handle toolbar tool selection
  const handleToolSelect = (tool: 'select' | 'measure' | 'draw' | 'mark' | 'fog') => {
    console.log(`🔧 TacticalGrid: Tool selected: ${tool}`)
    setActiveTool(tool)
    
    // Clear measurement state when switching tools
    setMeasurementPoints([])
    setActiveMeasurement(null)
    
    // Clear measurement timer
    if (measurementTimer) {
      clearTimeout(measurementTimer)
      setMeasurementTimer(null)
    }
    
    // Clear drawing state when switching tools
    setIsDrawing(false)
    setCurrentPath([])
    
    // Different behaviors based on selected tool
    switch (tool) {
      case 'measure':
        console.log('📏 Measurement tool activated - Click two points to measure')
        setShowColorPalette(false)
        setShowMarkerPalette(false)
        break
      case 'draw':
        console.log('✏️ Drawing tool activated - Click and drag to draw')
        setShowColorPalette(true)
        setShowMarkerPalette(false)
        break
      case 'mark':
        console.log('📍 Marking tool activated - Click to place markers')
        setShowColorPalette(false)
        setShowMarkerPalette(true)
        break
      case 'fog':
        console.log('🌫️ Fog of war tool activated - Click and drag to create fog areas')
        setShowColorPalette(false)
        setShowMarkerPalette(false)
        setShowFogTypePalette(true)
        // Clear any active fog creation state
        setIsCreatingFog(false)
        setFogStartPoint(null)
        setCurrentFogArea(null)
        break
      default:
        console.log('👆 Selection tool activated')
        setShowColorPalette(false)
        setShowMarkerPalette(false)
        setShowFogTypePalette(false)
        break
    }
  }

  // Cleanup measurement timer on unmount
  useEffect(() => {
    return () => {
      if (measurementTimer) {
        clearTimeout(measurementTimer)
      }
    }
  }, [measurementTimer])

  // Cleanup drawing timers on unmount and tool change
  useEffect(() => {
    return () => {
      // Clear all drawing timers on unmount
      drawingTimers.forEach(timer => clearTimeout(timer))
    }
  }, [])

  // Clear drawing timers when switching away from drawing tool
  useEffect(() => {
    if (activeTool !== 'draw') {
      // Clear current drawing state
      setIsDrawing(false)
      setCurrentPath([])
      
      // Clear all active drawings and their timers
      drawingTimers.forEach(timer => clearTimeout(timer))
      setDrawingTimers(new Map())
      setActiveDrawings([])
    }
  }, [activeTool])

  // Markers are persistent - no cleanup when switching tools

  // Handle measurement clicks
  const handleMeasurementClick = (e: React.MouseEvent) => {
    if (activeTool !== 'measure') return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    console.log(`📏 Measurement click at: (${x}, ${y})`)
    
    if (measurementPoints.length === 0) {
      // First click - set start point
      setMeasurementPoints([{ x, y }])
      console.log('📏 Start point set')
    } else if (measurementPoints.length === 1) {
      // Second click - set end point and calculate distance
      const startPoint = measurementPoints[0]
      const endPoint = { x, y }
      
      // Calculate distance in pixels
      const pixelDistance = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + 
        Math.pow(endPoint.y - startPoint.y, 2)
      )
      
      // Convert to cells (distance in pixels / grid size)
      const cellDistance = pixelDistance / gridSize
      
      // Convert to meters
      const metersDistance = cellDistance * cellValueInMeters
      
      console.log(`📏 Distance: ${pixelDistance.toFixed(1)}px = ${cellDistance.toFixed(2)} cells = ${metersDistance.toFixed(2)}m`)
      
      const measurementId = `measurement_${Date.now()}_${userId}`
      const measurement = {
        startPoint,
        endPoint,
        distance: metersDistance,
        id: measurementId,
        userId
      }
      
      setActiveMeasurement(measurement)
      setMeasurementPoints([startPoint, endPoint])
      
      // Clear any existing timer
      if (measurementTimer) {
        clearTimeout(measurementTimer)
      }
      
      // Broadcast measurement to all users via WebSocket - only if properly connected and joined
      if (canEmitSocketEvents()) {
        console.log('📡 Broadcasting measurement to all users', { campaignId, measurementId })
        socket?.emit('measurement_show', {
          campaignId,
          measurement,
          userId
        })
      } else {
        console.warn('⚠️ Skipping measurement broadcast - basic check failed')
      }
      
      // Set timer to hide measurement after 5 seconds
      const timer = setTimeout(() => {
        console.log('⏰ Hiding measurement after 5 seconds')
        setActiveMeasurement(null)
        
        // Broadcast hide to all users - only if properly connected and joined
        if (canEmitSocketEvents()) {
          socket?.emit('measurement_hide', {
            campaignId,
            measurementId,
            userId
          })
        }
      }, 5000)
      
      setMeasurementTimer(timer)
      
    } else {
      // Reset measurement
      setMeasurementPoints([{ x, y }])
      setActiveMeasurement(null)
      
      // Clear timer
      if (measurementTimer) {
        clearTimeout(measurementTimer)
        setMeasurementTimer(null)
      }
      
      console.log('📏 Measurement reset, new start point set')
    }
  }

  // Handle drawing events with useCallback to prevent unnecessary re-renders
  const handleDrawingStart = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'draw') return
    
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    console.log(`✏️ Starting to draw at: (${x}, ${y})`)
    
    setIsDrawing(true)
    setCurrentPath([{ x, y }])
  }, [activeTool])

  const handleDrawingMove = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'draw' || !isDrawing) return
    
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Throttle updates to reduce re-renders
    setCurrentPath(prev => {
      const lastPoint = prev[prev.length - 1]
      // Only add point if it's moved at least 3 pixels to reduce updates
      if (!lastPoint || Math.abs(lastPoint.x - x) > 3 || Math.abs(lastPoint.y - y) > 3) {
        return [...prev, { x, y }]
      }
      return prev
    })
  }, [activeTool, isDrawing])

  const handleDrawingEnd = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'draw' || !isDrawing) return
    
    console.log(`✏️ Finished drawing, path length: ${currentPath.length}`)
    
    setIsDrawing(false)
    
    if (currentPath.length > 1) {
      const drawingId = `drawing_${Date.now()}_${userId}`
      const newDrawing = {
        id: drawingId,
        path: currentPath,
        color: selectedColor,
        userId,
        timestamp: Date.now()
      }
      
      // Add to local drawings
      setActiveDrawings(prev => [...prev, newDrawing])
      
      // Broadcast via WebSocket - only if properly connected and joined
      if (canEmitSocketEvents()) {
        console.log('📡 Broadcasting drawing to all users', { campaignId, drawingId })
        socket?.emit('drawing_show', {
          campaignId,
          drawing: newDrawing,
          userId
        })
      } else {
        console.warn('⚠️ Skipping drawing broadcast - basic check failed')
      }
      
      // Set timer to remove after 15 seconds
      const timer = setTimeout(() => {
        console.log('⏰ Hiding drawing after 15 seconds')
        setActiveDrawings(prev => prev.filter(d => d.id !== drawingId))
        
        // Broadcast hide to all users - only if properly connected and joined
        if (canEmitSocketEvents()) {
          socket?.emit('drawing_hide', {
            campaignId,
            drawingId,
            userId
          })
        }
      }, 15000)
      
      // Store timer for cleanup
      setDrawingTimers(prev => new Map(prev.set(drawingId, timer)))
    }
    
    setCurrentPath([])
  }, [activeTool, isDrawing, currentPath, selectedColor, userId, socket, isConnected, campaignId])

  // Handle marker clicks - place markers on single click
  const handleMarkerClick = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'mark') return
    
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    console.log(`📍 Placing marker at: (${x}, ${y}) with icon: ${selectedMarkerIcon}`)
    
    const markerId = `marker_${Date.now()}_${userId}`
    const newMarker = {
      id: markerId,
      position: { x, y },
      icon: selectedMarkerIcon,
      userId,
      timestamp: Date.now()
    }
    
    console.log('🎯 Created marker object:', newMarker)
    
    // Add to local markers
    setActiveMarkers(prev => {
      console.log('📋 Adding marker locally, previous count:', prev.length)
      const newMarkers = [...prev, newMarker]
      console.log('📋 New marker count:', newMarkers.length)
      return newMarkers
    })
    
    // Broadcast via WebSocket - only if properly connected and joined
    if (canEmitSocketEvents()) {
      console.log('📡 Broadcasting marker to all users', { campaignId, markerId, newMarker })
      socket?.emit('marker:show', {
        campaignId,
        marker: newMarker,
        userId
      })
      console.log('✅ Marker emit sent successfully')
    } else {
      console.warn('⚠️ Skipping marker broadcast - basic check failed')
    }
    
    // Markers are persistent - no auto-hide timer
    console.log('📍 Marker placed successfully - persistent until manually removed')
  }, [activeTool, selectedMarkerIcon, userId, canEmitSocketEvents, socket, campaignId])

  // Handle marker right-click for removal (GM only)
  const handleMarkerRightClick = useCallback((markerId: string, e: React.MouseEvent) => {
    if (!isGM) return
    
    e.preventDefault()
    e.stopPropagation()
    
    console.log(`🗑️ GM removing marker: ${markerId}`)
    
    // Remove from local markers immediately
    setActiveMarkers(prev => prev.filter(m => m.id !== markerId))
    
    // Broadcast removal to all users
    if (canEmitSocketEvents()) {
      console.log('📡 Broadcasting marker removal to all users', { campaignId, markerId })
      socket?.emit('marker:hide', {
        campaignId,
        markerId,
        userId
      })
    } else {
      console.warn('⚠️ Skipping marker removal broadcast - basic check failed')
    }
  }, [isGM, canEmitSocketEvents, socket, campaignId, userId])

  // Helper functions for grid snapping
  const snapPositionToGrid = useCallback((x: number, y: number) => {
    const snappedX = Math.floor(x / gridSize) * gridSize
    const snappedY = Math.floor(y / gridSize) * gridSize
    return { x: snappedX, y: snappedY }
  }, [gridSize])

  const getGridCellFromPoint = useCallback((x: number, y: number) => {
    const cellX = Math.floor(x / gridSize)
    const cellY = Math.floor(y / gridSize)
    return { cellX, cellY, x: cellX * gridSize, y: cellY * gridSize }
  }, [gridSize])

  // Handle fog creation events - GM only
  const handleFogStart = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'fog' || !isGM) return
    
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Snap to grid
    const snapped = snapPositionToGrid(x, y)
    
    console.log(`🌫️ Starting fog creation at: (${x}, ${y}) -> snapped to (${snapped.x}, ${snapped.y})`)
    
    setIsCreatingFog(true)
    setFogStartPoint(snapped)
    setCurrentFogArea({ x: snapped.x, y: snapped.y, width: 0, height: 0 })
  }, [activeTool, isGM, snapPositionToGrid])

  const handleFogMove = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'fog' || !isCreatingFog || !fogStartPoint) return
    
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Snap to grid
    const snapped = snapPositionToGrid(x, y)
    
    // Calculate rectangle aligned to grid
    const minX = Math.min(fogStartPoint.x, snapped.x)
    const minY = Math.min(fogStartPoint.y, snapped.y)
    const maxX = Math.max(fogStartPoint.x, snapped.x)
    const maxY = Math.max(fogStartPoint.y, snapped.y)
    
    // Ensure width and height are multiples of grid size
    const width = maxX - minX + gridSize
    const height = maxY - minY + gridSize
    
    setCurrentFogArea({
      x: minX,
      y: minY,
      width: width,
      height: height
    })
  }, [activeTool, isCreatingFog, fogStartPoint, snapPositionToGrid, gridSize])

  const handleFogEnd = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'fog' || !isCreatingFog || !currentFogArea || !fogStartPoint) return
    
    console.log(`🌫️ Finished creating fog area:`, currentFogArea)
    
    setIsCreatingFog(false)
    
    // Only create if the area is large enough (minimum 10x10 pixels)
    if (currentFogArea.width > 10 && currentFogArea.height > 10) {
      const fogId = `fog_${Date.now()}_${userId}`
      const newFogArea = {
        id: fogId,
        x: currentFogArea.x,
        y: currentFogArea.y,
        width: currentFogArea.width,
        height: currentFogArea.height,
        type: selectedFogType,
        color: selectedFogType === 'magical' ? selectedFogColor : undefined,
        userId,
        timestamp: Date.now()
      }
      
      // Add to local fog areas
      setFogAreas(prev => [...prev, newFogArea])
      
      // Broadcast via WebSocket
      if (canEmitSocketEvents()) {
        console.log('📡 Broadcasting fog area to all users', { campaignId, fogId, newFogArea })
        socket?.emit('fog:show', {
          campaignId,
          fogArea: newFogArea,
          userId
        })
      } else {
        console.warn('⚠️ Skipping fog broadcast - basic check failed')
      }
      
      // Persist fog areas to server
      persistFogAreas([...fogAreas, newFogArea])
      
      console.log('🌫️ Fog area created successfully')
    }
    
    setFogStartPoint(null)
    setCurrentFogArea(null)
  }, [activeTool, isCreatingFog, currentFogArea, fogStartPoint, userId, canEmitSocketEvents, socket, campaignId, fogAreas])

  // Handle fog area right-click for removal (GM only)
  const handleFogRightClick = useCallback((fogId: string, e: React.MouseEvent) => {
    if (!isGM) return
    
    e.preventDefault()
    e.stopPropagation()
    
    console.log(`🗑️ GM removing fog area: ${fogId}`)
    
    // Remove from local fog areas immediately
    const newFogAreas = fogAreas.filter(f => f.id !== fogId)
    setFogAreas(newFogAreas)
    
    // Broadcast removal to all users
    if (canEmitSocketEvents()) {
      console.log('📡 Broadcasting fog removal to all users', { campaignId, fogId })
      socket?.emit('fog:hide', {
        campaignId,
        fogId,
        userId
      })
    } else {
      console.warn('⚠️ Skipping fog removal broadcast - basic check failed')
    }
    
    // Persist updated fog areas to server
    persistFogAreas(newFogAreas)
  }, [isGM, fogAreas, canEmitSocketEvents, socket, campaignId, userId])

  // Persist fog areas to server
  const persistFogAreas = async (areas: typeof fogAreas) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/game-state`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fogAreas: areas
        })
      })

      if (!response.ok) {
        console.error('❌ Failed to persist fog areas to server')
      } else {
        console.log('✅ Fog areas persisted to server')
      }
    } catch (error) {
      console.error('❌ Error persisting fog areas:', error)
    }
  }

  // Helper function to check if a point is inside a fog area
  const isPointInFog = useCallback((x: number, y: number) => {
    return fogAreas.some(fog => 
      x >= fog.x && 
      x <= fog.x + fog.width && 
      y >= fog.y && 
      y <= fog.y + fog.height
    )
  }, [fogAreas])

  // Helper function to check if a token is in fog (for players only)
  const isTokenInFog = useCallback((token: any) => {
    if (isGM) return false // GM can always see everything
    
    const tokenCenterX = token.position.left + (token.tokenSize || 40) / 2
    const tokenCenterY = token.position.top + (token.tokenSize || 40) / 2
    
    return isPointInFog(tokenCenterX, tokenCenterY)
  }, [isGM, isPointInFog])

  // Helper function to check if a marker is in fog (for players only)
  const isMarkerInFog = useCallback((marker: any) => {
    if (isGM) return false // GM can always see everything
    
    return isPointInFog(marker.position.x, marker.position.y)
  }, [isGM, isPointInFog])

  // Handle eraser click to remove single grid cells from fog areas (GM only)
  const handleEraserClick = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'eraser' || !isGM) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Get the grid cell being clicked
    const { cellX, cellY, x: cellStartX, y: cellStartY } = getGridCellFromPoint(x, y)
    
    console.log(`🧹 Eraser click at cell (${cellX}, ${cellY}) -> (${cellStartX}, ${cellStartY})`)
    
    // Find fog areas that contain this cell
    const fogsToModify = fogAreas.filter(fog => 
      cellStartX >= fog.x && 
      cellStartX < fog.x + fog.width && 
      cellStartY >= fog.y && 
      cellStartY < fog.y + fog.height
    )
    
    if (fogsToModify.length > 0) {
      let newFogAreas = [...fogAreas]
      let modified = false
      
      fogsToModify.forEach(fog => {
        // Remove this fog area and create new ones excluding the erased cell
        newFogAreas = newFogAreas.filter(f => f.id !== fog.id)
        
        // Split the fog area to exclude the erased cell
        const fragmentedAreas = createFogFragments(fog, cellStartX, cellStartY, gridSize)
        newFogAreas = [...newFogAreas, ...fragmentedAreas]
        modified = true
      })
      
      if (modified) {
        setFogAreas(newFogAreas)
        
        // Broadcast the complete new fog state
        if (canEmitSocketEvents()) {
          console.log('📡 Broadcasting fog cell erasure to all users')
          socket?.emit('fog:cell-erase', {
            campaignId,
            cellX,
            cellY,
            newFogAreas,
            userId
          })
        }
        
        // Persist updated fog areas to server
        persistFogAreas(newFogAreas)
      }
    }
  }, [activeTool, isGM, fogAreas, getGridCellFromPoint, gridSize, canEmitSocketEvents, socket, campaignId, userId])


  // Helper function to create fog fragments when a cell is erased
  const createFogFragments = useCallback((originalFog: typeof fogAreas[0], erasedCellX: number, erasedCellY: number, gridSize: number) => {
    const fragments: typeof fogAreas = []
    
    // Calculate the grid cells that make up the original fog area
    const startCellX = originalFog.x / gridSize
    const startCellY = originalFog.y / gridSize
    const endCellX = (originalFog.x + originalFog.width) / gridSize
    const endCellY = (originalFog.y + originalFog.height) / gridSize
    
    const erasedGridX = erasedCellX / gridSize
    const erasedGridY = erasedCellY / gridSize
    
    // Create fragments for each remaining cell
    for (let cellY = startCellY; cellY < endCellY; cellY++) {
      for (let cellX = startCellX; cellX < endCellX; cellX++) {
        // Skip the erased cell
        if (cellX === erasedGridX && cellY === erasedGridY) {
          continue
        }
        
        // Create a fragment for this cell
        fragments.push({
          id: `${originalFog.id}_fragment_${cellX}_${cellY}_${Date.now()}`,
          x: cellX * gridSize,
          y: cellY * gridSize,
          width: gridSize,
          height: gridSize,
          type: originalFog.type,
          color: originalFog.color,
          userId: originalFog.userId,
          timestamp: Date.now()
        })
      }
    }
    
    return fragments
  }, [])

  // Helper function to get fog area visual styles
  const getFogAreaStyles = useCallback((fog: typeof fogAreas[0]) => {
    const baseStyles = {
      position: 'absolute' as const,
      left: fog.x,
      top: fog.y,
      width: fog.width,
      height: fog.height,
      zIndex: 20,
      pointerEvents: isGM ? ('auto' as const) : ('none' as const),
      cursor: isGM ? (activeTool === 'eraser' ? 'crosshair' : 'pointer') : 'default'
    }

    if (isGM) {
      // Check if this is a single cell (fragment) vs larger area
      const isSingleCell = fog.width === gridSize && fog.height === gridSize
      
      // GM view: subtle overlay with dashed border
      return {
        ...baseStyles,
        backgroundColor: fog.type === 'magical' && fog.color 
          ? `${fog.color}30` // 30 = low opacity
          : 'rgba(0, 0, 0, 0.3)',
        border: isSingleCell 
          ? '1px solid rgba(156, 163, 175, 0.5)' // Subtle border for single cells
          : '2px dashed rgba(156, 163, 175, 0.8)', // Original dashed border for larger areas
        backdropFilter: fog.type === 'thin' ? 'blur(2px)' : undefined
      }
    } else {
      // Player view: different effects based on fog type
      switch (fog.type) {
        case 'dense':
          return {
            ...baseStyles,
            backgroundColor: 'rgba(0, 0, 0, 0.95)' // Almost opaque black
          }
        case 'thin':
          return {
            ...baseStyles,
            backgroundColor: 'rgba(128, 128, 128, 0.4)', // Semi-transparent gray
            backdropFilter: 'blur(3px)'
          }
        case 'magical':
          return {
            ...baseStyles,
            backgroundColor: fog.color ? `${fog.color}4D` : '#8b5cf64D', // 4D = 30% opacity
            backdropFilter: 'blur(1px)',
            background: fog.color 
              ? `radial-gradient(circle, ${fog.color}4D 0%, ${fog.color}1A 100%)`
              : 'radial-gradient(circle, #8b5cf64D 0%, #8b5cf61A 100%)'
          }
        default:
          return {
            ...baseStyles,
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
      }
    }
  }, [isGM, activeTool])

  // Get map image with cache busting - memoized to prevent unnecessary re-renders
  const getMapImage = useCallback(() => {
    if (activeMap?.imageUrl) {
      return activeMap.imageUrl
    }
    return "/placeholder.svg"
  }, [activeMap?.imageUrl])

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
        onClick={activeTool === 'measure' ? handleMeasurementClick : activeTool === 'mark' ? handleMarkerClick : activeTool === 'eraser' ? handleEraserClick : undefined}
        onMouseDown={activeTool === 'draw' ? handleDrawingStart : activeTool === 'fog' ? handleFogStart : undefined}
        onMouseMove={activeTool === 'draw' ? handleDrawingMove : activeTool === 'fog' ? handleFogMove : undefined}
        onMouseUp={activeTool === 'draw' ? handleDrawingEnd : activeTool === 'fog' ? handleFogEnd : undefined}
      >
        {/* Loading */}
        {mapLoading && (
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
        {!activeMap && !mapLoading && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white">Nenhum mapa ativo</div>
          </div>
        )}

        {/* Grid Coordinates System */}
        <GridCoordinates
          gridSize={gridSize}
          containerWidth={800}
          containerHeight={600}
          showCoordinates={showCoordinates}
          showGrid={showGrid}
          showRulers={false}
        />

        {/* Measurement Line and Points - Show for all users */}
        <div className="absolute inset-0 pointer-events-none">
          <svg width="800" height="600" className="absolute inset-0">
            {/* First measurement point - only show when GM is actively measuring */}
            {activeTool === 'measure' && measurementPoints.length > 0 && (
              <circle
                cx={measurementPoints[0].x}
                cy={measurementPoints[0].y}
                r="4"
                fill="#ef4444"
                stroke="#dc2626"
                strokeWidth="2"
              />
            )}
            
            {/* Measurement line and points - show for all users */}
            {activeMeasurement && (
              <>
                <line
                  x1={activeMeasurement.startPoint.x}
                  y1={activeMeasurement.startPoint.y}
                  x2={activeMeasurement.endPoint.x}
                  y2={activeMeasurement.endPoint.y}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                <circle
                  cx={activeMeasurement.startPoint.x}
                  cy={activeMeasurement.startPoint.y}
                  r="4"
                  fill="#ef4444"
                  stroke="#dc2626"
                  strokeWidth="2"
                />
                <circle
                  cx={activeMeasurement.endPoint.x}
                  cy={activeMeasurement.endPoint.y}
                  r="4"
                  fill="#ef4444"
                  stroke="#dc2626"
                  strokeWidth="2"
                />
                
                {/* Background for text readability */}
                <rect
                  x={(activeMeasurement.startPoint.x + activeMeasurement.endPoint.x) / 2 - 25}
                  y={(activeMeasurement.startPoint.y + activeMeasurement.endPoint.y) / 2 - 25}
                  width="50"
                  height="20"
                  fill="rgba(0, 0, 0, 0.7)"
                  rx="3"
                />
                <text
                  x={(activeMeasurement.startPoint.x + activeMeasurement.endPoint.x) / 2}
                  y={(activeMeasurement.startPoint.y + activeMeasurement.endPoint.y) / 2 - 10}
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {activeMeasurement.distance.toFixed(1)}m
                </text>
              </>
            )}
            
            {/* Drawing paths */}
            {activeDrawings.map((drawing) => (
              <g key={drawing.id}>
                <path
                  d={`M ${drawing.path.map(p => `${p.x},${p.y}`).join(' L ')}`}
                  stroke={drawing.color}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ))}
            
            {/* Current drawing path (while drawing) */}
            {isDrawing && currentPath.length > 1 && (
              <path
                d={`M ${currentPath.map(p => `${p.x},${p.y}`).join(' L ')}`}
                stroke={selectedColor}
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
            )}
          </svg>
        </div>

        {/* Markers - positioned absolutely over the grid, hidden in fog for players */}
        {activeMarkers.map((marker) => {
          const inFog = isMarkerInFog(marker)
          if (inFog && !isGM) return null // Hide markers in fog for players
          
          return (
            <div
              key={marker.id}
              className={`absolute z-30 ${isGM ? 'pointer-events-auto cursor-pointer hover:scale-110' : 'pointer-events-none'} transition-transform ${inFog && isGM ? 'opacity-50' : ''}`}
              style={{
                left: marker.position.x - 15, // Center the 30px icon
                top: marker.position.y - 15,
                fontSize: '30px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.3))'
              }}
              onContextMenu={(e) => handleMarkerRightClick(marker.id, e)}
              title={isGM ? "Clique direito para remover" : undefined}
            >
              {marker.icon}
            </div>
          )
        })}

        {/* Tokens - Only generic tokens, clean grid if no previous session, hidden in fog for players */}
        {!tokensLoading && tokens?.map((token) => {
          const inFog = isTokenInFog(token)
          if (inFog && !isGM) return null // Hide tokens in fog for players
          
          return (
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
          )
        })}
        
        {/* Show clean grid message when no tokens */}
        {!tokensLoading && (!tokens || tokens.length === 0) && activeMap && activeTool === 'select' && (
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded text-sm">
            Grid limpo - Clique com botão direito para adicionar tokens ou configurar grade
          </div>
        )}

        {/* Measurement tool instructions */}
        {activeTool === 'measure' && (
          <div className="absolute bottom-4 left-4 bg-red-600 bg-opacity-90 text-white px-3 py-2 rounded text-sm">
            {measurementPoints.length === 0 && "📏 Clique no primeiro ponto para medir"}
            {measurementPoints.length === 1 && "📏 Clique no segundo ponto"}
            {activeMeasurement && "📏 Clique em qualquer lugar para nova medição"}
          </div>
        )}

        {/* Drawing tool instructions */}
        {activeTool === 'draw' && (
          <div className="absolute bottom-4 left-4 bg-blue-600 bg-opacity-90 text-white px-3 py-2 rounded text-sm">
            {isDrawing && "✏️ Arraste para desenhar"}
            {!isDrawing && "✏️ Pressione e arraste para desenhar"}
          </div>
        )}

        {/* Marker tool instructions */}
        {activeTool === 'mark' && (
          <div className="absolute bottom-4 left-4 bg-purple-600 bg-opacity-90 text-white px-3 py-2 rounded text-sm">
            📍 Clique para colocar • Clique direito para remover
          </div>
        )}

        {/* Fog tool instructions */}
        {activeTool === 'fog' && isGM && (
          <div className="absolute bottom-4 left-4 bg-gray-600 bg-opacity-90 text-white px-3 py-2 rounded text-sm">
            {isCreatingFog && "🌫️ Arraste para definir área de névoa"}
            {!isCreatingFog && "🌫️ Arraste para criar névoa • Clique direito para remover"}
          </div>
        )}

        {/* Eraser tool instructions */}
        {activeTool === 'eraser' && isGM && (
          <div className="absolute bottom-4 left-4 bg-red-600 bg-opacity-90 text-white px-3 py-2 rounded text-sm">
            🧹 Clique em uma célula com névoa para removê-la • Clique direito remove área inteira
          </div>
        )}

        {/* Fog Areas - Different visual effects based on type */}
        {fogAreas.map((fog) => (
          <div
            key={fog.id}
            style={getFogAreaStyles(fog)}
            onContextMenu={isGM ? (e) => handleFogRightClick(fog.id, e) : undefined}
            title={isGM ? `${fog.type.charAt(0).toUpperCase() + fog.type.slice(1)} fog - Right-click to remove` : undefined}
          >
            {isGM && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold opacity-70">
                {/* Adjust icon size based on cell size */}
                <span style={{ fontSize: fog.width <= gridSize && fog.height <= gridSize ? '10px' : '12px' }}>
                  {fog.type === 'dense' ? '🌫️' : fog.type === 'thin' ? '🌤️' : '✨'}
                </span>
                {/* Only show text label for larger areas (not individual cells) */}
                {fog.width > gridSize || fog.height > gridSize ? (
                  <span className="ml-1">
                    {fog.type.toUpperCase()}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        ))}

        {/* Current fog area being created */}
        {isCreatingFog && currentFogArea && currentFogArea.width > 0 && currentFogArea.height > 0 && (
          <div
            className="absolute z-20 border-2 border-gray-300 border-dashed pointer-events-none"
            style={{
              left: currentFogArea.x,
              top: currentFogArea.y,
              width: currentFogArea.width,
              height: currentFogArea.height,
              backgroundColor: selectedFogType === 'magical' && selectedFogColor 
                ? `${selectedFogColor}30` 
                : 'rgba(0, 0, 0, 0.2)',
              backdropFilter: selectedFogType === 'thin' ? 'blur(2px)' : undefined
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
              {selectedFogType === 'dense' ? '🌫️' : selectedFogType === 'thin' ? '🌤️' : '✨'}
              <span className="ml-1">
                {selectedFogType.toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Grid status indicator */}
        {(showGrid || showCoordinates) && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded text-sm">
            <div className="flex items-center gap-2">
              {showGrid && <span className="text-green-400">●</span>}
              {showCoordinates && <span className="text-blue-400">A1</span>}
              <span>Células: {gridSize}px</span>
              {snapToGrid && <span className="text-yellow-400">⊞</span>}
            </div>
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
            {/* Token Actions */}
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

            {/* Grid Configuration Section - Only for GM */}
            {isGM && (
              <>
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-4 py-1 text-xs text-gray-500 font-medium">Configurações do Grid (Mestre)</div>
                
                <button
                  onClick={() => handleGridConfigChange('showGrid', !showGrid)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {showGrid ? '✓ ' : ''}Mostrar Grade
                </button>
                
                <button
                  onClick={() => handleGridConfigChange('showCoordinates', !showCoordinates)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {showCoordinates ? '✓ ' : ''}Mostrar Coordenadas
                </button>
                
                <button
                  onClick={() => handleGridConfigChange('snapToGrid', !snapToGrid)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    snapToGrid ? 'text-blue-700 bg-blue-50' : 'text-gray-700'
                  }`}
                >
                  {snapToGrid ? '✓ ' : ''}Ajustar à Grade
                </button>

                {/* Grid Size Section */}
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-4 py-1 text-xs text-gray-500 font-medium">Tamanho das Células</div>
                
                {[
                  { size: 20, label: 'Pequeno (20px)', key: 'small' },
                  { size: 40, label: 'Médio (40px)', key: 'medium' },
                  { size: 60, label: 'Grande (60px)', key: 'large' }
                ].map(({ size, label, key }) => (
                  <button
                    key={key}
                    onClick={() => {
                      handleGridConfigChange('gridSize', size)
                      setContextMenu(prev => ({ ...prev, visible: false }))
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      gridSize === size ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {gridSize === size ? '● ' : '○ '}{label}
                  </button>
                ))}

                {/* Measurement Section - Only when grid is active */}
                {showGrid && (
                  <>
                    <div className="border-t border-gray-200 my-1"></div>
                    <div className="px-4 py-1 text-xs text-gray-500 font-medium">Valor da Célula</div>
                    
                    <div className="px-4 py-2">
                      {/* Preset values */}
                      <div className="flex gap-1">
                        {[0.5, 1.0, 1.5, 2.0, 3.0, 5.0].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => {
                              handleGridConfigChange('cellValueInMeters', preset)
                            }}
                            className={`px-2 py-1 text-xs rounded border ${
                              cellValueInMeters === preset 
                                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {preset}m
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Grid Status for Players - Read Only */}
            {!isGM && (showGrid || showCoordinates) && (
              <>
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-4 py-1 text-xs text-gray-500 font-medium">Configurações do Grid</div>
                
                <div className="px-4 py-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    {showGrid && <span className="text-green-400">●</span>}
                    {showCoordinates && <span className="text-blue-400">A1</span>}
                    <span>Células: {gridSize}px</span>
                    {snapToGrid && <span className="text-yellow-400">⊞</span>}
                  </div>
                  {showGrid && (
                    <div className="text-xs text-gray-600 mt-1">
                      Valor: {cellValueInMeters}m por célula
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    (Configurado pelo Mestre)
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tactical Toolbar - GM Only */}
      <TacticalToolbar 
        isGM={isGM}
        onToolSelect={handleToolSelect}
      />

      {/* Color Palette - Only show when drawing tool is active */}
      {isGM && showColorPalette && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-gray-800 border border-gray-600 rounded-lg p-2 z-40">
          {drawingColors.map((color) => (
            <button
              key={color.value}
              onClick={() => setSelectedColor(color.value)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                selectedColor === color.value 
                  ? 'border-white scale-110' 
                  : 'border-gray-400 hover:border-gray-200'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      )}

      {/* Marker Icon Palette - Only show when marker tool is active */}
      {isGM && showMarkerPalette && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-gray-800 border border-gray-600 rounded-lg p-2 z-40">
          {markerIcons.map((marker) => (
            <button
              key={marker.icon}
              onClick={() => setSelectedMarkerIcon(marker.icon)}
              className={`w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center text-xl ${
                selectedMarkerIcon === marker.icon 
                  ? 'border-white scale-110 bg-gray-700' 
                  : 'border-gray-400 hover:border-gray-200 bg-gray-800 hover:bg-gray-700'
              }`}
              title={marker.name}
            >
              {marker.icon}
            </button>
          ))}
        </div>
      )}

      {/* Fog Type Palette - Only show when fog tool is active */}
      {isGM && showFogTypePalette && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-gray-800 border border-gray-600 rounded-lg p-3 z-40">
          <div className="text-white text-xs font-bold mb-2 text-center">Tipos de Névoa</div>
          
          {fogTypes.map((fogType) => (
            <button
              key={fogType.id}
              onClick={() => setSelectedFogType(fogType.id)}
              className={`w-12 h-12 rounded-lg border-2 transition-all flex flex-col items-center justify-center text-lg ${
                selectedFogType === fogType.id 
                  ? 'border-white scale-110 bg-gray-700' 
                  : 'border-gray-400 hover:border-gray-200 bg-gray-800 hover:bg-gray-700'
              }`}
              title={`${fogType.name} - ${fogType.description}`}
            >
              <span>{fogType.icon}</span>
            </button>
          ))}

          {/* Magical fog colors - only show when magical fog is selected */}
          {selectedFogType === 'magical' && (
            <>
              <div className="border-t border-gray-600 mt-2 pt-2">
                <div className="text-white text-xs font-bold mb-2 text-center">Cores Mágicas</div>
                <div className="flex flex-col gap-1">
                  {magicalFogColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedFogColor(color.value)}
                      className={`w-12 h-8 rounded border-2 transition-all flex items-center justify-center text-sm ${
                        selectedFogColor === color.value 
                          ? 'border-white scale-105' 
                          : 'border-gray-400 hover:border-gray-200'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      <span className="drop-shadow-lg">{color.icon}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

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