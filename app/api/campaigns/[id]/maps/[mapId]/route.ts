import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; mapId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const campaignId = params.id
    const mapId = params.mapId
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
      return NextResponse.json({ error: 'Apenas o GM pode editar mapas' }, { status: 403 })
    }

    // Verificar se o mapa existe
    const existingMap = await prisma.map.findUnique({
      where: { id: mapId, campaignId }
    })

    if (!existingMap) {
      return NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 })
    }

    // Atualizar o mapa
    const map = await prisma.map.update({
      where: { id: mapId },
      data: {
        name,
        description,
        imageUrl,
        gridSize: gridSize || existingMap.gridSize
      }
    })

    return NextResponse.json({ map })
  } catch (error) {
    console.error('Erro ao editar mapa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; mapId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const campaignId = params.id
    const mapId = params.mapId

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
      return NextResponse.json({ error: 'Apenas o GM pode excluir mapas' }, { status: 403 })
    }

    // Verificar se o mapa existe
    const existingMap = await prisma.map.findUnique({
      where: { id: mapId, campaignId }
    })

    if (!existingMap) {
      return NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 })
    }

    // Remover mapa do gameState se estiver ativo
    if (existingMap.isActive) {
      await prisma.gameState.updateMany({
        where: { campaignId, activeMapId: mapId },
        data: { activeMapId: null }
      })
    }

    // Deletar o mapa
    await prisma.map.delete({
      where: { id: mapId }
    })

    return NextResponse.json({ message: 'Mapa excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir mapa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}