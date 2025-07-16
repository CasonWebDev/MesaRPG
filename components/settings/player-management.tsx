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
            Crie um convite personalizado e seguro para adicionar novos jogadores à campanha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <LinkIcon className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Como funciona:</p>
                <p className="text-blue-700">
                  Digite o email do jogador e clique em "Gerar Convite". 
                  Será criado um link único e seguro que você poderá enviar para o jogador.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email do Jogador *
              </Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Digite o email do jogador que você quer convidar"
                disabled={isCreatingInvite}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                O convite será vinculado a este email para maior segurança
              </p>
            </div>

            <Button 
              onClick={handleCreateInvite} 
              disabled={isCreatingInvite || !inviteEmail.trim()}
              className="w-full"
              size="lg"
            >
              {isCreatingInvite ? (
                <>
                  <Mail className="h-4 w-4 mr-2 animate-pulse" />
                  Gerando Convite...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Gerar Convite Personalizado
                </>
              )}
            </Button>
          </div>

          {inviteUrl && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <LinkIcon className="h-4 w-4 text-green-600" />
                <Label className="text-green-800 font-medium">
                  Convite Criado com Sucesso!
                </Label>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={inviteUrl}
                    readOnly
                    className="bg-background border-green-300"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyInvite}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-green-700">
                  <p className="font-medium">✓ Link pronto para compartilhar</p>
                  <p className="text-xs mt-1">
                    • Expira em 7 dias • Funciona apenas para o email especificado • Uso único
                  </p>
                </div>
              </div>
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