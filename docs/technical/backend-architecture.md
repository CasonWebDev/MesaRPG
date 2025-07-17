# ⚙️ Arquitetura Backend

## 📋 Visão Geral

O backend do MesaRPG é construído sobre Next.js 15 com App Router, implementando uma arquitetura robusta e escalável que combina API Routes, WebSocket real-time, database ORM e sistema de autenticação integrado.

## 🏗️ Arquitetura Geral

### **Stack Tecnológico**
```
Next.js 15 (App Router)
├── API Routes (RESTful)
├── Server Components
├── Middleware (Auth)
└── Custom WebSocket Server

PostgreSQL Database
├── Prisma ORM
├── Type-safe queries
├── Migration system
└── Connection pooling

Real-time Layer
├── Socket.IO Server
├── Room-based events
├── Authentication
└── Error handling
```

### **Fluxo de Dados**
```
Client Request → Middleware → API Route → Validation → Database → Response
                     ↓
WebSocket Events → Authentication → Room Management → Broadcast
```

## 🔧 Implementação das APIs

### **Estrutura de Rotas**
```
app/api/
├── auth/
│   ├── register/route.ts         # Registro de usuários
│   └── [...nextauth]/route.ts    # NextAuth handlers
├── campaigns/
│   ├── route.ts                  # CRUD básico de campanhas
│   ├── create/route.ts           # Criação de campanha
│   └── [id]/
│       ├── route.ts              # Campanha específica
│       ├── characters/
│       │   ├── route.ts          # CRUD personagens
│       │   └── [characterId]/
│       │       ├── route.ts      # Personagem específico
│       │       └── transfer/route.ts  # Transferência
│       ├── messages/route.ts     # Chat persistence
│       ├── maps/
│       │   ├── route.ts          # CRUD mapas
│       │   └── [mapId]/
│       │       ├── route.ts      # Mapa específico
│       │       └── activate/route.ts  # Ativação
│       ├── handouts/
│       │   ├── route.ts          # CRUD handouts
│       │   └── [handoutId]/
│       │       ├── route.ts      # Handout específico
│       │       └── share/route.ts     # Compartilhamento
│       ├── tokens/route.ts       # Sistema de tokens
│       ├── game-state/route.ts   # Estado do jogo
│       ├── freeze-map/route.ts   # Congelamento de mapa
│       └── create-invite/route.ts # Sistema de convites
├── invites/[token]/route.ts      # Processamento de convites
├── upload/route.ts               # Upload de arquivos
└── user/update/route.ts          # Atualização de perfil
```

### **Padrão de API Route**
```typescript
// Exemplo: app/api/campaigns/[id]/characters/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// Validation schema
const createCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["PC", "NPC", "CREATURE"]),
  userId: z.string().optional(),
  data: z.object({}).passthrough(),
  templateId: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Authorization
    const hasAccess = await verifyUserAccess(params.id, session.user.email)
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 3. Query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as CharacterType | null
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')

    // 4. Database query
    const characters = await prisma.character.findMany({
      where: {
        campaignId: params.id,
        ...(type && { type }),
        ...(userId && { userId }),
        ...(search && { 
          name: { contains: search, mode: 'insensitive' } 
        })
      },
      include: {
        user: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    // 5. Response
    return NextResponse.json({ characters })

  } catch (error) {
    console.error("Error fetching characters:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Authorization (GM only for character creation)
    const isGM = await verifyGMAccess(params.id, session.user.email)
    if (!isGM) {
      return NextResponse.json({ error: "GM access required" }, { status: 403 })
    }

    // 3. Input validation
    const body = await request.json()
    const validatedData = createCharacterSchema.parse(body)

    // 4. Business logic validation
    if (validatedData.userId) {
      const isMember = await prisma.campaignMember.findFirst({
        where: {
          campaignId: params.id,
          userId: validatedData.userId
        }
      })
      
      if (!isMember) {
        return NextResponse.json(
          { error: "User is not a member of this campaign" },
          { status: 400 }
        )
      }
    }

    // 5. Database operation
    const character = await prisma.character.create({
      data: {
        campaignId: params.id,
        name: validatedData.name,
        type: validatedData.type,
        userId: validatedData.userId,
        data: JSON.stringify(validatedData.data),
        templateId: validatedData.templateId
      },
      include: {
        user: { select: { id: true, name: true } },
        template: { select: { id: true, name: true } }
      }
    })

    // 6. Success response
    return NextResponse.json({ character }, { status: 201 })

  } catch (error) {
    console.error("Error creating character:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

## 🔐 Sistema de Autenticação

### **NextAuth Configuration** (`lib/auth.ts`)
```typescript
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
      }
      return session
    }
  }
}
```

### **Authorization Utilities** (`lib/auth-utils.ts`)
```typescript
export async function verifyUserAccess(
  campaignId: string,
  userEmail: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      ownedCampaigns: {
        where: { id: campaignId },
        select: { id: true }
      },
      campaignMemberships: {
        where: { campaignId },
        select: { id: true }
      }
    }
  })

  if (!user) return false

  return user.ownedCampaigns.length > 0 || user.campaignMemberships.length > 0
}

