"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type AdvantageType = "normal" | "advantage" | "disadvantage"

interface AdvantageSelectorProps {
  value: AdvantageType
  onChange: (value: AdvantageType) => void
  className?: string
}

export const AdvantageSelector = ({ value, onChange, className }: AdvantageSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="normal">Normal</SelectItem>
        <SelectItem value="advantage">Vantagem</SelectItem>
        <SelectItem value="disadvantage">Desvantagem</SelectItem>
      </SelectContent>
    </Select>
  )
}