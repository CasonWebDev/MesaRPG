import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface AttributeDefinition {
  id: string
  name: string
  defaultValue: number
}

interface AttributesFieldRendererProps {
  field: {
    groupName: string
    required?: boolean
    attributes?: AttributeDefinition[]
  }
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
            {field.attributes?.map((attr: AttributeDefinition) => (
              <div key={attr.id} className="space-y-2">
                <Label htmlFor={`${field.groupName}-${attr.name}`}>
                  {attr.name}
                </Label>
                <Input
                  id={`${field.groupName}-${attr.name}`}
                  type="number"
                  value={value[attr.name] || attr.defaultValue || 0}
                  onChange={(e) => handleAttributeChange(attr.name, Number(e.target.value))}
                  placeholder={attr.defaultValue?.toString() || "0"}
                  min={0}
                  max={20}
                  className="text-center bg-stone-50/50"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}