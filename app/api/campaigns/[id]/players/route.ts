import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const { id: campaignId } = await params
    if (!campaignId) {
      return NextResponse.json(
        { error: "ID da campanha é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se o usuário tem acesso à campanha
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

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
      select: { id: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada ou sem acesso" },
        { status: 404 }
      )
    }

    // Buscar todos os jogadores da campanha
    const campaignWithPlayers = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    })

    if (!campaignWithPlayers) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      )
    }

    // Formar lista de jogadores
    const players = [
      // Mestre
      {
        id: campaignWithPlayers.owner.id,
        name: campaignWithPlayers.owner.name,
        email: campaignWithPlayers.owner.email,
        role: "Mestre" as const,
        isGM: true
      },
      // Jogadores
      ...campaignWithPlayers.members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
        role: "Jogador" as const,
        isGM: false
      }))
    ]

    return NextResponse.json({
      players,
      total: players.length
    })

  } catch (error) {
    console.error("Erro ao buscar jogadores:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}