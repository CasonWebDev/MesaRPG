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
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id

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

    // Get all campaign content
    const [maps, characters, handouts, templates, gameState] = await Promise.all([
      // Maps
      prisma.map.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Characters (NPCs and creatures for GM, PCs for players)
      prisma.character.findMany({
        where: {
          campaignId,
          ...(isGM ? {} : { type: 'PC', userId: session.user.id })
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Handouts (only shared ones for players)
      prisma.handout.findMany({
        where: {
          campaignId,
          ...(isGM ? {} : { isShared: true })
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Templates
      prisma.sheetTemplate.findMany({
        where: { campaignId },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Game state
      prisma.gameState.findUnique({
        where: { campaignId }
      })
    ])

    // Format the response
    const content = {
      maps: maps.map((map: any) => ({
        id: map.id,
        name: map.name,
        description: map.description,
        imageUrl: map.imageUrl,
        isActive: map.isActive,
        gridSize: map.gridSize,
        createdAt: map.createdAt.toISOString()
      })),
      
      characters: characters.map((char: any) => ({
        id: char.id,
        name: char.name,
        type: char.type,
        description: char.description,
        imageUrl: char.imageUrl,
        stats: char.stats ? JSON.parse(char.stats) : {},
        userId: char.userId,
        createdAt: char.createdAt.toISOString()
      })),
      
      handouts: handouts.map((handout: any) => ({
        id: handout.id,
        title: handout.title,
        content: handout.content,
        imageUrl: handout.imageUrl,
        isShared: handout.isShared,
        createdAt: handout.createdAt.toISOString()
      })),
      
      templates: templates.map((template: any) => ({
        id: template.id,
        name: template.name,
        type: template.type,
        fields: template.fields ? JSON.parse(template.fields) : [],
        createdAt: template.createdAt.toISOString()
      })),
      
      gameState: gameState ? {
        tokens: gameState.tokens ? JSON.parse(gameState.tokens) : [],
        activeMapId: gameState.activeMapId,
        gameData: gameState.gameData ? JSON.parse(gameState.gameData) : {},
        lastActivity: gameState.lastActivity.toISOString()
      } : null,
      
      permissions: {
        isGM,
        isPlayer,
        canCreateMaps: isGM,
        canCreateNPCs: isGM,
        canCreateCreatures: isGM,
        canCreateHandouts: isGM,
        canCreateTemplates: isGM,
        canShareHandouts: isGM,
        canActivateMaps: isGM
      }
    }

    return NextResponse.json(content)

  } catch (error) {
    console.error('Error loading campaign content:', error)
    return NextResponse.json(
      { error: 'Failed to load campaign content' },
      { status: 500 }
    )
  }
}