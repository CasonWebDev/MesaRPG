"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, Loader2 } from "lucide-react"
import { ContentListItem } from "./content-list-item"
import { HandoutStats } from "@/components/ui/handout-stats"
import { useHandouts, type Handout } from "@/hooks/use-handouts"
import { ViewHandoutModal } from "@/components/modals/view-handout-modal"

interface PlayerHandoutListProps {
  campaignId: string
  sharedIds: string[]
}

export function PlayerHandoutList({ campaignId, sharedIds }: PlayerHandoutListProps) {
  const { handouts, isLoading, error } = useHandouts(campaignId)
  const [viewingHandout, setViewingHandout] = useState<Handout | null>(null)
  
  const visibleHandouts = handouts.filter((handout) => {
    // Verificar se o handout está compartilhado
    return handout.sharedWith.length > 0 || sharedIds.includes(handout.id)
  })

  if (error) {
    return (
      <div className="space-y-2 p-1">
        <div className="text-sm text-destructive">
          Erro ao carregar utilitários: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-1">
      <HandoutStats handouts={visibleHandouts} isGM={false} />
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : visibleHandouts.length > 0 ? (
        visibleHandouts.map((handout) => (
          <ContentListItem 
            key={handout.id} 
            title={handout.name} 
            description={handout.content.substring(0, 100) + (handout.content.length > 100 ? '...' : '')}
            showImage={false}
          >
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => setViewingHandout(handout)}
              title="Visualizar utilitário"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </ContentListItem>
        ))
      ) : (
        <p className="text-sm text-muted-foreground text-center p-4">Nenhum utilitário foi compartilhado ainda.</p>
      )}
      
      <ViewHandoutModal
        handout={viewingHandout}
        isOpen={!!viewingHandout}
        onClose={() => setViewingHandout(null)}
      />
    </div>
  )
}
