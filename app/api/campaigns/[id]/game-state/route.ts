import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 GET game-state - Starting request')
    
    const session = await getServerSession(authOptions)
    console.log('🔍 Session check:', { hasSession: !!session, userId: session?.user?.id })
    
    if (!session?.user?.id) {
      console.log('❌ Unauthorized - no session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const campaignId = resolvedParams.id
    console.log('🔍 Campaign ID:', campaignId)

    // Check if user has access to this campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: { where: { userId: session.user.id } }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const isGM = campaign.ownerId === session.user.id
    const isPlayer = campaign.members.length > 0

    if (!isGM && !isPlayer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get current game state
    const gameState = await prisma.gameState.findUnique({
      where: { campaignId }
    })
    
    // Get active map separately if it exists
    let activeMap = null
    if (gameState?.activeMapId) {
      activeMap = await prisma.map.findUnique({
        where: { id: gameState.activeMapId },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          gridSize: true
        }
      })
    }

    if (!gameState) {
      return NextResponse.json({
        activeMap: null,
        tokens: [],
        gameData: {},
        lastActivity: null
      })
    }

    // Parse tokens and ensure they have the correct structure
    const tokens = gameState.tokens ? JSON.parse(gameState.tokens) : []
    const formattedTokens = tokens.map((token: any) => ({
      id: token.id,
      src: token.src || '/placeholder.svg',
      alt: token.alt || token.name || 'Token',
      name: token.name || token.alt || 'Token',
      position: {
        top: token.position?.top || 0,
        left: token.position?.left || 0
      },
      borderColor: token.borderColor || 'border-blue-500',
      canPlayerMove: token.canPlayerMove !== false,
      ownerId: token.ownerId || null,
      characterId: token.characterId || null,
      characterType: token.characterType || null,
      hidden: token.hidden || false,
      locked: token.locked || false,
      scale: token.scale || 1,
      rotation: token.rotation || 0,
      opacity: token.opacity || 1,
      tokenSize: token.tokenSize || 40,
      sizeType: token.sizeType || 'medium'
    }))

    return NextResponse.json({
      gameState: {
        activeMap: activeMap,
        tokens: formattedTokens,
        gameData: gameState.gameData ? JSON.parse(gameState.gameData) : {},
        gridConfig: gameState.gridConfig ? JSON.parse(gameState.gridConfig) : {},
        lastActivity: gameState.lastActivity.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Error loading game state:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    return NextResponse.json(
      { error: `Failed to load game state: ${error instanceof Error ? error.message : 'Unknown error'}` },
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const campaignId = resolvedParams.id
    const { tokens, gameData, activeMapId, gridConfig } = await request.json()

    // Check if user has access to this campaign and is GM
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const isGM = campaign.ownerId === session.user.id

    if (!isGM) {
      return NextResponse.json({ error: 'Only GMs can update game state' }, { status: 403 })
    }

    // Update game state
    const gameState = await prisma.gameState.upsert({
      where: { campaignId },
      update: {
        tokens: tokens ? JSON.stringify(tokens) : undefined,
        gameData: gameData ? JSON.stringify(gameData) : undefined,
        activeMapId: activeMapId || undefined,
        gridConfig: gridConfig ? JSON.stringify(gridConfig) : undefined,
        lastActivity: new Date()
      },
      create: {
        campaignId,
        tokens: JSON.stringify(tokens || []),
        gameData: JSON.stringify(gameData || {}),
        activeMapId: activeMapId || null,
        gridConfig: JSON.stringify(gridConfig || {})
      }
    })

    return NextResponse.json({
      success: true,
      gameState: {
        tokens: gameState.tokens ? JSON.parse(gameState.tokens) : [],
        gameData: gameState.gameData ? JSON.parse(gameState.gameData) : {},
        activeMapId: gameState.activeMapId,
        gridConfig: gameState.gridConfig ? JSON.parse(gameState.gridConfig) : {},
        lastActivity: gameState.lastActivity.toISOString()
      }
    })

  } catch (error) {
    console.error('Error updating game state:', error)
    return NextResponse.json(
      { error: 'Failed to update game state' },
      { status: 500 }
    )
  }
}