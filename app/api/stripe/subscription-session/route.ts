import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

const planPriceIds: { [key: string]: string } = {
  MONTHLY: process.env.STRIPE_MONTHLY_PLAN_PRICE_ID!,
  ANNUAL: process.env.STRIPE_ANNUAL_PLAN_PRICE_ID!,
  LIFETIME: process.env.STRIPE_LIFETIME_PLAN_PRICE_ID!,
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { planKey } = body;

    if (!planKey || !planPriceIds[planKey]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    const priceId = planPriceIds[planKey];
    const mode = planKey === 'LIFETIME' ? 'payment' : 'subscription';

    const YOUR_DOMAIN = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${YOUR_DOMAIN}/dashboard?payment_success=true`,
      cancel_url: `${YOUR_DOMAIN}/dashboard?payment_canceled=true`,
      metadata: {
        userId: session.user.id,
        planKey: planKey,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });

  } catch (error) {
    console.error('Erro ao criar sessão de assinatura:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
