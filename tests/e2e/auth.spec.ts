import { test, expect } from '@playwright/test'
import { testDb, setupTestDatabase, teardownTestDatabase } from '../db-setup'
import bcrypt from 'bcryptjs'

test.describe('Authentication Flow', () => {
  test.beforeAll(async () => {
    await setupTestDatabase()
  })

  test.afterAll(async () => {
    await teardownTestDatabase()
  })

  test.beforeEach(async ({ page }) => {
    // Clean up database before each test
    await testDb.user.deleteMany()
    
    // Navigate to home page
    await page.goto('/')
  })

  test('should redirect to login page when not authenticated', async ({ page }) => {
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
    
    // Should show login form
    await expect(page.locator('h1')).toContainText('Login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should allow user registration', async ({ page }) => {
    await page.goto('/register')
    
    // Fill registration form
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Verify user was created in database
    const user = await testDb.user.findUnique({
      where: { email: 'test@example.com' }
    })
    expect(user).toBeTruthy()
    expect(user?.name).toBe('Test User')
  })

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/register')
    
    // Try to submit with empty fields
    await page.click('button[type="submit"]')
    
    // Should show validation errors
    await expect(page.locator('text=Nome é obrigatório')).toBeVisible()
    
    // Try with invalid email
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show email validation error
    await expect(page.locator('text=Email inválido')).toBeVisible()
    
    // Try with short password
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', '123')
    await page.click('button[type="submit"]')
    
    // Should show password validation error
    await expect(page.locator('text=Senha deve ter pelo menos 6 caracteres')).toBeVisible()
  })

  test('should prevent registration with duplicate email', async ({ page }) => {
    // Create existing user
    await testDb.user.create({
      data: {
        name: 'Existing User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PLAYER',
      },
    })

    await page.goto('/register')
    
    // Try to register with same email
    await page.fill('input[name="name"]', 'New User')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show duplicate email error
    await expect(page.locator('text=Email já está em uso')).toBeVisible()
  })

  test('should allow user login', async ({ page }) => {
    // Create test user
    await testDb.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PLAYER',
      },
    })

    await page.goto('/login')
    
    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Should show user's name in the interface
    await expect(page.locator('text=Test User')).toBeVisible()
  })

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Try login with invalid credentials
    await page.fill('input[type="email"]', 'nonexistent@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Credenciais inválidas')).toBeVisible()
  })

  test('should handle login with correct email but wrong password', async ({ page }) => {
    // Create test user
    await testDb.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('correctpassword', 10),
        role: 'PLAYER',
      },
    })

    await page.goto('/login')
    
    // Try login with wrong password
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Credenciais inválidas')).toBeVisible()
  })

  test('should allow logout', async ({ page, context }) => {
    // Create test user and login
    await testDb.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PLAYER',
      },
    })

    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Verify we're logged in
    await expect(page).toHaveURL('/dashboard')
    
    // Find and click logout button (this might be in a dropdown or menu)
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sair"), [data-testid="logout-button"]').first()
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
    } else {
      // Look for user menu first
      const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Test User")').first()
      if (await userMenu.isVisible()) {
        await userMenu.click()
        await page.locator('button:has-text("Logout"), button:has-text("Sair")').first().click()
      }
    }
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login')
  })

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/login')
    
    // Click register link
    await page.click('a:has-text("Registrar"), a:has-text("Criar conta")')
    await expect(page).toHaveURL('/register')
    
    // Click login link
    await page.click('a:has-text("Login"), a:has-text("Fazer login")')
    await expect(page).toHaveURL('/login')
  })

  test('should show loading states during authentication', async ({ page }) => {
    await page.goto('/login')
    
    // Fill form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    // Submit and check for loading state
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Button should show loading state (disabled or spinner)
    await expect(submitButton).toBeDisabled()
  })
})