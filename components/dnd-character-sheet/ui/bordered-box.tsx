import { cn } from "@/lib/utils"
import type React from "react"

export const BorderedBox = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("rounded-lg border-2 border-foreground bg-game-sheet", className)}>{children}</div>
)