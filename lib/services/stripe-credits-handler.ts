import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function handleCreditsPurchase(session: Stripe.Checkout.Session) {
  const { userId, credits } = session.metadata || {};

  if (!userId || !credits) {
    throw new Error(`Metadata inválida: userId ou credits ausente na sessão ${session.id}`);
  }

  console.log(`HANDLER: Tentando creditar ${credits} créditos para o usuário ${userId}`);

  try {
    const creditsToAdd = parseInt(credits, 10);
    if (isNaN(creditsToAdd)) {
      throw new Error(`Valor de créditos inválido na metadata: "${credits}"`);
    }

    // Obter o PaymentIntent para detalhes da transação
    const paymentIntentId = typeof session.payment_intent === 'string' 
      ? session.payment_intent 
      : session.payment_intent?.id;

    if (!paymentIntentId) {
      throw new Error(`Payment Intent ID ausente na sessão ${session.id}`);
    }

    // Obter o objeto PaymentIntent completo para detalhes de valor e moeda
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      throw new Error(`Payment Intent ${paymentIntentId} não encontrado.`);
    }

    // Atualizar os créditos do usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: creditsToAdd,
        },
      },
    });

    // Criar um registro de compra de crédito para auditoria
    await prisma.creditPurchase.create({
      data: {
        userId: userId,
        stripePaymentIntentId: paymentIntent.id,
        creditsPurchased: creditsToAdd,
        amountPaid: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        purchasedAt: new Date(paymentIntent.created * 1000), // Convert timestamp to Date
      },
    });

    console.log(`HANDLER: Créditos adicionados e registro de compra criado com sucesso para o usuário ${userId}.`);

  } catch (error) {
    console.error(`HANDLER: Erro ao creditar o usuário ${userId}.`, error);
    throw new Error(`Erro no banco de dados ao creditar o usuário: ${error instanceof Error ? error.message : String(error)}`);
  }
}
