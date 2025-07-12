"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"
import { rollDice } from "@/lib/dice"

interface ChatMessage {
  id: string
  message: string
  userId: string
  userName: string
  type: 'CHAT' | 'DICE_ROLL' | 'SYSTEM' | 'OOC'
  metadata?: any
  createdAt: string
}

interface ChatPanelProps {
  campaignId?: string
  currentUserId?: string
}

export function ChatPanel({ campaignId, currentUserId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { socket, isConnected } = useSocket(campaignId)
  
  // Character count validation
  const maxLength = 300
  const charactersRemaining = maxLength - inputMessage.length
  const isOverLimit = charactersRemaining < 0

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleChatMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
    }

    socket.on('chat:message', handleChatMessage)

    return () => {
      socket.off('chat:message', handleChatMessage)
    }
  }, [socket])

  // Load existing messages when component mounts
  useEffect(() => {
    if (!campaignId) return

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/messages`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages || [])
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }

    loadMessages()
  }, [campaignId])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !socket || !campaignId || !isConnected || isOverLimit) return

    const message = inputMessage.trim()
    setInputMessage("")
    setIsLoading(true)

    console.log('Sending message:', { campaignId, message, socketConnected: !!socket, isConnected })

    try {
      // Check if it's a dice roll command
      if (message.startsWith('/r ')) {
        const diceExpression = message.substring(3).trim()
        
        try {
          const diceResult = rollDice(diceExpression)
          
          if (!diceResult.success) {
            // Send error message
            socket.emit('chat:send', {
              campaignId,
              message: `Erro ao rolar dados: ${diceExpression}`,
              type: 'SYSTEM'
            })
            return
          }
          
          // Format rolls for display
          const rollsDisplay = diceResult.rolls.map(roll => {
            const rollsText = roll.rolls.join(', ')
            if (roll.modifier !== 0) {
              return `[${rollsText}] ${roll.modifier >= 0 ? '+' : ''}${roll.modifier}`
            }
            return `[${rollsText}]`
          }).join(' + ')
          
          // Send dice roll message
          socket.emit('chat:send', {
            campaignId,
            message: `${diceResult.expression} = ${rollsDisplay} = **${diceResult.total}**`,
            type: 'DICE_ROLL',
            metadata: {
              expression: diceExpression,
              result: diceResult.total,
              rolls: diceResult.rolls,
              total: diceResult.total
            }
          })
        } catch (error) {
          // Send error message
          socket.emit('chat:send', {
            campaignId,
            message: `Erro ao rolar dados: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
            type: 'SYSTEM'
          })
        }
      } else if (message.startsWith('/ooc ')) {
        // Out of character message
        const oocMessage = message.substring(5).trim()
        socket.emit('chat:send', {
          campaignId,
          message: oocMessage,
          type: 'OOC'
        })
      } else {
        // Regular chat message
        socket.emit('chat:send', {
          campaignId,
          message,
          type: 'CHAT'
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getMessageStyle = (message: ChatMessage) => {
    const isCurrentUser = message.userId === currentUserId
    
    switch (message.type) {
      case 'DICE_ROLL':
        return "italic text-amber-400"
      case 'SYSTEM':
        return "italic text-gray-400"
      case 'OOC':
        return "text-gray-300"
      default:
        return "text-foreground"
    }
  }

  const getUserNameStyle = (message: ChatMessage) => {
    const isCurrentUser = message.userId === currentUserId
    
    if (message.type === 'DICE_ROLL' || message.type === 'SYSTEM') {
      return ""
    }
    
    if (isCurrentUser) {
      return "font-bold text-primary"
    }
    
    // Different colors for different users
    const colors = [
      "font-bold text-blue-400",
      "font-bold text-purple-400", 
      "font-bold text-green-400",
      "font-bold text-yellow-400",
      "font-bold text-red-400",
      "font-bold text-pink-400"
    ]
    
    const userIndex = message.userId.charCodeAt(0) % colors.length
    return colors[userIndex]
  }

  const formatMessage = (message: ChatMessage) => {
    if (message.type === 'DICE_ROLL') {
      return `${message.userName} rolou ${message.message}`
    }
    if (message.type === 'SYSTEM') {
      return `⚙️ ${message.message}`
    }
    if (message.type === 'OOC') {
      return `💬 ${message.userName} (OOC): ${message.message}`
    }
    return `${message.userName}: ${message.message}`
  }

  const renderMessageWithMarkdown = (text: string) => {
    // Simple markdown parser for **bold** text
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={index} className="font-bold">
            {part.slice(2, -2)}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div className="h-full flex flex-col bg-background/50 rounded-lg p-2">
      <div className="flex-grow space-y-2 overflow-y-auto pr-2 max-h-96">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            Nenhuma mensagem ainda. Comece a conversa!
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={getMessageStyle(message)}>
              {message.type === 'DICE_ROLL' || message.type === 'SYSTEM' ? (
                <span>{renderMessageWithMarkdown(formatMessage(message))}</span>
              ) : (
                <>
                  <span className={getUserNameStyle(message)}>
                    {message.type === 'OOC' ? `${message.userName} (OOC)` : `${message.userName}`}:
                  </span>
                  <span className="ml-1">{renderMessageWithMarkdown(message.message)}</span>
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem ou /r 1d20+5 para rolar dados..."
            disabled={isLoading || !isConnected || !campaignId}
            className={`bg-white text-black ${isOverLimit ? 'border-red-500' : ''}`}
            autoComplete="off"
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={isLoading || !isConnected || !campaignId || !inputMessage.trim() || isOverLimit}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Character count helper */}
        {inputMessage.length > 0 && (
          <div className="text-xs text-right">
            {isOverLimit ? (
              <span className="text-red-500">
                {Math.abs(charactersRemaining)} caracteres em excesso
              </span>
            ) : (
              <span className="text-gray-500">
                {charactersRemaining} caracteres restantes
              </span>
            )}
          </div>
        )}
      </div>
      
      {!isConnected && (
        <div className="text-center text-red-400 text-sm mt-2">
          Desconectado do servidor. Tentando reconectar...
        </div>
      )}
    </div>
  )
}