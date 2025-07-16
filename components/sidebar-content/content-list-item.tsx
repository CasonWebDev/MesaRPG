import type React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ContentListItemProps {
  title: string
  description: string
  imageUrl?: string
  isActive?: boolean
  showImage?: boolean
  children: React.ReactNode
}

export function ContentListItem({ title, description, imageUrl, isActive = false, showImage = true, children }: ContentListItemProps) {
  return (
    <div
      className={cn(
        "p-2 rounded-md bg-muted/30 border border-transparent hover:bg-muted/50 transition-colors",
        isActive && "border-primary bg-primary/10",
      )}
    >
      <div className="flex items-start gap-3">
        {showImage && (
          <Avatar className="rounded-sm h-12 w-12">
            <AvatarImage src={imageUrl || `/placeholder.svg?width=48&height=48&query=${title}`} alt={title} />
            <AvatarFallback>{title.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-grow">
          <h4 className="font-semibold text-sm text-foreground">{title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 mt-2">{children}</div>
    </div>
  )
}
