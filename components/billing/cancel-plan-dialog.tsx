"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface CancelPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planExpiresAt: Date | null
}

export function CancelPlanDialog({ open, onOpenChange, planExpiresAt }: CancelPlanDialogProps) {
  const [isCancelling, setIsCancelling] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleConfirmCancel = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const result = await response.json()

      if (response.ok) {
        const expiresAt = new Date(result.cancelAt).toISOString()
        router.push(`/payment/cancel-success?expiresAt=${expiresAt}`)
      } else {
        throw new Error(result.error || "Erro ao agendar cancelamento.")
      }
    } catch (error) {
      console.error("Erro ao cancelar plano:", error)
      toast({
        title: "Erro ao cancelar plano",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
      onOpenChange(false)
    }
  }

  const formattedDate = planExpiresAt 
    ? new Date(planExpiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : 'data desconhecida';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza de que deseja cancelar sua assinatura? Seu plano continuará
            ativo e com todos os benefícios até o final do período de faturamento em{" "}
            <strong>{formattedDate}</strong>. Após essa data, ele não será renovado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>Voltar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirmCancel}
            disabled={isCancelling}
          >
            {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCancelling ? "Confirmando..." : "Confirmar Cancelamento"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
