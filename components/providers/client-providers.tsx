"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "./theme-provider"
import type { Session } from "next-auth"

interface ClientProvidersProps {
  children: React.ReactNode
  session?: Session | null
}

export function ClientProviders({ 
  children, 
  session 
}: ClientProvidersProps) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  )
}