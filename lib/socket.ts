import { Server as IOServer } from 'socket.io'
import { Server as HttpServer } from 'http'
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import { prisma } from './prisma'

export interface ServerToClientEvents {
  'chat:message': (data: {
    id: string
    message: string
    userId: string
    userName: string
    type: 'CHAT' | 'DICE_ROLL' | 'SYSTEM' | 'OOC'
    metadata?: any
    createdAt: string
  }) => void
  'game:token-move': (data: {
    tokenId: string
    position: { top: number; left: number }
    userId: string
  }) => void
  'error': (message: string) => void
  // FASE 1: New token property events
  'token:visibility:toggle': (data: {
    tokenId: string
    hidden: boolean
    userId: string
    campaignId: string
  }) => void
  'token:lock:toggle': (data: {
    tokenId: string
    locked: boolean
    userId: string
    campaignId: string
  }) => void
  'token:ownership:change': (data: {
    tokenId: string
    oldOwnerId: string | null
    newOwnerId: string
    userId: string
    campaignId: string
  }) => void
  'token:properties:update': (data: {
    tokenId: string
    properties: Record<string, any>
    userId: string
    campaignId: string
  }) => void
  'game:map-activate': (data: {
    mapId: string
    mapName: string
    userId: string
  }) => void
  'map:activated': (data: {
    mapId: string
    map: any
    userId: string
  }) => void
  'map:deactivated': (data: {
    previousMapId: string
    userId: string
  }) => void
  'game:state-update': (data: {
    gameState: any
    userId: string
  }) => void
  'player:join': (data: {
    userId: string
    userName: string
  }) => void
  'player:leave': (data: {
    userId: string
    userName: string
  }) => void
  'players:list': (players: Array<{
    userId: string
    userName: string
  }>) => void
  'handout:shared': (data: {
    handoutId: string
    handoutName: string
    sharedWith: string[]
    sharedBy: string
    campaignId: string
  }) => void
  'handout:notification': (data: {
    type: 'shared' | 'updated' | 'removed'
    handoutId: string
    handoutName: string
    sharedBy: string
    message: string
  }) => void
}

export interface ClientToServerEvents {
  'chat:send': (data: {
    campaignId: string
    message: string
    type?: 'CHAT' | 'DICE_ROLL' | 'SYSTEM' | 'OOC'
    metadata?: any
  }) => void
  'game:move-token': (data: {
    campaignId: string
    tokenId: string
    position: { top: number; left: number }
  }) => void
  'token_move': (data: {
    campaignId: string
    tokenId: string
    position: { top: number; left: number }
  }) => void
  // FASE 1: New token property events (client to server)
  'token:toggle-visibility': (data: {
    campaignId: string
    tokenId: string
  }) => void
  'token:toggle-lock': (data: {
    campaignId: string
    tokenId: string
  }) => void
  'token:change-ownership': (data: {
    campaignId: string
    tokenId: string
    newOwnerId: string
  }) => void
  'token:update-properties': (data: {
    campaignId: string
    tokenId: string
    properties: Record<string, any>
  }) => void
  'game:update-state': (data: {
    campaignId: string
    gameState: any
  }) => void
  'campaign:join': (campaignId: string) => void
  'campaign:leave': (campaignId: string) => void
}

export interface InterServerEvents {}

export interface SocketData {
  userId: string
  userName: string
  campaignId?: string
}

