import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token

    if (!token) {
      return NextResponse.json(
        { error: "Token é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar convite pelo token
    const invite = await prisma.campaignInvite.findUnique({
      where: { token },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            description: true,
            system: true
          }
        },
        createdBy: {
          select: {
            name: true
          }
        }
      }
    })

    if (!invite) {
      return NextResponse.json(
        { error: "Convite não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o convite já foi usado
    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Convite já foi utilizado" },
        { status: 400 }
      )
    }

    // Verificar se o convite expirou
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Convite expirado" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      invite: {
        id: invite.id,
        token: invite.token,
        campaign: invite.campaign,
        createdBy: invite.createdBy,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt
      }
    })

  } catch (error) {
    console.error("Erro ao buscar convite:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    console.log("POST /api/invites/[token] - Starting request")
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log("No session found")
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const token = params.token
    console.log("Processing token:", token)

    if (!token) {
      console.log("No token provided")
      return NextResponse.json(
        { error: "Token é obrigatório" },
        { status: 400 }
      )
    }

    // Buscar usuário atual
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

    // Buscar convite
    const invite = await prisma.campaignInvite.findUnique({
      where: { token },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            ownerId: true
          }
        }
      }
    })

    if (!invite) {
      return NextResponse.json(
        { error: "Convite não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se o convite já foi usado
    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Convite já foi utilizado" },
        { status: 400 }
      )
    }

    // Verificar se o convite expirou
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Convite expirado" },
        { status: 400 }
      )
    }

    // Verificar se o usuário é o próprio GM
    console.log("Campaign owner ID:", invite.campaign.ownerId)
    console.log("User ID:", user.id)
    
    if (invite.campaign.ownerId === user.id) {
      console.log("User is the GM")
      return NextResponse.json(
        { error: "Você já é o Mestre desta campanha" },
        { status: 400 }
      )
    }

    // Verificar se já é membro da campanha
    const existingMembership = await prisma.campaignMember.findFirst({
      where: {
        campaignId: invite.campaign.id,
        userId: user.id
      }
    })

    console.log("Existing membership:", existingMembership)

    if (existingMembership) {
      console.log("User is already a member")
      return NextResponse.json(
        { error: "Você já é membro desta campanha" },
        { status: 400 }
      )
    }

    // Criar membership e marcar convite como usado
    const [membership] = await prisma.$transaction([
      prisma.campaignMember.create({
        data: {
          campaignId: invite.campaign.id,
          userId: user.id,
          role: "PLAYER"
        }
      }),
      prisma.campaignInvite.update({
        where: { id: invite.id },
        data: {
          usedById: user.id,
          usedAt: new Date()
        }
      })
    ])

    return NextResponse.json({
      success: true,
      campaign: {
        id: invite.campaign.id,
        name: invite.campaign.name
      },
      membership: {
        id: membership.id,
        role: "Jogador"
      }
    })

  } catch (error) {
    console.error("Erro ao aceitar convite:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}