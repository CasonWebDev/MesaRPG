const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', async (socket) => {
    console.log('User connected:', socket.id, 'with auth:', socket.handshake.auth)

    // Autenticação no momento da conexão
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        console.error('No token provided on connection')
        socket.disconnect()
        return
      }
      
      // Aqui você pode verificar o token JWT ou session
      // Por simplicidade, vamos assumir que o token contém o email
      const userEmail = token // Using email as identifier
      console.log('Looking for user with email:', userEmail)
      
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true, name: true, email: true }
      })
      
      console.log('User found:', user)

      if (!user) {
        console.error('User not found:', userEmail)
        socket.disconnect()
        return
      }

      socket.data.userId = user.id // Using actual user ID for database relations
      socket.data.userEmail = user.email // Keep email for consistency
      socket.data.userName = user.name || 'Usuário'
      
      console.log('User authenticated successfully:', socket.data.userName, socket.data.userId)
      
    } catch (error) {
      console.error('Authentication error during connection:', error)
      socket.disconnect()
      return
    }

    // Entrar em uma sala de campanha
    socket.on('campaign:join', async (campaignId) => {
      console.log(`🎯 CAMPAIGN JOIN REQUEST - User ${socket.data.userId} attempting to join campaign ${campaignId}`)
      try {
        // Verificar se o usuário tem acesso à campanha
        console.log(`🔍 Checking campaign access for user ${socket.data.userId}`)
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: {
            owner: { select: { email: true } },
            members: { 
              include: { 
                user: { select: { email: true } } 
              } 
            }
          }
        })

        if (!campaign) {
          console.log(`❌ Campaign not found: ${campaignId}`)
          socket.emit('error', 'Campaign not found')
          return
        }

        console.log(`✅ Campaign found: ${campaign.name}`)
        console.log(`🔑 Checking access - Owner: ${campaign.owner.email}, User: ${socket.data.userEmail}`)
        console.log(`👥 Members:`, campaign.members.map(m => m.user.email))

        const hasAccess = campaign.owner.email === socket.data.userEmail || 
                        campaign.members.some(member => member.user.email === socket.data.userEmail)

        if (!hasAccess) {
          console.log(`❌ Access denied for user ${socket.data.userId}`)
          socket.emit('error', 'Access denied')
          return
        }

        socket.join(campaignId)
        socket.data.campaignId = campaignId
        console.log(`🎉 User ${socket.data.userId} successfully joined campaign ${campaignId}`)

        // Obter lista de sockets conectados na campanha
        const socketsInRoom = await io.in(campaignId).fetchSockets()
        const connectedUsers = socketsInRoom.map(s => ({
          userId: s.data.userEmail, // Use email for consistency with frontend
          userName: s.data.userName
        })).filter(user => user.userId) // Filtrar usuários válidos

        // Enviar lista atual de jogadores conectados para o usuário que entrou
        console.log('Sending players list to new user:', connectedUsers)
        socket.emit('players:list', connectedUsers)

        // Notificar outros usuários na campanha sobre o novo jogador
        console.log('Notifying other users about new player join')
        socket.to(campaignId).emit('player:join', {
          userId: socket.data.userEmail, // Use email for consistency
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
        userId: socket.data.userEmail, // Use email for consistency
        userName: socket.data.userName
      })
      socket.data.campaignId = undefined
    })

    // Enviar mensagem de chat
    socket.on('chat:send', async (data) => {
      try {
        const { campaignId, message, type = 'CHAT', metadata = {} } = data
        console.log('💬 CHAT MESSAGE RECEIVED:', { campaignId, socketCampaignId: socket.data.campaignId, userId: socket.data.userId, message })

        // Verificar se o usuário está na campanha
        if (socket.data.campaignId !== campaignId) {
          console.log('User not in campaign. Socket campaign:', socket.data.campaignId, 'Request campaign:', campaignId)
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
          userId: socket.data.userEmail, // Use email for consistency with frontend
          userName: socket.data.userName,
          type: chatMessage.type,
          metadata: JSON.parse(chatMessage.metadata),
          createdAt: chatMessage.createdAt.toISOString()
        })

        console.log(`Chat message sent in campaign ${campaignId}`)
      } catch (error) {
        console.error('Error sending chat message:', error)
        console.error('Error details:', error.message, error.stack)
        socket.emit('error', 'Failed to send message')
      }
    })

    // Desconexão
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      
      if (socket.data.campaignId) {
        socket.to(socket.data.campaignId).emit('player:leave', {
          userId: socket.data.userEmail, // Use email for consistency
          userName: socket.data.userName
        })
      }
    })

    console.log('Socket event listeners setup complete for user:', socket.data.userId)
  })

  return io
}

let io

function getSocketServer() {
  return io
}

function setSocketServer(server) {
  io = server
}

module.exports = {
  initSocketServer,
  getSocketServer,
  setSocketServer
}