import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface TextareaFieldRendererProps {
  field: any
  value: string
  onChange: (value: string) => void
}

export function TextareaFieldRenderer({ field, value, onChange }: TextareaFieldRendererProps) {
  return (
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Textarea
        id={field.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Digite ${String(field.name).toLowerCase()}`}
        required={field.required}
        rows={4}
      />
    </div>
  )
}