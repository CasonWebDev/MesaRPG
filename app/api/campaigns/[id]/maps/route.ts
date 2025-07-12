import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const campaignId = resolvedParams.id

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

    const maps = await prisma.map.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ maps })
  } catch (error) {
    console.error('Erro ao buscar mapas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const campaignId = resolvedParams.id
    const { name, description, imageUrl, gridSize } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Nome do mapa é obrigatório' },
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
      return NextResponse.json({ error: 'Apenas o GM pode criar mapas' }, { status: 403 })
    }

    const map = await prisma.map.create({
      data: {
        campaignId,
        name,
        description,
        imageUrl,
        gridSize: gridSize || 20,
        settings: JSON.stringify({
          gridVisible: true,
          gridColor: '#000000',
          gridOpacity: 0.5
        })
      }
    })

    return NextResponse.json({ map }, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar mapa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}