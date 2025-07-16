# Sistema de Chat e Tempo Real

## Visão Geral

O sistema de chat e tempo real é um dos pilares fundamentais do MesaRPG, oferecendo comunicação instantânea entre jogadores e GMs, sistema de comandos de dados integrado, e sincronização em tempo real de todos os elementos do jogo através de WebSocket.

## Tecnologias Utilizadas

### 1. Socket.IO
- **Server**: Node.js custom server com Socket.IO
- **Client**: Hook singleton para conexão compartilhada
- **Events**: Sistema completo de eventos para diferentes funcionalidades
- **Rooms**: Isolamento por campanha para privacidade

### 2. Prisma + SQLite
- **Persistência**: Histórico de mensagens no banco de dados
- **Performance**: Queries otimizadas para carregamento rápido
- **Relacionamentos**: Integração com usuários e campanhas

## Arquitetura WebSocket

### 1. Server Bridge
- **Arquivo**: `lib/socket-bridge.js`
- **Responsabilidades**:
  - Servidor Socket.IO com eventos completos
  - Autenticação de usuários e validação de campanhas
  - Gerenciamento de rooms por campanha
  - Validação de permissões (GM/Player)

```javascript
// lib/socket-bridge.js
const { Server } = require('socket.io')
const { getServerSession } = require('next-auth/next')
const { authOptions } = require('./auth')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL,
      credentials: true
    }
  })
  
  // Middleware de autenticação
  io.use(async (socket, next) => {
    try {
      const session = await getServerSession(socket.request, socket.response, authOptions)
      if (!session) {
        return next(new Error('Unauthorized'))
      }
      socket.userId = session.user.id
      socket.userName = session.user.name
      next()
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })
  
  io.on('connection', (socket) => {
    console.log(`User ${socket.userName} connected`)
    
    // Eventos de campanha
    socket.on('campaign:join', async (campaignId) => {
      // Validar acesso à campanha
      const access = await validateCampaignAccess(campaignId, socket.userId)
      if (!access) {
        socket.emit('error', 'Access denied')
        return
      }
      
      socket.join(`campaign:${campaignId}`)
      socket.campaignId = campaignId
      
      // Notificar outros usuários
      socket.to(`campaign:${campaignId}`).emit('player:join', {
        userId: socket.userId,
        userName: socket.userName
      })
    })
    
    socket.on('campaign:leave', (campaignId) => {
      socket.leave(`campaign:${campaignId}`)
      socket.to(`campaign:${campaignId}`).emit('player:leave', {
        userId: socket.userId,
        userName: socket.userName
      })
    })
    
    // Eventos de chat
    socket.on('chat:send', async (data) => {
      if (!socket.campaignId) return
      
      try {
        // Salvar mensagem no banco
        const message = await prisma.chatMessage.create({
          data: {
            content: data.content,
            type: data.type || 'message',
            userId: socket.userId,
            campaignId: socket.campaignId
          },
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        })
        
        // Enviar para todos na campanha
        io.to(`campaign:${socket.campaignId}`).emit('chat:message', message)
      } catch (error) {
        socket.emit('error', 'Failed to send message')
      }
    })
    
    // Eventos de tokens
    socket.on('token_move', (data) => {
      if (!socket.campaignId) return
      
      // Repassar movimento para outros usuários
      socket.to(`campaign:${socket.campaignId}`).emit('game:token-move', {
        tokenId: data.tokenId,
        x: data.x,
        y: data.y,
        movedBy: socket.userId
      })
    })
    
    // Eventos de mapas
    socket.on('game:map-activate', async (data) => {
      if (!socket.campaignId) return
      
      // Verificar se é GM
      const isGM = await validateGMRole(socket.campaignId, socket.userId)
      if (!isGM) {
        socket.emit('error', 'Only GMs can activate maps')
        return
      }
      
      // Ativar mapa e notificar todos
      io.to(`campaign:${socket.campaignId}`).emit('map:activated', {
        mapId: data.mapId,
        activatedBy: socket.userName
      })
    })
    
    // Desconexão
    socket.on('disconnect', () => {
      if (socket.campaignId) {
        socket.to(`campaign:${socket.campaignId}`).emit('player:leave', {
          userId: socket.userId,
          userName: socket.userName
        })
      }
      console.log(`User ${socket.userName} disconnected`)
    })
  })
  
  return io
}

async function validateCampaignAccess(campaignId, userId) {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    }
  })
  return !!campaign
}

async function validateGMRole(campaignId, userId) {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      ownerId: userId
    }
  })
  return !!campaign
}

module.exports = { initializeSocket }
```

