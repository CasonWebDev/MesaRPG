"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { ThemeToggleWithText } from "@/components/ui/theme-toggle"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { BuyCreditsDialog } from "@/components/billing/buy-credits-dialog"
import { ChangePlanDialog } from "@/components/billing/change-plan-dialog"

// Mapeamento de Planos para exibição
const planNames: { [key: string]: string } = {
  FREE: "Gratuito",
  MONTHLY: "Mensal",
  ANNUAL: "Anual",
  LIFETIME: "Vitalício",
  CREDITS: "Créditos Avulsos",
};

interface EditProfileDialogProps {
  user: {
    name: string
    email: string
    plan: string
    credits: number
    planStartedAt: Date | null
    planExpiresAt: Date | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProfileDialog({ user, open, onOpenChange }: EditProfileDialogProps) {
  const { update: updateSession } = useSession()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false)
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validação de senha
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setError("As novas senhas não coincidem.")
        setIsLoading(false)
        return
      }

      if (formData.newPassword && formData.newPassword.length < 6) {
        setError("A nova senha deve ter pelo menos 6 caracteres.")
        setIsLoading(false)
        return
      }

      // Preparar dados para envio
      const updateData: any = {
        name: formData.name,
        email: formData.email,
      }

      // Incluir senha apenas se foi fornecida
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (response.ok) {
        // Atualizar sessão se necessário
        if (formData.name !== user.name) {
          await updateSession({
            ...updateData,
            name: formData.name,
          })
        }

        toast({
          title: "Perfil atualizado com sucesso!",
          description: "Suas informações foram atualizadas.",
        })

        // Resetar campos de senha
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }))

        onOpenChange(false)
      } else {
        setError(result.error || "Erro ao atualizar perfil.")
        toast({
          title: "Erro ao atualizar perfil",
          description: result.error || "Erro desconhecido. Tente novamente.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("Erro interno do servidor. Tente novamente mais tarde.")
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: user.name,
      email: user.email,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setError("")
  }

  const canChangePlan = ['FREE', 'MONTHLY', 'ANNUAL', 'CREDITS'].includes(user.plan);
  const canBuyCredits = ['FREE', 'CREDITS'].includes(user.plan);
  const canCancelPlan = ['MONTHLY', 'ANNUAL'].includes(user.plan);

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(newOpen) => {
          onOpenChange(newOpen)
          if (!newOpen) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Editar Perfil</DialogTitle>
              <DialogDescription>
                Atualize suas informações pessoais e gerencie sua assinatura.
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="flex-grow">
              <div className="grid gap-4 p-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome*
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="col-span-3"
                    required
                    autoComplete="name"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email*
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="col-span-3"
                    required
                    autoComplete="email"
                  />
                </div>
                
                <Separator />

                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-3">Plano e Assinatura</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Plano Atual:</span>
                      <span className="font-bold">{planNames[user.plan] || "Não definido"}</span>
                    </div>
                    {user.plan === 'CREDITS' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Créditos:</span>
                        <span className="font-bold">{user.credits}</span>
                      </div>
                    )}
                    {['MONTHLY', 'ANNUAL'].includes(user.plan) && (
                      <>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Início da Vigência:</span>
                          <span>{user.planStartedAt ? new Date(user.planStartedAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Fim da Vigência:</span>
                          <span>{user.planExpiresAt ? new Date(user.planExpiresAt).toLocaleDateString('pt-BR') : 'N/A'}</span>
                        </div>
                      </>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      {canChangePlan && <Button type="button" className="flex-1" onClick={() => setIsChangePlanOpen(true)}>Mudar Plano</Button>}
                      {canBuyCredits && <Button type="button" variant="secondary" className="flex-1" onClick={() => setIsBuyCreditsOpen(true)}>Comprar Créditos</Button>}
                      {canCancelPlan && <Button type="button" variant="destructive" className="flex-1">Cancelar Plano</Button>}
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-3">Aparência</h4>
                  <div className="space-y-2">
                    <Label className="text-sm">Tema da Interface</Label>
                    <ThemeToggleWithText className="w-full" />
                    <p className="text-xs text-muted-foreground">
                      Escolha entre tema claro (vermelho) ou escuro (laranja com tons de chumbo)
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-3">Alterar Senha (opcional)</h4>
                  
                  <div className="grid grid-cols-4 items-center gap-4 mb-3">
                    <Label htmlFor="currentPassword" className="text-right text-sm">
                      Senha Atual
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                      className="col-span-3"
                      autoComplete="current-password"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4 mb-3">
                    <Label htmlFor="newPassword" className="text-right text-sm">
                      Nova Senha
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange("newPassword", e.target.value)}
                      className="col-span-3"
                      autoComplete="new-password"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="confirmPassword" className="text-right text-sm">
                      Confirmar
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="col-span-3"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <DialogFooter className="flex-shrink-0 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.name.trim() || !formData.email.trim()}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <BuyCreditsDialog open={isBuyCreditsOpen} onOpenChange={setIsBuyCreditsOpen} />
      <ChangePlanDialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen} currentUserPlan={user.plan} />
    </>
  )
}
