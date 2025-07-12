import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
const { getSocketServer } = require('@/lib/socket-bridge')

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; mapId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id
    const mapId = params.mapId

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
      return NextResponse.json({ error: 'Apenas o GM pode ativar mapas' }, { status: 403 })
    }

    // Verificar se o mapa existe
    const map = await prisma.map.findUnique({
      where: { id: mapId, campaignId }
    })

    if (!map) {
      return NextResponse.json({ error: 'Mapa não encontrado' }, { status: 404 })
    }

    // Desativar todos os mapas da campanha
    await prisma.map.updateMany({
      where: { campaignId },
      data: { isActive: false }
    })

    // Ativar o mapa selecionado
    const activatedMap = await prisma.map.update({
      where: { id: mapId },
      data: { isActive: true }
    })

    // Atualizar ou criar o estado do jogo
    await prisma.gameState.upsert({
      where: { campaignId },
      update: { 
        activeMapId: mapId,
        lastActivity: new Date()
      },
      create: {
        campaignId,
        activeMapId: mapId,
        tokens: JSON.stringify([]),
        gameData: JSON.stringify({})
      }
    })

    // Notificar via WebSocket sobre a ativação do mapa
    const socketServer = getSocketServer()
    if (socketServer) {
      socketServer.to(campaignId).emit('map:activated', {
        mapId,
        map: activatedMap,
        userId: user.id
      })
      
      console.log(`Map activated via WebSocket: ${activatedMap.name} in campaign ${campaignId}`)
    }

    return NextResponse.json({ map: activatedMap })
  } catch (error) {
    console.error('Erro ao ativar mapa:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}