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

    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: creditsToAdd,
        },
      },
    });

    console.log(`HANDLER: Créditos adicionados com sucesso para o usuário ${userId}.`);

  } catch (error) {
    console.error(`HANDLER: Erro ao creditar o usuário ${userId}.`, error);
    // Re-throw para que o webhook possa capturar e retornar um erro 500
    throw new Error(`Erro no banco de dados ao creditar o usuário: ${error instanceof Error ? error.message : String(error)}`);
  }
}
