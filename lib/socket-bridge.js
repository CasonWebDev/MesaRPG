// This file serves as a bridge to use the TypeScript socket implementation
// from the CommonJS server.js
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function initSocketServer(httpServer) {
  console.log('🚀 Socket.IO server initializing...')
  
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  console.log('🚀 Socket.IO server initialized and listening for connections')
  
  io.on('connection', async (socket) => {
    console.log('🔗 NEW CONNECTION:', socket.id, 'with auth:', socket.handshake.auth)

    // Authentication
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        console.error('❌ No token provided on connection')
        socket.disconnect()
        return
      }
      
      console.log('🔍 Looking for user with ID:', token)
      
      const user = await prisma.user.findUnique({
        where: { id: token },
        select: { id: true, name: true, email: true }
      })
      
      console.log('👤 User found:', user)

      if (!user) {
        console.error('❌ User not found:', token)
        socket.disconnect()
        return
      }

      socket.data.userId = user.id
      socket.data.userName = user.name || 'Usuário'
      
      console.log('✅ User authenticated successfully:', socket.data.userName, socket.data.userId)
      
    } catch (error) {
      console.error('❌ Authentication error during connection:', error)
      socket.disconnect()
      return
    }

    // Campaign join
    socket.on('campaign:join', async (campaignId) => {
      console.log(`🏠 User ${socket.data.userId} attempting to join campaign ${campaignId}`)
      try {
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
        
        // Confirm successful join
        socket.emit('campaign:joined', campaignId)

        // Get list of connected sockets in the campaign
        const socketsInRoom = await io.in(campaignId).fetchSockets()
        const connectedUsers = socketsInRoom.map(s => ({
          userId: s.data.userId,
          userName: s.data.userName
        })).filter(user => user.userId) // Filter valid users

        // Send current players list to the user who joined
        console.log('📋 Sending players list to new user:', connectedUsers)
        socket.emit('players:list', connectedUsers)

        // Notify other users in the campaign about the new player
        console.log('📢 Notifying other users about new player join')
        socket.to(campaignId).emit('player:join', {
          userId: socket.data.userId,
          userName: socket.data.userName
        })

        console.log(`✅ User ${socket.data.userName} joined campaign ${campaignId}. ${connectedUsers.length} users now connected.`)
      } catch (error) {
        console.error('❌ Error joining campaign:', error)
        socket.emit('error', 'Failed to join campaign')
      }
    })

    // Token movement
    socket.on('token_move', async (data) => {
      try {
        const { campaignId, tokenId, position } = data
        console.log(`🔄 Received token_move: ${tokenId} in campaign ${campaignId}`, position)

        if (socket.data.campaignId !== campaignId) {
          console.error(`❌ User ${socket.data.userId} not in campaign ${campaignId}`)
          console.error(`❌ Socket campaignId: ${socket.data.campaignId}, Expected: ${campaignId}`)
          console.error(`❌ Socket data:`, socket.data)
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Update token position in database
        let gameState = await prisma.gameState.findUnique({
          where: { campaignId }
        })

        if (!gameState) {
          console.log(`📝 Creating new gameState for campaign ${campaignId}`)
          gameState = await prisma.gameState.create({
            data: {
              campaignId,
              tokens: JSON.stringify([]),
              gameData: JSON.stringify({}),
              activeMapId: null
            }
          })
        }

        const tokens = JSON.parse(gameState.tokens || '[]')
        console.log(`🔍 Current tokens in gameState:`, tokens.length)
        console.log(`🔍 Looking for token:`, tokenId)
        
        const tokenIndex = tokens.findIndex(t => t.id === tokenId)
        
        if (tokenIndex !== -1) {
          console.log(`✅ Found token ${tokenId} at index ${tokenIndex}`)
          const oldPosition = tokens[tokenIndex].position
          tokens[tokenIndex].position = position
          
          await prisma.gameState.update({
            where: { campaignId },
            data: {
              tokens: JSON.stringify(tokens),
              lastActivity: new Date()
            }
          })
          
          console.log(`💾 Token position updated: ${JSON.stringify(oldPosition)} → ${JSON.stringify(position)}`)
        } else {
          console.warn(`⚠️ Token ${tokenId} not found in gameState.tokens`)
          console.log(`📝 Available token IDs:`, tokens.map(t => t.id))
          
          // If token doesn't exist, we can't update its position
          // This might happen if tokens are created via a different system
          console.log(`🚨 Token persistence failed - token not in gameState`)
        }

        // Notify other users
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

    // Chat messages
    socket.on('chat:send', async (data) => {
      try {
        const { campaignId, message, type = 'CHAT', metadata = {} } = data

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        const chatMessage = await prisma.chatMessage.create({
          data: {
            campaignId,
            userId: socket.data.userId,
            message,
            type,
            metadata: JSON.stringify(metadata)
          }
        })

        io.to(campaignId).emit('chat:message', {
          id: chatMessage.id,
          message: chatMessage.message,
          userId: socket.data.userId,
          userName: socket.data.userName,
          type: chatMessage.type,
          metadata: JSON.parse(chatMessage.metadata),
          createdAt: chatMessage.createdAt.toISOString()
        })

        console.log(`💬 Chat message sent in campaign ${campaignId}`)
      } catch (error) {
        console.error('❌ Error sending chat message:', error)
        socket.emit('error', 'Failed to send message')
      }
    })

    // Map activation (GM only)
    socket.on('game:map-activate', async (data) => {
      try {
        const { campaignId, mapId } = data
        console.log(`🗺️ Map activation request: ${mapId} in campaign ${campaignId}`)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify user is GM of the campaign
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: {
            owner: { select: { id: true } }
          }
        })

        if (!campaign || campaign.owner.id !== socket.data.userId) {
          socket.emit('error', 'Only GM can activate maps')
          return
        }

        // Deactivate all maps
        await prisma.map.updateMany({
          where: { campaignId },
          data: { isActive: false }
        })

        // Activate selected map
        const activatedMap = await prisma.map.update({
          where: { id: mapId },
          data: { isActive: true }
        })

        // Update game state
        await prisma.gameState.upsert({
          where: { campaignId },
          update: { 
            activeMapId: mapId,
            lastActivity: new Date()
          },
          create: {
            campaignId,
            activeMapId: mapId,
            tokens: JSON.stringify([]),
            gameData: JSON.stringify({})
          }
        })

        // Broadcast map activation to all users in campaign
        io.to(campaignId).emit('map:activated', {
          mapId,
          map: activatedMap,
          userId: socket.data.userId
        })

        console.log(`✅ Map activated: ${activatedMap.name} in campaign ${campaignId}`)
      } catch (error) {
        console.error('❌ Error activating map:', error)
        socket.emit('error', 'Failed to activate map')
      }
    })

    // Avatar sync system
    socket.on('avatar:sync', async (data) => {
      try {
        const { campaignId, characterId, newAvatarUrl } = data
        console.log(`🎭 Avatar sync request: ${characterId} in campaign ${campaignId}`)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Get the character and verify ownership or GM status
        const character = await prisma.character.findUnique({
          where: { id: characterId },
          include: {
            campaign: { include: { owner: { select: { id: true } } } }
          }
        })

        if (!character || character.campaignId !== campaignId) {
          socket.emit('error', 'Character not found')
          return
        }

        // Check if user owns the character or is GM
        const isGM = character.campaign.owner.id === socket.data.userId
        const isOwner = character.userId === socket.data.userId

        if (!isGM && !isOwner) {
          socket.emit('error', 'No permission to sync this character avatar')
          return
        }

        // Update all tokens linked to this character that have syncAvatar enabled
        const updatedTokens = await prisma.token.updateMany({
          where: { 
            campaignId,
            characterId,
            syncAvatar: true 
          },
          data: { 
            imageUrl: newAvatarUrl,
            lastSyncAt: new Date()
          }
        })

        console.log(`🎭 Updated ${updatedTokens.count} tokens with new avatar`)

        // Broadcast avatar sync to all campaign members
        io.to(campaignId).emit('avatar:synced', {
          characterId,
          newAvatarUrl,
          syncedTokensCount: updatedTokens.count,
          userId: socket.data.userId
        })

        console.log(`✅ Avatar synced for character ${characterId}`)
      } catch (error) {
        console.error('❌ Error syncing avatar:', error)
        socket.emit('error', 'Failed to sync avatar')
      }
    })

    // Token linking events
    socket.on('token:linked', async (data) => {
      try {
        const { campaignId, tokenId, characterId, ownerId } = data
        console.log(`🔗 Token linking broadcast: ${tokenId} → ${characterId}`)

        if (socket.data.campaignId === campaignId) {
          // Broadcast token linking to all campaign members except sender
          socket.to(campaignId).emit('token:linked', {
            tokenId,
            characterId,
            ownerId
          })
        }
      } catch (error) {
        console.error('❌ Error broadcasting token link:', error)
      }
    })

    socket.on('token:unlinked', async (data) => {
      try {
        const { campaignId, tokenId, ownerId } = data
        console.log(`🔗 Token unlinking broadcast: ${tokenId}`)

        if (socket.data.campaignId === campaignId) {
          // Broadcast token unlinking to all campaign members except sender
          socket.to(campaignId).emit('token:unlinked', {
            tokenId,
            ownerId
          })
        }
      } catch (error) {
        console.error('❌ Error broadcasting token unlink:', error)
      }
    })

    // Campaign leave
    socket.on('campaign:leave', (campaignId) => {
      socket.leave(campaignId)
      socket.to(campaignId).emit('player:leave', {
        userId: socket.data.userId,
        userName: socket.data.userName
      })
      socket.data.campaignId = undefined
    })

    // Disconnect
    socket.on('disconnect', (reason) => {
      console.log('👋 User disconnected:', socket.id, 'reason:', reason)
      
      if (socket.data.campaignId) {
        socket.to(socket.data.campaignId).emit('player:leave', {
          userId: socket.data.userId,
          userName: socket.data.userName
        })
      }
    })

    console.log('🔧 Socket event listeners setup complete for user:', socket.data.userId)
    console.log('🎯 Waiting for campaign:join event...')
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

module.exports = { initSocketServer, getSocketServer, setSocketServer }