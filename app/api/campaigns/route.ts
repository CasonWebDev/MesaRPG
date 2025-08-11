import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Buscar campanhas onde o usuário é GM ou jogador
    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    })

    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Busca o usuário e a contagem de campanhas que ele possui
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        _count: {
          select: { ownedCampaigns: true },
        },
      },
    });

    // Aplica a regra de negócio para o plano Gratuito
    if (user?.plan === 'FREE' && user._count.ownedCampaigns >= 1) {
      return NextResponse.json(
        { error: 'Usuários do plano Gratuito podem ter apenas uma campanha. Exclua a campanha existente para criar uma nova.' },
        { status: 403 } // 403 Forbidden é mais apropriado aqui
      );
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da campanha é obrigatório' },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        ownerId: session.user.id,
        settings: JSON.stringify({
          gridSize: 20,
          maxPlayers: 6,
          isPrivate: false
        })
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Criar templates padrão para a campanha
    const defaultTemplates = [
      {
        name: 'Personagem Jogador',
        type: 'PC',
        fields: JSON.stringify([
          { id: 'name', name: 'Nome', type: 'text' },
          { id: 'class', name: 'Classe & Nível', type: 'text' },
          { id: 'strength', name: 'Força', type: 'number' },
          { id: 'dexterity', name: 'Destreza', type: 'number' },
          { id: 'constitution', name: 'Constituição', type: 'number' },
          { id: 'avatar', name: 'Avatar', type: 'image' },
          { id: 'background', name: 'História', type: 'textarea' }
        ]),
        isDefault: true
      },
      {
        name: 'NPC',
        type: 'NPC',
        fields: JSON.stringify([
          { id: 'name', name: 'Nome', type: 'text' },
          { id: 'occupation', name: 'Ocupação', type: 'text' },
          { id: 'motivation', name: 'Motivação', type: 'textarea' },
          { id: 'loyalty', name: 'Lealdade', type: 'boolean' },
          { id: 'avatar', name: 'Avatar', type: 'image' }
        ]),
        isDefault: true
      },
      {
        name: 'Criatura',
        type: 'CREATURE',
        fields: JSON.stringify([
          { id: 'name', name: 'Nome da Criatura', type: 'text' },
          { id: 'hp', name: 'Pontos de Vida', type: 'number' },
          { id: 'ac', name: 'Classe de Armadura', type: 'number' },
          { id: 'actions', name: 'Ações', type: 'textarea' },
          { id: 'treasure', name: 'Tesouro', type: 'textarea' },
          { id: 'token', name: 'Token', type: 'image' }
        ]),
        isDefault: true
      }
    ]

    for (const template of defaultTemplates) {
      await prisma.sheetTemplate.create({
        data: {
          campaignId: campaign.id,
          name: template.name,
          type: template.type as 'PC' | 'NPC' | 'CREATURE',
          fields: template.fields,
          isDefault: template.isDefault
        }
      })
    }

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar campanha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}