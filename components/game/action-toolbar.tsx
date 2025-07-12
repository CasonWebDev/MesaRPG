"use client"

import type { LucideIcon } from "lucide-react"
import { GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface Tool {
  id: string
  label: string
  icon: LucideIcon
  cursor: string
}

interface ActionToolbarProps {
  tools: Tool[]
  activeTool: Tool
  onToolSelect: (tool: Tool) => void
  position?: "top-left" | "top-right"
  gridSize: number
  onGridSizeChange: (size: number) => void
}

export function ActionToolbar({
  tools,
  activeTool,
  onToolSelect,
  position = "top-right",
  gridSize,
  onGridSizeChange,
}: ActionToolbarProps) {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  }

  const renderTool = (tool: Tool) => {
    if (tool.id === "grid-settings") {
      return (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <tool.icon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent className="w-48 bg-secondary text-secondary-foreground" align="end">
            <DropdownMenuLabel>Configurações do Grid</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-secondary/80">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="grid-size-input">Tamanho (px)</Label>
                <Input
                  id="grid-size-input"
                  type="number"
                  value={gridSize}
                  onChange={(e) => onGridSizeChange(Number(e.target.value))}
                  className="bg-background/50"
                  min={10}
                  max={200}
                />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool.id === tool.id ? "default" : "ghost"}
            size="icon"
            onClick={() => onToolSelect(tool)}
            className={cn(
              "cursor-pointer",
              activeTool.id === tool.id && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
          >
            <tool.icon className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{tool.label}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div
      className={cn(
        "absolute z-20 flex items-center bg-secondary/80 backdrop-blur-sm rounded-lg border border-border shadow-lg cursor-grab",
        positionClasses[position],
      )}
    >
      <div className="p-2">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <Separator orientation="vertical" className="h-8" />
      <div className="flex p-1">
        <TooltipProvider delayDuration={0}>{tools.map((tool) => <div key={tool.id}>{renderTool(tool)}</div>)}</TooltipProvider>
      </div>
    </div>
  )
}
