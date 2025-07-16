import type React from "react"
import type { Metadata } from "next"
import { Cinzel_Decorative, Lato } from "next/font/google"
import { ClientProviders } from "@/components/providers/client-providers"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import "./globals.css"
import { cn } from "@/lib/utils"

const fontHeading = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-heading",
})

const fontBody = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
})

export const metadata: Metadata = {
  title: "MesaRPG - Sua Aventura Começa Aqui",
  description: "Uma plataforma de Virtual Tabletop para suas campanhas de RPG.",
  generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)
  
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={cn("antialiased bg-background text-foreground", fontHeading.variable, fontBody.variable)}>
        <ClientProviders session={session}>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
