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
  
  // Toolbar state
  const [activeTool, setActiveTool] = useState<'select' | 'measure' | 'draw' | 'mark' | 'fog'>('select')
  
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
          
          if (gridConfig) {
            console.log('📥 Loading existing grid config:', gridConfig)
            setShowGrid(gridConfig.showGrid || false)
            setShowCoordinates(gridConfig.showCoordinates || false)
            setSnapToGrid(gridConfig.snapToGrid || false)
            setGridSize(gridConfig.gridSize || 40)
            setCellValueInMeters(gridConfig.cellValueInMeters || 1.5)
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
    
    socket.on('grid:config-updated', handleGridConfigUpdate)
    socket.on('game:token-move', handleTokenMove)
    socket.on('measurement:show', handleMeasurementShow)
    socket.on('measurement:hide', handleMeasurementHide)
    
    return () => {
      socket.off('grid:config-updated', handleGridConfigUpdate)
      socket.off('game:token-move', handleTokenMove)
      socket.off('measurement:show', handleMeasurementShow)
      socket.off('measurement:hide', handleMeasurementHide)
    }
  }, [socket, isConnected, userId, isGM])

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

    // Send grid configuration via WebSocket
    if (socket && isConnected) {
      const gridConfig = {
        showGrid: configKey === 'showGrid' ? value : showGrid,
        showCoordinates: configKey === 'showCoordinates' ? value : showCoordinates,
        snapToGrid: configKey === 'snapToGrid' ? value : snapToGrid,
        gridSize: configKey === 'gridSize' ? value : gridSize,
        cellValueInMeters: configKey === 'cellValueInMeters' ? value : cellValueInMeters
      }

      console.log('📡 Broadcasting grid config via WebSocket:', gridConfig)
      
      socket.emit('grid_config_update', {
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
    
    // Different behaviors based on selected tool
    switch (tool) {
      case 'measure':
        console.log('📏 Measurement tool activated - Click two points to measure')
        break
      case 'draw':
        console.log('✏️ Drawing tool activated')
        break
      case 'mark':
        console.log('📍 Marking tool activated')
        break
      case 'fog':
        console.log('🌫️ Fog of war tool activated')
        break
      default:
        console.log('👆 Selection tool activated')
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
      
      // Broadcast measurement to all users via WebSocket
      if (socket && isConnected) {
        console.log('📡 Broadcasting measurement to all users')
        socket.emit('measurement_show', {
          campaignId,
          measurement,
          userId
        })
      }
      
      // Set timer to hide measurement after 5 seconds
      const timer = setTimeout(() => {
        console.log('⏰ Hiding measurement after 5 seconds')
        setActiveMeasurement(null)
        
        // Broadcast hide to all users
        if (socket && isConnected) {
          socket.emit('measurement_hide', {
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
        onClick={handleMeasurementClick}
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
          </svg>
        </div>

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
        {!loading && (!tokens || tokens.length === 0) && activeMap && activeTool === 'select' && (
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