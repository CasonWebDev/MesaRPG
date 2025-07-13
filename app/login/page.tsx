"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Verificar se há um convite pendente
  const inviteToken = searchParams.get('invite')

  useEffect(() => {
    if (inviteToken) {
      // Armazenar o token no localStorage para uso após o login
      localStorage.setItem('pendingInvite', inviteToken)
    }
  }, [inviteToken])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Credenciais inválidas. Tente novamente.")
        toast({
          title: "Erro no login",
          description: "Credenciais inválidas. Verifique seus dados e tente novamente.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta ao MesaRPG.",
        })
        
        // Verificar se há um convite pendente
        const pendingInvite = localStorage.getItem('pendingInvite')
        if (pendingInvite) {
          localStorage.removeItem('pendingInvite')
          router.replace(`/invite/${pendingInvite}`)
        } else {
          // Use replace instead of push to avoid back button issues
          router.replace("/dashboard")
        }
      }
    } catch (error) {
      setError("Erro interno do servidor. Tente novamente mais tarde.")
      toast({
        title: "Erro no login",
        description: "Erro interno do servidor. Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/placeholder.svg?width=1920&height=1080')" }}
    >
      <Card className="w-full max-w-sm bg-parchment/90 backdrop-blur-sm text-ink-text">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-heading">MesaRPG</CardTitle>
          <CardDescription className="text-ink-text/80">
            {inviteToken ? "Faça login para aceitar o convite" : "Sua aventura começa aqui."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid w-full items-center gap-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="mestre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-stone-50/50"
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-stone-50/50"
                  autoComplete="current-password"
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <Button
            type="submit"
            className="w-full"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
          <div className="text-center text-sm">
            <p className="text-ink-text/80">
              Não tem uma conta?{" "}
              <Link href="/register" className="font-bold text-primary hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </main>
  )
}