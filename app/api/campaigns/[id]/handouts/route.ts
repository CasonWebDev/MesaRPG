import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id

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

    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const isGM = user.ownedCampaigns.length > 0

    // Buscar handouts
    let handouts
    if (isGM) {
      // GM vê todos os handouts
      handouts = await prisma.handout.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      // Jogadores veem apenas handouts compartilhados com eles
      handouts = await prisma.handout.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'desc' }
      })

      // Filtrar handouts que foram compartilhados com o jogador
      handouts = handouts.filter(handout => {
        const sharedWith = JSON.parse(handout.sharedWith)
        return sharedWith.includes(user.email)
      })
    }

    return NextResponse.json({ handouts })
  } catch (error) {
    console.error('Erro ao buscar handouts:', error)
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id
    const { name, content, attachments, sharedWith } = await request.json()

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Nome e conteúdo são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedCampaigns: {
          where: { id: campaignId }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário é GM da campanha
    if (user.ownedCampaigns.length === 0) {
      return NextResponse.json({ error: 'Apenas o GM pode criar handouts' }, { status: 403 })
    }

    const handout = await prisma.handout.create({
      data: {
        campaignId,
        name,
        content,
        attachments: JSON.stringify(attachments || []),
        sharedWith: JSON.stringify(sharedWith || [])
      }
    })

    return NextResponse.json({ handout }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar handout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}