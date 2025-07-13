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

    // Token clear all
    socket.on('token_clear_all', async (data) => {
      try {
        const { campaignId } = data
        console.log(`🧹 Received token_clear_all for campaign ${campaignId}`)

        if (socket.data.campaignId !== campaignId) {
          console.error(`❌ User ${socket.data.userId} not in campaign ${campaignId}`)
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Clear all tokens from gameState
        await prisma.gameState.upsert({
          where: { campaignId },
          update: {
            tokens: JSON.stringify([]),
            lastActivity: new Date()
          },
          create: {
            campaignId,
            tokens: JSON.stringify([]),
            gameData: JSON.stringify({}),
            activeMapId: null
          }
        })
        
        console.log(`💾 All tokens cleared from campaign ${campaignId}`)

        // Notify all users in the campaign
        io.to(campaignId).emit('game:tokens-cleared', {
          campaignId,
          userId: socket.data.userId,
          userName: socket.data.userName
        })
        console.log(`📡 Broadcasted game:tokens-cleared to campaign ${campaignId}`)

      } catch (error) {
        console.error('❌ Error clearing tokens:', error)
        socket.emit('error', 'Failed to clear tokens')
      }
    })

    // Token deletion
    socket.on('token_delete', async (data) => {
      try {
        const { campaignId, tokenId, userId } = data
        console.log(`🗑️ Received token delete: ${tokenId} from ${userId} in campaign ${campaignId}`)

        if (socket.data.campaignId !== campaignId) {
          console.error(`❌ User ${socket.data.userId} not in campaign ${campaignId}`)
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Get current gameState
        let gameState = await prisma.gameState.findUnique({
          where: { campaignId }
        })

        if (!gameState) {
          console.log(`❌ No gameState found for campaign ${campaignId}`)
          socket.emit('error', 'No game state found')
          return
        }

        // Remove token from gameState
        const tokens = JSON.parse(gameState.tokens || '[]')
        const updatedTokens = tokens.filter(token => token.id !== tokenId)
        
        await prisma.gameState.update({
          where: { campaignId },
          data: {
            tokens: JSON.stringify(updatedTokens),
            lastActivity: new Date()
          }
        })
        
        console.log(`💾 Token ${tokenId} removed from campaign ${campaignId} gameState`)

        // Notify all users in the campaign about token deletion
        io.to(campaignId).emit('game:token-deleted', {
          tokenId,
          userId,
          campaignId
        })
        console.log(`📡 Broadcasted token deletion to campaign ${campaignId}`)

      } catch (error) {
        console.error('❌ Error deleting token:', error)
        socket.emit('error', 'Failed to delete token')
      }
    })

    // Token creation
    socket.on('token_create', async (data) => {
      try {
        const { campaignId, tokenData } = data
        console.log(`🎯 Received token_create: ${tokenData.name} in campaign ${campaignId}`)

        if (socket.data.campaignId !== campaignId) {
          console.error(`❌ User ${socket.data.userId} not in campaign ${campaignId}`)
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Add token to gameState
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
        tokens.push(tokenData)
        
        await prisma.gameState.update({
          where: { campaignId },
          data: {
            tokens: JSON.stringify(tokens),
            lastActivity: new Date()
          }
        })
        
        console.log(`💾 Token created and saved: ${tokenData.name}`)

        // Notify other users
        socket.to(campaignId).emit('game:token-created', {
          token: tokenData,
          userId: socket.data.userId
        })
        console.log(`📡 Broadcasted game:token-created to campaign ${campaignId}`)

      } catch (error) {
        console.error('❌ Error creating token:', error)
        socket.emit('error', 'Failed to create token')
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

    // Token update notification (lightweight sync for large data)
    socket.on('token_update_notification', async (data) => {
      try {
        const { campaignId, tokenId, updateType, characterId, characterName, characterType } = data
        console.log(`🔔 Received token_update_notification: ${tokenId} in campaign ${campaignId}`, { updateType, characterId, characterName })

        if (socket.data.campaignId !== campaignId) {
          console.error(`❌ User ${socket.data.userId} not in campaign ${campaignId}`)
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Update token in gameState with lightweight data
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
        const tokenIndex = tokens.findIndex(t => t.id === tokenId)
        
        if (tokenIndex !== -1) {
          console.log(`✅ Found token ${tokenId} for lightweight update`)
          
          // Update with lightweight character linking data
          tokens[tokenIndex] = { 
            ...tokens[tokenIndex], 
            characterId,
            name: characterName,
            alt: characterName,
            characterType
          }
          
          await prisma.gameState.update({
            where: { campaignId },
            data: {
              tokens: JSON.stringify(tokens),
              lastActivity: new Date()
            }
          })
          
          console.log(`💾 Token lightweight update saved: ${tokenId}`)
        }

        // Send lightweight notification to other users to trigger token refresh
        socket.to(campaignId).emit('game:token-refresh', {
          tokenId,
          updateType,
          characterId,
          characterName,
          characterType,
          userId: socket.data.userId
        })
        
        console.log(`📡 Broadcasted game:token-refresh notification to campaign ${campaignId}`)

      } catch (error) {
        console.error('❌ Error processing token update notification:', error)
        socket.emit('error', 'Failed to process notification')
      }
    })

    // Token update (for character linking and other updates)
    socket.on('token_update', async (data) => {
      try {
        const { campaignId, tokenId, updates } = data
        console.log(`🔄 Received token_update: ${tokenId} in campaign ${campaignId}`, updates)
        
        // Debug: Check if this is a size update
        const isSizeUpdate = updates.tokenSize || updates.sizeType
        if (isSizeUpdate) {
          console.log(`📏 Server: Size update for token ${tokenId}:`, {
            tokenSize: updates.tokenSize,
            sizeType: updates.sizeType
          })
        }

        if (socket.data.campaignId !== campaignId) {
          console.error(`❌ User ${socket.data.userId} not in campaign ${campaignId}`)
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Update token in gameState
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
        const tokenIndex = tokens.findIndex(t => t.id === tokenId)
        
        if (tokenIndex !== -1) {
          console.log(`✅ Found token ${tokenId} at index ${tokenIndex}`)
          
          // Debug: Check if updates contain large avatar data
          const hasLargeAvatar = updates.src && updates.src.length > 1000
          if (hasLargeAvatar) {
            console.log(`🖼️ Large avatar detected for token ${tokenId}, size: ${updates.src.length} chars`)
          }
          
          // Merge updates into existing token
          const oldToken = { ...tokens[tokenIndex] }
          tokens[tokenIndex] = { ...tokens[tokenIndex], ...updates }
          
          // Debug: Log the final token to see if size properties are included
          if (isSizeUpdate) {
            console.log(`📏 Server: Final token after merge:`, {
              id: tokens[tokenIndex].id,
              name: tokens[tokenIndex].name,
              tokenSize: tokens[tokenIndex].tokenSize,
              sizeType: tokens[tokenIndex].sizeType
            })
          }
          
          try {
            await prisma.gameState.update({
              where: { campaignId },
              data: {
                tokens: JSON.stringify(tokens),
                lastActivity: new Date()
              }
            })
            
            console.log(`💾 Token updated successfully: ${tokenId}`)
            if (hasLargeAvatar) {
              console.log(`🖼️ Large avatar saved successfully for token ${tokenId}`)
            }
            if (isSizeUpdate) {
              console.log(`📏 Server: Size update saved to database for token ${tokenId}`)
            }
          } catch (dbError) {
            console.error(`❌ Database save failed for token ${tokenId}:`, dbError)
            // Revert token changes if DB save failed
            tokens[tokenIndex] = oldToken
            throw dbError
          }

          // Notify other users
          try {
            const broadcastData = {
              tokenId,
              updates,
              token: tokens[tokenIndex], // Send complete updated token
              userId: socket.data.userId
            }
            
            // Debug: Check broadcast data size
            const broadcastSize = JSON.stringify(broadcastData).length
            if (broadcastSize > 10000) {
              console.log(`📡 Large broadcast data for token ${tokenId}, size: ${broadcastSize} chars`)
            }
            
            socket.to(campaignId).emit('game:token-updated', broadcastData)
            console.log(`📡 Broadcasted game:token-updated to campaign ${campaignId}`)
            
            if (hasLargeAvatar) {
              console.log(`🖼️ Large avatar broadcasted successfully for token ${tokenId}`)
            }
          } catch (broadcastError) {
            console.error(`❌ Broadcast failed for token ${tokenId}:`, broadcastError)
          }

        } else {
          console.warn(`⚠️ Token ${tokenId} not found in gameState.tokens`)
          console.log(`📝 Available token IDs:`, tokens.map(t => t.id))
          socket.emit('error', 'Token not found for update')
        }

      } catch (error) {
        console.error('❌ Error updating token:', error)
        socket.emit('error', 'Failed to update token')
      }
    })

    // Token linking events (legacy support)
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

    // Grid configuration update (GM only)
    socket.on('grid_config_update', async (data) => {
      try {
        const { campaignId, config, updatedBy } = data
        console.log(`📐 Received grid config update from ${updatedBy}:`, config)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can update grid configuration')
          return
        }

        // Update gameState with grid configuration
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
              gridConfig: JSON.stringify(config),
              activeMapId: null
            }
          })
        } else {
          await prisma.gameState.update({
            where: { campaignId },
            data: {
              gridConfig: JSON.stringify(config),
              lastActivity: new Date()
            }
          })
        }

        console.log(`💾 Grid config saved to database for campaign ${campaignId}`)

        // Broadcast grid configuration to all campaign members
        socket.to(campaignId).emit('grid:config-updated', {
          config,
          updatedBy,
          campaignId
        })

        console.log(`📡 Grid config broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error updating grid configuration:', error)
        socket.emit('error', 'Failed to update grid configuration')
      }
    })

    // Measurement show (GM only)
    socket.on('measurement_show', async (data) => {
      try {
        const { campaignId, measurement, userId } = data
        console.log(`📏 Received measurement show from ${userId}:`, measurement)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can create measurements')
          return
        }

        // Broadcast measurement to all campaign members
        io.to(campaignId).emit('measurement:show', {
          measurement,
          userId,
          campaignId
        })

        console.log(`📡 Measurement broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error broadcasting measurement:', error)
        socket.emit('error', 'Failed to broadcast measurement')
      }
    })

    // Measurement hide (GM only)
    socket.on('measurement_hide', async (data) => {
      try {
        const { campaignId, measurementId, userId } = data
        console.log(`📏 Received measurement hide from ${userId}:`, measurementId)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can hide measurements')
          return
        }

        // Broadcast measurement hide to all campaign members
        io.to(campaignId).emit('measurement:hide', {
          measurementId,
          userId,
          campaignId
        })

        console.log(`📡 Measurement hide broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error broadcasting measurement hide:', error)
        socket.emit('error', 'Failed to broadcast measurement hide')
      }
    })

    // Drawing show (GM only)
    socket.on('drawing_show', async (data) => {
      try {
        const { campaignId, drawing, userId } = data
        console.log(`✏️ Received drawing show from ${userId}:`, drawing)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can create drawings')
          return
        }

        // Broadcast drawing to all campaign members
        io.to(campaignId).emit('drawing:show', {
          drawing,
          userId,
          campaignId
        })

        console.log(`📡 Drawing broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error broadcasting drawing:', error)
        socket.emit('error', 'Failed to broadcast drawing')
      }
    })

    // Drawing hide (GM only)
    socket.on('drawing_hide', async (data) => {
      try {
        const { campaignId, drawingId, userId } = data
        console.log(`✏️ Received drawing hide from ${userId}:`, drawingId)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can hide drawings')
          return
        }

        // Broadcast drawing hide to all campaign members
        io.to(campaignId).emit('drawing:hide', {
          drawingId,
          userId,
          campaignId
        })

        console.log(`📡 Drawing hide broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error broadcasting drawing hide:', error)
        socket.emit('error', 'Failed to broadcast drawing hide')
      }
    })

    // Marker show (GM only)
    socket.on('marker:show', async (data) => {
      try {
        const { campaignId, marker, userId } = data
        console.log(`📍 Received marker show from ${userId}:`, marker)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can create markers')
          return
        }

        // Broadcast marker to all campaign members
        io.to(campaignId).emit('marker:show', {
          marker,
          userId,
          campaignId
        })

        console.log(`📡 Marker broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error broadcasting marker:', error)
        socket.emit('error', 'Failed to broadcast marker')
      }
    })

    // Marker hide (GM only)
    socket.on('marker:hide', async (data) => {
      try {
        const { campaignId, markerId, userId } = data
        console.log(`📍 Received marker hide from ${userId}:`, markerId)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can hide markers')
          return
        }

        // Broadcast marker hide to all campaign members
        io.to(campaignId).emit('marker:hide', {
          markerId,
          userId,
          campaignId
        })

        console.log(`📡 Marker hide broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error broadcasting marker hide:', error)
        socket.emit('error', 'Failed to broadcast marker hide')
      }
    })

    // Fog of War show (GM only)
    socket.on('fog:show', async (data) => {
      try {
        const { campaignId, fogArea, userId } = data
        console.log(`🌫️ Received fog area show from ${userId}:`, fogArea)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can create fog areas')
          return
        }

        // Broadcast fog area to all campaign members
        io.to(campaignId).emit('fog:show', {
          fogArea,
          userId,
          campaignId
        })

        console.log(`📡 Fog area broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error broadcasting fog area:', error)
        socket.emit('error', 'Failed to broadcast fog area')
      }
    })

    // Fog of War hide (GM only)
    socket.on('fog:hide', async (data) => {
      try {
        const { campaignId, fogId, userId } = data
        console.log(`🌫️ Received fog area hide from ${userId}:`, fogId)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can hide fog areas')
          return
        }

        // Broadcast fog area hide to all campaign members
        io.to(campaignId).emit('fog:hide', {
          fogId,
          userId,
          campaignId
        })

        console.log(`📡 Fog area hide broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error broadcasting fog area hide:', error)
        socket.emit('error', 'Failed to broadcast fog area hide')
      }
    })

    // Fog of War cell erase (GM only)
    socket.on('fog:cell-erase', async (data) => {
      try {
        const { campaignId, cellX, cellY, newFogAreas, userId } = data
        console.log(`🧹 Received fog cell erase from ${userId} at cell (${cellX}, ${cellY})`)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can erase fog cells')
          return
        }

        // Broadcast fog cell erase to all campaign members
        io.to(campaignId).emit('fog:cell-erase', {
          cellX,
          cellY,
          newFogAreas,
          userId,
          campaignId
        })

        console.log(`📡 Fog cell erase broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error broadcasting fog cell erase:', error)
        socket.emit('error', 'Failed to broadcast fog cell erase')
      }
    })

    // Fog of War clear all (GM only)
    socket.on('fog:clear-all', async (data) => {
      try {
        const { campaignId, userId } = data
        console.log(`🧹 Received fog clear all from ${userId}`)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can clear all fog areas')
          return
        }

        // Broadcast fog clear all to all campaign members
        io.to(campaignId).emit('fog:clear-all', {
          userId,
          campaignId
        })

        console.log(`📡 Fog clear all broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error broadcasting fog clear all:', error)
        socket.emit('error', 'Failed to broadcast fog clear all')
      }
    })

    // Fog of War area erase (GM only)
    socket.on('fog:area-erase', async (data) => {
      try {
        const { campaignId, eraserArea, newFogAreas, userId } = data
        console.log(`🧹 Received fog area erase from ${userId}`)

        if (socket.data.campaignId !== campaignId) {
          socket.emit('error', 'Not in this campaign')
          return
        }

        // Verify GM permission
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { ownerId: true }
        })

        if (!campaign || campaign.ownerId !== socket.data.userId) {
          socket.emit('error', 'Only GM can erase fog areas')
          return
        }

        // Broadcast fog area erase to all campaign members
        io.to(campaignId).emit('fog:area-erase', {
          eraserArea,
          newFogAreas,
          userId,
          campaignId
        })

        console.log(`📡 Fog area erase broadcasted to campaign ${campaignId} members`)

      } catch (error) {
        console.error('❌ Error broadcasting fog area erase:', error)
        socket.emit('error', 'Failed to broadcast fog area erase')
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