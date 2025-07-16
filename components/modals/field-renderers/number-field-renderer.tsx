import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NumberFieldRendererProps {
  field: any
  value: number
  onChange: (value: number) => void
}

export function NumberFieldRenderer({ field, value, onChange }: NumberFieldRendererProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        placeholder={`Digite ${String(field.name).toLowerCase()}`}
        required={field.required}
        min={field.min}
        max={field.max}
        className="bg-background/50"
      />
    </div>
  )
}