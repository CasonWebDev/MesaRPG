"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { BorderedBox } from "./bordered-box"
import type { ConditionName } from "@/lib/dnd-types"
import { CONDITIONS_LIST } from "@/lib/dnd-utils"

export const ConditionTracker = ({
  activeConditions,
  exhaustionLevel,
  onConditionToggle,
  onExhaustionChange,
}: {
  activeConditions: ConditionName[]
  exhaustionLevel: number
  onConditionToggle: (condition: ConditionName, isChecked: boolean) => void
  onExhaustionChange: (level: number) => void
}) => {
  return (
    <BorderedBox className="p-2">
      <h3 className="text-center font-bold text-sm mb-2">Condições</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {CONDITIONS_LIST.map((condition) => (
          <div key={condition} className="flex items-center gap-2">
            <Checkbox
              id={`cond-${condition}`}
              checked={activeConditions.includes(condition)}
              onCheckedChange={(checked) => onConditionToggle(condition, !!checked)}
            />
            <label htmlFor={`cond-${condition}`}>{condition}</label>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t">
        <div className="flex items-center justify-center gap-2">
          <label htmlFor="exhaustion" className="font-bold text-sm">
            Exaustão
          </label>
          <Input
            id="exhaustion"
            type="number"
            value={exhaustionLevel}
            onChange={(e) => onExhaustionChange(Number.parseInt(e.target.value) || 0)}
            className="w-16 h-8 text-center"
            min={0}
            max={6}
          />
        </div>
      </div>
    </BorderedBox>
  )
}
