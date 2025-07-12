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
    const { name, content, attachments } = await request.json()

    if (!name || !content) {
      return NextResponse.json(
        { error: 'Nome e conteúdo são obrigatórios' },
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
      return NextResponse.json({ error: 'Apenas o GM pode editar handouts' }, { status: 403 })
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

    const handout = await prisma.handout.update({
      where: { id: handoutId },
      data: {
        name,
        content,
        attachments: JSON.stringify(attachments || [])
      }
    })

    return NextResponse.json({ handout })
  } catch (error) {
    console.error('Erro ao atualizar handout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: 'Apenas o GM pode deletar handouts' }, { status: 403 })
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

    await prisma.handout.delete({
      where: { id: handoutId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar handout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}