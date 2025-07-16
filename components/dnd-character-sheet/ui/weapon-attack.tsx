"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sword, Dice6, Edit, Trash2 } from "lucide-react"
import { DiceRoller } from "./dice-roller"
import { DamageRoller } from "./damage-roller"
import { AdvantageType } from "./advantage-selector"

interface WeaponAttackProps {
  attackName: string
  attackBonus: number | string // Pode ser número ou string para ataques customizados
  damage: string
  characterName: string
  isCustomAttack?: boolean
  onAttackRoll?: (result: { total: number; breakdown: string; isCritical: boolean; advantage?: AdvantageType }) => void
  onDamageRoll?: (result: { total: number; breakdown: string; isCritical: boolean }) => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export const WeaponAttack = ({
  attackName,
  attackBonus,
  damage,
  characterName,
  isCustomAttack = false,
  onAttackRoll,
  onDamageRoll,
  onEdit,
  onDelete,
  className
}: WeaponAttackProps) => {
  const [lastAttackRoll, setLastAttackRoll] = useState<{
    total: number
    breakdown: string
    isCritical: boolean
    advantage?: AdvantageType
  } | null>(null)
  const [canRollDamage, setCanRollDamage] = useState(false)
  
  // Converter attackBonus para número se for string
  const numericAttackBonus = typeof attackBonus === 'string' ? 
    parseInt(attackBonus.replace(/[^-\d]/g, '')) || 0 : 
    attackBonus

  const handleAttackRoll = (result: {
    total: number
    rolls: number[]
    modifier: number
    isCritical: boolean
    advantage: AdvantageType
  }) => {
    const attackResult = {
      total: result.total,
      breakdown: `Dados: ${result.rolls.join(', ')}${result.modifier !== 0 ? ` ${result.modifier >= 0 ? '+' : ''}${result.modifier}` : ''}`,
      isCritical: result.isCritical,
      advantage: result.advantage
    }
    
    setLastAttackRoll(attackResult)
    setCanRollDamage(true)
    onAttackRoll?.(attackResult)
  }

  const handleDamageRoll = (result: { total: number; breakdown: string; isCritical: boolean }) => {
    onDamageRoll?.(result)
    // Não resetar o estado aqui para permitir múltiplas rolagens de dano
  }

  const resetAttack = () => {
    setLastAttackRoll(null)
    setCanRollDamage(false)
  }

  return (
    <div className={`border rounded-lg p-3 space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sword className="h-4 w-4 text-primary" />
          <span className="font-semibold text-lg">{attackName}</span>
          {isCustomAttack && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
              CUSTOM
            </span>
          )}
        </div>
        
        {/* Botões de edição/exclusão para ataques customizados */}
        {isCustomAttack && (onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onDelete}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Attack Info */}
      <div className="text-sm text-muted-foreground">
        <span>Bônus de Ataque: {numericAttackBonus >= 0 ? '+' : ''}{numericAttackBonus}</span>
        <span className="ml-4">Dano: {damage}</span>
      </div>

      {/* Attack Roll Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">1. Rolagem de Ataque (d20)</span>
          {lastAttackRoll && (
            <Button
              size="sm"
              variant="outline"
              onClick={resetAttack}
              className="text-xs"
            >
              Resetar
            </Button>
          )}
        </div>
        
        <DiceRoller
          label="Atacar"
          modifier={numericAttackBonus}
          onRoll={handleAttackRoll}
          className="w-full"
        />

        {/* Attack Result Display */}
        {lastAttackRoll && (
          <div className="bg-muted rounded p-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">
                Resultado: {lastAttackRoll.total}
              </span>
              {lastAttackRoll.isCritical && (
                <span className="bg-destructive/20 text-destructive px-2 py-1 rounded text-xs font-bold">
                  CRÍTICO!
                </span>
              )}
              {lastAttackRoll.advantage && lastAttackRoll.advantage !== 'normal' && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  lastAttackRoll.advantage === 'advantage' 
                    ? 'bg-green-500/20 text-green-700' 
                    : 'bg-primary/20 text-primary'
                }`}>
                  {lastAttackRoll.advantage === 'advantage' ? 'VANTAGEM' : 'DESVANTAGEM'}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {lastAttackRoll.breakdown}
            </div>
          </div>
        )}
      </div>

      {/* Damage Roll Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">2. Rolagem de Dano</span>
          {!canRollDamage && (
            <span className="text-xs text-muted-foreground">Role o ataque primeiro</span>
          )}
        </div>
        
        {canRollDamage ? (
          <DamageRoller
            label="Dano"
            damageDice={damage}
            isCritical={lastAttackRoll?.isCritical || false}
            onRoll={handleDamageRoll}
            className="w-full"
          />
        ) : (
          <div className="opacity-50 pointer-events-none">
            <DamageRoller
              label="Dano"
              damageDice={damage}
              onRoll={() => {}}
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-xs text-muted-foreground bg-primary/10 p-2 rounded">
        <strong>Como usar:</strong> Primeiro role o d20 de ataque para ver se acerta. 
        Se o ataque for bem-sucedido, role o dano. Críticos dobram os dados de dano.
      </div>
    </div>
  )
}