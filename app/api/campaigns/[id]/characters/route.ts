import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CharacterType } from '@prisma/client'

const CreateCharacterSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['PC', 'NPC', 'CREATURE']),
  data: z.record(z.any()),
  templateId: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const resolvedParams = await params
    const campaignId = resolvedParams.id
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') as CharacterType | null
    const createdBy = searchParams.get('createdBy') // 'gm' para NPCs/Criaturas, 'player' para PCs

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedCampaigns: {
          where: { id: campaignId }
        },
        campaignMemberships: {
          where: { campaignId }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem acesso à campanha
    const hasAccess = user.ownedCampaigns.length > 0 || user.campaignMemberships.length > 0
    const isGM = user.ownedCampaigns.length > 0

    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado à campanha' }, { status: 403 })
    }

    // Construir where clause
    const whereClause: any = { campaignId }

    // Se userId específico for fornecido
    if (userId) {
      whereClause.userId = userId
    }

    // Filtrar por tipo
    if (type) {
      whereClause.type = type
    }

    // Filtrar por criador (GM vs Player)
    if (createdBy === 'gm' && isGM) {
      // Buscar NPCs/Criaturas criados pelo GM
      whereClause.type = { in: ['NPC', 'CREATURE'] }
      // Buscar apenas os criados pelo GM atual
      const gmUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
      whereClause.userId = gmUser?.id
    } else if (createdBy === 'player') {
      // Buscar PCs de jogadores
      whereClause.type = 'PC'
    }

    // Se não é GM e não especificou userId, buscar apenas seus próprios personagens
    if (!isGM && !userId) {
      whereClause.userId = user.id
    }

    // Buscar characters
    const characters = await prisma.character.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaign: true,
        template: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse dos dados JSON
    const charactersWithParsedData = characters.map(char => ({
      ...char,
      data: typeof char.data === 'string' ? JSON.parse(char.data) : char.data
    }))

    return NextResponse.json({ 
      characters: charactersWithParsedData,
      isGM
    })

  } catch (error) {
    console.error('Erro ao buscar personagem:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const resolvedParams = await params
    const campaignId = resolvedParams.id
    const body = await request.json()

    // Validar dados de entrada
    const validationResult = CreateCharacterSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const { name, type, data, templateId } = validationResult.data

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedCampaigns: {
          where: { id: campaignId }
        },
        campaignMemberships: {
          where: { campaignId },
          include: { campaign: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem acesso à campanha
    const hasAccess = user.ownedCampaigns.length > 0 || user.campaignMemberships.length > 0
    const isGM = user.ownedCampaigns.length > 0

    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado à campanha' }, { status: 403 })
    }

    // Verificar permissões baseadas no tipo
    if ((type === 'NPC' || type === 'CREATURE') && !isGM) {
      return NextResponse.json({ 
        error: 'Apenas o GM pode criar NPCs e Criaturas' 
      }, { status: 403 })
    }

    // Para PCs, verificar se usuário já tem personagem nesta campanha
    if (type === 'PC') {
      const existingCharacter = await prisma.character.findFirst({
        where: {
          campaignId,
          userId: user.id,
          type: 'PC'
        }
      })

      if (existingCharacter) {
        return NextResponse.json({ 
          error: 'Você já possui um personagem nesta campanha' 
        }, { status: 409 })
      }
    }

    // Buscar template padrão se não especificado
    let finalTemplateId = templateId
    if (!finalTemplateId) {
      const defaultTemplate = await prisma.sheetTemplate.findFirst({
        where: {
          campaignId,
          type: type,
          isDefault: true
        }
      })

      if (!defaultTemplate) {
        return NextResponse.json({ 
          error: `Nenhum template de ${type === 'PC' ? 'personagem' : type === 'NPC' ? 'NPC' : 'criatura'} encontrado para esta campanha` 
        }, { status: 400 })
      }

      finalTemplateId = defaultTemplate.id
    }

    // Validar template existe e é do tipo correto
    const template = await prisma.sheetTemplate.findUnique({
      where: { id: finalTemplateId }
    })

    if (!template || template.campaignId !== campaignId || template.type !== type) {
      return NextResponse.json({ 
        error: 'Template inválido ou não disponível' 
      }, { status: 400 })
    }

    // Validar dados contra template
    const templateFields = typeof template.fields === 'string' ? JSON.parse(template.fields) : template.fields
    const requiredFields = templateFields.filter((field: any) => field.required)
    
    for (const field of requiredFields) {
      if (!data[field.name] || data[field.name] === '') {
        return NextResponse.json({ 
          error: `Campo obrigatório não preenchido: ${field.name}` 
        }, { status: 400 })
      }
    }

    // Criar personagem
    const character = await prisma.character.create({
      data: {
        name,
        type: type as CharacterType,
        data: JSON.stringify(data),
        campaignId,
        userId: user.id,
        templateId: finalTemplateId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaign: true,
        template: true
      }
    })

    return NextResponse.json({ 
      character,
      message: 'Personagem criado com sucesso' 
    }, { status: 201 })

  } catch (error) {
    console.error('Erro ao criar personagem:', error)
    
    // Log mais detalhado do erro
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}