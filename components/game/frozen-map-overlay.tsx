"use client"

import { Lock } from "lucide-react"
import { useMapFreeze } from "@/hooks/use-map-freeze"

interface FrozenMapOverlayProps {
  campaignId: string
  isGM: boolean
}

export function FrozenMapOverlay({ campaignId, isGM }: FrozenMapOverlayProps) {
  // SEMPRE chamar o hook, independente das condições
  const { mapFrozen, frozenByName, frozenAt } = useMapFreeze(campaignId, isGM)

  // Para GMs, não mostrar overlay (eles sempre veem tudo)
  // Para Players, só mostrar quando o mapa estiver congelado
  if (isGM || !mapFrozen) {
    return null
  }

  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card/95 rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center border border-border">
        <div className="mb-6">
          <div className="bg-destructive/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Lock className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-card-foreground mb-2">
            Mapa Congelado
          </h2>
          <p className="text-muted-foreground">
            O mestre está preparando o ambiente. As alterações no mapa não estão visíveis no momento.
          </p>
        </div>

        {frozenAt && (
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="text-sm text-muted-foreground">
              <p>Congelado desde {new Date(frozenAt).toLocaleString()}</p>
              {frozenByName && <p>por {frozenByName}</p>}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            Aguardando liberação do mestre...
          </p>
          <p className="mt-2 text-xs">
            Este aviso desaparecerá automaticamente quando o mestre liberar o mapa.
          </p>
        </div>
      </div>
    </div>
  )
}