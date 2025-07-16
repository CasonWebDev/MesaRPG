"use client"

import { useState, useEffect } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Campaign } from "./campaign-card"

interface EditCampaignDialogProps {
  campaign: Campaign
  open: boolean
  onOpenChange: (open: boolean) => void
  onCampaignUpdated?: () => void
}

export function EditCampaignDialog({ 
  campaign, 
  open, 
  onOpenChange, 
  onCampaignUpdated 
}: EditCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: campaign.name,
    description: campaign.description,
    system: campaign.system,
  })
  const { toast } = useToast()

  // Reset form data when campaign changes or dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: campaign.name,
        description: campaign.description,
        system: campaign.system,
      })
    }
  }, [campaign, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Campanha atualizada com sucesso!",
          description: `A campanha "${formData.name}" foi atualizada.`,
        })
        onOpenChange(false)
        if (onCampaignUpdated) {
          onCampaignUpdated()
        }
      } else {
        toast({
          title: "Erro ao atualizar campanha",
          description: data.error || "Erro desconhecido",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: campaign.name,
      description: campaign.description,
      system: campaign.system,
    })
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
            <DialogTitle>Editar Campanha</DialogTitle>
            <DialogDescription>
              Atualize as informações da sua campanha.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nome*
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="col-span-3"
                placeholder="Ex: A Ameaça do Dragão Vermelho"
                required
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-system" className="text-right">
                Sistema*
              </Label>
              <Input
                id="edit-system"
                value={formData.system}
                onChange={(e) => handleInputChange("system", e.target.value)}
                className="col-span-3"
                placeholder="Ex: D&D 5e, Pathfinder, Call of Cthulhu"
                required
                autoComplete="off"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-description" className="text-right pt-2">
                Descrição
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="col-span-3 resize-none bg-input"
                placeholder="Descrição opcional da campanha..."
                rows={3}
              />
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
              disabled={isLoading || !formData.name.trim() || !formData.system.trim()}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}