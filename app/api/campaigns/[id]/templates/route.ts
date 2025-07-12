import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const attributeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome do atributo é obrigatório"),
  defaultValue: z.number().optional()
})

const templateFieldSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome do campo é obrigatório"),
  type: z.enum(['text', 'textarea', 'number', 'boolean', 'image', 'select', 'attributes']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  defaultValue: z.any().optional(),
  attributes: z.array(attributeSchema).optional()
})

const createTemplateSchema = z.object({
  name: z.string().min(1, "Nome do template é obrigatório").max(100, "Nome muito longo"),
  type: z.enum(['PC', 'NPC', 'CREATURE']),
  fields: z.array(templateFieldSchema).min(1, "Pelo menos um campo é obrigatório"),
  isDefault: z.boolean().default(false)
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: campaignId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // PC, NPC, CREATURE

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar acesso à campanha
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
      select: { id: true, ownerId: true }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada ou sem acesso' }, { status: 404 })
    }

    const whereClause: any = { campaignId }
    if (type) {
      whereClause.type = type
    }

    const templates = await prisma.sheetTemplate.findMany({
      where: whereClause,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Parse fields JSON para cada template
    const parsedTemplates = templates.map(template => ({
      ...template,
      fields: JSON.parse(template.fields)
    }))

    return NextResponse.json({ templates: parsedTemplates })
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: campaignId } = await params
    const body = await request.json()

    // Validar dados
    const validatedData = createTemplateSchema.parse(body)

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário é GM da campanha
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        ownerId: user.id
      },
      select: { id: true }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada ou apenas o GM pode criar templates' }, { status: 403 })
    }

    // Verificar se já existe um template do mesmo tipo
    const existingTemplate = await prisma.sheetTemplate.findFirst({
      where: { campaignId, type: validatedData.type }
    })

    if (existingTemplate) {
      return NextResponse.json({ 
        error: 'Já existe um template deste tipo. Use a edição para modificar o template existente.' 
      }, { status: 400 })
    }

    // Se este template está sendo marcado como padrão, desmarcar outros templates padrão do mesmo tipo
    if (validatedData.isDefault) {
      await prisma.sheetTemplate.updateMany({
        where: { campaignId, type: validatedData.type, isDefault: true },
        data: { isDefault: false }
      })
    }

    const template = await prisma.sheetTemplate.create({
      data: {
        campaignId,
        name: validatedData.name,
        type: validatedData.type,
        fields: JSON.stringify(validatedData.fields),
        isDefault: validatedData.isDefault
      }
    })

    return NextResponse.json({ 
      template: {
        ...template,
        fields: validatedData.fields
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar template:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}