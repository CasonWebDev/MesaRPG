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

export const LevelUpModal = ({
  character,
  isOpen,
  onClose,
  onLevelUp,
  conMod,
}: {
  character: Character
  isOpen: boolean
  onClose: () => void
  onLevelUp: (hpGained: number) => void
  conMod: number
}) => {
  const classInfo = CLASS_DATA[character.class as keyof typeof CLASS_DATA]
  const hitDie = classInfo?.hitDie || 6
  const [rolledHp, setRolledHp] = useState<number | string>("")

  if (!isOpen) return null

  const handleTakeAverage = () => {
    setRolledHp(hitDie / 2 + 1)
  }

  const handleApply = () => {
    const hpToAdd = (Number(rolledHp) || 0) + conMod
    onLevelUp(hpToAdd)
    setRolledHp("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir para o Nível {character.level + 1}!</DialogTitle>
          <DialogDescription>
            Role seu dado de vida (d{hitDie}) ou pegue a média e adicione seu modificador de Constituição (
            {conMod >= 0 ? `+${conMod}` : conMod}) para aumentar seus pontos de vida.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-4 py-4">
          <Input
            type="number"
            value={rolledHp}
            onChange={(e) => setRolledHp(e.target.value)}
            placeholder={`Role 1d${hitDie}`}
            className="w-32 text-center text-lg"
            min={1}
            max={hitDie}
          />
          <Button onClick={handleTakeAverage}>Pegar Média ({hitDie / 2 + 1})</Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={!rolledHp}>
            Aplicar PV (+{Number(rolledHp) + conMod})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}