import { redirect, notFound } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GameClient } from "./game-client"

export const dynamic = 'force-dynamic'
export type UserRole = "Mestre" | "Jogador"

export default async function GamePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { role?: UserRole }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect("/login")
  }

  const { id: campaignId } = await params
  const { role } = await searchParams
  const requestedRole = role || "Jogador"

  // Get user and verify campaign access
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true }
  })

  if (!user) {
    redirect("/login")
  }

  // Get campaign and verify user has access
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      OR: [
        { ownerId: user.id }, // User is GM
        { 
          members: {
            some: { userId: user.id }
          }
        } // User is a player
      ]
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      members: {
        where: { userId: user.id },
        select: { id: true }
      }
    }
  })

  if (!campaign) {
    notFound()
  }

  // Determine actual user role
  const isGM = campaign.ownerId === user.id
  const userRole: UserRole = isGM ? "Mestre" : "Jogador"

  // If requested role doesn't match actual role, redirect with correct role
  if (requestedRole !== userRole) {
    redirect(`/campaign/${campaignId}/play?role=${userRole}`)
  }

  // Get user's character if they are a player
  let playerCharacterId: string | undefined
  if (userRole === "Jogador") {
    const character = await prisma.character.findFirst({
      where: {
        campaignId: campaignId,
        userId: user.id,
        type: "PC"
      },
      select: { id: true }
    })
    playerCharacterId = character?.id
  }

  return (
    <GameClient 
      campaignId={campaignId}
      campaignName={campaign.name}
      userRole={userRole}
      playerCharacterId={playerCharacterId}
      currentUserId={user.id}
      rpgSystem={campaign.rpgSystem || 'generic'}
    />
  )
}