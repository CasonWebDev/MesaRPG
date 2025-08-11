import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const campaignId = params.id;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, credits: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (user.plan !== 'CREDITS') {
      return NextResponse.json({ error: 'Esta função está disponível apenas para usuários do plano de Créditos.' }, { status: 403 });
    }

    if (user.credits <= 0) {
      return NextResponse.json({ error: 'Você não tem créditos suficientes para reativar esta campanha.' }, { status: 403 });
    }

    const [updatedUser, updatedCampaign] = await prisma.$transaction([
      // Debita um crédito
      prisma.user.update({
        where: { id: session.user.id },
        data: { credits: { decrement: 1 } },
      }),
      // Reativa a campanha
      prisma.campaign.update({
        where: { id: campaignId },
        data: {
          isArchived: false,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })
    ]);

    return NextResponse.json({ campaign: updatedCampaign });
  } catch (error) {
    console.error('Erro ao reativar campanha:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
