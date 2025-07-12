import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Update specific token properties
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tokenId: string }> }
) {
  try {
    console.log('🔧 PATCH /api/campaigns/[id]/tokens/[tokenId] - Update token properties')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const campaignId = resolvedParams.id
    const tokenId = resolvedParams.tokenId
    const updates = await request.json()

    console.log('🔍 Token update request:', { campaignId, tokenId, updates })

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

    if (!gameState) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 })
    }

    // Parse tokens
    const tokens = gameState.tokens ? JSON.parse(gameState.tokens) : []
    const tokenIndex = tokens.findIndex((token: any) => token.id === tokenId)

    if (tokenIndex === -1) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    const currentToken = tokens[tokenIndex]

    // Check permissions for specific updates
    if (updates.hasOwnProperty('hidden') || updates.hasOwnProperty('locked')) {
      if (!isGM) {
        return NextResponse.json({ error: 'Only GM can change visibility/lock state' }, { status: 403 })
      }
    }

    if (updates.hasOwnProperty('ownerId')) {
      if (!isGM) {
        return NextResponse.json({ error: 'Only GM can change token ownership' }, { status: 403 })
      }
    }

    if (updates.hasOwnProperty('position')) {
      // Check if user can move this token
      const canMove = isGM || 
                     (currentToken.ownerId === session.user.id) || 
                     (currentToken.canPlayerMove !== false && !isGM)

      if (!canMove) {
        return NextResponse.json({ error: 'Cannot move this token' }, { status: 403 })
      }
    }

    // Apply updates to token
    const updatedToken = {
      ...currentToken,
      ...updates,
      // Ensure certain fields are handled correctly
      hidden: updates.hasOwnProperty('hidden') ? updates.hidden : currentToken.hidden,
      canPlayerMove: updates.hasOwnProperty('locked') ? !updates.locked : currentToken.canPlayerMove,
      lastUpdated: new Date().toISOString()
    }

    // Update tokens array
    tokens[tokenIndex] = updatedToken

    // Save updated game state
    await prisma.gameState.update({
      where: { campaignId },
      data: {
        tokens: JSON.stringify(tokens),
        lastActivity: new Date()
      }
    })

    console.log('✅ Token updated successfully:', updatedToken.name, updates)

    return NextResponse.json({
      success: true,
      token: updatedToken,
      updates: updates
    })

  } catch (error) {
    console.error('❌ Error updating token:', error)
    return NextResponse.json(
      { error: 'Failed to update token' },
      { status: 500 }
    )
  }
}

// Get specific token details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tokenId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const campaignId = resolvedParams.id
    const tokenId = resolvedParams.tokenId

    // Check access
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

    // Get game state and find token
    const gameState = await prisma.gameState.findUnique({
      where: { campaignId }
    })

    if (!gameState) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 })
    }

    const tokens = gameState.tokens ? JSON.parse(gameState.tokens) : []
    const token = tokens.find((t: any) => t.id === tokenId)

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    // Filter token visibility for players
    if (!isGM && token.hidden && token.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    return NextResponse.json({
      token: token
    })

  } catch (error) {
    console.error('Error getting token:', error)
    return NextResponse.json(
      { error: 'Failed to get token' },
      { status: 500 }
    )
  }
}

// PUT method for direct token updates (position, etc)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tokenId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const campaignId = resolvedParams.id
    const tokenId = resolvedParams.tokenId
    const updates = await request.json()

    console.log('📍 PUT token update:', { tokenId, updates })

    // Check campaign access
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

    // Try to update in new Token schema first
    try {
      const existingToken = await prisma.token.findUnique({
        where: { id: tokenId }
      })

      if (existingToken) {
        // Check permissions
        const canMove = isGM || existingToken.ownerId === session.user.id
        if (!canMove) {
          return NextResponse.json({ error: 'Cannot move this token' }, { status: 403 })
        }

        // Prepare update data for new schema (normalized coordinates)
        const updateData: any = { ...updates }
        
        // Remove position field for new schema, use x/y instead
        if (updates.position) {
          updateData.x = updates.x || existingToken.x
          updateData.y = updates.y || existingToken.y
          delete updateData.position
        }
        
        updateData.updatedAt = new Date()

        const updatedToken = await prisma.token.update({
          where: { id: tokenId },
          data: updateData
        })

        console.log('✅ Token updated in new schema:', updatedToken.name, 'new position:', { x: updatedToken.x, y: updatedToken.y })
        return NextResponse.json({ success: true, token: updatedToken })
      }
    } catch (error) {
      console.log('⚠️ Token not in new schema, updating GameState:', error)
    }

    // Fallback to GameState update
    const gameState = await prisma.gameState.findUnique({
      where: { campaignId }
    })

    if (!gameState) {
      return NextResponse.json({ error: 'Game state not found' }, { status: 404 })
    }

    const tokens = gameState.tokens ? JSON.parse(gameState.tokens) : []
    const tokenIndex = tokens.findIndex((token: any) => token.id === tokenId)

    if (tokenIndex === -1) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    // Update token in GameState (pixel coordinates)
    const currentToken = tokens[tokenIndex]
    const updatedToken = {
      ...currentToken,
      ...updates,
      lastUpdated: new Date().toISOString()
    }
    
    // Ensure position is properly set for GameState schema
    if (updates.position) {
      updatedToken.position = updates.position
    }
    
    tokens[tokenIndex] = updatedToken

    await prisma.gameState.update({
      where: { campaignId },
      data: {
        tokens: JSON.stringify(tokens),
        lastActivity: new Date()
      }
    })

    console.log('✅ Token updated in GameState:', updatedToken.name, 'position:', updatedToken.position)
    return NextResponse.json({ success: true, token: updatedToken })

  } catch (error) {
    console.error('❌ Error updating token:', error)
    return NextResponse.json(
      { error: 'Failed to update token' },
      { status: 500 }
    )
  }
}