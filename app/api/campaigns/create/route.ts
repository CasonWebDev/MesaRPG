import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCampaignSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  description: z.string().optional(),
  rpgSystem: z.string().min(1, "Sistema RPG é obrigatório").default("dnd5e"),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCampaignSchema.parse(body)

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        rpgSystem: validatedData.rpgSystem,
        ownerId: user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        rpgSystem: true,
        createdAt: true,
      }
    })

    return NextResponse.json({
      success: true,
      campaign
    })

  } catch (error) {
    console.error("Error creating campaign:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Dados inválidos",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}