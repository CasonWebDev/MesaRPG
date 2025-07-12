import { useState } from "react"
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from "@dnd-kit/core"
import { 
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { 
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { TemplateField } from "@/types/sheet-template"
import { FieldEditor } from "./field-editor"

interface SortableFieldProps {
  field: TemplateField
  onUpdate: (field: TemplateField) => void
  onDelete: (fieldId: string) => void
}

function SortableField({ field, onUpdate, onDelete }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="flex items-start gap-2">
        <button
          className="mt-3 p-1 cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-stone-400" />
        </button>
        <div className="flex-1">
          <FieldEditor field={field} onUpdate={onUpdate} onDelete={onDelete} />
        </div>
      </div>
    </div>
  )
}

interface FieldListProps {
  fields: TemplateField[]
  onUpdateField: (field: TemplateField) => void
  onDeleteField: (fieldId: string) => void
  onReorderFields: (fields: TemplateField[]) => void
}

export function FieldList({ fields, onUpdateField, onDeleteField, onReorderFields }: FieldListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex(field => field.id === active.id)
      const newIndex = fields.findIndex(field => field.id === over.id)
      
      const newFields = arrayMove(fields, oldIndex, newIndex)
      onReorderFields(newFields)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={fields} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {fields.map(field => (
            <SortableField
              key={field.id}
              field={field}
              onUpdate={onUpdateField}
              onDelete={onDeleteField}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}