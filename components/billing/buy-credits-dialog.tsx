"use client"

import { useState, useMemo } from "react"
import { loadStripe } from '@stripe/stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface BuyCreditsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CREDIT_PRICE = 2.90

// Promessa do Stripe para evitar recarregamentos
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export function BuyCreditsDialog({ open, onOpenChange }: BuyCreditsDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const totalAmount = useMemo(() => {
    return quantity * CREDIT_PRICE
  }, [quantity])

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    if (value > 0) {
      setQuantity(value)
    } else if (e.target.value === "") {
      setQuantity(0)
    }
  }
  
  const handleClose = () => {
    if (isLoading) return
    setQuantity(1)
    onOpenChange(false)
  }

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      const { sessionId, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      if (!sessionId) {
        throw new Error('Session ID não recebida.');
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js não carregou.');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

    } catch (error) {
      console.error("Erro no pagamento:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Comprar Créditos</DialogTitle>
          <DialogDescription>
            Selecione a quantidade de créditos que deseja adquirir. Cada crédito
            permite manter uma campanha ativa por 30 dias.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantidade
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity || ''}
              onChange={handleQuantityChange}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
          <div className="text-right font-bold text-lg pr-4">
            <p>Valor por crédito: {CREDIT_PRICE.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            <p>Total: {totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handlePayment} disabled={isLoading || quantity === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Processando..." : "Efetuar Pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