export type SocketIOServer = IOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new IOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  console.log('🚀 Socket.IO server initialized and listening for connections')
  
  io.on('connection', async (socket) => {
    console.log('🔗 NEW CONNECTION:', socket.id, 'with auth:', socket.handshake.auth)

    // Autenticação no momento da conexão
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        console.error('No token provided on connection')
        socket.disconnect()
        return
      }
      
      // Aqui você pode verificar o token JWT ou session
      // Por simplicidade, vamos assumir que o token contém o user ID
      const userId = token // Using ID as identifier
      console.log('Looking for user with ID:', userId)
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      })
      
      console.log('User found:', user)

      if (!user) {
        console.error('User not found:', userId)
        socket.disconnect()
        return
      }

      socket.data.userId = user.id // Using ID as consistent identifier
      socket.data.userName = user.name || 'Usuário'
      
      console.log('User authenticated successfully:', socket.data.userName, socket.data.userId)
      
    } catch (error) {
      console.error('Authentication error during connection:', error)
      socket.disconnect()
      return
    }

    // Entrar em uma sala de campanha
    socket.on('campaign:join', async (campaignId) => {
      console.log(`User ${socket.data.userId} attempting to join campaign ${campaignId}`)
      try {
        // Verificar se o usuário tem acesso à campanha
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: {
            owner: { select: { id: true } },
            members: { 
              include: { 
                user: { select: { id: true } } 
              } 
            }
          }
        })

        if (!campaign) {
          socket.emit('error', 'Campaign not found')
          return
        }

        const hasAccess = campaign.owner.id === socket.data.userId || 
                        campaign.members.some(member => member.user.id === socket.data.userId)

        if (!hasAccess) {
          socket.emit('error', 'Access denied')
          return
        }

        socket.join(campaignId)
        socket.data.campaignId = campaignId

        // Obter lista de sockets conectados na campanha
        const socketsInRoom = await io.in(campaignId).fetchSockets()
        const connectedUsers = socketsInRoom.map(s => ({
          userId: s.data.userId,
          userName: s.data.userName
        })).filter(user => user.userId) // Filtrar usuários válidos

        // Enviar lista atual de jogadores conectados para o usuário que entrou
        console.log('Sending players list to new user:', connectedUsers)
        socket.emit('players:list', connectedUsers)

        // Notificar outros usuários na campanha sobre o novo jogador
        console.log('Notifying other users about new player join')
        socket.to(campaignId).emit('player:join', {
          userId: socket.data.userId,
          userName: socket.data.userName
        })

        console.log(`User ${socket.data.userName} joined campaign ${campaignId}. ${connectedUsers.length} users now connected.`)
      } catch (error) {
        console.error('Error joining campaign:', error)
        socket.emit('error', 'Failed to join campaign')
      }
    })

    // Sair de uma sala de campanha
    socket.on('campaign:leave', (campaignId) => {
      socket.leave(campaignId)
      socket.to(campaignId).emit('player:leave', {
        userId: socket.data.userId,
        userName: socket.data.userName
      })
      socket.data.campaignId = undefined
    })

    // Enviar mensagem de chat
    socket.on('chat:send', async (data) => {
      try {
        const { campaignId, message, type = 'CHAT', metadata = {} } = data

        // Verificar se o usuário está na campanha
        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Salvar mensagem no banco
        const chatMessage = await prisma.chatMessage.create({
          data: {
            campaignId,
            userId: socket.data.userId,
            message,
            type,
            metadata: JSON.stringify(metadata)
          }
        })

        // Enviar mensagem para todos na campanha
        io.to(campaignId).emit('chat:message', {
          id: chatMessage.id,
          message: chatMessage.message,
          userId: socket.data.userId,
          userName: socket.data.userName,
          type: chatMessage.type as any,
          metadata: JSON.parse(chatMessage.metadata),
          createdAt: chatMessage.createdAt.toISOString()
        })

        console.log(`Chat message sent in campaign ${campaignId}`)
      } catch (error) {
        console.error('Error sending chat message:', error)
        socket.emit('error', 'Failed to send message')
      }
    })

    // Mover token
    socket.on('game:move-token', async (data) => {
      try {
        const { campaignId, tokenId, position } = data

        // Verificar se o usuário está na campanha
        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Atualizar posição do token no estado do jogo
        const gameState = await prisma.gameState.findUnique({
          where: { campaignId }
        })

        if (gameState) {
          const tokens = JSON.parse(gameState.tokens)
          const tokenIndex = tokens.findIndex((t: any) => t.id === tokenId)
          
          if (tokenIndex !== -1) {
            tokens[tokenIndex].position = position
            
            await prisma.gameState.update({
              where: { campaignId },
              data: {
                tokens: JSON.stringify(tokens),
                lastActivity: new Date()
              }
            })
          }
        }

        // Notificar outros usuários
        socket.to(campaignId).emit('game:token-move', {
          tokenId,
          position,
          userId: socket.data.userId
        })

        console.log(`Token moved in campaign ${campaignId}`)
      } catch (error) {
        console.error('Error moving token:', error)
        socket.emit('error', 'Failed to move token')
      }
    })

    // Mover token (nova versão para drag & drop)
    socket.on('token_move', async (data) => {
      try {
        const { campaignId, tokenId, position } = data
        console.log(`🔄 Received token_move: ${tokenId} in campaign ${campaignId}`, position)

        // Verificar se o usuário está na campanha
        if (socket.data.campaignId !== campaignId) {
          console.error(`❌ User ${socket.data.userId} not in campaign ${campaignId}`)
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Atualizar posição do token no estado do jogo
        const gameState = await prisma.gameState.findUnique({
          where: { campaignId }
        })

        console.log(`📊 GameState found: ${!!gameState}, tokens: ${gameState?.tokens ? JSON.parse(gameState.tokens).length : 0}`)

        if (gameState) {
          const tokens = JSON.parse(gameState.tokens || '[]')
          const tokenIndex = tokens.findIndex((t: any) => t.id === tokenId)
          
          console.log(`🎯 Token index: ${tokenIndex}, total tokens: ${tokens.length}`)
          
          if (tokenIndex !== -1) {
            tokens[tokenIndex].position = position
            
            await prisma.gameState.update({
              where: { campaignId },
              data: {
                tokens: JSON.stringify(tokens),
                lastActivity: new Date()
              }
            })
            
            console.log(`💾 Token position updated in database`)
          } else {
            console.warn(`⚠️ Token ${tokenId} not found in gameState.tokens`)
          }
        } else {
          console.warn(`⚠️ No gameState found for campaign ${campaignId}`)
        }

        // Notificar outros usuários
        const moveData = {
          tokenId,
          position,
          userId: socket.data.userId
        }
        
        socket.to(campaignId).emit('game:token-move', moveData)
        console.log(`📡 Broadcasted game:token-move to campaign ${campaignId}:`, moveData)

      } catch (error) {
        console.error('❌ Error moving token:', error)
        socket.emit('error', 'Failed to move token')
      }
    })

    // FASE 1: Token Property Events
    
    // Toggle token visibility
    socket.on('token:toggle-visibility', async (data) => {
      try {
        const { campaignId, tokenId } = data

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Directly update the database instead of HTTP call
        const gameState = await prisma.gameState.findUnique({
          where: { campaignId }
        })

        if (gameState) {
          const tokens = JSON.parse(gameState.tokens || '[]')
          const tokenIndex = tokens.findIndex((t: any) => t.id === tokenId)
          
          if (tokenIndex !== -1) {
            const currentHidden = tokens[tokenIndex].hidden || false
            tokens[tokenIndex].hidden = !currentHidden
            
            await prisma.gameState.update({
              where: { campaignId },
              data: {
                tokens: JSON.stringify(tokens),
                lastActivity: new Date()
              }
            })

            // Broadcast visibility change to all users in campaign
            io.to(campaignId).emit('token:visibility:toggle', {
              tokenId,
              hidden: !currentHidden,
              userId: socket.data.userId,
              campaignId
            })

            console.log(`Token visibility toggled in campaign ${campaignId}: ${tokenId} - hidden: ${!currentHidden}`)
          }
        }
      } catch (error) {
        console.error('Error toggling token visibility:', error)
        socket.emit('error', 'Failed to toggle token visibility')
      }
    })

    // Toggle token lock
    socket.on('token:toggle-lock', async (data) => {
      try {
        const { campaignId, tokenId } = data

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // For now, directly update the database (we'll improve this with proper API auth later)
        const gameState = await prisma.gameState.findUnique({
          where: { campaignId }
        })

        if (gameState) {
          const tokens = JSON.parse(gameState.tokens || '[]')
          const tokenIndex = tokens.findIndex((t: any) => t.id === tokenId)
          
          if (tokenIndex !== -1) {
            const currentLocked = tokens[tokenIndex].canPlayerMove === false
            tokens[tokenIndex].canPlayerMove = currentLocked // Toggle lock state
            
            await prisma.gameState.update({
              where: { campaignId },
              data: {
                tokens: JSON.stringify(tokens),
                lastActivity: new Date()
              }
            })

            // Broadcast lock change to all users in campaign
            io.to(campaignId).emit('token:lock:toggle', {
              tokenId,
              locked: !currentLocked,
              userId: socket.data.userId,
              campaignId
            })

            console.log(`Token lock toggled in campaign ${campaignId}: ${tokenId} - locked: ${!currentLocked}`)
          }
        }
      } catch (error) {
        console.error('Error toggling token lock:', error)
        socket.emit('error', 'Failed to toggle token lock')
      }
    })

    // Change token ownership
    socket.on('token:change-ownership', async (data) => {
      try {
        const { campaignId, tokenId, newOwnerId } = data

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        const gameState = await prisma.gameState.findUnique({
          where: { campaignId }
        })

        if (gameState) {
          const tokens = JSON.parse(gameState.tokens || '[]')
          const tokenIndex = tokens.findIndex((t: any) => t.id === tokenId)
          
          if (tokenIndex !== -1) {
            const oldOwnerId = tokens[tokenIndex].ownerId
            tokens[tokenIndex].ownerId = newOwnerId
            
            await prisma.gameState.update({
              where: { campaignId },
              data: {
                tokens: JSON.stringify(tokens),
                lastActivity: new Date()
              }
            })

            // Broadcast ownership change to all users in campaign
            io.to(campaignId).emit('token:ownership:change', {
              tokenId,
              oldOwnerId,
              newOwnerId,
              userId: socket.data.userId,
              campaignId
            })

            console.log(`Token ownership changed in campaign ${campaignId}: ${tokenId} from ${oldOwnerId} to ${newOwnerId}`)
          }
        }
      } catch (error) {
        console.error('Error changing token ownership:', error)
        socket.emit('error', 'Failed to change token ownership')
      }
    })

    // Update token properties
    socket.on('token:update-properties', async (data) => {
      try {
        const { campaignId, tokenId, properties } = data

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        const gameState = await prisma.gameState.findUnique({
          where: { campaignId }
        })

        if (gameState) {
          const tokens = JSON.parse(gameState.tokens || '[]')
          const tokenIndex = tokens.findIndex((t: any) => t.id === tokenId)
          
          if (tokenIndex !== -1) {
            // Merge properties
            tokens[tokenIndex] = { ...tokens[tokenIndex], ...properties }
            
            await prisma.gameState.update({
              where: { campaignId },
              data: {
                tokens: JSON.stringify(tokens),
                lastActivity: new Date()
              }
            })

            // Broadcast property update to all users in campaign
            io.to(campaignId).emit('token:properties:update', {
              tokenId,
              properties,
              userId: socket.data.userId,
              campaignId
            })

            console.log(`Token properties updated in campaign ${campaignId}: ${tokenId}`, properties)
          }
        }
      } catch (error) {
        console.error('Error updating token properties:', error)
        socket.emit('error', 'Failed to update token properties')
      }
    })

    // Atualizar estado do jogo
    socket.on('game:update-state', async (data) => {
      try {
        const { campaignId, gameState } = data

        // Verificar se o usuário está na campanha
        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Atualizar estado no banco
        await prisma.gameState.upsert({
          where: { campaignId },
          update: {
            gameData: JSON.stringify(gameState),
            lastActivity: new Date()
          },
          create: {
            campaignId,
            gameData: JSON.stringify(gameState),
            tokens: JSON.stringify([])
          }
        })

        // Notificar outros usuários
        socket.to(campaignId).emit('game:state-update', {
          gameState,
          userId: socket.data.userId
        })

        console.log(`Game state updated in campaign ${campaignId}`)
      } catch (error) {
        console.error('Error updating game state:', error)
        socket.emit('error', 'Failed to update game state')
      }
    })

    // Desconexão
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      
      if (socket.data.campaignId) {
        socket.to(socket.data.campaignId).emit('player:leave', {
          userId: socket.data.userId,
          userName: socket.data.userName
        })
      }
    })

    console.log('Socket event listeners setup complete for user:', socket.data.userId)
  })

  return io
}

export let io: SocketIOServer | undefined

export function getSocketServer(): SocketIOServer | undefined {
  return io
}

export function setSocketServer(server: SocketIOServer) {
  io = server
}