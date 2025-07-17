import { testDb, setupTestDatabase, teardownTestDatabase } from '@/tests/db-setup'
import { NextRequest } from 'next/server'
import { POST as registerHandler } from '@/app/api/auth/register/route'
import bcrypt from 'bcryptjs'

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await testDb.user.deleteMany()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.user).toMatchObject({
        name: 'Test User',
        email: 'test@example.com',
        role: 'PLAYER',
      })
      expect(data.user.password).toBeUndefined() // Password should not be returned

      // Verify user was created in database
      const dbUser = await testDb.user.findUnique({
        where: { email: 'test@example.com' },
      })
      expect(dbUser).toBeTruthy()
      expect(dbUser?.name).toBe('Test User')
      expect(dbUser?.email).toBe('test@example.com')
      expect(dbUser?.role).toBe('PLAYER')
      
      // Verify password is hashed
      const isPasswordValid = await bcrypt.compare('password123', dbUser?.password || '')
      expect(isPasswordValid).toBe(true)
    })

    it('should reject registration with invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Dados inválidos')
    })

    it('should reject registration with short password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Dados inválidos')
    })

    it('should reject registration with duplicate email', async () => {
      // Create initial user
      await testDb.user.create({
        data: {
          name: 'Existing User',
          email: 'test@example.com',
          password: await bcrypt.hash('password123', 10),
          role: 'PLAYER',
        },
      })

      const userData = {
        name: 'New User',
        email: 'test@example.com',
        password: 'password456',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Email já está em uso')
    })

    it('should reject registration with missing fields', async () => {
      const userData = {
        name: 'Test User',
        // Missing email and password
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Dados inválidos')
    })

    it('should reject registration with empty name', async () => {
      const userData = {
        name: '',
        email: 'test@example.com',
        password: 'password123',
      }

      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Dados inválidos')
    })

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/register', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await registerHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro interno do servidor')
    })
  })
})