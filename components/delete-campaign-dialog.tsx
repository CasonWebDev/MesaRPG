"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertTriangle } from "lucide-react"
import type { Campaign } from "./campaign-card"

interface DeleteCampaignDialogProps {
  campaign: Campaign
  open: boolean
  onOpenChange: (open: boolean) => void
  onCampaignDeleted?: () => void
}

export function DeleteCampaignDialog({ 
  campaign, 
  open, 
  onOpenChange, 
  onCampaignDeleted 
}: DeleteCampaignDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/delete`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Campanha deletada com sucesso!",
          description: `A campanha "${campaign.name}" foi removida permanentemente.`,
        })
        onOpenChange(false)
        if (onCampaignDeleted) {
          onCampaignDeleted()
        }
      } else {
        toast({
          title: "Erro ao deletar campanha",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Deletar Campanha
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Isso irá deletar permanentemente a campanha e todos os dados relacionados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> Ao deletar esta campanha, todos os dados serão perdidos permanentemente, incluindo:
            </AlertDescription>
          </Alert>
          
          <ul className="mt-3 text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Todas as mensagens de chat</li>
            <li>• Personagens criados</li>
            <li>• Mapas e tokens</li>
            <li>• Handouts e arquivos</li>
            <li>• Configurações da campanha</li>
            <li>• Histórico de jogo</li>
          </ul>
          
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm">
              <strong>Campanha:</strong> {campaign.name}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Sistema:</strong> {campaign.system}
            </p>
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
            type="button" 
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Deletando..." : "Deletar Campanha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}