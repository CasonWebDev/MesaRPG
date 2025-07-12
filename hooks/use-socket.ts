import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

export interface ChatMessage {
  id: string
  message: string
  userId: string
  userName: string
  type: 'CHAT' | 'DICE_ROLL' | 'SYSTEM' | 'OOC'
  metadata?: any
  createdAt: string
}

export interface TokenMove {
  tokenId: string
  position: { top: number; left: number }
  userId: string
}

export interface TokenCreate {
  token: any
  userId: string
}

export interface TokenUpdate {
  tokenId: string
  updates: Partial<any>
  token: any
  userId: string
}

export interface TokenRefresh {
  tokenId: string
  updateType: string
  characterId?: string
  characterName?: string
  characterType?: string
  userId: string
}

export interface TokensClear {
  campaignId: string
  userId: string
  userName: string
}

export interface GameStateUpdate {
  gameState: any
  userId: string
}

export interface PlayerUpdate {
  userId: string
  userName: string
}

// Singleton socket instance to prevent multiple connections
let globalSocket: Socket | null = null
let connectionPromise: Promise<Socket> | null = null

export function useSocket(campaignId?: string) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [connectedPlayers, setConnectedPlayers] = useState<PlayerUpdate[]>([])
  const [tokenMoves, setTokenMoves] = useState<TokenMove[]>([])
  const [tokenCreations, setTokenCreations] = useState<TokenCreate[]>([])
  const [tokenUpdates, setTokenUpdates] = useState<TokenUpdate[]>([])
  const [tokenRefreshes, setTokenRefreshes] = useState<TokenRefresh[]>([])
  const [tokensCleared, setTokensCleared] = useState<TokensClear[]>([])
  const [joinedCampaign, setJoinedCampaign] = useState<string | null>(null)
  
  // Debug log
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 useSocket hook called:', { 
      campaignId, 
      sessionUserId: session?.user?.id, 
      hasSocket: !!socket, 
      connected, 
      joinedCampaign 
    })
  }

  const createSocket = async (userId: string): Promise<Socket> => {
    if (globalSocket && globalSocket.connected) {
      console.log('🔌 Reusing existing socket connection')
      return globalSocket
    }

    if (connectionPromise) {
      console.log('🔌 Waiting for existing connection attempt...')
      return connectionPromise
    }

    console.log('🔌 Creating new socket connection for user:', userId)

    connectionPromise = new Promise((resolve, reject) => {
      const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
        auth: {
          token: userId
        },
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      })

      newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully')
        globalSocket = newSocket
        connectionPromise = null
        resolve(newSocket)
      })

      newSocket.on('connect_error', (error: any) => {
        console.error('❌ Socket connection error:', error)
        connectionPromise = null
        reject(error)
      })

      // Set timeout for connection
      setTimeout(() => {
        if (!newSocket.connected) {
          console.error('❌ Socket connection timeout')
          connectionPromise = null
          reject(new Error('Connection timeout'))
        }
      }, 10000)
    })

    return connectionPromise
  }

  useEffect(() => {
    if (!session?.user?.id) {
      console.log('❌ No session or user ID, skipping socket connection')
      return
    }

    let mounted = true

    const initializeSocket = async () => {
      try {
        const socketInstance = await createSocket(session.user.id)
        
        if (!mounted) return

        // Setup event listeners
        const handleConnect = () => {
          console.log('🔌 Socket connected')
          setConnected(true)
        }

        const handleDisconnect = (reason: string) => {
          console.log('🔌 Socket disconnected, reason:', reason)
          setConnected(false)
        }

        const handleChatMessage = (message: ChatMessage) => {
          setMessages(prev => [...prev, message])
        }

        const handlePlayerJoin = (player: PlayerUpdate) => {
          setConnectedPlayers(prev => {
            const exists = prev.some(p => p.userId === player.userId)
            if (exists) return prev
            return [...prev, player]
          })
        }

        const handlePlayerLeave = (player: PlayerUpdate) => {
          setConnectedPlayers(prev => prev.filter(p => p.userId !== player.userId))
        }

        const handlePlayersList = (players: PlayerUpdate[]) => {
          setConnectedPlayers(players)
        }

        const handleTokenMove = (tokenMove: TokenMove) => {
          console.log('Token moved:', tokenMove)
          setTokenMoves(prev => [...prev, tokenMove])
        }

        const handleTokenCreate = (tokenCreate: TokenCreate) => {
          console.log('Token created:', tokenCreate)
          setTokenCreations(prev => [...prev, tokenCreate])
        }

        const handleTokenUpdate = (tokenUpdate: TokenUpdate) => {
          console.log('Token updated:', tokenUpdate)
          setTokenUpdates(prev => [...prev, tokenUpdate])
        }

        const handleTokenRefresh = (tokenRefresh: TokenRefresh) => {
          console.log('🔔 Token refresh notification:', tokenRefresh)
          setTokenRefreshes(prev => [...prev, tokenRefresh])
        }

        const handleTokensClear = (tokensClear: TokensClear) => {
          console.log('Tokens cleared:', tokensClear)
          setTokensCleared(prev => [...prev, tokensClear])
        }

        const handleError = (error: string) => {
          console.error('❌ Socket error:', error)
        }

        const handleCampaignJoined = (campaignId: string) => {
          console.log('✅ Successfully joined campaign:', campaignId)
          setJoinedCampaign(campaignId)
        }

        // Add listeners
        socketInstance.on('connect', handleConnect)
        socketInstance.on('disconnect', handleDisconnect)
        socketInstance.on('chat:message', handleChatMessage)
        socketInstance.on('player:join', handlePlayerJoin)
        socketInstance.on('player:leave', handlePlayerLeave)
        socketInstance.on('players:list', handlePlayersList)
        socketInstance.on('game:token-move', handleTokenMove)
        socketInstance.on('game:token-created', handleTokenCreate)
        socketInstance.on('game:token-updated', handleTokenUpdate)
        socketInstance.on('game:token-refresh', handleTokenRefresh)
        socketInstance.on('game:tokens-cleared', handleTokensClear)
        socketInstance.on('campaign:joined', handleCampaignJoined)
        socketInstance.on('error', handleError)

        setSocket(socketInstance)
        setConnected(socketInstance.connected)

        // Cleanup function
        return () => {
          socketInstance.off('connect', handleConnect)
          socketInstance.off('disconnect', handleDisconnect)
          socketInstance.off('chat:message', handleChatMessage)
          socketInstance.off('player:join', handlePlayerJoin)
          socketInstance.off('player:leave', handlePlayerLeave)
          socketInstance.off('players:list', handlePlayersList)
          socketInstance.off('game:token-move', handleTokenMove)
          socketInstance.off('game:token-created', handleTokenCreate)
          socketInstance.off('game:token-updated', handleTokenUpdate)
          socketInstance.off('game:token-refresh', handleTokenRefresh)
          socketInstance.off('game:tokens-cleared', handleTokensClear)
          socketInstance.off('campaign:joined', handleCampaignJoined)
          socketInstance.off('error', handleError)
        }
      } catch (error) {
        console.error('❌ Failed to initialize socket:', error)
      }
    }

    const cleanup = initializeSocket()

    return () => {
      mounted = false
      cleanup?.then(cleanupFn => cleanupFn?.())
    }
  }, [session?.user?.id])

  useEffect(() => {
    console.log('🔄 Campaign join useEffect triggered:', { 
      hasSocket: !!socket, 
      socketConnected: socket?.connected,
      socketId: socket?.id,
      campaignId,
      joinedCampaign 
    })
    
    if (!socket || !campaignId) {
      console.log('❌ Cannot join campaign - socket:', !!socket, 'campaignId:', campaignId)
      return
    }

    if (!connected) {
      console.log('❌ Socket not connected yet, skipping campaign join')
      return
    }

    // Always join on socket connection or campaign change
    console.log('🏠 Joining campaign:', campaignId, 'with socket:', socket.id)
    socket.emit('campaign:join', campaignId)
    console.log('📤 Emitted campaign:join event')

    return () => {
      if (joinedCampaign === campaignId) {
        console.log('Leaving campaign:', campaignId)
        socket.emit('campaign:leave', campaignId)
        setJoinedCampaign(null)
      }
    }
  }, [socket, campaignId, connected])

  const sendMessage = (message: string, type: 'CHAT' | 'DICE_ROLL' | 'SYSTEM' | 'OOC' = 'CHAT', metadata?: any) => {
    if (!socket || !campaignId) return

    socket.emit('chat:send', {
      campaignId,
      message,
      type,
      metadata
    })
  }

  const moveToken = (tokenId: string, position: { top: number; left: number }) => {
    if (!socket || !campaignId) return

    socket.emit('token_move', {
      campaignId,
      tokenId,
      position
    })
  }

  const createToken = (tokenData: any) => {
    if (!socket || !campaignId) return

    socket.emit('token_create', {
      campaignId,
      tokenData
    })
  }

  const updateGameState = (gameState: any) => {
    if (!socket || !campaignId) return

    socket.emit('game:update-state', {
      campaignId,
      gameState
    })
  }

  const onTokenMove = (callback: (data: TokenMove) => void) => {
    if (!socket) return

    socket.on('game:token-move', callback)
    return () => socket.off('game:token-move', callback)
  }

  const onGameStateUpdate = (callback: (data: GameStateUpdate) => void) => {
    if (!socket) return

    socket.on('game:state-update', callback)
    return () => socket.off('game:state-update', callback)
  }

  const onMapActivate = (callback: (data: { mapId: string; mapName: string; userId: string }) => void) => {
    if (!socket) return

    socket.on('game:map-activate', callback)
    return () => socket.off('game:map-activate', callback)
  }

  return {
    socket,
    connected,
    isConnected: connected,
    messages,
    connectedPlayers,
    tokenMoves,
    tokenCreations,
    tokenUpdates,
    tokenRefreshes,
    tokensCleared,
    sendMessage,
    moveToken,
    createToken,
    updateGameState,
    onTokenMove,
    onGameStateUpdate,
    onMapActivate,
    clearTokenMoves: () => setTokenMoves([]),
    clearTokenCreations: () => setTokenCreations([]),
    clearTokenUpdates: () => setTokenUpdates([]),
    clearTokenRefreshes: () => setTokenRefreshes([]),
    clearTokensCleared: () => setTokensCleared([])
  }
}