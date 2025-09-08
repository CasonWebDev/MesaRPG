'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function downgradeUserPlan() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error('Não autenticado')
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        plan: 'FREE',
        planStartedAt: null,
        planExpiresAt: null,
        subscriptionStatus: 'CANCELED',
      },
    })
    revalidatePath('/dashboard') // Invalida o cache para a UI atualizar
    return { success: true }
  } catch (error) {
    console.error('Falha ao reverter o plano:', error)
    return { success: false, error: 'Falha ao atualizar o plano.' }
  }
}
