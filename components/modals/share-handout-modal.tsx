"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { type Handout } from "@/hooks/use-handouts"

interface CampaignMember {
  id: string
  email: string
  name: string
  role: 'GM' | 'PLAYER'
}

interface ShareHandoutModalProps {
  handout: Handout | null
  isOpen: boolean
  onClose: () => void
  onShare: (handoutId: string, sharedWith: string[]) => Promise<void>
  campaignId: string
}

export function ShareHandoutModal({ 
  handout, 
  isOpen, 
  onClose, 
  onShare, 
  campaignId 
}: ShareHandoutModalProps) {
  const [members, setMembers] = useState<CampaignMember[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  // Buscar membros da campanha
  useEffect(() => {
    if (isOpen && campaignId) {
      fetchCampaignMembers()
    }
  }, [isOpen, campaignId])

  // Reset selection when handout changes
  useEffect(() => {
    if (handout) {
      setSelectedEmails(handout.sharedWith || [])
    }
  }, [handout])

  const fetchCampaignMembers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}/players`)
      if (response.ok) {
        const data = await response.json()
        // Filter out GM and get only players
        const playerMembers: CampaignMember[] = data.players
          ?.filter((player: any) => player.role === 'Jogador')
          ?.map((player: any) => ({
            id: player.id,
            email: player.email,
            name: player.name || player.email.split('@')[0],
            role: 'PLAYER' as const
          })) || []
        
        // Add some mock players if none exist
        if (playerMembers.length === 0) {
          playerMembers.push(
            {
              id: 'mock1',
              email: 'jogador1@email.com',
              name: 'Jogador 1',
              role: 'PLAYER'
            },
            {
              id: 'mock2', 
              email: 'jogador2@email.com',
              name: 'Jogador 2',
              role: 'PLAYER'
            }
          )
        }
        
        setMembers(playerMembers)
      }
    } catch (error) {
      console.error('Erro ao buscar membros:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailToggle = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedEmails(prev => [...prev, email])
    } else {
      setSelectedEmails(prev => prev.filter(e => e !== email))
    }
  }

  const handleSelectAll = () => {
    if (selectedEmails.length === members.length) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(members.map(m => m.email))
    }
  }

  const handleShare = async () => {
    if (!handout) return
    
    try {
      setIsSharing(true)
      await onShare(handout.id, selectedEmails)
      onClose()
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleClose = () => {
    if (!isSharing) {
      onClose()
    }
  }

  if (!handout) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-parchment text-ink-text">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Compartilhar Utilitário
          </DialogTitle>
          <DialogDescription>
            Selecione com quais jogadores você deseja compartilhar "{handout.name}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status atual */}
          <div>
            <Label className="text-sm font-medium">Status atual:</Label>
            <div className="mt-1">
              {handout.sharedWith.length > 0 ? (
                <Badge variant="secondary" className="text-card-foreground">
                  Compartilhado com {handout.sharedWith.length} jogador(es)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-card-foreground">
                  Não compartilhado
                </Badge>
              )}
            </div>
          </div>

          {/* Lista de jogadores */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">Jogadores da campanha:</Label>
              {members.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={isLoading || isSharing}
                >
                  {selectedEmails.length === members.length ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nenhum jogador encontrado na campanha.
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-2 p-2 rounded border bg-background/30"
                  >
                    <Checkbox
                      id={`member-${member.id}`}
                      checked={selectedEmails.includes(member.email)}
                      onCheckedChange={(checked) => 
                        handleEmailToggle(member.email, checked as boolean)
                      }
                      disabled={isSharing}
                    />
                    <Label
                      htmlFor={`member-${member.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div>
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview da seleção */}
          {selectedEmails.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Será compartilhado com:</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {selectedEmails.map((email) => {
                  const member = members.find(m => m.email === email)
                  return (
                    <Badge key={email} variant="secondary" className="text-xs text-card-foreground">
                      {member?.name || email}
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isSharing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing || members.length === 0}
          >
            {isSharing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Compartilhando...
              </>
            ) : (
              'Compartilhar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}