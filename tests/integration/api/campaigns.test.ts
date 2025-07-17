import { testDb, setupTestDatabase, teardownTestDatabase } from '@/tests/db-setup'
import { NextRequest } from 'next/server'
import { POST as createCampaignHandler } from '@/app/api/campaigns/create/route'
import { GET as getCampaignsHandler } from '@/app/api/campaigns/route'
import { GET as getCampaignHandler, PUT as updateCampaignHandler, DELETE as deleteCampaignHandler } from '@/app/api/campaigns/[id]/route'
import bcrypt from 'bcryptjs'

describe('Campaigns API Integration Tests', () => {
  let testUser: any
  let testUser2: any

  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    // Clean up all tables
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
  })

  describe('POST /api/campaigns/create', () => {
    it('should create a new campaign successfully', async () => {
      const campaignData = {
        name: 'Test Campaign',
        description: 'A test campaign for integration testing',
        system: 'dnd5e',
      }

      // Mock NextAuth session
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      // Mock the auth module
      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest('http://localhost:3000/api/campaigns/create', {
        method: 'POST',
        body: JSON.stringify(campaignData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createCampaignHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.campaign).toMatchObject({
        name: 'Test Campaign',
        description: 'A test campaign for integration testing',
        system: 'dnd5e',
        ownerId: testUser.id,
      })

      // Verify campaign was created in database
      const dbCampaign = await testDb.campaign.findUnique({
        where: { id: data.campaign.id },
        include: { members: true }
      })
      
      expect(dbCampaign).toBeTruthy()
      expect(dbCampaign?.name).toBe('Test Campaign')
      expect(dbCampaign?.ownerId).toBe(testUser.id)
      expect(dbCampaign?.members).toHaveLength(1)
      expect(dbCampaign?.members[0].userId).toBe(testUser.id)
      expect(dbCampaign?.members[0].role).toBe('GM')
    })

    it('should reject campaign creation with invalid data', async () => {
      const campaignData = {
        name: '', // Empty name should be invalid
        description: 'Test description',
        system: 'dnd5e',
      }

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest('http://localhost:3000/api/campaigns/create', {
        method: 'POST',
        body: JSON.stringify(campaignData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createCampaignHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Dados da campanha são obrigatórios')
    })

    it('should reject campaign creation without authentication', async () => {
      const campaignData = {
        name: 'Test Campaign',
        description: 'Test description',
        system: 'dnd5e',
      }

      const mockGetServerSession = jest.fn().mockResolvedValue(null)

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest('http://localhost:3000/api/campaigns/create', {
        method: 'POST',
        body: JSON.stringify(campaignData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await createCampaignHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Não autorizado')
    })
  })

  describe('GET /api/campaigns', () => {
    let testCampaign1: any
    let testCampaign2: any

    beforeEach(async () => {
      // Create test campaigns
      testCampaign1 = await testDb.campaign.create({
        data: {
          name: 'Campaign 1',
          description: 'First test campaign',
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

      testCampaign2 = await testDb.campaign.create({
        data: {
          name: 'Campaign 2',
          description: 'Second test campaign',
          system: 'pathfinder',
          ownerId: testUser2.id,
          members: {
            create: [
              { userId: testUser2.id, role: 'GM' }
            ]
          }
        },
        include: { members: true }
      })
    })

    it('should return user campaigns', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest('http://localhost:3000/api/campaigns')
      const response = await getCampaignsHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.campaigns).toHaveLength(1) // User should only see Campaign 1
      expect(data.campaigns[0].name).toBe('Campaign 1')
      expect(data.campaigns[0].ownerId).toBe(testUser.id)
    })

    it('should return empty array for user with no campaigns', async () => {
      // Create a new user with no campaigns
      const newUser = await testDb.user.create({
        data: {
          name: 'New User',
          email: 'new@example.com',
          password: await bcrypt.hash('password123', 10),
          role: 'PLAYER',
        },
      })

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: newUser.id, email: newUser.email, name: newUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest('http://localhost:3000/api/campaigns')
      const response = await getCampaignsHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.campaigns).toHaveLength(0)
    })

    it('should reject request without authentication', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue(null)

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest('http://localhost:3000/api/campaigns')
      const response = await getCampaignsHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Não autorizado')
    })
  })

  describe('GET /api/campaigns/[id]', () => {
    let testCampaign: any

    beforeEach(async () => {
      testCampaign = await testDb.campaign.create({
        data: {
          name: 'Test Campaign',
          description: 'Test description',
          system: 'dnd5e',
          ownerId: testUser.id,
          members: {
            create: [
              { userId: testUser.id, role: 'GM' }
            ]
          }
        },
        include: { members: true }
      })
    })

    it('should return campaign details for authorized user', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}`)
      const response = await getCampaignHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.campaign.id).toBe(testCampaign.id)
      expect(data.campaign.name).toBe('Test Campaign')
      expect(data.campaign.ownerId).toBe(testUser.id)
    })

    it('should return 404 for non-existent campaign', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest('http://localhost:3000/api/campaigns/non-existent-id')
      const response = await getCampaignHandler(request, { params: { id: 'non-existent-id' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Campanha não encontrada')
    })

    it('should reject unauthorized access', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser2.id, email: testUser2.email, name: testUser2.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}`)
      const response = await getCampaignHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Campanha não encontrada')
    })
  })

  describe('PUT /api/campaigns/[id]', () => {
    let testCampaign: any

    beforeEach(async () => {
      testCampaign = await testDb.campaign.create({
        data: {
          name: 'Test Campaign',
          description: 'Test description',
          system: 'dnd5e',
          ownerId: testUser.id,
          members: {
            create: [
              { userId: testUser.id, role: 'GM' }
            ]
          }
        },
        include: { members: true }
      })
    })

    it('should update campaign successfully', async () => {
      const updateData = {
        name: 'Updated Campaign Name',
        description: 'Updated description',
        system: 'pathfinder',
      }

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await updateCampaignHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.campaign.name).toBe('Updated Campaign Name')
      expect(data.campaign.description).toBe('Updated description')
      expect(data.campaign.system).toBe('pathfinder')

      // Verify database was updated
      const dbCampaign = await testDb.campaign.findUnique({
        where: { id: testCampaign.id }
      })
      expect(dbCampaign?.name).toBe('Updated Campaign Name')
    })

    it('should reject update by non-owner', async () => {
      const updateData = {
        name: 'Updated Campaign Name',
      }

      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser2.id, email: testUser2.email, name: testUser2.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await updateCampaignHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Campanha não encontrada')
    })
  })

  describe('DELETE /api/campaigns/[id]', () => {
    let testCampaign: any

    beforeEach(async () => {
      testCampaign = await testDb.campaign.create({
        data: {
          name: 'Test Campaign',
          description: 'Test description',
          system: 'dnd5e',
          ownerId: testUser.id,
          members: {
            create: [
              { userId: testUser.id, role: 'GM' }
            ]
          }
        },
        include: { members: true }
      })
    })

    it('should delete campaign successfully', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser.id, email: testUser.email, name: testUser.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}`, {
        method: 'DELETE',
      })

      const response = await deleteCampaignHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify campaign was deleted from database
      const dbCampaign = await testDb.campaign.findUnique({
        where: { id: testCampaign.id }
      })
      expect(dbCampaign).toBeNull()
    })

    it('should reject deletion by non-owner', async () => {
      const mockGetServerSession = jest.fn().mockResolvedValue({
        user: { id: testUser2.id, email: testUser2.email, name: testUser2.name }
      })

      jest.doMock('@/lib/auth', () => ({
        getServerSession: mockGetServerSession
      }))

      const request = new NextRequest(`http://localhost:3000/api/campaigns/${testCampaign.id}`, {
        method: 'DELETE',
      })

      const response = await deleteCampaignHandler(request, { params: { id: testCampaign.id } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Campanha não encontrada')

      // Verify campaign still exists
      const dbCampaign = await testDb.campaign.findUnique({
        where: { id: testCampaign.id }
      })
      expect(dbCampaign).toBeTruthy()
    })
  })
})