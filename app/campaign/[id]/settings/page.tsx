import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SettingsClient } from "./settings-client"

export default async function CampaignSettingsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect('/login')
  }

  const resolvedParams = await params

  // Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  })

  if (!user) {
    redirect('/login')
  }

  // Buscar campanha e verificar se usuário é o owner
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: resolvedParams.id,
      ownerId: user.id
    },
    include: {
      owner: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  })

  if (!campaign) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Configurações da Campanha</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações e jogadores da campanha "{campaign.name}"
          </p>
        </div>
        
        <SettingsClient campaign={campaign} />
      </div>
    </div>
  )
}