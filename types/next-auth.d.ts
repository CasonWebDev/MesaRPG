import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
      plan: string
      credits: number
      planStartedAt?: string | null
      planExpiresAt?: string | null
      justDowngraded?: boolean
      subscriptionStatus?: string | null; // Adicionado
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    plan: string
    credits: number
    planStartedAt?: Date | null
    planExpiresAt?: Date | null
    justDowngraded?: boolean
    subscriptionStatus?: string | null; // Adicionado
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    plan: string
    credits: number
    planStartedAt?: string | null
    planExpiresAt?: string | null
    justDowngraded?: boolean
    subscriptionStatus?: string | null; // Adicionado
  }
}