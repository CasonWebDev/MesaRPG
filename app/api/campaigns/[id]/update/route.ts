import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateCampaignSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().optional(),
  system: z.string().min(1, "Sistema é obrigatório").max(50, "Sistema muito longo"),
  playerLimit: z.union([
    z.number().int().min(1, "Limite deve ser pelo menos 1").max(20, "Limite máximo é 20"),
    z.string().transform(val => parseInt(val)).refine(val => val >= 1 && val <= 20, "Limite deve ser entre 1 e 20")
  ]).optional(),
})

export async function PUT(
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
        { error: "Apenas o mestre da campanha pode editá-la" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateCampaignSchema.parse(body)

    // Atualizar a campanha
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        system: validatedData.system,
        playerLimit: validatedData.playerLimit,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        description: true,
        system: true,
        playerLimit: true,
        createdAt: true,
        updatedAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      message: "Campanha atualizada com sucesso",
      campaign: updatedCampaign
    })

  } catch (error) {
    console.error("Erro ao atualizar campanha:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}