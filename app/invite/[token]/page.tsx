import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { InviteClient } from "./invite-client"

export const dynamic = 'force-dynamic'

interface InvitePageProps {
  params: {
    token: string
  }
}

export default async function InvitePage({ params }: InvitePageProps) {
  const session = await getServerSession(authOptions)
  const { token } = await params

  try {
    // Buscar o convite
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/invites/${token}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Convite Inválido</h1>
            <p className="text-muted-foreground mb-4">
              Este convite não existe, expirou ou já foi utilizado.
            </p>
            <a href="/dashboard" className="text-primary hover:underline">
              Voltar ao Dashboard
            </a>
          </div>
        </div>
      )
    }

    const data = await response.json()

    // Se não está logado, redirecionar para login com o token no cache
    if (!session?.user?.email) {
      // Armazenar o token no localStorage será feito no client
      redirect(`/login?invite=${token}`)
    }

    // Se está logado, processar o convite
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <InviteClient invite={data.invite} />
        </div>
      </div>
    )

  } catch (error) {
    console.error('Erro ao buscar convite:', error)
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Erro</h1>
          <p className="text-muted-foreground mb-4">
            Ocorreu um erro ao processar o convite.
          </p>
          <a href="/dashboard" className="text-primary hover:underline">
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    )
  }
}