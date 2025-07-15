"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Character } from "@/lib/dnd-types"
import { CLASS_DATA } from "@/lib/dnd-utils"

export const ShortRestModal = ({
  character,
  isOpen,
  onClose,
  onConfirm,
  conMod,
}: {
  character: Character
  isOpen: boolean
  onClose: () => void
  onConfirm: (diceToSpend: number) => void
  conMod: number
}) => {
  const availableDice = character.level - character.usedHitDice
  const [diceToSpend, setDiceToSpend] = useState(1)

  if (!isOpen) return null

  const handleConfirm = () => {
    onConfirm(diceToSpend)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Descanso Curto</DialogTitle>
          <DialogDescription>
            Gaste seus Dados de Vida para recuperar pontos de vida. Você tem {availableDice} / {character.level} dados
            de vida disponíveis.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-4 py-4">
          <label htmlFor="dice-to-spend" className="font-bold">
            Dados a Gastar:
          </label>
          <Input
            id="dice-to-spend"
            type="number"
            value={diceToSpend}
            onChange={(e) => setDiceToSpend(Number(e.target.value))}
            className="w-24 text-center text-lg"
            min={1}
            max={availableDice}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={diceToSpend <= 0 || diceToSpend > availableDice}>
            Gastar {diceToSpend}d{CLASS_DATA[character.class as keyof typeof CLASS_DATA]?.hitDie || 6}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
