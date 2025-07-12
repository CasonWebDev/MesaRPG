"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollText, Share2, Paperclip, Eye } from "lucide-react"
import { type Handout } from "@/hooks/use-handouts"

interface HandoutStatsProps {
  handouts: Handout[]
  isGM?: boolean
}

export function HandoutStats({ handouts, isGM = false }: HandoutStatsProps) {
  const totalHandouts = handouts.length
  const sharedHandouts = handouts.filter(h => h.sharedWith.length > 0).length
  const privateHandouts = totalHandouts - sharedHandouts
  const handoutsWithAttachments = handouts.filter(h => h.attachments && h.attachments.length > 0).length

  if (totalHandouts === 0) return null

  return (
    <Card className="mb-2">
      <CardContent className="p-3">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <ScrollText className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Total:</span>
            <Badge variant="secondary" className="text-xs text-black">
              {totalHandouts}
            </Badge>
          </div>
          
          {isGM && (
            <>
              <div className="flex items-center gap-1">
                <Share2 className="h-3 w-3 text-green-600" />
                <span className="text-muted-foreground">Compartilhados:</span>
                <Badge variant="secondary" className="text-xs text-black">
                  {sharedHandouts}
                </Badge>
              </div>
              
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-blue-600" />
                <span className="text-muted-foreground">Privados:</span>
                <Badge variant="secondary" className="text-xs text-black">
                  {privateHandouts}
                </Badge>
              </div>
            </>
          )}
          
          {handoutsWithAttachments > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="h-3 w-3 text-orange-600" />
              <span className="text-muted-foreground">Com anexos:</span>
              <Badge variant="secondary" className="text-xs text-black">
                {handoutsWithAttachments}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}