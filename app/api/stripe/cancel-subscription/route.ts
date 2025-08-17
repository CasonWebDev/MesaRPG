import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeSubscriptionId: true, planExpiresAt: true },
    });

    if (!user || !user.stripeSubscriptionId) {
      return NextResponse.json({ error: 'Assinatura não encontrada para este usuário.' }, { status: 404 });
    }

    // Cancelar a assinatura no Stripe para não renovar no final do período
    const subscription = await stripe.subscriptions.update(
      user.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );

    // Atualizar o status da assinatura no nosso banco de dados
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionStatus: SubscriptionStatus.CANCELED,
        // O planExpiresAt já deve estar correto, mas podemos garantir que não será nulo
        planExpiresAt: user.planExpiresAt || new Date(subscription.current_period_end * 1000),
      },
    });

    return NextResponse.json({
      message: 'Assinatura agendada para cancelamento. Permanecerá ativa até o final do período atual.',
      cancelAt: user.planExpiresAt,
    });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
