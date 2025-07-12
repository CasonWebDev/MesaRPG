// Token-Character Linking API
// Handles linking and unlinking tokens to/from characters

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/campaigns/[id]/tokens/[tokenId]/link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tokenId: string }> }
) {
  try {
    console.log('🔗 POST /api/campaigns/[id]/tokens/[tokenId]/link - Linking token to character')

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { id: campaignId, tokenId } = resolvedParams
    const { characterId } = await request.json()

    console.log('🔍 Linking token:', tokenId, 'to character:', characterId)

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

    // Get the character to validate ownership
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    })

    if (!character || character.campaignId !== campaignId) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Check if user can link this character
    const canLinkCharacter = isGM || character.userId === session.user.id

    if (!canLinkCharacter) {
      return NextResponse.json({ error: 'Cannot link to this character' }, { status: 403 })
    }

    // Get or create token in new schema
    let token = await prisma.token.findUnique({
      where: { id: tokenId }
    })

    if (!token) {
      // Create token if it doesn't exist in new schema (migration from GameState)
      const characterData = character.data ? JSON.parse(character.data) : {}
      const avatarUrl = characterData.avatar || characterData.image || '/placeholder.svg'
      
      token = await prisma.token.create({
        data: {
          id: tokenId,
          campaignId,
          name: character.name,
          x: 0.5, // Default center position
          y: 0.5,
          imageUrl: avatarUrl,
          characterId,
          ownerId: character.userId || session.user.id,
          type: character.type as any, // PC, NPC, CREATURE
          autoCreated: true,
          syncAvatar: true,
          borderColor: getCharacterBorderColor(character.type),
          canPlayerMove: character.type === 'PC',
          createdBy: session.user.id,
          ownershipType: 'character'
        }
      })
    } else {
      // Update existing token with character link
      const characterData = character.data ? JSON.parse(character.data) : {}
      const avatarUrl = characterData.avatar || characterData.image

      token = await prisma.token.update({
        where: { id: tokenId },
        data: {
          characterId,
          ownerId: character.userId || session.user.id,
          type: character.type as any,
          syncAvatar: true,
          ownershipType: 'character',
          lastSyncAt: new Date(),
          ...(avatarUrl && { imageUrl: avatarUrl })
        }
      })
    }

    console.log('✅ Token successfully linked to character')

    return NextResponse.json({
      success: true,
      token: {
        id: token.id,
        characterId: token.characterId,
        ownerId: token.ownerId,
        syncAvatar: token.syncAvatar,
        ownershipType: token.ownershipType
      }
    })

  } catch (error) {
    console.error('❌ Error linking token to character:', error)
    return NextResponse.json(
      { error: 'Failed to link token to character' },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id]/tokens/[tokenId]/link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tokenId: string }> }
) {
  try {
    console.log('🔗 DELETE /api/campaigns/[id]/tokens/[tokenId]/link - Unlinking token from character')

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { id: campaignId, tokenId } = resolvedParams

    console.log('🔍 Unlinking token:', tokenId)

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

    // Get the token
    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: { character: true }
    })

    if (!token || token.campaignId !== campaignId) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    // Check if user can unlink this token
    const canUnlink = isGM || token.ownerId === session.user.id

    if (!canUnlink) {
      return NextResponse.json({ error: 'Cannot unlink this token' }, { status: 403 })
    }

    // Update token to remove character link
    const updatedToken = await prisma.token.update({
      where: { id: tokenId },
      data: {
        characterId: null,
        type: 'CUSTOM',
        syncAvatar: false,
        ownershipType: 'manual',
        lastSyncAt: null,
        ownerId: session.user.id // Transfer ownership to current user
      }
    })

    console.log('✅ Token successfully unlinked from character')

    return NextResponse.json({
      success: true,
      token: {
        id: updatedToken.id,
        characterId: null,
        ownerId: updatedToken.ownerId,
        syncAvatar: false,
        ownershipType: 'manual'
      }
    })

  } catch (error) {
    console.error('❌ Error unlinking token from character:', error)
    return NextResponse.json(
      { error: 'Failed to unlink token from character' },
      { status: 500 }
    )
  }
}

function getCharacterBorderColor(type: string): string {
  switch (type) {
    case 'PC':
      return '#3b82f6' // Blue
    case 'NPC':
      return '#10b981' // Green
    case 'CREATURE':
      return '#ef4444' // Red
    default:
      return '#6b7280' // Gray
  }
}