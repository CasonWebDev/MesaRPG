import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface AttributesFieldRendererProps {
  field: any
  value: Record<string, number>
  onChange: (value: Record<string, number>) => void
}

export function AttributesFieldRenderer({ field, value, onChange }: AttributesFieldRendererProps) {
  const handleAttributeChange = (attributeName: string, newValue: number) => {
    onChange({
      ...value,
      [attributeName]: newValue
    })
  }

  return (
    <div className="space-y-2 md:col-span-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            {field.groupName}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {field.attributes?.map((attributeName: string) => (
              <div key={attributeName} className="space-y-2">
                <Label htmlFor={`${field.groupName}-${attributeName}`}>
                  {attributeName}
                </Label>
                <Input
                  id={`${field.groupName}-${attributeName}`}
                  type="number"
                  value={value[attributeName] || 0}
                  onChange={(e) => handleAttributeChange(attributeName, Number(e.target.value))}
                  placeholder="0"
                  min={0}
                  max={20}
                  className="text-center"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}