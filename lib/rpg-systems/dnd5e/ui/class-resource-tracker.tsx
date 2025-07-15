"use client"

import { Input } from "@/components/ui/input"
import { BorderedBox } from "./bordered-box"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { Resource } from "../types"

export const ClassResourceTracker = ({
  resource,
  onUpdate,
  onDelete,
}: {
  resource: Resource
  onUpdate: (resource: Resource) => void
  onDelete: (resourceId: string) => void
}) => {
  const isCustom = resource.id.startsWith("custom_")

  return (
    <BorderedBox className="p-2 space-y-1">
      <div className="flex justify-between items-center">
        <Input
          value={resource.name}
          onChange={(e) => onUpdate({ ...resource, name: e.target.value })}
          className="text-xs font-bold uppercase border-0 h-6 p-1 bg-transparent focus:bg-gray-100"
          placeholder="Nome do Recurso"
          readOnly={!isCustom}
        />
        {isCustom && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(resource.id)}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        )}
      </div>
      <div className="flex items-center justify-center gap-2">
        <Input
          type="number"
          className="w-16 text-center h-8"
          placeholder="Atuais"
          value={resource.current ?? ""}
          onChange={(e) => onUpdate({ ...resource, current: Number.parseInt(e.target.value) || 0 })}
          max={resource.max}
          min={0}
        />
        <span className="text-gray-500">/</span>
        <Input
          type="number"
          className="w-16 text-center h-8 font-bold"
          value={resource.max ?? ""}
          onChange={(e) => onUpdate({ ...resource, max: Number.parseInt(e.target.value) || 0 })}
          readOnly={!isCustom}
        />
      </div>
    </BorderedBox>
  )
}