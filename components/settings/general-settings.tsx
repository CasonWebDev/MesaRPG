"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Save, Wand2 } from "lucide-react"
import { getAvailableSystems } from "@/lib/rpg-systems"

interface Campaign {
  id: string
  name: string
  description: string | null
  system: string
  rpgSystem?: string
}

interface GeneralSettingsProps {
  campaign: Campaign
}

export function GeneralSettings({ campaign }: GeneralSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: campaign.name,
    description: campaign.description || "",
    system: campaign.rpgSystem || campaign.system || "dnd5e"
  })
  const availableSystems = getAvailableSystems()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          rpgSystem: formData.system
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar campanha')
      }

      toast.success('Configurações atualizadas com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  const getSystemIcon = (systemId: string) => {
    switch (systemId) {
      case 'dnd5e':
        return <Wand2 className="h-4 w-4" />
      default:
        return <Wand2 className="h-4 w-4" />
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Campanha</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome da campanha"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="system">Sistema de RPG</Label>
          <Select
            value={formData.system}
            onValueChange={(value) => setFormData({ ...formData, system: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um sistema" />
            </SelectTrigger>
            <SelectContent>
              {availableSystems.map((system) => (
                <SelectItem key={system.id} value={system.id}>
                  <div className="flex items-center space-x-2">
                    {getSystemIcon(system.id)}
                    <span>{system.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {availableSystems.find(s => s.id === formData.system)?.description}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição da campanha (opcional)"
          rows={4}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </form>
  )
}