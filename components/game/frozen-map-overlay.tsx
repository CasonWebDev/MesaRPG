"use client"

import { useState } from "react"
import { Lock, Eye, EyeOff } from "lucide-react"
import { useMapFreeze } from "@/hooks/use-map-freeze"

interface FrozenMapOverlayProps {
  campaignId: string
  isGM: boolean
}

export function FrozenMapOverlay({ campaignId, isGM }: FrozenMapOverlayProps) {
  const [showOverlay, setShowOverlay] = useState(true)
  const { mapFrozen, frozenByName, frozenAt } = useMapFreeze(campaignId, isGM)

  // Para GMs, não mostrar overlay (eles sempre veem tudo)
  if (isGM || !mapFrozen) {
    return null
  }

  // Para jogadores, mostrar overlay quando mapa está congelado
  if (!showOverlay) {
    // Botão pequeno para mostrar o overlay novamente
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowOverlay(true)}
          className="bg-red-600/90 text-white p-2 rounded-lg shadow-lg hover:bg-red-700/90 transition-colors"
          title="Mostrar informações do mapa congelado"
        >
          <Lock className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white/95 rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center border border-gray-200">
        <div className="mb-6">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Lock className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Mapa Congelado
          </h2>
          <p className="text-gray-600">
            O mestre está preparando o ambiente. As alterações no mapa não estão visíveis no momento.
          </p>
        </div>

        {frozenAt && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-500">
              <p>Congelado desde {new Date(frozenAt).toLocaleString()}</p>
              {frozenByName && <p>por {frozenByName}</p>}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setShowOverlay(false)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <EyeOff className="h-4 w-4" />
            Ocultar Aviso
          </button>
          <button
            onClick={() => {/* Manter visível */}}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled
          >
            <Eye className="h-4 w-4" />
            Aguardar Liberação
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          Este aviso desaparecerá automaticamente quando o mestre liberar o mapa.
        </div>
      </div>
    </div>
  )
}