"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

export interface MeasurementPoint {
  x: number
  y: number
  gridX: number
  gridY: number
}

export interface MeasurementSettings {
  unit: 'feet' | 'meters' | 'squares'
  snapToGrid: boolean
  snapToCenter: boolean
  feetPerSquare: number
  metersPerSquare: number
  // Grid display options
  showGrid: boolean
  showCoordinates: boolean
  showRulers: boolean
}

interface MeasurementToolProps {
  isActive: boolean
  gridSize: number
  containerRef: React.RefObject<HTMLDivElement>
  settings: MeasurementSettings
  onMeasurementChange?: (points: MeasurementPoint[], totalDistance: number) => void
  imageOffset?: { x: number; y: number }
  imageDisplaySize?: { width: number; height: number }
}

export function MeasurementTool({
  isActive,
  gridSize,
  containerRef,
  settings,
  onMeasurementChange,
  imageOffset = { x: 0, y: 0 },
  imageDisplaySize = { width: 0, height: 0 }
}: MeasurementToolProps) {
  const [points, setPoints] = useState<MeasurementPoint[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null)

  // Calculate distance between two points
  const calculateDistance = useCallback((p1: MeasurementPoint, p2: MeasurementPoint): number => {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const pixelDistance = Math.sqrt(dx * dx + dy * dy)
    
    // Convert to grid squares first
    const squareDistance = pixelDistance / gridSize
    
    // Convert to desired unit
    switch (settings.unit) {
      case 'feet':
        return squareDistance * settings.feetPerSquare
      case 'meters':
        return squareDistance * settings.metersPerSquare
      case 'squares':
        return squareDistance
      default:
        return squareDistance
    }
  }, [gridSize, settings])

  // Calculate total path distance
  const calculateTotalDistance = useCallback((pathPoints: MeasurementPoint[]): number => {
    if (pathPoints.length < 2) return 0
    
    let total = 0
    for (let i = 1; i < pathPoints.length; i++) {
      total += calculateDistance(pathPoints[i - 1], pathPoints[i])
    }
    return total
  }, [calculateDistance])

  // Snap point to grid
  const snapToGrid = useCallback((x: number, y: number) => {
    if (!settings.snapToGrid) {
      return { x, y, gridX: Math.floor(x / gridSize), gridY: Math.floor(y / gridSize) }
    }

    let snappedX: number
    let snappedY: number

    if (settings.snapToCenter) {
      // Snap to center of grid squares
      snappedX = Math.floor(x / gridSize) * gridSize + gridSize / 2
      snappedY = Math.floor(y / gridSize) * gridSize + gridSize / 2
    } else {
      // Snap to grid intersections (corners)
      snappedX = Math.round(x / gridSize) * gridSize
      snappedY = Math.round(y / gridSize) * gridSize
    }

    return {
      x: snappedX,
      y: snappedY,
      gridX: Math.floor(snappedX / gridSize),
      gridY: Math.floor(snappedY / gridSize)
    }
  }, [gridSize, settings.snapToGrid, settings.snapToCenter])

  // Handle mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isActive || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const containerX = e.clientX - rect.left
    const containerY = e.clientY - rect.top
    
    // Adjust coordinates to image space
    const x = containerX - imageOffset.x
    const y = containerY - imageOffset.y
    
    // Check if click is within image bounds
    if (x < 0 || y < 0 || x > imageDisplaySize.width || y > imageDisplaySize.height) {
      return
    }

    const snappedPoint = snapToGrid(x, y)

    if (e.shiftKey && points.length > 0) {
      // Multi-point measurement (add point)
      setPoints(prev => [...prev, snappedPoint])
    } else {
      // Start new measurement
      setPoints([snappedPoint])
      setIsDrawing(true)
    }
  }, [isActive, containerRef, snapToGrid, points.length, imageOffset, imageDisplaySize])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isActive || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const containerX = e.clientX - rect.left
    const containerY = e.clientY - rect.top
    
    // Adjust coordinates to image space
    const x = containerX - imageOffset.x
    const y = containerY - imageOffset.y

    const snappedPoint = snapToGrid(x, y)
    setCurrentMousePos(snappedPoint)
  }, [isActive, containerRef, snapToGrid, imageOffset])

  const handleMouseUp = useCallback(() => {
    if (!isActive || !isDrawing) return

    if (currentMousePos && points.length > 0) {
      const newPoints = [...points, currentMousePos]
      setPoints(newPoints)
      
      // Calculate total distance
      const totalDistance = calculateTotalDistance(newPoints)
      onMeasurementChange?.(newPoints, totalDistance)
    }

    setIsDrawing(false)
  }, [isActive, isDrawing, currentMousePos, points, calculateTotalDistance, onMeasurementChange])

  // Clear measurements when tool becomes inactive
  useEffect(() => {
    if (!isActive) {
      setPoints([])
      setIsDrawing(false)
      setCurrentMousePos(null)
    }
  }, [isActive])

  // Update measurement callback when points change
  useEffect(() => {
    if (points.length > 1) {
      const totalDistance = calculateTotalDistance(points)
      onMeasurementChange?.(points, totalDistance)
    } else if (points.length === 0) {
      onMeasurementChange?.([], 0)
    }
  }, [points, calculateTotalDistance, onMeasurementChange])

  // Clear measurements on right click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!isActive) return
    e.preventDefault()
    setPoints([])
    setIsDrawing(false)
    setCurrentMousePos(null)
    onMeasurementChange?.([], 0)
  }, [isActive, onMeasurementChange])

  // Format distance for display
  const formatDistance = useCallback((distance: number): string => {
    const rounded = Math.round(distance * 10) / 10
    
    // Translate units to Portuguese
    const unitTranslation = {
      'feet': 'pés',
      'meters': 'metros', 
      'squares': 'quadrados'
    }
    
    const translatedUnit = unitTranslation[settings.unit] || settings.unit
    return `${rounded} ${translatedUnit}`
  }, [settings.unit])

  if (!isActive) return null

  const currentPoints = [...points]
  if (isDrawing && currentMousePos) {
    currentPoints.push(currentMousePos)
  }

  return (
    <div
      className="absolute inset-0 pointer-events-auto"
      style={{ cursor: isActive ? 'crosshair' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {/* Render measurement lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {currentPoints.length > 1 && (
          <>
            {/* Draw path lines */}
            {currentPoints.map((point, index) => {
              if (index === 0) return null
              const prevPoint = currentPoints[index - 1]
              return (
                <line
                  key={`line-${index}`}
                  x1={prevPoint.x + imageOffset.x}
                  y1={prevPoint.y + imageOffset.y}
                  x2={point.x + imageOffset.x}
                  y2={point.y + imageOffset.y}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray={isDrawing && index === currentPoints.length - 1 ? "5,5" : "none"}
                />
              )
            })}

            {/* Draw measurement points */}
            {currentPoints.map((point, index) => (
              <circle
                key={`point-${index}`}
                cx={point.x + imageOffset.x}
                cy={point.y + imageOffset.y}
                r="4"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ))}

            {/* Distance labels on each segment */}
            {currentPoints.map((point, index) => {
              if (index === 0) return null
              const prevPoint = currentPoints[index - 1]
              const segmentDistance = calculateDistance(prevPoint, point)
              const midX = (prevPoint.x + point.x) / 2 + imageOffset.x
              const midY = (prevPoint.y + point.y) / 2 + imageOffset.y
              
              return (
                <g key={`label-${index}`}>
                  <rect
                    x={midX - 20}
                    y={midY - 10}
                    width="40"
                    height="20"
                    fill="#1f2937"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    rx="4"
                    opacity="0.9"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    className="text-xs fill-white font-medium"
                  >
                    {formatDistance(segmentDistance)}
                  </text>
                </g>
              )
            })}

            {/* Total distance display */}
            {currentPoints.length > 1 && (
              <g>
                <rect
                  x={currentPoints[currentPoints.length - 1].x + imageOffset.x + 10}
                  y={currentPoints[currentPoints.length - 1].y + imageOffset.y - 15}
                  width="80"
                  height="25"
                  fill="#059669"
                  stroke="#ffffff"
                  strokeWidth="2"
                  rx="6"
                  opacity="0.95"
                />
                <text
                  x={currentPoints[currentPoints.length - 1].x + imageOffset.x + 50}
                  y={currentPoints[currentPoints.length - 1].y + imageOffset.y - 2}
                  textAnchor="middle"
                  className="text-sm fill-white font-bold"
                >
                  {formatDistance(calculateTotalDistance(currentPoints))}
                </text>
              </g>
            )}
          </>
        )}
      </svg>

      {/* Snap indicator */}
      {isActive && currentMousePos && (
        <div
          className="absolute w-2 h-2 bg-blue-500 border border-white rounded-full pointer-events-none"
          style={{
            left: currentMousePos.x + imageOffset.x - 4,
            top: currentMousePos.y + imageOffset.y - 4,
            opacity: 0.8
          }}
        />
      )}
    </div>
  )
}

// Hook for measurement settings
export function useMeasurementSettings() {
  const [settings, setSettings] = useState<MeasurementSettings>({
    unit: 'feet',
    snapToGrid: true,
    snapToCenter: false,
    feetPerSquare: 5,
    metersPerSquare: 1.5,
    showGrid: true,
    showCoordinates: false,
    showRulers: false
  })

  const updateSettings = useCallback((updates: Partial<MeasurementSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }, [])

  return { settings, updateSettings }
}