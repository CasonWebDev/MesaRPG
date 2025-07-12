"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AttachmentViewer } from "@/components/ui/attachment-viewer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import { type Handout } from "@/hooks/use-handouts"

interface ViewHandoutModalProps {
  handout: Handout | null
  isOpen: boolean
  onClose: () => void
}

export function ViewHandoutModal({ handout, isOpen, onClose }: ViewHandoutModalProps) {
  if (!handout) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] bg-parchment text-ink-text">
        <DialogHeader>
          <DialogTitle className="text-xl">{handout.name}</DialogTitle>
          <DialogDescription>
            Criado em {formatDate(handout.createdAt)}
          </DialogDescription>
          {handout.sharedWith.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-black">
                Compartilhado
              </Badge>
            </div>
          )}
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Conteúdo */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Conteúdo
              </h4>
              <div className="prose prose-sm max-w-none bg-stone-50/50 rounded-lg p-4 border">
                <div className="whitespace-pre-wrap text-sm">
                  {handout.content || "Nenhum conteúdo disponível."}
                </div>
              </div>
            </div>
            
            {/* Anexos */}
            {handout.attachments && handout.attachments.length > 0 && (
              <div>
                <AttachmentViewer 
                  attachments={handout.attachments} 
                  showTitle={true}
                />
              </div>
            )}
            
            {/* Informações de compartilhamento */}
            {handout.sharedWith.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Compartilhado com
                </h4>
                <div className="flex flex-wrap gap-1">
                  {handout.sharedWith.map((email, index) => (
                    <Badge key={index} variant="secondary" className="text-xs text-black">
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}