"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { 
  Users, 
  UserPlus, 
  Mail, 
  Link, 
  Crown, 
  Calendar,
  Copy,
  Trash2,
  Search,
  User
} from "lucide-react"
import { toast } from "sonner"

interface PlayerManagementProps {
  campaign: {
    id: string
    name: string
    owner: {
      id: string
      name: string | null
      email: string
    }
    members: Array<{
      id: string
      user: {
        id: string
        name: string | null
        email: string
      }
      joinedAt: string
    }>
    invites: Array<{
      id: string
      token: string
      createdAt: string
      expiresAt: string | null
      createdBy: {
        name: string | null
      }
    }>
  }
}

export function PlayerManagement({ campaign }: PlayerManagementProps) {
  const [searchEmail, setSearchEmail] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<{
    id: string
    name: string | null
    email: string
    isAlreadyMember: boolean
  } | null>(null)
  const [isCreatingInvite, setIsCreatingInvite] = useState(false)
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [isRemovingPlayer, setIsRemovingPlayer] = useState("")
  const [copiedTokens, setCopiedTokens] = useState<Set<string>>(new Set())

  const handleSearchPlayer = async () => {
    if (!searchEmail.trim()) {
      toast.error("Digite um email para buscar")
      return
    }

    setIsSearching(true)
    setSearchResult(null)

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/search-players?email=${encodeURIComponent(searchEmail)}`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (response.ok) {
        setSearchResult(data.user)
      } else {
        toast.error(data.error || "Erro ao buscar jogador")
      }
    } catch (error) {
      toast.error("Erro ao buscar jogador")
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddPlayer = async () => {
    if (!searchResult) return

    setIsAddingPlayer(true)

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/add-player`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: searchResult.id
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Jogador adicionado com sucesso!")
        setSearchEmail("")
        setSearchResult(null)
        // Refresh the page to update the player list
        window.location.reload()
      } else {
        console.error("API Error:", data)
        toast.error(data.error || "Erro ao adicionar jogador")
      }
    } catch (error) {
      toast.error("Erro ao adicionar jogador")
    } finally {
      setIsAddingPlayer(false)
    }
  }

  const handleRemovePlayer = async (userId: string) => {
    setIsRemovingPlayer(userId)

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/remove-player`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({
          userId
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Jogador removido com sucesso!")
        // Refresh the page to update the player list
        window.location.reload()
      } else {
        toast.error(data.error || "Erro ao remover jogador")
      }
    } catch (error) {
      toast.error("Erro ao remover jogador")
    } finally {
      setIsRemovingPlayer("")
    }
  }

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true)

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/create-invite`, {
        method: "POST",
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        toast.success("Convite criado com sucesso!")
        // Copy invite URL to clipboard
        navigator.clipboard.writeText(data.invite.url)
        // Refresh the page to update the invites list
        window.location.reload()
      } else {
        toast.error(data.error || "Erro ao criar convite")
      }
    } catch (error) {
      toast.error("Erro ao criar convite")
    } finally {
      setIsCreatingInvite(false)
    }
  }

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopiedTokens(prev => new Set([...prev, token]))
      
      // Resetar o estado após 3 segundos
      setTimeout(() => {
        setCopiedTokens(prev => {
          const newSet = new Set(prev)
          newSet.delete(token)
          return newSet
        })
      }, 3000)
    } catch (error) {
      toast.error("Erro ao copiar link")
    }
  }

  const formatDate = (dateString: string) => {
    // Usar formato ISO para evitar problemas de hidratação
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <div className="space-y-6">
      {/* Lista de Jogadores Atuais */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Jogadores Atuais
        </h3>
        
        <div className="space-y-3">
          {/* Mestre */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium">{campaign.owner.name || "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground">{campaign.owner.email}</p>
                  </div>
                </div>
                <Badge variant="default" className="bg-amber-500/20 text-amber-700">
                  Mestre
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Jogadores */}
          {campaign.members.map((member) => (
            <Card key={member.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{member.user.name || "Sem nome"}</p>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Calendar className="mr-1 h-3 w-3" />
                        Entrou em {formatDate(member.joinedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200">
                      Jogador
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={isRemovingPlayer === member.user.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Jogador</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover {member.user.name || member.user.email} da campanha?
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleRemovePlayer(member.user.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Adicionar Jogador */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          Adicionar Jogador
        </h3>
        
        <Card>
          <CardHeader>
            <CardTitle>Buscar por Email</CardTitle>
            <CardDescription>
              Digite o email do jogador que deseja adicionar à campanha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="search-email">Email do Jogador</Label>
                <Input
                  id="search-email"
                  type="email"
                  placeholder="jogador@exemplo.com"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchPlayer()}
                  className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleSearchPlayer}
                  disabled={isSearching}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </div>

            {searchResult && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{searchResult.name || "Sem nome"}</p>
                      <p className="text-sm text-muted-foreground">{searchResult.email}</p>
                      {searchResult.isAlreadyMember && (
                        <Badge variant="secondary" className="mt-2">
                          Já é membro
                        </Badge>
                      )}
                    </div>
                    {!searchResult.isAlreadyMember && (
                      <Button 
                        onClick={handleAddPlayer}
                        disabled={isAddingPlayer}
                      >
                        {isAddingPlayer ? "Adicionando..." : "Adicionar"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Convites por Link */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Link className="mr-2 h-5 w-5" />
          Convites por Link
        </h3>
        
        <Card>
          <CardHeader>
            <CardTitle>Gerar Convite</CardTitle>
            <CardDescription>
              Crie um link de convite que pode ser compartilhado com jogadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCreateInvite}
              disabled={isCreatingInvite}
            >
              <Mail className="mr-2 h-4 w-4" />
              {isCreatingInvite ? "Criando..." : "Criar Convite"}
            </Button>
          </CardContent>
        </Card>

        {/* Lista de Convites Ativos */}
        {campaign.invites.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Convites Ativos</CardTitle>
              <CardDescription>
                Convites que ainda podem ser utilizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {campaign.invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">
                        Criado por {invite.createdBy.name || "Usuário"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(invite.createdAt)}
                        {invite.expiresAt && ` • Expira em ${formatDate(invite.expiresAt)}`}
                      </p>
                    </div>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => copyInviteLink(invite.token)}
                      className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copiedTokens.has(invite.token) ? "Link Copiado" : "Copiar Link"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
