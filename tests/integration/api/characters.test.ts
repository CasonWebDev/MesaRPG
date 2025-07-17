import { testDb, setupTestDatabase, teardownTestDatabase } from '@/tests/db-setup'
import { NextRequest } from 'next/server'
import { GET as getCharactersHandler, POST as createCharacterHandler } from '@/app/api/campaigns/[id]/characters/route'
import { GET as getCharacterHandler, PUT as updateCharacterHandler, DELETE as deleteCharacterHandler } from '@/app/api/campaigns/[id]/characters/[characterId]/route'
import bcrypt from 'bcryptjs'

describe('Characters API Integration Tests', () => {
  let testUser: any
  let testUser2: any
  let testCampaign: any

  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    // Clean up all tables
    await testDb.character.deleteMany()
    await testDb.campaignMember.deleteMany()
    await testDb.campaign.deleteMany()
    await testDb.user.deleteMany()

    // Create test users
    testUser = await testDb.user.create({
      data: {
        name: 'Test GM',
        email: 'gm@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PLAYER',
      },
    })

    testUser2 = await testDb.user.create({
      data: {
        name: 'Test Player',
        email: 'player@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PLAYER',
      },
    })

    // Create test campaign
    testCampaign = await testDb.campaign.create({
      data: {
        name: 'Test Campaign',
        description: 'Test description',
        system: 'dnd5e',
        ownerId: testUser.id,
        members: {
          create: [
            { userId: testUser.id, role: 'GM' },
            { userId: testUser2.id, role: 'PLAYER' }
          ]
        }
      },
      include: { members: true }
    })
  })

  describe('POST /api/campaigns/[id]/characters', () => {
    it('should create a new character successfully', async () => {
      const characterData = {
        name: 'Test Character',
        type: 'PC',
        data: {
          class: 'Fighter',
          level: 1,
          race: 'Human'
        }
      }

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters`, {
        method: 'POST',
        body: JSON.stringify(characterData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createCharacterHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.character).toMatchObject({
        name: 'Test Character',
        type: 'PC',
        campaignId: testCampaign.id,
        createdById: testUser.id,
      })

      // Verify character was created in database
      const dbCharacter = await testDb.character.findUnique({
        where: { id: data.character.id }
      })
      
      expect(dbCharacter).toBeTruthy()
      expect(dbCharacter?.name).toBe('Test Character')
      expect(dbCharacter?.type).toBe('PC')
      expect(dbCharacter?.data).toMatchObject({
        class: 'Fighter',
        level: 1,
        race: 'Human'
      })
    })

    it('should create NPC character as GM', async () => {
      const characterData = {
        name: 'Test NPC',
        type: 'NPC',
        data: {
          description: 'A helpful merchant',
          hitPoints: 20
        }
      }

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters`, {
        method: 'POST',
        body: JSON.stringify(characterData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createCharacterHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.character.type).toBe('NPC')
      expect(data.character.name).toBe('Test NPC')
    })

    it('should reject character creation with invalid data', async () => {
      const characterData = {
        name: '', // Empty name should be invalid
        type: 'PC'
      }

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters`, {
        method: 'POST',
        body: JSON.stringify(characterData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createCharacterHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should reject character creation for non-member', async () => {
      // Create a user who is not a member of the campaign
      const nonMember = await testDb.user.create({
        data: {
          name: 'Non Member',
          email: 'nonmember@example.com',
          password: await bcrypt.hash('password123', 10),
          role: 'PLAYER',
        },
      })

      const characterData = {
        name: 'Test Character',
        type: 'PC'
      }

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: nonMember.id, email: nonMember.email, name: nonMember.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters`, {
        method: 'POST',
        body: JSON.stringify(characterData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createCharacterHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Acesso negado à campanha')
    })
  })

  describe('GET /api/campaigns/[id]/characters', () => {
    let testCharacter1: any
    let testCharacter2: any
    let testCharacter3: any

    beforeEach(async () => {
      // Create test characters
      testCharacter1 = await testDb.character.create({
        data: {
          name: 'PC Character',
          type: 'PC',
          campaignId: testCampaign.id,
          createdById: testUser2.id,
          ownerId: testUser2.id,
          data: { class: 'Wizard', level: 3 }
        }
      })

      testCharacter2 = await testDb.character.create({
        data: {
          name: 'NPC Character',
          type: 'NPC',
          campaignId: testCampaign.id,
          createdById: testUser.id, // GM created
          data: { description: 'Town guard' }
        }
      })

      testCharacter3 = await testDb.character.create({
        data: {
          name: 'Creature Character',
          type: 'CREATURE',
          campaignId: testCampaign.id,
          createdById: testUser.id, // GM created
          data: { description: 'Orc warrior' }
        }
      })
    })

    it('should return all characters for GM', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters`)
      const response = await getCharactersHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.characters).toHaveLength(3)
      
      const characterNames = data.characters.map((c: any) => c.name)
      expect(characterNames).toContain('PC Character')
      expect(characterNames).toContain('NPC Character')
      expect(characterNames).toContain('Creature Character')
    })

    it('should return filtered characters for player', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser2.id, email: testUser2.email, name: testUser2.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters`)
      const response = await getCharactersHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      // Player should see their own PC and shared NPCs/Creatures
      expect(data.characters.length).toBeGreaterThan(0)
      
      const playerCharacter = data.characters.find((c: any) => c.name === 'PC Character')
      expect(playerCharacter).toBeTruthy()
      expect(playerCharacter.ownerId).toBe(testUser2.id)
    })

    it('should filter by character type', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters?type=NPC`)
      const response = await getCharactersHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.characters).toHaveLength(1)
      expect(data.characters[0].type).toBe('NPC')
      expect(data.characters[0].name).toBe('NPC Character')
    })

    it('should search characters by name', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters?search=PC`)
      const response = await getCharactersHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.characters).toHaveLength(1)
      expect(data.characters[0].name).toBe('PC Character')
    })
  })

  describe('GET /api/campaigns/[id]/characters/[characterId]', () => {
    let testCharacter: any

    beforeEach(async () => {
      testCharacter = await testDb.character.create({
        data: {
          name: 'Test Character',
          type: 'PC',
          campaignId: testCampaign.id,
          createdById: testUser2.id,
          ownerId: testUser2.id,
          data: { class: 'Rogue', level: 2 }
        }
      })
    })

    it('should return character details for owner', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser2.id, email: testUser2.email, name: testUser2.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters/${testCharacter.id}`)
      const response = await getCharacterHandler(request, { 
        params: { id: testCampaign.id, characterId: testCharacter.id } 
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.character.id).toBe(testCharacter.id)
      expect(data.character.name).toBe('Test Character')
      expect(data.character.ownerId).toBe(testUser2.id)
    })

    it('should return character details for GM', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters/${testCharacter.id}`)
      const response = await getCharacterHandler(request, { 
        params: { id: testCampaign.id, characterId: testCharacter.id } 
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.character.id).toBe(testCharacter.id)
    })

    it('should return 404 for non-existent character', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters/non-existent-id`)
      const response = await getCharacterHandler(request, { 
        params: { id: testCampaign.id, characterId: 'non-existent-id' } 
      })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Personagem não encontrado')
    })
  })

  describe('PUT /api/campaigns/[id]/characters/[characterId]', () => {
    let testCharacter: any

    beforeEach(async () => {
      testCharacter = await testDb.character.create({
        data: {
          name: 'Test Character',
          type: 'PC',
          campaignId: testCampaign.id,
          createdById: testUser2.id,
          ownerId: testUser2.id,
          data: { class: 'Rogue', level: 2 }
        }
      })
    })

    it('should update character successfully by owner', async () => {
      const updateData = {
        name: 'Updated Character Name',
        data: {
          class: 'Rogue',
          level: 3,
          hitPoints: 25
        }
      }

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser2.id, email: testUser2.email, name: testUser2.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters/${testCharacter.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await updateCharacterHandler(request, { 
        params: { id: testCampaign.id, characterId: testCharacter.id } 
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.character.name).toBe('Updated Character Name')
      expect(data.character.data.level).toBe(3)
      expect(data.character.data.hitPoints).toBe(25)

      // Verify database was updated
      const dbCharacter = await testDb.character.findUnique({
        where: { id: testCharacter.id }
      })
      expect(dbCharacter?.name).toBe('Updated Character Name')
      expect(dbCharacter?.data).toMatchObject({
        class: 'Rogue',
        level: 3,
        hitPoints: 25
      })
    })

    it('should update character successfully by GM', async () => {
      const updateData = {
        name: 'GM Updated Name'
      }

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters/${testCharacter.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await updateCharacterHandler(request, { 
        params: { id: testCampaign.id, characterId: testCharacter.id } 
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.character.name).toBe('GM Updated Name')
    })

    it('should reject update by unauthorized user', async () => {
      // Create another user not involved in the campaign
      const unauthorizedUser = await testDb.user.create({
        data: {
          name: 'Unauthorized User',
          email: 'unauthorized@example.com',
          password: await bcrypt.hash('password123', 10),
          role: 'PLAYER',
        },
      })

      const updateData = {
        name: 'Unauthorized Update'
      }

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: unauthorizedUser.id, email: unauthorizedUser.email, name: unauthorizedUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters/${testCharacter.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await updateCharacterHandler(request, { 
        params: { id: testCampaign.id, characterId: testCharacter.id } 
      })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Acesso negado à campanha')
    })
  })

  describe('DELETE /api/campaigns/[id]/characters/[characterId]', () => {
    let testCharacter: any

    beforeEach(async () => {
      testCharacter = await testDb.character.create({
        data: {
          name: 'Test Character',
          type: 'PC',
          campaignId: testCampaign.id,
          createdById: testUser2.id,
          ownerId: testUser2.id,
          data: { class: 'Rogue', level: 2 }
        }
      })
    })

    it('should delete character successfully by owner', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser2.id, email: testUser2.email, name: testUser2.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters/${testCharacter.id}`, {
        method: 'DELETE',
      })

      const response = await deleteCharacterHandler(request, { 
        params: { id: testCampaign.id, characterId: testCharacter.id } 
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify character was deleted from database
      const dbCharacter = await testDb.character.findUnique({
        where: { id: testCharacter.id }
      })
      expect(dbCharacter).toBeNull()
    })

    it('should delete character successfully by GM', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters/${testCharacter.id}`, {
        method: 'DELETE',
      })

      const response = await deleteCharacterHandler(request, { 
        params: { id: testCampaign.id, characterId: testCharacter.id } 
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify character was deleted
      const dbCharacter = await testDb.character.findUnique({
        where: { id: testCharacter.id }
      })
      expect(dbCharacter).toBeNull()
    })

    it('should reject deletion by unauthorized user', async () => {
      const unauthorizedUser = await testDb.user.create({
        data: {
          name: 'Unauthorized User',
          email: 'unauthorized@example.com',
          password: await bcrypt.hash('password123', 10),
          role: 'PLAYER',
        },
      })

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: unauthorizedUser.id, email: unauthorizedUser.email, name: unauthorizedUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}/characters/${testCharacter.id}`, {
        method: 'DELETE',
      })

      const response = await deleteCharacterHandler(request, { 
        params: { id: testCampaign.id, characterId: testCharacter.id } 
      })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Acesso negado à campanha')

      // Verify character still exists
      const dbCharacter = await testDb.character.findUnique({
        where: { id: testCharacter.id }
      })
      expect(dbCharacter).toBeTruthy()
    })
  })
})