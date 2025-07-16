import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CharacterType } from '@prisma/client'
import { z } from 'zod'

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
    const type = searchParams.get('type') as CharacterType
    const createdBy = searchParams.get('createdBy') as 'gm' | 'player'

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

    // Construir filtros
    const filters: any = {
      campaignId,
      ...(type && { type })
    }

    // Filtrar por criador se especificado
    if (createdBy === 'gm' && isGM) {
      filters.userId = user.id
    } else if (createdBy === 'player') {
      filters.userId = { not: user.id }
    }

    // Buscar personagens
    const characters = await prisma.character.findMany({
      where: filters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaign: true
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

    const { name, type, data } = validationResult.data

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

    // Para PCs criados por jogadores, verificar se usuário já tem personagem nesta campanha
    if (type === 'PC' && !isGM) {
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

    // Verificar se não existe um personagem criado muito recentemente (proteção contra duplicatas)
    const targetUserId = isGM && type === 'PC' && name === 'Novo Personagem' ? null : user.id
    const recentCharacter = await prisma.character.findFirst({
      where: {
        campaignId,
        userId: targetUserId,
        type: type as CharacterType,
        name: name,
        createdAt: {
          gte: new Date(Date.now() - 5000) // 5 segundos atrás
        }
      }
    })

    if (recentCharacter) {
      console.log('⚠️ Tentativa de criar personagem duplicado bloqueada:', {
        userId: user.id,
        campaignId,
        type,
        name
      })
      return NextResponse.json({ 
        character: {
          ...recentCharacter,
          data: typeof recentCharacter.data === 'string' ? JSON.parse(recentCharacter.data) : recentCharacter.data
        },
        message: 'Personagem já existe' 
      })
    }

    // Criar personagem (sem validação de template - usa D&D 5e)
    const character = await prisma.character.create({
      data: {
        name,
        type: type as CharacterType,
        data: JSON.stringify(data),
        campaignId,
        userId: targetUserId, // GM pode criar PCs sem userId
        templateId: null // Não usa mais templates
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaign: true
      }
    })

    // Parse dos dados JSON para resposta
    const characterWithParsedData = {
      ...character,
      data: typeof character.data === 'string' ? JSON.parse(character.data) : character.data
    }

    return NextResponse.json({ 
      character: characterWithParsedData,
      message: 'Personagem criado com sucesso' 
    })

  } catch (error) {
    console.error('Erro ao criar personagem:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}