### 2. Client Singleton
- **Arquivo**: `hooks/use-socket.ts`
- **Responsabilidades**:
  - Hook singleton para conexão compartilhada
  - Prevenção de múltiplas conexões
  - Gerenciamento de estado (mensagens, players, tokens)
  - Auto-reconnection e error handling

```typescript
// hooks/use-socket.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

interface ChatMessage {
  id: string
  content: string
  type: 'message' | 'roll' | 'ooc'
  createdAt: string
  user: {
    id: string
    name: string
  }
}

interface ConnectedPlayer {
  userId: string
  userName: string
}

interface TokenPosition {
  tokenId: string
  x: number
  y: number
  movedBy: string
}

// Singleton socket instance
let socketInstance: Socket | null = null
let connectionCount = 0

export function useSocket(campaignId?: string) {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectedPlayers, setConnectedPlayers] = useState<ConnectedPlayer[]>([])
  const [tokenPositions, setTokenPositions] = useState<Record<string, TokenPosition>>({})
  const socketRef = useRef<Socket | null>(null)
  
  // Conectar ao socket
  useEffect(() => {
    if (!session || !campaignId) return
    
    // Usar singleton ou criar nova conexão
    if (!socketInstance) {
      socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })
    }
    
    connectionCount++
    socketRef.current = socketInstance
    const socket = socketInstance
    
    // Event listeners
    const onConnect = () => {
      console.log('Socket connected')
      setIsConnected(true)
      // Entrar na campanha
      socket.emit('campaign:join', campaignId)
    }
    
    const onDisconnect = () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    }
    
    const onChatMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
    }
    
    const onPlayerJoin = (player: ConnectedPlayer) => {
      setConnectedPlayers(prev => {
        if (prev.some(p => p.userId === player.userId)) return prev
        return [...prev, player]
      })
    }
    
    const onPlayerLeave = (player: ConnectedPlayer) => {
      setConnectedPlayers(prev => 
        prev.filter(p => p.userId !== player.userId)
      )
    }
    
    const onTokenMove = (data: TokenPosition) => {
      setTokenPositions(prev => ({
        ...prev,
        [data.tokenId]: data
      }))
    }
    
    const onMapActivated = (data: { mapId: string, activatedBy: string }) => {
      // Notificação de mapa ativado será tratada por hook específico
    }
    
    const onError = (error: string) => {
      console.error('Socket error:', error)
    }
    
    // Registrar listeners
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('chat:message', onChatMessage)
    socket.on('player:join', onPlayerJoin)
    socket.on('player:leave', onPlayerLeave)
    socket.on('game:token-move', onTokenMove)
    socket.on('map:activated', onMapActivated)
    socket.on('error', onError)
    
    // Conectar se não estiver conectado
    if (!socket.connected) {
      socket.connect()
    } else {
      onConnect()
    }
    
    // Cleanup
    return () => {
      connectionCount--
      
      if (socket.connected && campaignId) {
        socket.emit('campaign:leave', campaignId)
      }
      
      // Remover listeners
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('chat:message', onChatMessage)
      socket.off('player:join', onPlayerJoin)
      socket.off('player:leave', onPlayerLeave)
      socket.off('game:token-move', onTokenMove)
      socket.off('map:activated', onMapActivated)
      socket.off('error', onError)
      
      // Desconectar apenas se for a última instância
      if (connectionCount === 0 && socketInstance) {
        socketInstance.disconnect()
        socketInstance = null
      }
    }
  }, [session, campaignId])
  
  // Funções para envio de dados
  const sendMessage = useCallback((content: string, type: 'message' | 'roll' | 'ooc' = 'message') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('chat:send', { content, type })
    }
  }, [])
  
  const moveToken = useCallback((tokenId: string, x: number, y: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('token_move', { tokenId, x, y })
    }
  }, [])
  
  const activateMap = useCallback((mapId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('game:map-activate', { mapId })
    }
  }, [])
  
  return {
    isConnected,
    messages,
    connectedPlayers,
    tokenPositions,
    sendMessage,
    moveToken,
    activateMap,
    socket: socketRef.current
  }
}
```

