"use client"

import { useState } from "react"
import { 
  MousePointer2,
  Ruler, 
  Pencil, 
  MapPin, 
  Wind,
  Eraser
} from "lucide-react"

type ToolType = 'select' | 'measure' | 'draw' | 'mark' | 'fog' | 'eraser'

interface TacticalToolbarProps {
  isGM: boolean
  onToolSelect?: (tool: ToolType) => void
}

export function TacticalToolbar({ isGM, onToolSelect }: TacticalToolbarProps) {
  const [activeTool, setActiveTool] = useState<ToolType>('select')

  // Só exibe o toolbar para o mestre
  if (!isGM) {
    return null
  }

  const handleToolClick = (tool: ToolType) => {
    console.log(`🔧 Tool selected: ${tool}`)
    setActiveTool(tool)
    onToolSelect?.(tool)
  }

  const tools = [
    {
      id: 'select' as ToolType,
      name: 'Selecionar',
      icon: MousePointer2,
      description: 'Ferramenta de seleção'
    },
    {
      id: 'measure' as ToolType,
      name: 'Medir',
      icon: Ruler,
      description: 'Ferramenta de medição'
    },
    {
      id: 'draw' as ToolType,
      name: 'Desenhar',
      icon: Pencil,
      description: 'Ferramenta de desenho'
    },
    {
      id: 'mark' as ToolType,
      name: 'Marcar',
      icon: MapPin,
      description: 'Ferramenta de marcação'
    },
    {
      id: 'fog' as ToolType,
      name: 'Névoa de Guerra',
      icon: Wind,
      description: 'Ferramenta de névoa de guerra'
    },
    {
      id: 'eraser' as ToolType,
      name: 'Borracha',
      icon: Eraser,
      description: 'Remover névoa seletivamente'
    }
  ]

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40">
      <div className="bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-2">
        {/* Botões das ferramentas */}
        <div className="space-y-2">
          {tools.map((tool) => {
            const IconComponent = tool.icon
            const isActive = activeTool === tool.id
            
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={`
                  w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  }
                `}
                title={tool.description}
              >
                <IconComponent 
                  size={20} 
                  className={isActive ? 'drop-shadow-sm' : ''} 
                />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}