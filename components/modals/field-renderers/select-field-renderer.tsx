import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface SelectFieldRendererProps {
  field: any
  value: string
  onChange: (value: string) => void
}

export function SelectFieldRenderer({ field, value, onChange }: SelectFieldRendererProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-background/50">
          <SelectValue placeholder={`Selecione ${String(field.name).toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {field.options?.map((option: string) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}