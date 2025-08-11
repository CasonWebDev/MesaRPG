import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { type Campaign } from "@/components/campaign-card"
import { CreateCampaignDialog } from "@/components/create-campaign-dialog"
import { UserMenu } from "@/components/user-menu"
import { CampaignListClient } from "@/components/campaign-list-client"
import { SubscriptionNotifier } from "@/components/subscription-notifier"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect("/login")
  }

  // Get user with their campaigns
  let user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      ownedCampaigns: {
        select: {
          id: true,
          name: true,
          description: true,
          rpgSystem: true,
          createdAt: true,
          isArchived: true,
          expiresAt: true,
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
              rpgSystem: true,
              createdAt: true,
              isArchived: true,
              expiresAt: true,
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

  let notification = null;
  if (session.user.justDowngraded) {
    notification = {
      planExpired: true,
      planStartedAt: session.user.planStartedAt,
      planExpiresAt: session.user.planExpiresAt,
    };
  }

  const freePlanLimit = user.ownedCampaigns.length < 1;
  const creditsPlanLimit = user.credits > 0;
  const canCreateCampaign = user.plan !== 'FREE' || freePlanLimit;
  const canCreateWithCredits = user.plan === 'CREDITS' && creditsPlanLimit;

  // Transform data to match Campaign interface
  const campaigns: Campaign[] = [
    // User's owned campaigns (where they are GM)
    ...user.ownedCampaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description || "Sem descrição",
      system: campaign.rpgSystem,
      userRole: "Mestre" as const,
      isArchived: campaign.isArchived,
      expiresAt: campaign.expiresAt,
    })),
    // Campaigns where user is a player
    ...user.campaignMemberships.map(membership => ({
      id: membership.campaign.id,
      name: membership.campaign.name,
      description: membership.campaign.description || "Sem descrição",
      system: membership.campaign.rpgSystem,
      userRole: "Jogador" as const,
      isArchived: membership.campaign.isArchived,
      expiresAt: membership.campaign.expiresAt,
    }))
  ]
  return (
    <div className="min-h-screen bg-background">
      {notification && <SubscriptionNotifier notification={notification} />}
      <header className="bg-card border-b border-border p-4 shadow-sm">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-heading text-primary">MesaRPG</h1>
          <div className="flex items-center gap-4">
            <CreateCampaignDialog 
              canCreate={canCreateCampaign} 
              canCreateWithCredits={canCreateWithCredits}
              userPlan={user.plan}
            />
            <UserMenu user={{ 
              name: user.name || 'Usuário', 
              email: user.email,
              plan: user.plan,
              credits: user.credits,
              planStartedAt: user.planStartedAt,
              planExpiresAt: user.planExpiresAt,
            }} />
          </div>
        </div>
      </header>
      <main className="container mx-auto py-8">
        <h2 className="text-2xl font-heading mb-6 text-foreground">Suas Campanhas</h2>
        {campaigns.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">Você ainda não participa de nenhuma campanha.</p>
            <CreateCampaignDialog 
              canCreate={canCreateCampaign} 
              canCreateWithCredits={canCreateWithCredits}
              userPlan={user.plan}
            />
          </div>
        ) : (
          <CampaignListClient 
            campaigns={campaigns} 
            userPlan={user.plan} 
            userCredits={user.credits} 
          />
        )}
      </main>
    </div>
  )
}
