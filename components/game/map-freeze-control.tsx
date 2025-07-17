"use client"

import { Lock, Unlock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMapFreeze } from "@/hooks/use-map-freeze"

interface MapFreezeControlProps {
  campaignId: string
  isGM: boolean
}

export function MapFreezeControl({ campaignId, isGM }: MapFreezeControlProps) {
  const { mapFrozen, frozenByName, frozenAt, loading, toggleFreeze } = useMapFreeze(campaignId, isGM)

  // Não exibir se não for GM
  if (!isGM) {
    return null
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={toggleFreeze}
        disabled={loading}
        variant={mapFrozen ? "destructive" : "outline"}
        size="sm"
        className={`w-full ${mapFrozen ? 'bg-red-600 hover:bg-red-700' : ''}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : mapFrozen ? (
          <Lock className="h-4 w-4 mr-2" />
        ) : (
          <Unlock className="h-4 w-4 mr-2" />
        )}
        {loading 
          ? 'Alterando...' 
          : mapFrozen 
            ? 'Liberar Mapa' 
            : 'Congelar Mapa'
        }
      </Button>
      
      {mapFrozen && frozenAt && (
        <div className="text-xs text-muted-foreground text-center">
          <p>Congelado desde {new Date(frozenAt).toLocaleTimeString()}</p>
          {frozenByName && <p>por {frozenByName}</p>}
        </div>
      )}
    </div>
  )
}