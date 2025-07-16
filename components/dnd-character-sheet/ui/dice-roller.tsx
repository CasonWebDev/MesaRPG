"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dice6 } from "lucide-react"
import { AdvantageSelector, AdvantageType } from "./advantage-selector"

interface DiceRollerProps {
  label: string
  modifier: number
  onRoll?: (result: { total: number; rolls: number[]; modifier: number; advantage: AdvantageType; isCritical: boolean }) => void
  className?: string
  criticalRange?: number // Critical hit on roll >= this number (default 20)
}

export const DiceRoller = ({ label, modifier, onRoll, className, criticalRange = 20 }: DiceRollerProps) => {
  const [advantage, setAdvantage] = useState<AdvantageType>("normal")
  const [lastRoll, setLastRoll] = useState<{ total: number; rolls: number[]; modifier: number; advantage: AdvantageType; isCritical: boolean } | null>(null)

  const rollDice = () => {
    let rolls: number[] = []
    
    if (advantage === "normal") {
      rolls = [Math.floor(Math.random() * 20) + 1]
    } else {
      // Roll two d20s for advantage/disadvantage
      const roll1 = Math.floor(Math.random() * 20) + 1
      const roll2 = Math.floor(Math.random() * 20) + 1
      rolls = [roll1, roll2]
    }
    
    // Calculate the final roll based on advantage type
    let finalRoll: number
    if (advantage === "advantage") {
      finalRoll = Math.max(...rolls)
    } else if (advantage === "disadvantage") {
      finalRoll = Math.min(...rolls)
    } else {
      finalRoll = rolls[0]
    }
    
    // Check for critical hit
    const isCritical = finalRoll >= criticalRange
    
    const total = finalRoll + modifier
    const result = { total, rolls, modifier, advantage, isCritical }
    
    setLastRoll(result)
    onRoll?.(result)
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Button onClick={rollDice} size="sm" className="flex items-center gap-1">
          <Dice6 className="h-4 w-4" />
          {label}
        </Button>
        <AdvantageSelector
          value={advantage}
          onChange={setAdvantage}
          className="w-32"
        />
      </div>
      
      {lastRoll && (
        <div className="text-sm text-muted-foreground">
          <div className={`font-semibold ${lastRoll.isCritical ? 'text-destructive' : ''}`}>
            Total: {lastRoll.total}
            {lastRoll.isCritical && " ⚡ CRÍTICO!"}
          </div>
          <div className="text-xs">
            Dados: {lastRoll.rolls.join(", ")} 
            {lastRoll.advantage !== "normal" && ` (${lastRoll.advantage === "advantage" ? "vantagem" : "desvantagem"})`}
            {lastRoll.modifier !== 0 && ` + ${lastRoll.modifier}`}
          </div>
        </div>
      )}
    </div>
  )
}