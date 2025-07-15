import type React from "react"
import type { Metadata } from "next"
import { Open_Sans, Libre_Baskerville } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
})

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-libre-baskerville",
})

export const metadata: Metadata = {
  title: "D&D Character Sheet",
  description: "An automated character sheet for D&D 5e, based on your PRD.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn("min-h-screen bg-background font-sans antialiased", openSans.variable, libreBaskerville.variable)}
      >
        {children}
      </body>
    </html>
  )
}
