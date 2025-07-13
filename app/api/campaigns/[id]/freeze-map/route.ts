import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSocketServer } from "@/lib/socket-bridge"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const campaignId = params.id
    const { frozen } = await request.json()

    // Verificar se o usuário é o GM da campanha
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedCampaigns: {
          where: { id: campaignId },
          select: { id: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Verificar se é o GM da campanha
    if (user.ownedCampaigns.length === 0) {
      return NextResponse.json(
        { error: "Apenas o GM pode congelar/descongelar o mapa" },
        { status: 403 }
      )
    }

    // Atualizar o estado do mapa no GameState
    const gameState = await prisma.gameState.upsert({
      where: { campaignId },
      update: {
        mapFrozen: frozen,
        frozenBy: frozen ? user.id : null,
        frozenAt: frozen ? new Date() : null,
        lastActivity: new Date()
      },
      create: {
        campaignId,
        mapFrozen: frozen,
        frozenBy: frozen ? user.id : null,
        frozenAt: frozen ? new Date() : null,
        tokens: JSON.stringify([]),
        gameData: JSON.stringify({}),
        gridConfig: JSON.stringify({}),
        fogAreas: JSON.stringify([])
      }
    })

    // Emitir evento WebSocket para todos os jogadores da campanha
    const socketServer = getSocketServer()
    if (socketServer) {
      socketServer.to(campaignId).emit('map:frozen-changed', {
        campaignId,
        mapFrozen: frozen,
        frozenBy: user.id,
        frozenByName: user.name,
        frozenAt: frozen ? new Date().toISOString() : null,
        timestamp: new Date().toISOString()
      })
      
      console.log(`🔒 Map ${frozen ? 'frozen' : 'unfrozen'} by GM ${user.name} in campaign ${campaignId}`)
    }

    return NextResponse.json({
      success: true,
      mapFrozen: frozen,
      frozenBy: frozen ? user.id : null,
      frozenByName: frozen ? user.name : null,
      frozenAt: frozen ? gameState.frozenAt?.toISOString() : null
    })

  } catch (error) {
    console.error("❌ Error in freeze-map endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const campaignId = params.id

    // Verificar se o usuário tem acesso à campanha
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedCampaigns: {
          where: { id: campaignId },
          select: { id: true }
        },
        campaignMemberships: {
          where: { campaignId },
          select: { id: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const hasAccess = user.ownedCampaigns.length > 0 || user.campaignMemberships.length > 0

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      )
    }

    // Buscar estado atual do mapa
    const gameState = await prisma.gameState.findUnique({
      where: { campaignId },
      select: {
        mapFrozen: true,
        frozenBy: true,
        frozenAt: true
      }
    })

    if (!gameState) {
      return NextResponse.json({
        mapFrozen: false,
        frozenBy: null,
        frozenAt: null
      })
    }

    // Buscar nome do usuário que congelou o mapa (se aplicável)
    let frozenByName = null
    if (gameState.frozenBy) {
      const frozenByUser = await prisma.user.findUnique({
        where: { id: gameState.frozenBy },
        select: { name: true }
      })
      frozenByName = frozenByUser?.name
    }

    return NextResponse.json({
      mapFrozen: gameState.mapFrozen,
      frozenBy: gameState.frozenBy,
      frozenByName,
      frozenAt: gameState.frozenAt?.toISOString()
    })

  } catch (error) {
    console.error("❌ Error getting freeze state:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}