import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod'

const TransferCharacterSchema = z.object({
  newUserId: z.string().min(1, 'ID do usuário é obrigatório')
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params
    const campaignId = resolvedParams.id
    const characterId = resolvedParams.characterId
    const body = await request.json()
    
    // Validar dados de entrada
    const validationResult = TransferCharacterSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const { newUserId } = validationResult.data

    // Verificar se o usuário atual é o GM da campanha
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedCampaigns: {
          where: { id: campaignId }
        }
      }
    });

    if (!user || user.ownedCampaigns.length === 0) {
      return NextResponse.json({ error: 'Apenas o GM pode transferir personagens' }, { status: 403 });
    }

    // Verificar se o personagem existe e pertence à campanha
    const character = await prisma.character.findFirst({
      where: {
        id: characterId,
        campaignId: campaignId
      }
    });

    if (!character) {
      return NextResponse.json({ error: 'Personagem não encontrado' }, { status: 404 });
    }

    // Verificar se o novo usuário é membro da campanha
    const newUser = await prisma.user.findUnique({
      where: { id: newUserId },
      include: {
        campaignMemberships: {
          where: { campaignId: campaignId }
        }
      }
    });

    if (!newUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (newUser.campaignMemberships.length === 0) {
      return NextResponse.json({ error: 'Usuário não é membro desta campanha' }, { status: 400 });
    }

    // Verificar se o usuário de destino já tem um personagem PC nesta campanha
    const existingCharacter = await prisma.character.findFirst({
      where: {
        campaignId,
        userId: newUserId,
        type: 'PC'
      }
    })

    if (existingCharacter) {
      return NextResponse.json({ 
        error: 'Usuário já possui um personagem nesta campanha' 
      }, { status: 409 })
    }

    // Transferir o personagem
    const updatedCharacter = await prisma.character.update({
      where: { id: characterId },
      data: {
        userId: newUserId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Parse dos dados JSON para resposta
    const characterWithParsedData = {
      ...updatedCharacter,
      data: typeof updatedCharacter.data === 'string' ? JSON.parse(updatedCharacter.data) : updatedCharacter.data
    }

    return NextResponse.json({
      success: true,
      message: 'Personagem transferido com sucesso',
      character: characterWithParsedData
    });

  } catch (error) {
    console.error('Erro ao transferir personagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}