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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        maps: {
          orderBy: { createdAt: 'desc' }
        },
        characters: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        handouts: {
          orderBy: { createdAt: 'desc' }
        },
        sheetTemplates: {
          orderBy: { createdAt: 'desc' }
        },
        gameState: true
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    // Verificar se o usuário tem acesso à campanha
    const isGM = campaign.ownerId === session.user.id
    const isPlayer = campaign.members.some(p => p.userId === session.user.id)

    if (!isGM && !isPlayer) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Erro ao buscar campanha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id
    const { name, description, settings, rpgSystem } = await request.json()

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    // Apenas o GM pode editar a campanha
    if (campaign.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name,
        description,
        settings: settings ? JSON.stringify(settings) : undefined,
        rpgSystem: rpgSystem || undefined
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ campaign: updatedCampaign })
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
    }

    // Apenas o GM pode deletar a campanha
    if (campaign.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    await prisma.campaign.delete({
      where: { id: campaignId }
    })

    return NextResponse.json({ message: 'Campanha deletada com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar campanha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}