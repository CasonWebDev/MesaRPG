"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
import { Character } from "@/hooks/use-characters"

interface DeleteCharacterModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  character: Character
}

export function DeleteCharacterModal({
  isOpen,
  onClose,
  onConfirm,
  character
}: DeleteCharacterModalProps) {
  const getCharacterTypeLabel = () => {
    switch (character?.type) {
      case 'NPC':
        return 'NPC'
      case 'CREATURE':
        return 'criatura'
      case 'PC':
        return 'personagem'
      default:
        return 'character'
    }
  }

  if (!isOpen || !character) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir {getCharacterTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir {getCharacterTypeLabel()} <strong>{character.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Esta ação não pode ser desfeita
              </p>
              <p className="text-sm text-muted-foreground">
                Todos os dados d{getCharacterTypeLabel() === 'criatura' ? 'a' : 'o'} {getCharacterTypeLabel()} serão permanentemente removidos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir {getCharacterTypeLabel()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}