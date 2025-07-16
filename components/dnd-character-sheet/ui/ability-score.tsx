"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"
import { BorderedBox } from "./bordered-box"

export const AbilityScore = ({
  ability,
  score,
  modifier,
  onUpdate,
}: {
  ability: string
  score: number
  modifier: number
  onUpdate: (newScore: number) => void
}) => {
  const displayScore = isNaN(score) ? 10 : score
  const displayModifier = isNaN(modifier) ? 0 : modifier
  
  return (
    <BorderedBox className="relative flex h-32 w-full flex-col items-center justify-between p-2 text-center">
      <label className="font-bold uppercase">{ability}</label>
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-foreground bg-muted text-3xl font-bold shadow-inner">
        {displayModifier >= 0 ? `+${displayModifier}` : displayModifier}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={() => onUpdate(displayScore - 1)}>
          <Minus className="h-4 w-4" />
          <span className="sr-only">Diminuir pontuação</span>
        </Button>
        <div className="w-10 text-2xl font-bold">{displayScore}</div>
        <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={() => onUpdate(displayScore + 1)}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">Aumentar pontuação</span>
        </Button>
      </div>
    </BorderedBox>
  )
}