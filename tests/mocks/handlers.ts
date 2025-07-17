import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth handlers
  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'PLAYER',
      },
    })
  }),

  http.post('/api/auth/signin', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'PLAYER',
      },
    })
  }),

  // Campaign handlers
  http.get('/api/campaigns', () => {
    return HttpResponse.json({
      campaigns: [
        {
          id: 'test-campaign-id',
          name: 'Test Campaign',
          description: 'Test campaign description',
          rpgSystem: 'dnd5e',
          userRole: 'GM',
          createdAt: new Date().toISOString(),
        },
      ],
    })
  }),

  http.post('/api/campaigns/create', () => {
    return HttpResponse.json({
      success: true,
      campaign: {
        id: 'new-campaign-id',
        name: 'New Campaign',
        description: 'New campaign description',
        rpgSystem: 'dnd5e',
        createdAt: new Date().toISOString(),
      },
    })
  }),

  http.get('/api/campaigns/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      campaign: {
        id,
        name: 'Test Campaign',
        description: 'Test campaign description',
        rpgSystem: 'dnd5e',
        ownerId: 'test-user-id',
        isActive: true,
        playerLimit: 8,
        createdAt: new Date().toISOString(),
        owner: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
        members: [],
      },
    })
  }),

  // Character handlers
  http.get('/api/campaigns/:id/characters', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      characters: [
        {
          id: 'test-character-id',
          name: 'Test Character',
          type: 'PC',
          data: {
            level: 1,
            class: 'Fighter',
            race: 'Human',
            abilities: {
              strength: 15,
              dexterity: 14,
              constitution: 13,
              intelligence: 12,
              wisdom: 10,
              charisma: 8,
            },
          },
          userId: 'test-user-id',
          campaignId: id,
          createdAt: new Date().toISOString(),
          user: {
            id: 'test-user-id',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ],
      isGM: true,
    })
  }),

  http.post('/api/campaigns/:id/characters', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      character: {
        id: 'new-character-id',
        name: 'New Character',
        type: 'PC',
        data: {
          level: 1,
          class: 'Fighter',
          race: 'Human',
          abilities: {
            strength: 15,
            dexterity: 14,
            constitution: 13,
            intelligence: 12,
            wisdom: 10,
            charisma: 8,
          },
        },
        userId: 'test-user-id',
        campaignId: id,
        createdAt: new Date().toISOString(),
        user: {
          id: 'test-user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      message: 'Character created successfully',
    })
  }),

  // Messages handlers
  http.get('/api/campaigns/:id/messages', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      messages: [
        {
          id: 'test-message-id',
          message: 'Hello, world!',
          type: 'CHAT',
          metadata: '{}',
          createdAt: new Date().toISOString(),
          user: {
            id: 'test-user-id',
            name: 'Test User',
          },
        },
      ],
    })
  }),

  http.post('/api/campaigns/:id/messages', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      message: {
        id: 'new-message-id',
        message: 'New message',
        type: 'CHAT',
        metadata: '{}',
        createdAt: new Date().toISOString(),
        user: {
          id: 'test-user-id',
          name: 'Test User',
        },
      },
    })
  }),

  // Maps handlers
  http.get('/api/campaigns/:id/maps', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      maps: [
        {
          id: 'test-map-id',
          name: 'Test Map',
          description: 'Test map description',
          imageUrl: '/test-map.jpg',
          isActive: true,
          gridSize: 25,
          campaignId: id,
          createdAt: new Date().toISOString(),
        },
      ],
    })
  }),

  // Game state handlers
  http.get('/api/campaigns/:id/game-state', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      gameState: {
        id: 'test-game-state-id',
        campaignId: id,
        activeMapId: 'test-map-id',
        tokens: '[]',
        gameData: '{}',
        mapFrozen: false,
        lastActivity: new Date().toISOString(),
      },
    })
  }),

  // Upload handlers
  http.post('/api/upload', () => {
    return HttpResponse.json({
      file: {
        id: 'test-file-id',
        name: 'test-file.jpg',
        originalName: 'test-file.jpg',
        url: '/uploads/test-file.jpg',
        type: 'image/jpeg',
        size: 1024000,
        category: 'misc',
      },
    })
  }),

  // Fallback handler for unhandled requests
  http.all('*', ({ request }) => {
    console.warn(`Unhandled ${request.method} request to ${request.url}`)
    return HttpResponse.json({ error: 'Not found' }, { status: 404 })
  }),
]