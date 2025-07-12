import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const removePlayerSchema = z.object({
  userId: z.string().min(1)
})

export async function DELETE(
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
    const { userId } = removePlayerSchema.parse(body)

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
      select: { id: true, ownerId: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada ou sem permissão" },
        { status: 404 }
      )
    }

    // Verificar se não está tentando remover o próprio GM
    if (userId === campaign.ownerId) {
      return NextResponse.json(
        { error: "Não é possível remover o Mestre da campanha" },
        { status: 400 }
      )
    }

    // Verificar se o usuário é membro da campanha
    const membership = await prisma.campaignMember.findFirst({
      where: {
        campaignId,
        userId
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Usuário não é membro da campanha" },
        { status: 404 }
      )
    }

    // Remover jogador da campanha
    await prisma.campaignMember.delete({
      where: {
        id: membership.id
      }
    })

    return NextResponse.json({
      success: true,
      message: "Jogador removido com sucesso"
    })

  } catch (error) {
    console.error("Erro ao remover jogador:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}