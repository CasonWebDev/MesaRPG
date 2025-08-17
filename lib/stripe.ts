import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('A chave secreta do Stripe não está definida nas variáveis de ambiente');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // Use a versão mais recente da API
  typescript: true,
});
