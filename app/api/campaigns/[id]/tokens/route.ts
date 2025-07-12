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

    // Get characters in the campaign
    const characters = await prisma.character.findMany({
      where: { campaignId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    console.log('🎭 Found characters:', characters.length)
    characters.forEach(char => {
      console.log(`  - ${char.name} (${char.type}) by ${char.user?.name || 'GM'}`)
    })

    // Parse existing tokens from game state
    const gameTokens = gameState?.tokens ? JSON.parse(gameState.tokens) : []

    // Create tokens combining characters and existing tokens
    const tokens = []

    // Add tokens from characters
    for (const character of characters) {
      // Find if this character already has a token
      const existingToken = gameTokens.find((token: any) => token.characterId === character.id)
      
      if (existingToken) {
        // Use existing token position and properties
        const characterData = character.data ? JSON.parse(character.data) : {}
        const avatarUrl = characterData.avatar || characterData.image || '/placeholder.svg'
        
        tokens.push({
          id: existingToken.id,
          src: avatarUrl,
          alt: character.name,
          name: character.name,
          position: existingToken.position || { top: 100, left: 100 },
          borderColor: existingToken.borderColor || getCharacterBorderColor(character.type),
          canPlayerMove: existingToken.canPlayerMove !== false,
          ownerId: character.userId,
          characterId: character.id,
          characterType: character.type,
          hidden: existingToken.hidden || false,
          locked: existingToken.locked || false,
          scale: existingToken.scale || 1,
          rotation: existingToken.rotation || 0,
          opacity: existingToken.opacity || 1
        })
      } else {
        // Create new token for character
        const characterData = character.data ? JSON.parse(character.data) : {}
        const avatarUrl = characterData.avatar || characterData.image || '/placeholder.svg'
        
        tokens.push({
          id: `token-${character.id}`,
          src: avatarUrl,
          alt: character.name,
          name: character.name,
          position: { top: 100, left: 100 },
          borderColor: getCharacterBorderColor(character.type),
          canPlayerMove: character.type === 'PC' || character.userId === session.user.id,
          ownerId: character.userId,
          characterId: character.id,
          characterType: character.type,
          hidden: false,
          locked: false,
          scale: 1,
          rotation: 0,
          opacity: 1
        })
      }
    }

    // Add tokens without characters (manual tokens)
    for (const token of gameTokens) {
      if (!token.characterId) {
        tokens.push({
          id: token.id,
          src: token.src || '/placeholder.svg',
          alt: token.alt || token.name || 'Token',
          name: token.name || token.alt || 'Token',
          position: token.position || { top: 100, left: 100 },
          borderColor: token.borderColor || 'border-gray-500',
          canPlayerMove: token.canPlayerMove !== false,
          ownerId: token.ownerId || null,
          characterId: null,
          characterType: null,
          hidden: token.hidden || false,
          locked: token.locked || false,
          scale: token.scale || 1,
          rotation: token.rotation || 0,
          opacity: token.opacity || 1
        })
      }
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

    // Ensure tokens are persisted in gameState for position persistence
    if (tokens.length > 0) {
      const currentGameTokens = gameState?.tokens ? JSON.parse(gameState.tokens) : []
      let needsUpdate = false
      
      // Check if any token is missing from gameState and add it
      for (const token of tokens) {
        const existsInGameState = currentGameTokens.find((gt: any) => gt.id === token.id)
        if (!existsInGameState) {
          currentGameTokens.push(token)
          needsUpdate = true
          console.log('📝 Adding token to gameState:', token.id)
        }
      }
      
      // Update gameState if needed
      if (needsUpdate) {
        await prisma.gameState.upsert({
          where: { campaignId },
          update: {
            tokens: JSON.stringify(currentGameTokens),
            lastActivity: new Date()
          },
          create: {
            campaignId,
            tokens: JSON.stringify(currentGameTokens),
            gameData: JSON.stringify({}),
            activeMapId: null
          }
        })
        console.log('💾 GameState updated with new tokens')
      }
    }

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🎮 POST /api/campaigns/[id]/tokens - Creating token from character')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const campaignId = resolvedParams.id
    const { characterId, position } = await request.json()

    console.log('🔍 Creating token for character:', characterId, 'at position:', position)

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

    // Get the character
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!character || character.campaignId !== campaignId) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Check if user can create token for this character
    const canCreateToken = isGM || character.userId === session.user.id

    if (!canCreateToken) {
      return NextResponse.json({ error: 'Cannot create token for this character' }, { status: 403 })
    }

    // Get current game state
    const gameState = await prisma.gameState.findUnique({
      where: { campaignId }
    })

    // Parse existing tokens
    const gameTokens = gameState?.tokens ? JSON.parse(gameState.tokens) : []

    // Create new token
    const characterData = character.data ? JSON.parse(character.data) : {}
    const avatarUrl = characterData.avatar || characterData.image || '/placeholder.svg'
    
    const newToken = {
      id: `token-${character.id}`,
      src: avatarUrl,
      alt: character.name,
      name: character.name,
      position: position || { top: 100, left: 100 },
      borderColor: getCharacterBorderColor(character.type),
      canPlayerMove: character.type === 'PC' || character.userId === session.user.id,
      ownerId: character.userId,
      characterId: character.id,
      characterType: character.type,
      hidden: false,
      locked: false,
      scale: 1,
      rotation: 0,
      opacity: 1
    }

    // Add to tokens list (replace if exists)
    const existingIndex = gameTokens.findIndex((token: any) => token.characterId === character.id)
    if (existingIndex >= 0) {
      gameTokens[existingIndex] = newToken
    } else {
      gameTokens.push(newToken)
    }

    // Update game state
    await prisma.gameState.upsert({
      where: { campaignId },
      update: {
        tokens: JSON.stringify(gameTokens),
        lastActivity: new Date()
      },
      create: {
        campaignId,
        tokens: JSON.stringify(gameTokens),
        gameData: JSON.stringify({}),
        activeMapId: null
      }
    })

    console.log('✅ Token created successfully for character:', character.name)

    return NextResponse.json({
      success: true,
      token: newToken
    })

  } catch (error) {
    console.error('Error creating token:', error)
    return NextResponse.json(
      { error: 'Failed to create token' },
      { status: 500 }
    )
  }
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
      return 'border-gray-500'
  }
}