## API de Mensagens

### 1. Carregamento de Histórico
```typescript
// app/api/campaigns/[id]/messages/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(request.url)
  
  // Verificar acesso à campanha
  const hasAccess = await validateCampaignMembership(params.id, session.user.id)
  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const skip = (page - 1) * limit
  
  const messages = await prisma.chatMessage.findMany({
    where: { campaignId: params.id },
    include: {
      user: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit
  })
  
  return NextResponse.json({
    messages: messages.reverse(), // Ordem cronológica
    hasMore: messages.length === limit
  })
}
```

### 2. Envio de Mensagens
```typescript
// POST /api/campaigns/[id]/messages
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  // Verificar acesso
  const hasAccess = await validateCampaignMembership(params.id, session.user.id)
  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  // Processar comandos especiais
  let processedContent = body.content
  let messageType = body.type || 'message'
  
  // Comando de dados /r
  if (processedContent.startsWith('/r ')) {
    const diceExpression = processedContent.substring(3).trim()
    const result = rollDice(diceExpression)
    processedContent = `🎲 ${diceExpression} = ${result.total} ${result.breakdown ? `(${result.breakdown})` : ''}`
    messageType = 'roll'
  }
  
  // Comando OOC /ooc
  if (processedContent.startsWith('/ooc ')) {
    processedContent = processedContent.substring(5).trim()
    messageType = 'ooc'
  }
  
  const message = await prisma.chatMessage.create({
    data: {
      content: processedContent,
      type: messageType,
      userId: session.user.id,
      campaignId: params.id
    },
    include: {
      user: {
        select: { id: true, name: true }
      }
    }
  })
  
  return NextResponse.json(message, { status: 201 })
}
```

## Sistema de Dados

### 1. Engine de Dados
```typescript
// lib/dice.ts
interface DiceResult {
  total: number
  breakdown?: string
  rolls: number[]
}

export function rollDice(expression: string): DiceResult {
  // Limpar expressão
  const cleanExpr = expression.toLowerCase().replace(/\s/g, '')
  
  // Padrões suportados: 1d20, 2d6+3, 1d20+5-2, etc.
  const diceRegex = /(\d+)?d(\d+)([+-]\d+)*/g
  const modifierRegex = /([+-]\d+)/g
  
  let total = 0
  const breakdownParts: string[] = []
  
  // Processar dados
  let match
  while ((match = diceRegex.exec(cleanExpr)) !== null) {
    const count = parseInt(match[1] || '1')
    const sides = parseInt(match[2])
    const modifier = match[3] || ''
    
    const rolls = []
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * sides) + 1)
    }
    
    const rollSum = rolls.reduce((sum, roll) => sum + roll, 0)
    total += rollSum
    
    if (count === 1) {
      breakdownParts.push(`d${sides}(${rolls[0]})`)
    } else {
      breakdownParts.push(`${count}d${sides}(${rolls.join('+')})`)
    }
    
    // Processar modificadores
    if (modifier) {
      let modMatch
      while ((modMatch = modifierRegex.exec(modifier)) !== null) {
        const mod = parseInt(modMatch[1])
        total += mod
        breakdownParts.push(mod > 0 ? `+${mod}` : `${mod}`)
      }
    }
  }
  
  return {
    total,
    breakdown: breakdownParts.join(' '),
    rolls: []
  }
}

// Testes
export function testDiceRolls() {
  console.log(rollDice('1d20')) // { total: 15, breakdown: 'd20(15)' }
  console.log(rollDice('2d6+3')) // { total: 11, breakdown: '2d6(4+4) +3' }
  console.log(rollDice('1d20+5-2')) // { total: 18, breakdown: 'd20(15) +5 -2' }
}
```

