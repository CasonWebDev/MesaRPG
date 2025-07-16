"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, User } from "lucide-react"
import { toast } from "sonner"

interface InviteClientProps {
  invite: {
    id: string
    token: string
    campaign: {
      id: string
      name: string
      description: string | null
      system: string
    }
    createdBy: {
      name: string | null
    }
    expiresAt: string | null
    createdAt: string
  }
}

export function InviteClient({ invite }: InviteClientProps) {
  const [isAccepting, setIsAccepting] = useState(false)
  const router = useRouter()

  const handleAcceptInvite = async () => {
    setIsAccepting(true)

    try {
      const response = await fetch(`/api/invites/${invite.token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError)
        data = {}
      }

      console.log("Response status:", response.status)
      console.log("Response data:", data)

      if (response.ok) {
        toast.success(`Você entrou na campanha "${invite.campaign.name}"!`)
        router.push(`/campaign/${invite.campaign.id}/play`)
      } else {
        // Verificar tipos específicos de erro
        if (response.status === 400) {
          if (data.error === "Você já é membro desta campanha") {
            toast.error("Você já é membro desta campanha. Redirecionando para a campanha...")
            setTimeout(() => {
              router.push(`/campaign/${invite.campaign.id}/play`)
            }, 2000)
          } else if (data.error === "Você já é o Mestre desta campanha") {
            toast.error("Você é o Mestre desta campanha. Redirecionando para a campanha...")
            setTimeout(() => {
              router.push(`/campaign/${invite.campaign.id}/play`)
            }, 2000)
          } else if (data.error === "Convite já foi utilizado") {
            toast.error("Este convite já foi utilizado.")
          } else if (data.error === "Convite expirado") {
            toast.error("Este convite já expirou.")
          } else {
            toast.error(data.error || "Erro ao aceitar convite")
          }
        } else {
          toast.error(data.error || `Erro ${response.status}: Não foi possível aceitar o convite`)
        }
      }
    } catch (error) {
      toast.error("Erro ao aceitar convite")
    } finally {
      setIsAccepting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Convite para Campanha</h1>
        <p className="text-muted-foreground">
          Você foi convidado para participar de uma campanha de RPG
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{invite.campaign.name}</span>
          </CardTitle>
          <CardDescription>
            {invite.campaign.description || "Nenhuma descrição fornecida"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-orange-500 text-white border-orange-500">
                Sistema: {invite.campaign.system}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Convidado por: {invite.createdBy.name || "Mestre"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Criado em: {formatDate(invite.createdAt)}</span>
            </div>
            {invite.expiresAt && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Expira em: {formatDate(invite.expiresAt)}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleAcceptInvite}
                disabled={isAccepting}
                size="lg"
                className="flex-1 sm:flex-none"
              >
                {isAccepting ? "Entrando..." : "Aceitar Convite"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                size="lg"
                className="flex-1 sm:flex-none text-foreground hover:bg-muted/50"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          Ao aceitar este convite, você se tornará um jogador desta campanha e poderá
          participar das sessões de jogo.
        </p>
      </div>
    </div>
  )
}