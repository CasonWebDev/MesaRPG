import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CampaignSettingsClient } from "./settings-client"

export const dynamic = 'force-dynamic'

interface CampaignSettingsPageProps {
  params: {
    id: string
  }
}

export default async function CampaignSettingsPage({ params }: CampaignSettingsPageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user?.email) {
    redirect("/login")
  }

  // Buscar usuário atual
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  })

  if (!user) {
    redirect("/login")
  }

  // Buscar campanha e verificar se o usuário é o GM
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: id,
      ownerId: user.id
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
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
      },
      invites: {
        where: {
          usedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          createdBy: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  })

  if (!campaign) {
    redirect("/dashboard")
  }

  // Verificar se o usuário é realmente o GM
  if (campaign.ownerId !== user.id) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <CampaignSettingsClient campaign={{
          ...campaign,
          createdAt: campaign.createdAt.toISOString()
        }} />
      </div>
    </div>
  )
}
