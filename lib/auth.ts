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

          // Retorna um objeto PLAIN com tipos serializáveis
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role.toString(), // Garante que o enum seja uma string
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
      // Na primeira vez (login), o objeto 'user' está disponível
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Adiciona as propriedades do token ao objeto da sessão
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
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