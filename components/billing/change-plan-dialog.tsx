"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"

interface ChangePlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserPlan: string
}

const availablePlans = [
  {
    key: "MONTHLY",
    name: "Plano Mensal",
    price: "R$ 5,90",
    description: "Acesso completo por um mês.",
  },
  {
    key: "ANNUAL",
    name: "Plano Anual",
    price: "R$ 59,00",
    description: "Economize com um ano de acesso.",
  },
  {
    key: "LIFETIME",
    name: "Plano Vitalício",
    price: "R$ 119,00",
    description: "Pague uma vez, jogue para sempre.",
  },
]

export function ChangePlanDialog({ open, onOpenChange, currentUserPlan }: ChangePlanDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const plansToShow = availablePlans.filter(plan => plan.key !== currentUserPlan)

  const handleSelectPlan = (planKey: string) => {
    console.log(`Contratando o plano: ${planKey}`)
    setSelectedPlan(planKey)
    setIsLoading(true)
    // Simula uma chamada de API
    setTimeout(() => {
      setIsLoading(false)
      setSelectedPlan(null)
      onOpenChange(false)
    }, 2000)
  }

  const handleClose = () => {
    if (isLoading) return
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mudar de Plano</DialogTitle>
          <DialogDescription>
            Escolha um novo plano que se adapte melhor às suas necessidades.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {plansToShow.map(plan => (
              <Card key={plan.key} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-3xl font-bold text-primary">{plan.price}</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleSelectPlan(plan.key)}
                    disabled={isLoading}
                  >
                    {isLoading && selectedPlan === plan.key ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
                    ) : (
                      "Contratar"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
