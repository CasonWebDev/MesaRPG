import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { CharacterType } from '@prisma/client'

const UpdateCharacterSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  data: z.record(z.any()).optional(),
  templateId: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; characterId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const campaignId = params.id
    const characterId = params.characterId

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedCampaigns: {
          where: { id: campaignId }
        },
        campaignMemberships: {
          where: { campaignId }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem acesso à campanha
    const hasAccess = user.ownedCampaigns.length > 0 || user.campaignMemberships.length > 0
    const isGM = user.ownedCampaigns.length > 0

    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado à campanha' }, { status: 403 })
    }

    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaign: true,
        template: true
      }
    })

    if (!character || character.campaignId !== campaignId) {
      return NextResponse.json({ error: 'Character não encontrado' }, { status: 404 })
    }

    // Verificar permissões: GM pode ver todos, jogador pode ver seus PCs e NPCs/Criaturas (para vinculação)
    if (!isGM && character.type === 'PC' && character.userId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado ao character' }, { status: 403 })
    }

    // Parse dos dados JSON
    const characterWithParsedData = {
      ...character,
      data: typeof character.data === 'string' ? JSON.parse(character.data) : character.data
    }

    return NextResponse.json({ character: characterWithParsedData })
  } catch (error) {
    console.error('Erro ao buscar personagem:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; characterId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const campaignId = params.id
    const characterId = params.characterId
    const body = await request.json()

    // Validar dados de entrada
    const validationResult = UpdateCharacterSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: validationResult.error.issues 
      }, { status: 400 })
    }

    const { name, data, templateId } = validationResult.data

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem acesso à campanha
    const userWithCampaign = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedCampaigns: {
          where: { id: campaignId }
        },
        campaignMemberships: {
          where: { campaignId }
        }
      }
    })

    const hasAccess = userWithCampaign?.ownedCampaigns.length || userWithCampaign?.campaignMemberships.length
    const isGM = !!userWithCampaign?.ownedCampaigns.length

    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado à campanha' }, { status: 403 })
    }

    // Verificar se o character existe
    const character = await prisma.character.findUnique({
      where: { id: characterId },
      include: {
        campaign: true,
        template: true
      }
    })

    if (!character || character.campaignId !== campaignId) {
      return NextResponse.json({ error: 'Character não encontrado' }, { status: 404 })
    }

    // Verificar permissões baseadas no tipo
    const isOwner = character.userId === user.id

    // GM pode editar NPCs/Criaturas, jogador só seus próprios PCs
    if (!isGM && character.userId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado para editar este character' }, { status: 403 })
    }

    if (!isGM && (character.type === 'NPC' || character.type === 'CREATURE')) {
      return NextResponse.json({ error: 'Apenas o GM pode editar NPCs e Criaturas' }, { status: 403 })
    }

    // Validar dados contra template se fornecidos
    if (data && character.template) {
      const templateFields = typeof character.template.fields === 'string' 
        ? JSON.parse(character.template.fields) 
        : character.template.fields
      const requiredFields = templateFields.filter((field: any) => field.required)
      
      for (const field of requiredFields) {
        if (!data[field.name] || data[field.name] === '') {
          return NextResponse.json({ 
            error: `Campo obrigatório não preenchido: ${field.name}` 
          }, { status: 400 })
        }
      }
    }

    const updatedCharacter = await prisma.character.update({
      where: { id: characterId },
      data: {
        ...(name && { name }),
        ...(data && { data: JSON.stringify(data) }),
        ...(templateId && { templateId })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        campaign: true,
        template: true
      }
    })

    // If name or avatar changed, sync linked tokens
    const hasNameOrAvatarChange = !!name || !!(data && (data.avatar || data.name))
    if (hasNameOrAvatarChange) {
      try {
        console.log('🔄 Character updated, syncing linked tokens:', characterId)
        
        // Get current game state to update linked tokens
        const gameState = await prisma.gameState.findUnique({
          where: { campaignId }
        })

        if (gameState) {
          const tokens = gameState.tokens ? JSON.parse(gameState.tokens) : []
          let tokensUpdated = false

          // Update all tokens linked to this character
          const updatedTokens = tokens.map((token: any) => {
            if (token.characterId === characterId) {
              console.log('🎯 Updating token for character:', characterId)
              tokensUpdated = true
              
              // Determine the new name (top-level name or data.name for D&D 5e)
              const newName = name || data?.name || token.name
              
              return {
                ...token,
                name: newName,
                alt: newName,
                src: (data?.avatar) || token.src
              }
            }
            return token
          })

          // Save updated tokens if any changes were made
          if (tokensUpdated) {
            await prisma.gameState.update({
              where: { campaignId },
              data: {
                tokens: JSON.stringify(updatedTokens),
                lastActivity: new Date()
              }
            })

            console.log('✅ Tokens updated in game state for character:', characterId)

            // Import socket bridge dynamically to emit character update event
            try {
              const { getSocketServer } = await import('@/lib/socket-bridge')
              const io = getSocketServer()
              if (io) {
                console.log('📡 Broadcasting character update to campaign:', campaignId)
                
                // Determine the new name (top-level name or data.name for D&D 5e)
                const newName = name || data?.name || updatedCharacter.name
                
                io.to(campaignId).emit('character:updated', {
                  characterId,
                  campaignId,
                  name: newName,
                  avatar: data?.avatar,
                  updatedTokensCount: updatedTokens.filter((t: any) => t.characterId === characterId).length
                })
                
                console.log('✅ Character update event broadcasted successfully')
              } else {
                console.log('⚠️ Socket.IO server not available')
              }
            } catch (socketError) {
              console.log('⚠️ Socket.IO not available for character update broadcast:', socketError.message)
            }
          }
        }
      } catch (syncError) {
        console.error('❌ Error syncing character to tokens:', syncError)
        // Don't fail the character update if token sync fails
      }
    }

    return NextResponse.json({ 
      character: updatedCharacter,
      message: 'Personagem atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar personagem:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; characterId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const campaignId = params.id
    const characterId = params.characterId

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o personagem existe
    const character = await prisma.character.findUnique({
      where: { id: characterId, campaignId },
      include: {
        campaign: true
      }
    })

    if (!character) {
      return NextResponse.json({ error: 'Personagem não encontrado' }, { status: 404 })
    }

    // Verificar permissões
    const isGM = character.campaign.ownerId === user.id
    const isOwner = character.userId === user.id

    // Apenas GM ou dono do personagem pode deletar
    if (!isGM && !isOwner) {
      return NextResponse.json({ error: 'Você não tem permissão para deletar este personagem' }, { status: 403 })
    }

    await prisma.character.delete({
      where: { id: characterId }
    })

    return NextResponse.json({ message: 'Personagem deletado com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar personagem:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}