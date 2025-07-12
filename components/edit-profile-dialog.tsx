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
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface EditProfileDialogProps {
  user: {
    name: string
    email: string
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

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen)
        if (!newOpen) resetForm()
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais. Deixe os campos de senha em branco se não quiser alterá-la.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
            
            <div className="border-t pt-4">
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
          
          <DialogFooter>
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
  )
}