import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    if (!campaignId) {
      return NextResponse.json(
        { error: "ID da campanha é obrigatório" },
        { status: 400 }
      )
    }

    // Verificar se a campanha existe e se o usuário é o owner
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { owner: true }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: "Campanha não encontrada" },
        { status: 404 }
      )
    }

    if (campaign.owner.email !== session.user.email) {
      return NextResponse.json(
        { error: "Apenas o mestre da campanha pode deletá-la" },
        { status: 403 }
      )
    }

    // Deletar campanha e todos os dados relacionados
    // O Prisma irá fazer cascade delete baseado no schema
    await prisma.campaign.delete({
      where: { id: campaignId }
    })

    return NextResponse.json({
      message: "Campanha deletada com sucesso"
    })

  } catch (error) {
    console.error("Erro ao deletar campanha:", error)
    
    // Se o erro for de relacionamento, pode ser que precise de cleanup manual
    if (error instanceof Error && error.message.includes("Foreign key constraint")) {
      return NextResponse.json(
        { error: "Não foi possível deletar a campanha devido a dados relacionados" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}