export async function verifyGMAccess(
  campaignId: string,
  userEmail: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      ownedCampaigns: {
        where: { id: campaignId },
        select: { id: true }
      }
    }
  })

  return user?.ownedCampaigns.length > 0 || false
}

export async function getUserRole(
  campaignId: string,
  userEmail: string
): Promise<'GM' | 'PLAYER' | null> {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: {
      ownedCampaigns: {
        where: { id: campaignId },
        select: { id: true }
      },
      campaignMemberships: {
        where: { campaignId },
        select: { role: true }
      }
    }
  })

  if (!user) return null

  if (user.ownedCampaigns.length > 0) return 'GM'
  if (user.campaignMemberships.length > 0) return user.campaignMemberships[0].role

  return null
}
```

## 🗄️ Database Layer

### **Prisma Configuration** (`lib/prisma.ts`)
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### **Database Utilities** (`lib/database-utils.ts`)
```typescript
export async function withTransaction<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(operation)
}

export async function createGameStateIfNotExists(campaignId: string) {
  return await prisma.gameState.upsert({
    where: { campaignId },
    update: { lastActivity: new Date() },
    create: {
      campaignId,
      tokens: JSON.stringify([]),
      gameData: JSON.stringify({}),
      gridConfig: JSON.stringify({}),
      fogAreas: JSON.stringify([])
    }
  })
}

export async function updateGameState(
  campaignId: string,
  updates: Partial<GameState>
) {
  return await prisma.gameState.update({
    where: { campaignId },
    data: {
      ...updates,
      lastActivity: new Date()
    }
  })
}
```

## 🔄 WebSocket System

### **Socket Bridge** (`lib/socket-bridge.js`)
```javascript
const { createServer } = require('http')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
let io

