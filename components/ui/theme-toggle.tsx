"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/providers/theme-provider"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ThemeToggle({ 
  className, 
  variant = "ghost", 
  size = "icon" 
}: ThemeToggleProps) {
  const { theme, toggleTheme, isLoading } = useTheme()

  if (isLoading) {
    return (
      <Button 
        variant={variant} 
        size={size} 
        className={cn("relative", className)}
        disabled
      >
        <div className="h-4 w-4 animate-pulse bg-muted rounded" />
        <span className="sr-only">Carregando tema...</span>
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("relative", className)}
      onClick={toggleTheme}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">
        {theme === "light" ? "Mudar para tema escuro" : "Mudar para tema claro"}
      </span>
    </Button>
  )
}

export function ThemeToggleWithText({ 
  className, 
  variant = "ghost" 
}: Omit<ThemeToggleProps, "size">) {
  const { theme, toggleTheme, isLoading } = useTheme()

  if (isLoading) {
    return (
      <Button 
        variant={variant} 
        className={cn("justify-start", className)}
        disabled
      >
        <div className="h-4 w-4 animate-pulse bg-muted rounded mr-2" />
        Carregando...
      </Button>
    )
  }

  return (
    <Button
      variant={variant}
      className={cn("justify-start", className)}
      onClick={toggleTheme}
    >
      {theme === "light" ? 
      <Sun className="h-4 w-1 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      :
      <Moon className="h-4 w-1 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      }
      <span className="ml-6">
        {theme === "light" ? "Tema Escuro" : "Tema Claro"}
      </span>
    </Button>
  )
}