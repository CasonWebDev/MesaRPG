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
}) => (
  <BorderedBox className="p-2 text-center w-full">
    <div className="text-2xl font-bold">
      {sign && typeof value === "number" && value >= 0 ? `+${value}` : value}
      {unit && <span className="text-base"> {unit}</span>}
    </div>
    <label className="text-xs font-bold uppercase">{label}</label>
  </BorderedBox>
)
