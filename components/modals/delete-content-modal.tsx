import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface DeleteContentModalProps {
  item: { id: string; name: string }
  itemType: string
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => Promise<void>
}

export function DeleteContentModal({ item, itemType, isOpen, onClose, onConfirm }: DeleteContentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const handleConfirm = async () => {
    if (!onConfirm) return
    
    setIsLoading(true)
    
    try {
      await onConfirm()
    } catch (error) {
      console.error('Error deleting content:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="bg-parchment text-ink-text">
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            {`Esta ação não pode ser desfeita. Isso excluirá permanentemente o ${itemType.toLowerCase()} "${item.name}".`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="secondary" disabled={isLoading}>
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Excluindo..." : "Sim, excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
