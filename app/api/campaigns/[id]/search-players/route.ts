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

    const campaignId = params.id
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      )
    }

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
      select: { id: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada ou sem permissão" },
        { status: 404 }
      )
    }

    // Buscar usuário por email
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        campaignMemberships: {
          where: { campaignId },
          select: { id: true }
        }
      }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se já é membro da campanha
    const isAlreadyMember = targetUser.campaignMemberships.length > 0

    return NextResponse.json({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        isAlreadyMember
      }
    })

  } catch (error) {
    console.error("Erro ao buscar jogador:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}