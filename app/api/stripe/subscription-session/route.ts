import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

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

    // Buscar o usuário completo para garantir que temos todos os dados
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    // Se o usuário não tem um customerId, crie um novo no Stripe
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      // Salvar o customerId no nosso banco de dados
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId, // Usar o customerId existente ou recém-criado
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${YOUR_DOMAIN}/payment/success`,
      cancel_url: `${YOUR_DOMAIN}/dashboard?payment_canceled=true`,
      metadata: {
        userId: user.id,
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
