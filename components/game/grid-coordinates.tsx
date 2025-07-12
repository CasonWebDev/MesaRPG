"use client"

import { useState, useCallback } from "react"

interface GridCoordinatesProps {
  gridSize: number
  containerWidth: number
  containerHeight: number
  showCoordinates: boolean
  showGrid: boolean
  showRulers?: boolean
}

export function GridCoordinates({
  gridSize,
  containerWidth,
  containerHeight,
  showCoordinates,
  showGrid,
  showRulers = false
}: GridCoordinatesProps) {
  // Convert position to grid coordinates (A1, B2, etc.)
  const getGridCoordinate = useCallback((x: number, y: number): string => {
    const col = Math.floor(x / gridSize)
    const row = Math.floor(y / gridSize)
    
    // Convert column number to letter (A, B, C, ... Z, AA, AB, etc.)
    const getColumnLetter = (colIndex: number): string => {
      let result = ''
      while (colIndex >= 0) {
        result = String.fromCharCode(65 + (colIndex % 26)) + result
        colIndex = Math.floor(colIndex / 26) - 1
      }
      return result
    }
    
    return `${getColumnLetter(col)}${row + 1}`
  }, [gridSize])

  // Calculate number of columns and rows
  const cols = Math.ceil(containerWidth / gridSize)
  const rows = Math.ceil(containerHeight / gridSize)

  if (!showCoordinates && !showGrid) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Grid Lines */}
      {showGrid && (
        <svg className="absolute inset-0 w-full h-full">
          {/* Vertical lines */}
          {Array.from({ length: cols + 1 }, (_, i) => (
            <line
              key={`v-${i}`}
              x1={i * gridSize}
              y1={0}
              x2={i * gridSize}
              y2={containerHeight}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          ))}
          
          {/* Horizontal lines */}
          {Array.from({ length: rows + 1 }, (_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={i * gridSize}
              x2={containerWidth}
              y2={i * gridSize}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          ))}
        </svg>
      )}

      {/* Grid Coordinates */}
      {showCoordinates && (
        <>
          {/* Column Headers (A, B, C, etc.) */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-black/50 backdrop-blur-sm border-b border-white/20 flex">
            {Array.from({ length: cols }, (_, i) => {
              const letter = String.fromCharCode(65 + (i % 26))
              return (
                <div
                  key={`col-${i}`}
                  className="flex items-center justify-center text-white text-xs font-medium border-r border-white/20"
                  style={{
                    width: gridSize,
                    minWidth: gridSize
                  }}
                >
                  {letter}
                </div>
              )
            })}
          </div>

          {/* Row Headers (1, 2, 3, etc.) */}
          <div className="absolute top-6 left-0 bottom-0 w-8 bg-black/50 backdrop-blur-sm border-r border-white/20 flex flex-col">
            {Array.from({ length: rows }, (_, i) => (
              <div
                key={`row-${i}`}
                className="flex items-center justify-center text-white text-xs font-medium border-b border-white/20"
                style={{
                  height: gridSize,
                  minHeight: gridSize
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Corner piece */}
          <div className="absolute top-0 left-0 w-8 h-6 bg-black/60 border-r border-b border-white/20" />
        </>
      )}

      {/* Grid Size Rulers */}
      {(showCoordinates || showRulers) && (
        <>
          {/* Top ruler */}
          <div className="absolute top-6 left-8 right-0 h-4 bg-gradient-to-b from-black/30 to-transparent">
            <div className="relative w-full h-full">
              {Array.from({ length: Math.floor(containerWidth / (gridSize * 5)) + 1 }, (_, i) => (
                <div
                  key={`ruler-top-${i}`}
                  className="absolute top-0 h-full border-l border-yellow-400/60"
                  style={{ left: i * gridSize * 5 }}
                >
                  <div className="absolute top-0 left-1 text-xs text-yellow-300 font-mono">
                    {i * 5}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Left ruler */}
          <div className="absolute top-20 left-0 bottom-0 w-4 bg-gradient-to-r from-black/30 to-transparent">
            <div className="relative w-full h-full">
              {Array.from({ length: Math.floor(containerHeight / (gridSize * 5)) + 1 }, (_, i) => (
                <div
                  key={`ruler-left-${i}`}
                  className="absolute left-0 w-full border-t border-yellow-400/60"
                  style={{ top: i * gridSize * 5 }}
                >
                  <div className="absolute top-1 left-0 text-xs text-yellow-300 font-mono transform -rotate-90 origin-left">
                    {i * 5}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

