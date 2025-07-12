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

const updateTemplateSchema = z.object({
  name: z.string().min(1, "Nome do template é obrigatório").max(100, "Nome muito longo"),
  fields: z.array(templateFieldSchema).min(1, "Pelo menos um campo é obrigatório"),
  isDefault: z.boolean().default(false)
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: campaignId, templateId } = await params
    const body = await request.json()

    // Validar dados
    const validatedData = updateTemplateSchema.parse(body)

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o template existe e se o usuário é GM da campanha
    const existingTemplate = await prisma.sheetTemplate.findFirst({
      where: {
        id: templateId,
        campaignId: campaignId,
        campaign: {
          ownerId: user.id
        }
      },
      include: {
        campaign: { select: { ownerId: true } }
      }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template não encontrado ou apenas o GM pode editá-lo' }, { status: 403 })
    }

    // Se este template está sendo marcado como padrão, desmarcar outros templates padrão do mesmo tipo
    if (validatedData.isDefault) {
      await prisma.sheetTemplate.updateMany({
        where: { 
          campaignId, 
          type: existingTemplate.type, 
          isDefault: true,
          id: { not: templateId } // Não desmarcar o próprio template
        },
        data: { isDefault: false }
      })
    }

    const updatedTemplate = await prisma.sheetTemplate.update({
      where: { id: templateId },
      data: {
        name: validatedData.name,
        fields: JSON.stringify(validatedData.fields),
        isDefault: validatedData.isDefault,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      template: {
        ...updatedTemplate,
        fields: validatedData.fields
      }
    })
  } catch (error) {
    console.error('Erro ao atualizar template:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: campaignId, templateId } = await params

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o template existe e se o usuário é GM da campanha
    const existingTemplate = await prisma.sheetTemplate.findFirst({
      where: {
        id: templateId,
        campaignId: campaignId,
        campaign: {
          ownerId: user.id
        }
      }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template não encontrado ou apenas o GM pode deletá-lo' }, { status: 403 })
    }

    // Verificar se há personagens usando este template
    const charactersUsingTemplate = await prisma.character.count({
      where: {
        campaignId: campaignId,
        // Assumindo que há um campo templateId no modelo Character
        // Se não houver, vamos precisar criar essa relação
      }
    })

    // Por enquanto, permitir deletar sempre
    await prisma.sheetTemplate.delete({
      where: { id: templateId }
    })

    return NextResponse.json({ message: 'Template deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: campaignId, templateId } = await params

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar acesso à campanha e buscar template
    const template = await prisma.sheetTemplate.findFirst({
      where: {
        id: templateId,
        campaignId: campaignId,
        campaign: {
          OR: [
            { ownerId: user.id }, // User is GM
            { 
              members: {
                some: { userId: user.id }
              }
            } // User is a player
          ]
        }
      }
    })

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado ou sem acesso' }, { status: 404 })
    }

    return NextResponse.json({ 
      template: {
        ...template,
        fields: JSON.parse(template.fields)
      }
    })
  } catch (error) {
    console.error('Erro ao buscar template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}