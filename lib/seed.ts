import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function seedDatabase() {
  try {
    // Limpar dados existentes
    await prisma.chatMessage.deleteMany()
    await prisma.gameState.deleteMany()
    await prisma.character.deleteMany()
    await prisma.map.deleteMany()
    await prisma.handout.deleteMany()
    await prisma.sheetTemplate.deleteMany()
    await prisma.campaignPlayer.deleteMany()
    await prisma.campaign.deleteMany()
    await prisma.user.deleteMany()

    // Criar usuários
    const hashedPassword = await bcrypt.hash('123456', 10)

    const gm = await prisma.user.create({
      data: {
        email: 'gm@example.com',
        name: 'Mestre',
        password: hashedPassword,
        role: 'GM'
      }
    })

    const player1 = await prisma.user.create({
      data: {
        email: 'player1@example.com',
        name: 'Jogador 1',
        password: hashedPassword,
        role: 'PLAYER'
      }
    })

    const player2 = await prisma.user.create({
      data: {
        email: 'player2@example.com',
        name: 'Jogador 2',
        password: hashedPassword,
        role: 'PLAYER'
      }
    })

    // Criar campanha
    const campaign = await prisma.campaign.create({
      data: {
        name: 'Campanha de Teste',
        description: 'Uma campanha de exemplo para testar o sistema',
        gmId: gm.id,
        settings: JSON.stringify({
          gridSize: 20,
          maxPlayers: 6,
          isPrivate: false
        })
      }
    })

    // Adicionar jogadores à campanha
    await prisma.campaignPlayer.createMany({
      data: [
        { campaignId: campaign.id, userId: player1.id },
        { campaignId: campaign.id, userId: player2.id }
      ]
    })

    // Criar templates de ficha
    const templates = [
      {
        name: 'Personagem Jogador',
        type: 'PC',
        fields: JSON.stringify([
          { id: 'name', name: 'Nome', type: 'text' },
          { id: 'class', name: 'Classe & Nível', type: 'text' },
          { id: 'strength', name: 'Força', type: 'number' },
          { id: 'dexterity', name: 'Destreza', type: 'number' },
          { id: 'constitution', name: 'Constituição', type: 'number' },
          { id: 'avatar', name: 'Avatar', type: 'image' },
          { id: 'background', name: 'História', type: 'textarea' }
        ]),
        isDefault: true
      },
      {
        name: 'NPC',
        type: 'NPC',
        fields: JSON.stringify([
          { id: 'name', name: 'Nome', type: 'text' },
          { id: 'occupation', name: 'Ocupação', type: 'text' },
          { id: 'motivation', name: 'Motivação', type: 'textarea' },
          { id: 'loyalty', name: 'Lealdade', type: 'boolean' },
          { id: 'avatar', name: 'Avatar', type: 'image' }
        ]),
        isDefault: true
      },
      {
        name: 'Criatura',
        type: 'CREATURE',
        fields: JSON.stringify([
          { id: 'name', name: 'Nome da Criatura', type: 'text' },
          { id: 'hp', name: 'Pontos de Vida', type: 'number' },
          { id: 'ac', name: 'Classe de Armadura', type: 'number' },
          { id: 'actions', name: 'Ações', type: 'textarea' },
          { id: 'treasure', name: 'Tesouro', type: 'textarea' },
          { id: 'token', name: 'Token', type: 'image' }
        ]),
        isDefault: true
      }
    ]

    for (const template of templates) {
      await prisma.sheetTemplate.create({
        data: {
          campaignId: campaign.id,
          ...template
        }
      })
    }

    // Criar personagens
    const characters = [
      {
        name: 'Aragorn',
        type: 'PC',
        userId: player1.id,
        data: JSON.stringify({
          name: 'Aragorn',
          class: 'Guerreiro, Nível 7',
          strength: 18,
          dexterity: 15,
          constitution: 16,
          avatar: '/placeholder.svg',
          background: 'Criado nas terras selvagens do norte, Aragorn é um ranger habilidoso e um guerreiro formidável.'
        }),
        tokenData: JSON.stringify({
          id: 'token1',
          src: '/placeholder.svg',
          alt: 'Aragorn',
          position: { x: 100, y: 100 },
          borderColor: '#3b82f6'
        })
      },
      {
        name: 'Gandalf',
        type: 'PC',
        userId: player2.id,
        data: JSON.stringify({
          name: 'Gandalf',
          class: 'Mago, Nível 7',
          strength: 10,
          dexterity: 14,
          constitution: 13,
          avatar: '/placeholder.svg',
          background: 'Um ser de grande poder e sabedoria.'
        }),
        tokenData: JSON.stringify({
          id: 'token2',
          src: '/placeholder.svg',
          alt: 'Gandalf',
          position: { x: 150, y: 150 },
          borderColor: '#10b981'
        })
      },
      {
        name: 'Thoric, o Ferreiro',
        type: 'NPC',
        data: JSON.stringify({
          name: 'Thoric, o Ferreiro',
          occupation: 'Ferreiro',
          motivation: 'Forjar a arma perfeita.',
          loyalty: true,
          avatar: '/placeholder.svg'
        }),
        tokenData: JSON.stringify({
          id: 'token3',
          src: '/placeholder.svg',
          alt: 'Thoric',
          position: { x: 200, y: 200 },
          borderColor: '#f59e0b'
        })
      },
      {
        name: 'Goblin Batedor',
        type: 'CREATURE',
        data: JSON.stringify({
          name: 'Goblin Batedor',
          hp: 7,
          ac: 15,
          actions: 'Ataque com Adaga: +4 para acertar, 1d4+2 de dano perfurante.',
          treasure: '3 moedas de cobre.',
          token: '/placeholder.svg'
        }),
        tokenData: JSON.stringify({
          id: 'token4',
          src: '/placeholder.svg',
          alt: 'Goblin',
          position: { x: 250, y: 250 },
          borderColor: '#ef4444'
        })
      }
    ]

    for (const character of characters) {
      await prisma.character.create({
        data: {
          campaignId: campaign.id,
          ...character
        }
      })
    }

    // Criar mapa
    const map = await prisma.map.create({
      data: {
        campaignId: campaign.id,
        name: 'Mapa de Teste',
        imageUrl: '/placeholder.svg',
        isActive: true,
        gridSize: 20,
        settings: JSON.stringify({
          gridVisible: true,
          gridColor: '#000000',
          gridOpacity: 0.5
        })
      }
    })

    // Criar handouts
    await prisma.handout.createMany({
      data: [
        {
          campaignId: campaign.id,
          name: 'Regras da Casa',
          content: 'Regras específicas desta campanha.',
          attachments: JSON.stringify([]),
          sharedWith: JSON.stringify([player1.id, player2.id])
        },
        {
          campaignId: campaign.id,
          name: 'Mapa da Cidade',
          content: 'Descrição da cidade principal.',
          attachments: JSON.stringify([]),
          sharedWith: JSON.stringify([player1.id])
        }
      ]
    })

    // Criar estado do jogo
    await prisma.gameState.create({
      data: {
        campaignId: campaign.id,
        activeMapId: map.id,
        tokens: JSON.stringify([
          {
            id: 'token1',
            src: '/placeholder.svg',
            alt: 'Aragorn',
            position: { x: 100, y: 100 },
            borderColor: '#3b82f6'
          },
          {
            id: 'token2',
            src: '/placeholder.svg',
            alt: 'Gandalf',
            position: { x: 150, y: 150 },
            borderColor: '#10b981'
          }
        ]),
        gameData: JSON.stringify({
          initiative: [],
          currentTurn: 0,
          round: 1
        })
      }
    })

    // Criar algumas mensagens de chat
    await prisma.chatMessage.createMany({
      data: [
        {
          campaignId: campaign.id,
          userId: gm.id,
          message: 'Bem-vindos à campanha!',
          type: 'SYSTEM',
          metadata: JSON.stringify({})
        },
        {
          campaignId: campaign.id,
          userId: player1.id,
          message: 'Olá pessoal!',
          type: 'CHAT',
          metadata: JSON.stringify({})
        },
        {
          campaignId: campaign.id,
          userId: player2.id,
          message: 'Vamos começar a aventura!',
          type: 'CHAT',
          metadata: JSON.stringify({})
        }
      ]
    })

    console.log('Banco de dados populado com sucesso!')
    console.log('Usuários criados:')
    console.log('- GM: gm@example.com / 123456')
    console.log('- Jogador 1: player1@example.com / 123456')
    console.log('- Jogador 2: player2@example.com / 123456')
    console.log(`- Campanha: ${campaign.name} (ID: ${campaign.id})`)

  } catch (error) {
    console.error('Erro ao popular banco de dados:', error)
    throw error
  }
}