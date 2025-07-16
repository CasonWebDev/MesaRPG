import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🎮 GET /api/campaigns/[id]/tokens - Starting request')
    
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

    // Get current game state to get existing tokens
    const gameState = await prisma.gameState.findUnique({
      where: { campaignId }
    })

    // Parse existing tokens from game state (only generic tokens, no auto-character tokens)
    const gameTokens = gameState?.tokens ? JSON.parse(gameState.tokens) : []

    // Create tokens array with all saved tokens (generic and character-linked)
    const tokens = []

    // Add all tokens (both generic and character-linked)
    for (const token of gameTokens) {
      tokens.push({
        id: token.id,
        src: token.src || '/placeholder.svg',
        alt: token.alt || token.name || 'Token',
        name: token.name || token.alt || 'Token',
        position: token.position || { top: 100, left: 100 },
        borderColor: token.borderColor || 'border-muted-foreground',
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
      })
    }

    // Filter tokens based on user role
    let filteredTokens = tokens
    if (!isGM) {
      // Players can only see their own tokens and non-hidden tokens
      filteredTokens = tokens.filter(token => 
        token.ownerId === session.user.id || !token.hidden
      )
    }

    console.log('🎯 Total tokens created:', tokens.length)
    console.log('🎯 Filtered tokens for user:', filteredTokens.length)
    console.log('🎯 User role:', isGM ? 'GM' : 'PLAYER')

    console.log('🎯 Returning all tokens (generic and character-linked)')
    console.log('🎯 Total tokens:', tokens.length)
    console.log('🎯 Character-linked tokens:', tokens.filter(t => t.characterId).length)
    console.log('🎯 Generic tokens:', tokens.filter(t => !t.characterId).length)

    return NextResponse.json({
      tokens: filteredTokens,
      userRole: isGM ? 'GM' : 'PLAYER',
      userId: session.user.id
    })

  } catch (error) {
    console.error('Error loading tokens:', error)
    return NextResponse.json(
      { error: 'Failed to load tokens' },
      { status: 500 }
    )
  }
}

// POST endpoint disabled - no automatic character tokens
export async function POST() {
  return NextResponse.json({ 
    error: 'Character token creation disabled - use generic tokens only' 
  }, { status: 503 })
}

function getCharacterBorderColor(type: string): string {
  switch (type) {
    case 'PC':
      return 'border-blue-500'
    case 'NPC':
      return 'border-green-500'
    case 'CREATURE':
      return 'border-red-500'
    default:
      return 'border-muted-foreground'
  }
}