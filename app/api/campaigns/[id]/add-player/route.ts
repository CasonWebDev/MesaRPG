import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const addPlayerSchema = z.object({
  userId: z.string().min(1)
})

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

    const campaignId = params.id
    const body = await request.json()
    console.log("Request body:", body)
    
    const validationResult = addPlayerSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error.errors)
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.errors },
        { status: 400 }
      )
    }
    
    const { userId } = validationResult.data

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

    // Verificar se o usuário target existe
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se já é membro
    const existingMembership = await prisma.campaignMember.findFirst({
      where: {
        campaignId,
        userId
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: "Usuário já é membro da campanha" },
        { status: 400 }
      )
    }

    // Adicionar jogador à campanha
    const membership = await prisma.campaignMember.create({
      data: {
        campaignId,
        userId,
        role: "PLAYER"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      member: {
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        role: "Jogador",
        isGM: false
      }
    })

  } catch (error) {
    console.error("Erro ao adicionar jogador:", error)
    
    if (error instanceof z.ZodError) {
      console.error("Validation errors:", error.errors)
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}