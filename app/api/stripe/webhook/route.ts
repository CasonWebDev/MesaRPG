import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { handleSubscriptionChange } from '@/lib/services/stripe-subscription-handler';
import { handleCreditsPurchase } from '@/lib/services/stripe-credits-handler';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = headers().get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      console.error('🔴 Stripe signature or webhook secret is missing.');
      return NextResponse.json({ error: 'Webhook secret não configurado.' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.log(`🟢 Webhook verificado com sucesso: ${event.id}`);

  } catch (err: any) {
    console.error(`🔴 Erro na verificação do webhook: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`🟡 Processando evento: ${event.type}`);
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const { planKey, credits } = session.metadata || {};

        if (planKey) {
          await handleSubscriptionChange(session);
        } else if (credits) {
          await handleCreditsPurchase(session);
        } else {
          console.warn(`🟡 Metadata da sessão ${session.id} não contém planKey ou credits.`);
        }
        break;
      // TODO: Adicionar case para 'invoice.payment_succeeded' para renovações
      default:
        console.warn(`🟡 Evento de webhook não tratado: ${event.type}`);
    }
  } catch (error) {
    console.error('🔴 Erro ao processar evento do webhook:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
