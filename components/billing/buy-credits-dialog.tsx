"use client"

import { useState, useMemo } from "react"
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
import { Loader2 } from "lucide-react"

interface BuyCreditsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CREDIT_PRICE = 2.90

export function BuyCreditsDialog({ open, onOpenChange }: BuyCreditsDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

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

  const handlePayment = () => {
    // Lógica de pagamento será implementada futuramente
    console.log(`Iniciando pagamento para ${quantity} créditos no valor de R$ ${totalAmount.toFixed(2)}`)
    setIsLoading(true)
    // Simula uma chamada de API
    setTimeout(() => {
      setIsLoading(false)
      handleClose()
    }, 2000)
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
