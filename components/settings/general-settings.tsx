"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface CampaignData {
  id: string
  name: string
  description: string | null
  system: string
  playerLimit: number | null
}

interface GeneralSettingsProps {
  campaign: CampaignData
}


export function GeneralSettings({ campaign }: GeneralSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: campaign.name,
    description: campaign.description || "",
    system: campaign.system,
    playerLimit: campaign.playerLimit || 8,
  })

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Configurações atualizadas com sucesso!")
      } else {
        toast.error(data.error || "Erro ao atualizar configurações")
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error)
      toast.error("Erro ao atualizar configurações")
    } finally {
      setIsLoading(false)
    }
  }

  const hasChanges = 
    formData.name !== campaign.name ||
    formData.description !== (campaign.description || "") ||
    formData.system !== campaign.system ||
    formData.playerLimit !== (campaign.playerLimit || 8)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="campaign-name">Nome da Campanha *</Label>
          <Input
            id="campaign-name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Nome da sua campanha"
            className="bg-white dark:bg-gray-900"
            required
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="campaign-system">Sistema de RPG *</Label>
          <Input
            id="campaign-system"
            value={formData.system}
            onChange={(e) => handleInputChange("system", e.target.value)}
            placeholder="Ex: D&D 5e, Pathfinder, Tormenta20..."
            className="bg-white dark:bg-gray-900"
            required
            maxLength={50}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="campaign-description">Descrição</Label>
        <Textarea
          id="campaign-description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Descreva sua campanha, enredo, ambientação..."
          className="bg-white dark:bg-gray-900 min-h-[100px]"
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground">
          {formData.description.length}/1000 caracteres
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="player-limit">Limite de Jogadores</Label>
        <div className="w-32">
          <Input
            id="player-limit"
            type="number"
            min="1"
            max="20"
            value={formData.playerLimit}
            onChange={(e) => handleInputChange("playerLimit", parseInt(e.target.value) || 1)}
            className="bg-white dark:bg-gray-900"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Número máximo de jogadores permitidos na campanha (1-20)
        </p>
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!hasChanges || isLoading}
          className="min-w-[140px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </Button>
      </div>
    </form>
  )
}
