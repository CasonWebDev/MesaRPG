import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { type Campaign } from "@/components/campaign-card"
import { CreateCampaignDialog } from "@/components/create-campaign-dialog"
import { UserMenu } from "@/components/user-menu"
import { CampaignListClient } from "@/components/campaign-list-client"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect("/login")
  }

  // Get user with their campaigns
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      ownedCampaigns: {
        select: {
          id: true,
          name: true,
          description: true,
          system: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      },
      campaignMemberships: {
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              description: true,
              system: true,
              createdAt: true,
            }
          }
        },
        orderBy: { campaign: { createdAt: 'desc' } }
      }
    }
  })

  if (!user) {
    redirect("/login")
  }

  // Transform data to match Campaign interface
  const campaigns: Campaign[] = [
    // User's owned campaigns (where they are GM)
    ...user.ownedCampaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description || "Sem descrição",
      system: campaign.system,
      userRole: "Mestre" as const
    })),
    // Campaigns where user is a player
    ...user.campaignMemberships.map(membership => ({
      id: membership.campaign.id,
      name: membership.campaign.name,
      description: membership.campaign.description || "Sem descrição",
      system: membership.campaign.system,
      userRole: "Jogador" as const
    }))
  ]
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-secondary/50 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-heading text-primary">MesaRPG</h1>
          <div className="flex items-center gap-4">
            <CreateCampaignDialog />
            <UserMenu user={{ name: user.name || 'Usuário', email: user.email }} />
          </div>
        </div>
      </header>
      <main className="container mx-auto py-8">
        <h2 className="text-2xl font-heading mb-6">Suas Campanhas</h2>
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">Você ainda não participa de nenhuma campanha.</p>
            <CreateCampaignDialog />
          </div>
        ) : (
          <CampaignListClient campaigns={campaigns} />
        )}
      </main>
    </div>
  )
}
