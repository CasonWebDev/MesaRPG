import { Prisma, PlanType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

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

    if (plan === 'MONTHLY') {
      planExpiresAt = new Date(planStartedAt);
      planExpiresAt.setMonth(planStartedAt.getMonth() + 1);
    } else if (plan === 'ANNUAL') {
      planExpiresAt = new Date(planStartedAt);
      planExpiresAt.setFullYear(planStartedAt.getFullYear() + 1);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: plan,
        planStartedAt: planStartedAt,
        planExpiresAt: planExpiresAt,
      },
    });

    console.log(`HANDLER: Plano ${planKey} atualizado com sucesso para o usuário ${userId}.`);

  } catch (error) {
    console.error(`HANDLER: Erro ao atualizar o plano para o usuário ${userId}.`, error);
    // Re-throw para que o webhook possa capturar e retornar um erro 500
    throw new Error(`Erro no banco de dados ao atualizar o plano: ${error instanceof Error ? error.message : String(error)}`);
  }
}
