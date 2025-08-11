import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { verifySolution } from 'altcha-lib'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        altcha: { label: 'Altcha', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciais ausentes.');
        }

        if (!credentials.altcha) {
          throw new Error('Verificação anti-bot falhou. Tente novamente.');
        }

        const verified = await verifySolution(
          credentials.altcha,
          process.env.ALTCHA_HMAC_KEY
        );
        if (!verified) {
          throw new Error('Verificação anti-bot inválida.');
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            throw new Error('Credenciais inválidas.');
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Credenciais inválidas.");
          }

          let userToReturn = { ...user, justDowngraded: false };

          // VERIFICAÇÃO DE EXPIRAÇÃO DO PLANO
          const isPaidPlan = ['MONTHLY', 'ANNUAL'].includes(user.plan);
          if (isPaidPlan && user.planExpiresAt && new Date() > user.planExpiresAt) {
            // 1. Buscar as campanhas do usuário, da mais nova para a mais antiga
            const userCampaigns = await prisma.campaign.findMany({
              where: { ownerId: user.id },
              orderBy: { createdAt: 'desc' },
            });

            // 2. Arquivar todas, exceto a mais recente
            if (userCampaigns.length > 1) {
              const campaignsToArchive = userCampaigns.slice(1).map(c => c.id);
              await prisma.campaign.updateMany({
                where: { id: { in: campaignsToArchive } },
                data: { isArchived: true },
              });
            }

            // 3. Fazer o downgrade do plano do usuário
            const updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: {
                plan: 'FREE',
                planStartedAt: null,
                planExpiresAt: null,
                subscriptionStatus: 'CANCELED',
              },
            });
            userToReturn = { 
              ...updatedUser, 
              justDowngraded: true,
              planStartedAt: user.planStartedAt, 
              planExpiresAt: user.planExpiresAt,
            };
          }

          // Retorna um objeto PLAIN com os dados do usuário (possivelmente atualizados)
          return {
            id: userToReturn.id,
            email: userToReturn.email,
            name: userToReturn.name,
            role: userToReturn.role.toString(),
            plan: userToReturn.plan,
            credits: userToReturn.credits,
            planStartedAt: userToReturn.planStartedAt,
            planExpiresAt: userToReturn.planExpiresAt,
            justDowngraded: userToReturn.justDowngraded,
          };
        } catch (error) {
          console.error("Auth error:", error);
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error("Ocorreu um erro durante a autenticação.");
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.plan = user.plan;
        token.credits = user.credits;
        if (user.justDowngraded) {
          token.justDowngraded = true;
          token.planStartedAt = user.planStartedAt?.toISOString();
          token.planExpiresAt = user.planExpiresAt?.toISOString();
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.plan = token.plan as string;
        session.user.credits = token.credits as number;
        if (token.justDowngraded) {
          session.user.justDowngraded = true;
          session.user.planStartedAt = token.planStartedAt;
          session.user.planExpiresAt = token.planExpiresAt;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signUp: '/register'
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
  debug: process.env.NODE_ENV === 'development',
  basePath: '/api/auth'
}