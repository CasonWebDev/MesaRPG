import { BorderedBox } from "./bordered-box"

export const StatBox = ({
  label,
  value,
  unit,
  sign = false,
}: {
  label: string
  value: string | number
  unit?: string
  sign?: boolean
}) => {
  const displayValue = typeof value === "number" && isNaN(value) ? 0 : value
  
  return (
    <BorderedBox className="p-2 text-center w-full">
      <div className="text-2xl font-bold">
        {sign && typeof displayValue === "number" && displayValue >= 0 ? `+${displayValue}` : displayValue}
        {unit && <span className="text-base"> {unit}</span>}
      </div>
      <label className="text-xs font-bold uppercase">{label}</label>
    </BorderedBox>
  )
}