import { Prisma, PlanType, SubscriptionStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';

export async function handleSubscriptionChange(session: Stripe.Checkout.Session) {
  const { userId, planKey } = session.metadata || {};

  if (!userId || !planKey) {
    throw new Error(`Metadata inválida: userId ou planKey ausente na sessão ${session.id}`);
  }

  console.log(`HANDLER: Iniciando atualização de plano para ${planKey} para o usuário ${userId}`);

  try {
    const plan = planKey as PlanType;
    const planStartedAt = new Date();
    let planExpiresAt: Date | null = null;
    let stripeSubscriptionId: string | null = null;
    let stripePriceId: string | null = null;
    let stripeCurrentPeriodEnd: Date | null = null;
    let subscriptionStatus: SubscriptionStatus = 'ACTIVE';

    // Para assinaturas recorrentes, buscar o subscription ID
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      stripeSubscriptionId = subscription.id;
      stripePriceId = subscription.items.data[0]?.price.id || null;
      stripeCurrentPeriodEnd = new Date(subscription.current_period_end * 1000);
      planExpiresAt = stripeCurrentPeriodEnd; // Corrigido: Usar a data do Stripe
    } else if (session.mode === 'payment' && plan === 'LIFETIME') {
      // Para o plano vitalício (pagamento único), não há subscription ID
      // O priceId pode ser obtido do line_items se necessário para auditoria
      stripePriceId = session.line_items?.data[0]?.price?.id || null;
      planExpiresAt = null; // Vitalício não expira
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: plan,
        planStartedAt: planStartedAt,
        planExpiresAt: planExpiresAt, // Agora está correto
        stripeSubscriptionId: stripeSubscriptionId,
        stripePriceId: stripePriceId,
        stripeCurrentPeriodEnd: stripeCurrentPeriodEnd,
        subscriptionStatus: subscriptionStatus,
      },
    });

    console.log(`HANDLER: Plano ${planKey} atualizado com sucesso para o usuário ${userId}.`);

  } catch (error) {
    console.error(`HANDLER: Erro ao atualizar o plano para o usuário ${userId}.`, error);
    throw new Error(`Erro no banco de dados ao atualizar o plano: ${error instanceof Error ? error.message : String(error)}`);
  }
}
