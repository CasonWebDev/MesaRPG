import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, credits } = session.metadata || {};

      if (!userId || !credits) {
        console.error(`🔴 Metadata faltando na sessão de checkout: ${session.id}`);
        return NextResponse.json({ error: 'Metadata inválida.' }, { status: 400 });
      }

      console.log(`🟡 Tentando creditar ${credits} créditos para o usuário ${userId}`);

      try {
        const creditsToAdd = parseInt(credits, 10);
        if (isNaN(creditsToAdd)) {
          console.error(`🔴 Valor de créditos inválido na metadata: "${credits}"`);
          return NextResponse.json({ error: 'Valor de créditos inválido.' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            credits: {
              increment: creditsToAdd,
            },
          },
        });
        console.log(`🟢 Créditos adicionados com sucesso! Usuário ${userId} agora tem ${updatedUser.credits} créditos.`);
      
      } catch (dbError) {
        console.error('🔴 Erro ao atualizar o banco de dados.');
        if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
          console.error(`   - Código do Erro Prisma: ${dbError.code}`);
          console.error(`   - Mensagem: ${dbError.message}`);
          console.error(`   - Meta: ${JSON.stringify(dbError.meta)}`);
        } else {
          console.error(dbError);
        }
        return NextResponse.json({ error: 'Erro no banco de dados ao creditar o usuário.' }, { status: 500 });
      }
      break;
    default:
      console.warn(`🟡 Evento de webhook não tratado: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
