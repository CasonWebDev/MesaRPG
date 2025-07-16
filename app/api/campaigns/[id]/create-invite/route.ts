import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { nanoid } from "nanoid"

export async function POST(
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

    const body = await request.json()
    const campaignId = params.id

    // Verificar se o usuário é o GM da campanha
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
        ownerId: user.id
      },
      select: { id: true, name: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada ou sem permissão" },
        { status: 404 }
      )
    }

    // Gerar token único para o convite
    const token = nanoid(32)
    
    // Criar convite no banco
    const invite = await prisma.campaignInvite.create({
      data: {
        campaignId,
        token,
        email: body.email,
        createdById: user.id,
        // Convite expira em 7 dias
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    // Gerar link do convite
    const inviteUrl = `${process.env.NEXTAUTH_URL}/invite/${token}`

    return NextResponse.json({
      success: true,
      inviteUrl: inviteUrl,
      invite: {
        id: invite.id,
        token: invite.token,
        url: inviteUrl,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt
      }
    })

  } catch (error) {
    console.error("Erro ao criar convite:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}