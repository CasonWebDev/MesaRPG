import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; handoutId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id
    const handoutId = params.handoutId
    const { sharedWith } = await request.json()

    if (!Array.isArray(sharedWith)) {
      return NextResponse.json(
        { error: 'sharedWith deve ser um array de emails' },
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
      return NextResponse.json({ error: 'Apenas o GM pode compartilhar handouts' }, { status: 403 })
    }

    // Verificar se o handout existe e pertence à campanha
    const existingHandout = await prisma.handout.findFirst({
      where: { 
        id: handoutId,
        campaignId 
      }
    })

    if (!existingHandout) {
      return NextResponse.json({ error: 'Handout não encontrado' }, { status: 404 })
    }

    // Verificar se todos os emails pertencem a membros da campanha
    const campaignMembers = await prisma.campaignMember.findMany({
      where: { campaignId },
      include: {
        user: { select: { email: true } }
      }
    })

    const memberEmails = campaignMembers.map(member => member.user.email)
    const invalidEmails = sharedWith.filter(email => !memberEmails.includes(email))

    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Emails não são membros da campanha: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    const handout = await prisma.handout.update({
      where: { id: handoutId },
      data: {
        sharedWith: JSON.stringify(sharedWith)
      }
    })

    return NextResponse.json({ handout })
  } catch (error) {
    console.error('Erro ao compartilhar handout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}