import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TextFieldRendererProps {
  field: any
  value: string
  onChange: (value: string) => void
}

export function TextFieldRenderer({ field, value, onChange }: TextFieldRendererProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Digite ${String(field.name).toLowerCase()}`}
        required={field.required}
      />
    </div>
  )
}