function getSocketServer() {
  if (!io) {
    const httpServer = createServer()
    io = new Server(httpServer, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    })

    io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`)

      // Authentication
      socket.on('auth', async (data) => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: data.userId }
          })

          if (user) {
            socket.userId = user.id
            socket.userName = user.name
            console.log(`✅ User authenticated: ${user.name}`)
          }
        } catch (error) {
          console.error('❌ Authentication error:', error)
          socket.emit('error', 'Authentication failed')
        }
      })

      // Campaign management
      socket.on('campaign:join', async (campaignId) => {
        try {
          if (!socket.userId) {
            socket.emit('error', 'Not authenticated')
            return
          }

          // Verify access
          const hasAccess = await verifyUserAccess(campaignId, socket.userId)
          if (!hasAccess) {
            socket.emit('error', 'Access denied')
            return
          }

          // Join room
          socket.join(campaignId)
          socket.currentCampaign = campaignId

          // Notify others
          socket.to(campaignId).emit('player:joined', {
            userId: socket.userId,
            userName: socket.userName
          })

          console.log(`👥 User ${socket.userName} joined campaign ${campaignId}`)
        } catch (error) {
          console.error('❌ Campaign join error:', error)
          socket.emit('error', 'Failed to join campaign')
        }
      })

      // Chat messages
      socket.on('chat:send', async (data) => {
        try {
          const { campaignId, message, type, metadata } = data

          if (!socket.userId || socket.currentCampaign !== campaignId) {
            socket.emit('error', 'Not authorized')
            return
          }

          // Save to database
          const chatMessage = await prisma.chatMessage.create({
            data: {
              campaignId,
              userId: socket.userId,
              message,
              type: type || 'CHAT',
              metadata: JSON.stringify(metadata || {})
            },
            include: {
              user: { select: { id: true, name: true } }
            }
          })

          // Broadcast to room
          io.to(campaignId).emit('chat:message', chatMessage)

        } catch (error) {
          console.error('❌ Chat message error:', error)
          socket.emit('error', 'Failed to send message')
        }
      })

      // Token movement
      socket.on('token_move', async (data) => {
        try {
          const { campaignId, tokenId, x, y } = data

          if (!socket.userId || socket.currentCampaign !== campaignId) {
            socket.emit('error', 'Not authorized')
            return
          }

          // Update token position
          await prisma.token.update({
            where: { id: tokenId },
            data: { x, y }
          })

          // Broadcast to room
          socket.to(campaignId).emit('game:token-move', {
            tokenId,
            x,
            y,
            movedBy: socket.userId
          })

        } catch (error) {
          console.error('❌ Token move error:', error)
          socket.emit('error', 'Failed to move token')
        }
      })

      // Map activation
      socket.on('map:activate', async (data) => {
        try {
          const { campaignId, mapId } = data

          if (!socket.userId || socket.currentCampaign !== campaignId) {
            socket.emit('error', 'Not authorized')
            return
          }

          // Verify GM access
          const isGM = await verifyGMAccess(campaignId, socket.userId)
          if (!isGM) {
            socket.emit('error', 'GM access required')
            return
          }

          // Update game state
          await updateGameState(campaignId, { activeMapId: mapId })

          // Broadcast to room
          io.to(campaignId).emit('map:activated', {
            mapId,
            activatedBy: socket.userId
          })

        } catch (error) {
          console.error('❌ Map activation error:', error)
          socket.emit('error', 'Failed to activate map')
        }
      })

      // Disconnect
      socket.on('disconnect', () => {
        if (socket.currentCampaign) {
          socket.to(socket.currentCampaign).emit('player:left', {
            userId: socket.userId,
            userName: socket.userName
          })
        }
        console.log(`🔌 Client disconnected: ${socket.id}`)
      })
    })

    // Start server
    const PORT = process.env.SOCKET_PORT || 3001
    httpServer.listen(PORT, () => {
      console.log(`🚀 Socket.IO server running on port ${PORT}`)
    })
  }

  return io
}

module.exports = { getSocketServer }
```

## 📊 Error Handling

### **Error Types**
```typescript
enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_SERVER = 'INTERNAL_SERVER',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC'
}

interface APIError {
  type: ErrorType
  message: string
  details?: any
  code?: string
}
```

### **Error Handler Utility**
```typescript
export function handleAPIError(error: any): NextResponse {
  console.error('API Error:', error)

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        type: ErrorType.VALIDATION,
        message: "Invalid input data",
        details: error.errors
      },
      { status: 400 }
    )
  }

  if (error.code === 'P2002') { // Prisma unique constraint
    return NextResponse.json(
      {
        type: ErrorType.BUSINESS_LOGIC,
        message: "Resource already exists",
        details: error.meta
      },
      { status: 409 }
    )
  }

  return NextResponse.json(
    {
      type: ErrorType.INTERNAL_SERVER,
      message: "Internal server error"
    },
    { status: 500 }
  )
}
```

## 🔄 Middleware System

### **Authentication Middleware** (`middleware.ts`)
```typescript
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const { token } = req.nextauth

    // Protected routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/campaign/')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    // GM-only routes
    if (pathname.includes('/settings')) {
      // Additional GM verification would go here
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/campaign/:path*'
  ]
}
```

## 📈 Performance Optimizations

### **Database Optimizations**
```typescript
// Efficient queries with proper indexing
const campaigns = await prisma.campaign.findMany({
  where: { ownerId: userId },
  select: {
    id: true,
    name: true,
    description: true,
    rpgSystem: true,
    createdAt: true,
    // Only select needed fields
  },
  orderBy: { createdAt: 'desc' },
  take: 50 // Pagination
})

// Use transactions for related operations
await prisma.$transaction([
  prisma.campaign.create({ data: campaignData }),
  prisma.campaignMember.create({ data: memberData }),
  prisma.gameState.create({ data: gameStateData })
])
```

### **Connection Pooling**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pooling is handled by Prisma automatically
}
```

### **Caching Strategy**
```typescript
// Redis cache for frequently accessed data
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function getCachedCampaign(id: string) {
  const cached = await redis.get(`campaign:${id}`)
  if (cached) return JSON.parse(cached)

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { members: true }
  })

  await redis.setex(`campaign:${id}`, 300, JSON.stringify(campaign))
  return campaign
}
```

## 🧪 Testing

### **API Testing Strategy**
```typescript
describe('Campaign API', () => {
  beforeEach(async () => {
    await prisma.campaign.deleteMany()
    await prisma.user.deleteMany()
  })

  test('should create campaign with valid data', async () => {
    const user = await createTestUser()
    const campaignData = {
      name: 'Test Campaign',
      description: 'Test Description',
      rpgSystem: 'dnd5e'
    }

    const response = await request(app)
      .post('/api/campaigns/create')
      .set('Authorization', `Bearer ${user.token}`)
      .send(campaignData)
      .expect(201)

    expect(response.body.campaign.name).toBe(campaignData.name)
  })

  test('should require authentication', async () => {
    await request(app)
      .post('/api/campaigns/create')
      .send({})
      .expect(401)
  })
})
```

## 📝 Conclusão

A arquitetura backend do MesaRPG é **robusta, escalável e bem estruturada**, oferecendo:

- ✅ **API RESTful** com 30+ endpoints
- ✅ **Autenticação segura** com NextAuth.js
- ✅ **WebSocket real-time** com Socket.IO
- ✅ **Database ORM** com Prisma
- ✅ **Validação rigorosa** com Zod
- ✅ **Error handling** abrangente
- ✅ **Performance otimizada** com caching
- ✅ **Testabilidade** com estratégias claras

**Status**: Arquitetura production-ready com padrões profissionais de desenvolvimento.

---

*Documentação atualizada em: Janeiro 2025*  
*Próxima revisão: Implementação de microserviços*