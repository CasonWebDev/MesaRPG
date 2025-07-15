"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  UserPlus, 
  Mail, 
  Copy, 
  Trash2, 
  Calendar,
  Users,
  Link as LinkIcon
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Member {
  id: string
  role: string
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface PlayerManagementProps {
  campaignId: string
  members: Member[]
}

export function PlayerManagement({ campaignId, members }: PlayerManagementProps) {
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteUrl, setInviteUrl] = useState("")
  const [currentMembers, setCurrentMembers] = useState(members)

  const handleCreateInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Por favor, insira um email válido')
      return
    }

    setIsCreatingInvite(true)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/create-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar convite')
      }

      const data = await response.json()
      setInviteUrl(data.inviteUrl)
      setInviteEmail("")
      toast.success('Convite criado com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar convite')
    } finally {
      setIsCreatingInvite(false)
    }
  }

  const handleCopyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success('Link copiado para a área de transferência!')
    } catch (error) {
      toast.error('Erro ao copiar link')
    }
  }

  const handleRemovePlayer = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja remover ${userName} da campanha?`)) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/remove-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Erro ao remover jogador')
      }

      setCurrentMembers(prev => prev.filter(member => member.user.id !== userId))
      toast.success(`${userName} foi removido da campanha`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao remover jogador')
    }
  }

  return (
    <div className="space-y-6">
      {/* Seção de convites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Convidar Jogadores
          </CardTitle>
          <CardDescription>
            Crie um convite para adicionar novos jogadores à campanha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="email">Email do Jogador</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
                disabled={isCreatingInvite}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleCreateInvite} 
                disabled={isCreatingInvite || !inviteEmail.trim()}
              >
                {isCreatingInvite ? (
                  <>
                    <Mail className="h-4 w-4 mr-2 animate-pulse" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Criar Convite
                  </>
                )}
              </Button>
            </div>
          </div>

          {inviteUrl && (
            <div className="p-4 bg-muted rounded-lg">
              <Label>Link de Convite Criado</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={inviteUrl}
                  readOnly
                  className="bg-background"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyInvite}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Este link expira em 24 horas. Compartilhe com o jogador para que ele possa aceitar o convite.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de membros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros da Campanha
          </CardTitle>
          <CardDescription>
            {currentMembers.length} membro{currentMembers.length !== 1 ? 's' : ''} na campanha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {member.user.name?.charAt(0) || member.user.email.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">
                      {member.user.name || member.user.email}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Entrou em {format(new Date(member.joinedAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={member.role === 'GM' ? 'default' : 'secondary'}>
                    {member.role === 'GM' ? 'Mestre' : 'Jogador'}
                  </Badge>
                  
                  {member.role !== 'GM' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemovePlayer(member.user.id, member.user.name || member.user.email)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {currentMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum jogador na campanha ainda</p>
                <p className="text-sm">Crie um convite para adicionar jogadores</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}