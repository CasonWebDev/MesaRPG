"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dice6 } from "lucide-react"

interface DamageRollerProps {
  label: string
  damageDice: string // e.g., "1d8+3"
  onRoll?: (result: { total: number; breakdown: string; isCritical: boolean }) => void
  className?: string
  isCritical?: boolean
  criticalMultiplier?: number // Default 2 for double damage
}

export const DamageRoller = ({ 
  label, 
  damageDice, 
  onRoll, 
  className, 
  isCritical = false, 
  criticalMultiplier = 2 
}: DamageRollerProps) => {
  const [customDice, setCustomDice] = useState(damageDice)
  const [lastRoll, setLastRoll] = useState<{ total: number; breakdown: string; isCritical: boolean } | null>(null)

  const parseDiceString = (diceStr: string) => {
    // Parse strings like "1d8+3", "2d6", "1d10-1"
    const match = diceStr.match(/(\d+)d(\d+)([+-]\d+)?/)
    if (!match) return { count: 1, sides: 6, modifier: 0 }
    
    const count = parseInt(match[1])
    const sides = parseInt(match[2])
    const modifier = match[3] ? parseInt(match[3]) : 0
    
    return { count, sides, modifier }
  }

  const rollDice = (diceCount: number, sides: number): number[] => {
    const rolls = []
    for (let i = 0; i < diceCount; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1)
    }
    return rolls
  }

  const performRoll = () => {
    const { count, sides, modifier } = parseDiceString(customDice)
    
    let totalDamage = 0
    let breakdown = ""
    
    if (isCritical) {
      // For critical hits, double the dice (not the modifier)
      const normalRolls = rollDice(count, sides)
      const criticalRolls = rollDice(count, sides)
      
      const normalTotal = normalRolls.reduce((sum, roll) => sum + roll, 0)
      const criticalTotal = criticalRolls.reduce((sum, roll) => sum + roll, 0)
      
      totalDamage = normalTotal + criticalTotal + modifier
      breakdown = `[${normalRolls.join("+")}] + [${criticalRolls.join("+")}] crítico`
      if (modifier !== 0) {
        breakdown += ` ${modifier >= 0 ? '+' : ''}${modifier}`
      }
    } else {
      // Normal damage roll
      const rolls = rollDice(count, sides)
      const diceTotal = rolls.reduce((sum, roll) => sum + roll, 0)
      totalDamage = diceTotal + modifier
      breakdown = `[${rolls.join("+")}]`
      if (modifier !== 0) {
        breakdown += ` ${modifier >= 0 ? '+' : ''}${modifier}`
      }
    }
    
    const result = { total: totalDamage, breakdown, isCritical }
    setLastRoll(result)
    onRoll?.(result)
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center gap-2">
        <Input
          value={customDice}
          onChange={(e) => setCustomDice(e.target.value)}
          placeholder="1d8+3"
          className="flex-1 h-6 text-xs"
        />
        <Button onClick={performRoll} size="sm" className="flex items-center gap-1 h-6 text-xs">
          <Dice6 className="h-3 w-3" />
          {label}
        </Button>
      </div>
      {isCritical && (
        <span className="text-xs text-red-600 font-semibold">CRÍTICO!</span>
      )}
      
      {lastRoll && (
        <div className="text-xs text-gray-600">
          <div className={`font-semibold ${lastRoll.isCritical ? 'text-red-600' : ''}`}>
            Dano: {lastRoll.total}
            {lastRoll.isCritical && " ⚡"}
          </div>
          <div className="text-xs">
            {lastRoll.breakdown}
          </div>
        </div>
      )}
    </div>
  )
}