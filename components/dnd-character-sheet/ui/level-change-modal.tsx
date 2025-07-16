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
import { Label } from "@/components/ui/label"
import type { Character } from "@/lib/dnd-types"
import { CLASS_DATA } from "@/lib/dnd-utils"

export const LevelChangeModal = ({
  character,
  isOpen,
  onClose,
  onLevelChange,
  conMod,
}: {
  character: Character
  isOpen: boolean
  onClose: () => void
  onLevelChange: (newLevel: number, hpAdjustment: number) => void
  conMod: number
}) => {
  const classInfo = CLASS_DATA[character.class as keyof typeof CLASS_DATA]
  const hitDie = classInfo?.hitDie || 6
  const [newLevel, setNewLevel] = useState<number>(character.level)
  const [hpAdjustment, setHpAdjustment] = useState<number>(0)

  if (!isOpen) return null

  const levelDifference = newLevel - character.level
  const suggestedHpGain = levelDifference > 0 ? 
    levelDifference * (Math.floor(hitDie / 2) + 1 + conMod) : 0

  const handleCalculateAverage = () => {
    if (levelDifference > 0) {
      setHpAdjustment(suggestedHpGain)
    } else {
      setHpAdjustment(0)
    }
  }

  const handleApply = () => {
    onLevelChange(newLevel, hpAdjustment)
    onClose()
  }

  const handleReset = () => {
    setNewLevel(character.level)
    setHpAdjustment(0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Nível do Personagem</DialogTitle>
          <DialogDescription>
            Defina o nível do personagem e ajuste os pontos de vida
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Nível */}
          <div className="space-y-2">
            <Label htmlFor="level">Nível</Label>
            <Input
              id="level"
              type="number"
              value={newLevel}
              onChange={(e) => setNewLevel(Number(e.target.value))}
              className="w-20 text-center"
              min={1}
              max={20}
            />
          </div>

          {/* Informações sobre mudança */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Nível atual:</span>
              <span className="font-mono">{character.level}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Novo nível:</span>
              <span className="font-mono">{newLevel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Diferença:</span>
              <span className={`font-mono ${levelDifference > 0 ? 'text-green-600' : levelDifference < 0 ? 'text-red-600' : ''}`}>
                {levelDifference > 0 ? `+${levelDifference}` : levelDifference}
              </span>
            </div>
            
            {levelDifference > 0 && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <p><strong>Sugestão de HP:</strong> +{suggestedHpGain}</p>
                <p className="text-xs text-muted-foreground">
                  {levelDifference} níveis × (d{hitDie} média + CON) = {levelDifference} × ({Math.floor(hitDie / 2) + 1} + {conMod})
                </p>
              </div>
            )}
          </div>

          {/* Ajuste de HP */}
          <div className="space-y-2">
            <Label htmlFor="hp-adjustment">Ajuste de HP</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="hp-adjustment"
                type="number"
                value={hpAdjustment}
                onChange={(e) => setHpAdjustment(Number(e.target.value))}
                placeholder="0"
                className="text-center"
              />
              {levelDifference > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCalculateAverage}
                >
                  Usar Média
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              HP final será: {character.maxHitPoints} + {hpAdjustment} = {character.maxHitPoints + hpAdjustment}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Resetar
          </Button>
          <Button onClick={handleApply}>
            Aplicar Mudanças
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}