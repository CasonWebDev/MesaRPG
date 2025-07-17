# 🔐 Sistema de Autenticação

## 📋 Visão Geral

O MesaRPG implementa um sistema de autenticação robusto baseado em NextAuth.js com provider de credenciais, oferecendo registro, login, proteção de rotas e gerenciamento de sessões seguro.

## 🏗️ Arquitetura

### **Stack de Autenticação**
- **NextAuth.js v4**: Framework de autenticação principal
- **Credentials Provider**: Autenticação via email/senha
- **bcryptjs**: Hash de senhas seguro
- **JWT**: Tokens de sessão
- **Prisma**: Persistência de usuários
- **Middleware**: Proteção de rotas

### **Fluxo de Autenticação**
```
1. User Input → 2. Validation → 3. Database Check → 4. JWT Token → 5. Session Creation
```

## 🔧 Implementação Técnica

### **Configuração NextAuth** (`lib/auth.ts`)
```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validation + Database lookup + Password verification
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email }
        })
        
        if (user && await bcrypt.compare(credentials?.password, user.password)) {
          return { id: user.id, email: user.email, name: user.name }
        }
        return null
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login"
  },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.userId = user.id
      }
      return token
    },
    session: ({ session, token }) => {
      if (token) {
        session.userId = token.userId
      }
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  }
}
```

### **Middleware de Proteção** (`middleware.ts`)
```typescript
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/campaign/')) {
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/campaign/:path*']
}
```

## 📱 Páginas de Autenticação

### **Página de Login** (`app/login/page.tsx`)
```typescript
export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false
    })
    
    if (result?.error) {
      toast({
        title: "Erro no login",
        description: "Email ou senha incorretos",
        variant: "destructive"
      })
    } else {
      router.push("/dashboard")
    }
    
    setLoading(false)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        type="email" 
        value={formData.email}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
        required 
      />
      <Input 
        type="password" 
        value={formData.password}
        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
        required 
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  )
}
```

### **Página de Registro** (`app/register/page.tsx`)
```typescript
const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
})

export default function RegisterPage() {
  const handleSubmit = async (e: React.FormEvent) => {
    // Validate form data
    const validatedData = registerSchema.parse(formData)
    
    // API call
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validatedData)
    })
    
    if (response.ok) {
      // Auto-login after registration
      await signIn("credentials", {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false
      })
      router.push("/dashboard")
    }
  }
  
  // Form rendering with validation
}
```

## 🔌 API de Autenticação

### **Registro de Usuário** (`app/api/auth/register/route.ts`)
```typescript
const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 400 }
      )
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: "PLAYER"
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      user 
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
```

## 🛡️ Modelo de Segurança

### **Roles e Permissões**
```typescript
enum Role {
  GM = "GM",           // Game Master - pode criar campanhas
  PLAYER = "PLAYER",   // Jogador - pode participar de campanhas
  ADMIN = "ADMIN"      // Administrador - acesso total
}

// Verificação de permissões
function hasPermission(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy = {
    ADMIN: 3,
    GM: 2,
    PLAYER: 1
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}
```

### **Validação de Sessão**
```typescript
// Utility para verificar sessão em Server Components
export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    redirect("/login")
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true
    }
  })
  
  if (!user) {
    redirect("/login")
  }
  
  return user
}
```

## 🔐 Segurança Implementada

### **Proteções**
- **Password Hashing**: bcrypt com salt factor 12
- **JWT Tokens**: Tokens seguros com expiração
- **Route Protection**: Middleware automático
- **Input Validation**: Zod schemas em todas as entradas
- **CSRF Protection**: NextAuth.js built-in
- **Session Management**: Tokens com expiração configurável

### **Validações**
- **Email Format**: Regex validation
- **Password Strength**: Mínimo 6 caracteres
- **Rate Limiting**: Proteção contra brute force (recomendado)
- **SQL Injection**: Prisma ORM protection
- **XSS Prevention**: React built-in protection

## 📊 Fluxos de Usuário

### **Fluxo de Registro**
```
1. User Registration Form
2. Client-side Validation (Zod)
3. API Call (/api/auth/register)
4. Server-side Validation
5. Check Email Uniqueness
6. Hash Password (bcrypt)
7. Create User in Database
8. Auto-login with NextAuth
9. Redirect to Dashboard
```

### **Fluxo de Login**
```
1. User Login Form
2. Client-side Validation
3. NextAuth signIn()
4. Credentials Provider
5. Database User Lookup
6. Password Verification
7. JWT Token Creation
8. Session Establishment
9. Redirect to Dashboard
```

### **Fluxo de Proteção**
```
1. User Access Protected Route
2. Middleware Intercepts Request
3. Check JWT Token
4. Validate Session
5. Allow Access OR Redirect to Login
```

## 🧪 Testes de Autenticação

### **Casos de Teste**
```typescript
// Testes recomendados
describe("Authentication", () => {
  test("Should register new user successfully", async () => {
    // Test user registration
  })
  
  test("Should login with valid credentials", async () => {
    // Test login flow
  })
  
  test("Should protect routes from unauthenticated users", async () => {
    // Test middleware protection
  })
  
  test("Should handle invalid credentials", async () => {
    // Test error handling
  })
})
```

## 🔄 Estado da Sessão

### **Client-side Session Management**
```typescript
// SessionProvider wrapper
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

// Hook para acessar sessão
export function useAuthenticatedUser() {
  const { data: session, status } = useSession()
  
  if (status === "loading") return null
  if (status === "unauthenticated") redirect("/login")
  
  return session?.user
}
```

## 📈 Métricas de Segurança

### **Configurações Atuais**
- **Session Duration**: 30 dias
- **Password Hash**: bcrypt factor 12
- **JWT Algorithm**: HS256
- **Cookie Security**: httpOnly, secure, sameSite
- **Rate Limiting**: Não implementado (recomendado)

### **Recomendações**
1. **Rate Limiting**: Implementar com redis
2. **2FA**: Two-factor authentication
3. **OAuth**: Google/GitHub providers
4. **Password Policy**: Força da senha
5. **Audit Logging**: Log de tentativas de login

## 🚀 Deployment

### **Variáveis de Ambiente**
```env
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here

# Database
DATABASE_URL=postgresql://user:password@host:port/database
```

### **Security Headers**
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          }
        ]
      }
    ]
  }
}
```

## 📝 Conclusão

O sistema de autenticação do MesaRPG é **robusto, seguro e extensível**, implementando:

- ✅ **Autenticação completa** com NextAuth.js
- ✅ **Proteção de rotas** automática
- ✅ **Validação robusta** de entrada
- ✅ **Hash seguro** de senhas
- ✅ **Gerenciamento de sessão** eficiente
- ✅ **UX intuitiva** nos formulários

**Status**: Produção-ready com possibilidade de extensões futuras.

---

*Documentação atualizada em: Janeiro 2025*  
*Próxima revisão: Implementação de 2FA*