"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Dice6 } from "lucide-react"
import { DamageRoller } from "./damage-roller"

interface SpellRollerProps {
  spellName: string
  spellLevel: number
  onRoll?: (result: { type: 'damage' | 'save' | 'heal'; total: number; breakdown: string }) => void
  className?: string
}

export const SpellRoller = ({ spellName, spellLevel, onRoll, className }: SpellRollerProps) => {
  const [rollType, setRollType] = useState<'damage' | 'save' | 'heal'>('damage')
  const [customDice, setCustomDice] = useState(`${spellLevel}d6`)
  const [dcValue, setDcValue] = useState('13')

  const handleRoll = () => {
    if (rollType === 'save') {
      const result = {
        type: 'save' as const,
        total: parseInt(dcValue),
        breakdown: `CD ${dcValue}`
      }
      onRoll?.(result)
    }
  }

  const handleDamageRoll = (damageResult: { total: number; breakdown: string; isCritical: boolean }) => {
    const result = {
      type: rollType,
      total: damageResult.total,
      breakdown: damageResult.breakdown
    }
    onRoll?.(result)
  }

  return (
    <div className={`border rounded p-2 space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Zap className="h-3 w-3 text-blue-600" />
        <span className="font-semibold text-xs">{spellName}</span>
      </div>
      
      <div className="space-y-2">
        <Select value={rollType} onValueChange={(value) => setRollType(value as 'damage' | 'save' | 'heal')}>
          <SelectTrigger className="w-full h-6 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="damage">Dano</SelectItem>
            <SelectItem value="heal">Cura</SelectItem>
            <SelectItem value="save">Resistência</SelectItem>
          </SelectContent>
        </Select>
        
        {rollType === 'save' ? (
          <div className="flex items-center gap-2">
            <Input
              value={dcValue}
              onChange={(e) => setDcValue(e.target.value)}
              placeholder="CD"
              className="flex-1 h-6 text-xs"
            />
            <Button onClick={handleRoll} size="sm" className="h-6 text-xs">
              CD {dcValue}
            </Button>
          </div>
        ) : (
          <DamageRoller
            label={rollType === 'damage' ? 'Dano' : 'Cura'}
            damageDice={customDice}
            onRoll={handleDamageRoll}
            className="text-xs"
          />
        )}
      </div>
    </div>
  )
}