### 2. Componente de Entrada de Dados
```typescript
// components/dice-roller.tsx
export function DiceRoller({ onRoll }: { onRoll: (expression: string) => void }) {
  const [expression, setExpression] = useState('')
  
  const quickRolls = [
    { label: 'd20', value: '1d20' },
    { label: 'd12', value: '1d12' },
    { label: '2d6', value: '2d6' },
    { label: 'd4', value: '1d4' },
    { label: 'Ataque', value: '1d20+5' },
    { label: 'Dano', value: '1d8+3' }
  ]
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (expression.trim()) {
      onRoll(expression.trim())
      setExpression('')
    }
  }
  
  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Ex: 1d20+5, 2d6, etc."
          className="flex-1"
        />
        <Button type="submit" size="sm">
          🎲
        </Button>
      </form>
      
      <div className="flex flex-wrap gap-1">
        {quickRolls.map(roll => (
          <Button
            key={roll.value}
            variant="outline"
            size="sm"
            onClick={() => onRoll(roll.value)}
          >
            {roll.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
```

## Componente de Chat

### 1. Chat Panel Principal
```typescript
// components/game/chat-panel.tsx
export function ChatPanel({ campaignId }: { campaignId: string }) {
  const { data: session } = useSession()
  const { 
    isConnected, 
    messages, 
    connectedPlayers, 
    sendMessage 
  } = useSocket(campaignId)
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Carregar histórico inicial
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/messages`)
        const data = await response.json()
        setChatMessages(data.messages || [])
      } catch (error) {
        console.error('Error loading chat history:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadHistory()
  }, [campaignId])
  
  // Adicionar novas mensagens do WebSocket
  useEffect(() => {
    if (messages.length > 0) {
      setChatMessages(prev => {
        const lastMessage = messages[messages.length - 1]
        // Evitar duplicatas
        if (prev.find(m => m.id === lastMessage.id)) return prev
        return [...prev, lastMessage]
      })
    }
  }, [messages])
  
  // Auto scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !isConnected) return
    
    sendMessage(inputValue.trim())
    setInputValue('')
  }
  
  const formatMessage = (message: ChatMessage) => {
    const isOwnMessage = message.user.id === session?.user?.id
    
    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-2 p-2 rounded-lg",
          isOwnMessage ? "bg-primary/10 ml-8" : "bg-muted mr-8"
        )}
      >
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">
            {message.user.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{message.user.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
            {message.type === 'roll' && (
              <Badge variant="secondary" className="text-xs">🎲</Badge>
            )}
            {message.type === 'ooc' && (
              <Badge variant="outline" className="text-xs">OOC</Badge>
            )}
          </div>
          
          <div className={cn(
            "text-sm",
            message.type === 'roll' && "font-mono",
            message.type === 'ooc' && "italic"
          )}>
            {message.content}
          </div>
        </div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando chat...</span>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header com status de conexão */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold">Chat</h3>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-xs text-muted-foreground">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>
      
      {/* Lista de jogadores conectados */}
      {connectedPlayers.length > 0 && (
        <div className="p-2 border-b">
          <div className="text-xs text-muted-foreground mb-1">
            Online ({connectedPlayers.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {connectedPlayers.map(player => (
              <Badge key={player.userId} variant="outline" className="text-xs">
                {player.userName}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {chatMessages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Nenhuma mensagem ainda</p>
            <p className="text-xs">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          chatMessages.map(formatMessage)
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input de mensagem */}
      <div className="p-3 border-t space-y-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isConnected ? "Digite uma mensagem..." : "Desconectado"}
            disabled={!isConnected}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="sm" 
            disabled={!isConnected || !inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        {/* Comandos rápidos */}
        <div className="text-xs text-muted-foreground">
          <strong>Comandos:</strong> /r [dados] para rolar dados, /ooc [mensagem] para OOC
        </div>
        
        {/* Roller de dados */}
        <DiceRoller onRoll={(expr) => sendMessage(`/r ${expr}`)} />
      </div>
    </div>
  )
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}
```

## Hooks Especializados

### 1. Hook para Mapas Ativos
```typescript
// hooks/use-active-map.ts
export function useActiveMap(campaignId: string) {
  const [activeMap, setActiveMap] = useState<Map | null>(null)
  const { socket } = useSocket(campaignId)
  
  useEffect(() => {
    if (!socket) return
    
    const onMapActivated = (data: { mapId: string }) => {
      // Buscar dados do mapa ativado
      fetch(`/api/campaigns/${campaignId}/maps/${data.mapId}`)
        .then(res => res.json())
        .then(map => setActiveMap(map))
        .catch(console.error)
    }
    
    socket.on('map:activated', onMapActivated)
    
    return () => {
      socket.off('map:activated', onMapActivated)
    }
  }, [socket, campaignId])
  
  return { activeMap }
}
```

### 2. Hook para Notificações de Mapas
```typescript
// hooks/use-map-notifications.ts
export function useMapNotifications(campaignId: string) {
  const { socket } = useSocket(campaignId)
  
  useEffect(() => {
    if (!socket) return
    
    const onMapActivated = (data: { mapId: string, activatedBy: string }) => {
      toast.info(`${data.activatedBy} ativou um novo mapa`, {
        action: {
          label: "Atualizar",
          onClick: () => window.location.reload()
        }
      })
    }
    
    socket.on('map:activated', onMapActivated)
    
    return () => {
      socket.off('map:activated', onMapActivated)
    }
  }, [socket])
}
```

### 3. Hook para Tokens
```typescript
// hooks/use-tokens.ts
export function useTokens(campaignId: string) {
  const { tokenPositions, moveToken } = useSocket(campaignId)
  const [tokens, setTokens] = useState<Token[]>([])
  
  // Carregar tokens do banco
  useEffect(() => {
    const loadTokens = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/game-state`)
        const data = await response.json()
        setTokens(data.tokens || [])
      } catch (error) {
        console.error('Error loading tokens:', error)
      }
    }
    
    loadTokens()
  }, [campaignId])
  
  // Aplicar posições do WebSocket
  const tokensWithPositions = tokens.map(token => {
    const position = tokenPositions[token.id]
    return position ? { ...token, x: position.x, y: position.y } : token
  })
  
  const updateTokenPosition = useCallback((tokenId: string, x: number, y: number) => {
    // Atualizar localmente primeiro
    setTokens(prev => prev.map(token => 
      token.id === tokenId ? { ...token, x, y } : token
    ))
    
    // Enviar via WebSocket
    moveToken(tokenId, x, y)
  }, [moveToken])
  
  return {
    tokens: tokensWithPositions,
    updateTokenPosition
  }
}
```

## Eventos Suportados

### 1. Eventos de Campanha
- `campaign:join` - Entrada na campanha
- `campaign:leave` - Saída da campanha
- `player:join` - Jogador conectou
- `player:leave` - Jogador desconectou

### 2. Eventos de Chat
- `chat:send` - Enviar mensagem
- `chat:message` - Receber mensagem

### 3. Eventos de Jogo
- `token_move` - Mover token
- `game:token-move` - Token movido
- `game:map-activate` - Ativar mapa
- `map:activated` - Mapa ativado

### 4. Eventos de Sistema
- `error` - Erro do servidor
- `connect` - Conexão estabelecida
- `disconnect` - Conexão perdida

## Estrutura de Dados

### Chat Message Model
```prisma
model ChatMessage {
  id          String   @id @default(cuid())
  content     String
  type        String   @default("message") // message, roll, ooc
  createdAt   DateTime @default(now())
  
  // Relacionamentos
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  @@index([campaignId, createdAt])
}
```

## Correções Implementadas

### 1. Conflito de Múltiplas Conexões WebSocket
- **Problema**: MapList criava conexão própria conflitando com GameClient
- **Solução**: Reutilização da conexão singleton via useSocket hook
- **Implementação**: Fallback HTTP para maior confiabilidade

### 2. Memory Leaks em Event Listeners
- **Problema**: Event listeners não removidos causavam memory leaks
- **Solução**: Cleanup adequado no useEffect com contador de referências

### 3. Duplicação de Mensagens
- **Problema**: Mensagens duplicadas no chat
- **Solução**: Verificação de ID antes de adicionar mensagens

## Segurança

### 1. Autenticação de Socket
```typescript
// Middleware no servidor
io.use(async (socket, next) => {
  const session = await getServerSession(socket.request, socket.response, authOptions)
  if (!session) {
    return next(new Error('Unauthorized'))
  }
  socket.userId = session.user.id
  next()
})
```

### 2. Validação de Acesso à Campanha
```typescript
async function validateCampaignAccess(campaignId: string, userId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    }
  })
  return !!campaign
}
```

### 3. Rate Limiting
```typescript
// Implementação futura
const rateLimiter = new Map()

socket.on('chat:send', (data) => {
  const userId = socket.userId
  const now = Date.now()
  const userLimits = rateLimiter.get(userId) || { count: 0, resetTime: now + 60000 }
  
  if (now > userLimits.resetTime) {
    userLimits.count = 0
    userLimits.resetTime = now + 60000
  }
  
  if (userLimits.count >= 30) { // 30 mensagens por minuto
    socket.emit('error', 'Rate limit exceeded')
    return
  }
  
  userLimits.count++
  rateLimiter.set(userId, userLimits)
  
  // Processar mensagem...
})
```

## Performance

### 1. Paginação de Mensagens
```typescript
// Carregamento sob demanda
const loadMoreMessages = useCallback(async () => {
  if (loading || !hasMore) return
  
  setLoading(true)
  try {
    const response = await fetch(
      `/api/campaigns/${campaignId}/messages?page=${page + 1}`
    )
    const data = await response.json()
    
    setChatMessages(prev => [...data.messages, ...prev])
    setPage(p => p + 1)
    setHasMore(data.hasMore)
  } catch (error) {
    console.error('Error loading more messages:', error)
  } finally {
    setLoading(false)
  }
}, [campaignId, page, loading, hasMore])
```

### 2. Debouncing de Eventos
```typescript
// Debounce para movimentação de tokens
const debouncedMoveToken = useMemo(
  () => debounce((tokenId: string, x: number, y: number) => {
    moveToken(tokenId, x, y)
  }, 100),
  [moveToken]
)
```

## Próximos Passos

### Melhorias Futuras
- [ ] Sistema de whispers (mensagens privadas)
- [ ] Histórico de comandos de dados
- [ ] Emoji reactions nas mensagens
- [ ] Formatação rica (bold, italic, links)
- [ ] Upload de imagens no chat
- [ ] Notificações push
- [ ] Chat de voz/vídeo integrado

### Funcionalidades Avançadas
- [ ] Macros customizáveis
- [ ] Bots e automação
- [ ] Integração com APIs externas
- [ ] Sistema de moderação
- [ ] Logs de auditoria
- [ ] Backup automático de conversas