import { test, expect } from '@playwright/test'
import { testDb, setupTestDatabase, teardownTestDatabase } from '../db-setup'
import bcrypt from 'bcryptjs'

test.describe('Campaign Management Flow', () => {
  let testUser: any

  test.beforeAll(async () => {
    await setupTestDatabase()
  })

  test.afterAll(async () => {
    await teardownTestDatabase()
  })

  test.beforeEach(async ({ page }) => {
    // Clean up database
    await testDb.campaignMember.deleteMany()
    await testDb.campaign.deleteMany()
    await testDb.user.deleteMany()
    
    // Create test user
    testUser = await testDb.user.create({
      data: {
        name: 'Test GM',
        email: 'gm@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PLAYER',
      },
    })

    // Login user
    await page.goto('/login')
    await page.fill('input[type="email"]', 'gm@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should show empty dashboard state for new user', async ({ page }) => {
    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Should show welcome message or empty state
    await expect(page.locator('h1')).toContainText(['Dashboard', 'Campanhas', 'Bem-vindo'])
    
    // Should show create campaign button or empty state
    const createButton = page.locator('button:has-text("Criar"), button:has-text("Nova"), [data-testid="create-campaign"]')
    await expect(createButton.first()).toBeVisible()
  })

  test('should create a new campaign', async ({ page }) => {
    // Click create campaign button
    const createButton = page.locator('button:has-text("Criar"), button:has-text("Nova"), [data-testid="create-campaign"]').first()
    await createButton.click()
    
    // Should open campaign creation dialog/form
    await expect(page.locator('input[name="name"], input[placeholder*="nome"]')).toBeVisible()
    
    // Fill campaign details
    await page.fill('input[name="name"], input[placeholder*="nome"]', 'Test Campaign')
    await page.fill('textarea[name="description"], textarea[placeholder*="descrição"]', 'A test campaign for E2E testing')
    
    // Select RPG system if available
    const systemSelect = page.locator('select[name="system"], [data-testid="system-select"]')
    if (await systemSelect.isVisible()) {
      await systemSelect.selectOption('dnd5e')
    }
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Criar"), button:has-text("Salvar")')
    
    // Should return to dashboard with new campaign
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Test Campaign')).toBeVisible()
    
    // Verify campaign was created in database
    const campaign = await testDb.campaign.findFirst({
      where: { name: 'Test Campaign' }
    })
    expect(campaign).toBeTruthy()
    expect(campaign?.ownerId).toBe(testUser.id)
  })

  test('should show validation errors for invalid campaign data', async ({ page }) => {
    // Click create campaign button
    const createButton = page.locator('button:has-text("Criar"), button:has-text("Nova"), [data-testid="create-campaign"]').first()
    await createButton.click()
    
    // Try to submit without required fields
    await page.click('button[type="submit"]:has-text("Criar"), button:has-text("Salvar")')
    
    // Should show validation errors
    await expect(page.locator('text=Nome é obrigatório, text=obrigatório')).toBeVisible()
  })

  test('should navigate to campaign settings', async ({ page }) => {
    // Create test campaign first
    const campaign = await testDb.campaign.create({
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
      }
    })

    // Refresh dashboard to see new campaign
    await page.reload()
    
    // Click on campaign settings or configure button
    const settingsButton = page.locator(`[data-campaign-id="${campaign.id}"] button:has-text("Configurar"), button:has-text("Settings"), [data-testid="campaign-settings"]`)
    if (await settingsButton.isVisible()) {
      await settingsButton.click()
    } else {
      // Alternative: click on campaign name and look for settings
      await page.click('text=Test Campaign')
      await page.click('button:has-text("Configurações"), button:has-text("Settings")')
    }
    
    // Should navigate to settings page
    await expect(page).toHaveURL(`/campaign/${campaign.id}/settings`)
    
    // Should show settings interface
    await expect(page.locator('h1, h2')).toContainText(['Configurações', 'Settings'])
  })

  test('should enter campaign play mode', async ({ page }) => {
    // Create test campaign
    const campaign = await testDb.campaign.create({
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
      }
    })

    await page.reload()
    
    // Click on play/enter campaign button
    const playButton = page.locator(`[data-campaign-id="${campaign.id}"] button:has-text("Jogar"), button:has-text("Entrar"), button:has-text("Play"), [data-testid="enter-campaign"]`)
    if (await playButton.isVisible()) {
      await playButton.click()
    } else {
      // Alternative: click on campaign name directly
      await page.click('text=Test Campaign')
    }
    
    // Should navigate to campaign play page
    await expect(page).toHaveURL(`/campaign/${campaign.id}/play`)
    
    // Should show game interface
    await expect(page.locator('[data-testid="game-interface"], .game-container')).toBeVisible()
    
    // Should show GM controls since user is GM
    await expect(page.locator('[data-testid="gm-controls"], .gm-panel')).toBeVisible()
  })

  test('should display campaign list correctly', async ({ page }) => {
    // Create multiple campaigns
    const campaign1 = await testDb.campaign.create({
      data: {
        name: 'Campaign 1',
        description: 'First campaign',
        system: 'dnd5e',
        ownerId: testUser.id,
        members: {
          create: [{ userId: testUser.id, role: 'GM' }]
        }
      }
    })

    const campaign2 = await testDb.campaign.create({
      data: {
        name: 'Campaign 2',
        description: 'Second campaign',
        system: 'pathfinder',
        ownerId: testUser.id,
        members: {
          create: [{ userId: testUser.id, role: 'GM' }]
        }
      }
    })

    await page.reload()
    
    // Should show both campaigns
    await expect(page.locator('text=Campaign 1')).toBeVisible()
    await expect(page.locator('text=Campaign 2')).toBeVisible()
    
    // Should show campaign descriptions
    await expect(page.locator('text=First campaign')).toBeVisible()
    await expect(page.locator('text=Second campaign')).toBeVisible()
    
    // Should show GM role indicator
    await expect(page.locator('text=GM, text=Mestre')).toHaveCount(2)
  })

  test('should update campaign settings', async ({ page }) => {
    // Create test campaign
    const campaign = await testDb.campaign.create({
      data: {
        name: 'Test Campaign',
        description: 'Original description',
        system: 'dnd5e',
        ownerId: testUser.id,
        members: {
          create: [{ userId: testUser.id, role: 'GM' }]
        }
      }
    })

    // Navigate to settings
    await page.goto(`/campaign/${campaign.id}/settings`)
    
    // Update campaign name
    const nameInput = page.locator('input[name="name"], input[value="Test Campaign"]')
    await nameInput.fill('Updated Campaign Name')
    
    // Update description
    const descInput = page.locator('textarea[name="description"], textarea:has-text("Original description")')
    await descInput.fill('Updated description')
    
    // Save changes
    await page.click('button[type="submit"]:has-text("Salvar"), button:has-text("Save")')
    
    // Should show success message
    await expect(page.locator('text=Campanha atualizada, text=Campaign updated, text=salvo')).toBeVisible()
    
    // Verify changes in database
    const updatedCampaign = await testDb.campaign.findUnique({
      where: { id: campaign.id }
    })
    expect(updatedCampaign?.name).toBe('Updated Campaign Name')
    expect(updatedCampaign?.description).toBe('Updated description')
  })

  test('should delete campaign', async ({ page }) => {
    // Create test campaign
    const campaign = await testDb.campaign.create({
      data: {
        name: 'Campaign to Delete',
        description: 'This will be deleted',
        system: 'dnd5e',
        ownerId: testUser.id,
        members: {
          create: [{ userId: testUser.id, role: 'GM' }]
        }
      }
    })

    await page.reload()
    
    // Look for delete button (might be in settings or dropdown)
    const deleteButton = page.locator(`[data-campaign-id="${campaign.id}"] button:has-text("Excluir"), button:has-text("Delete"), [data-testid="delete-campaign"]`)
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
    } else {
      // Go to settings and delete from there
      await page.goto(`/campaign/${campaign.id}/settings`)
      await page.click('button:has-text("Excluir"), button:has-text("Delete")')
    }
    
    // Confirm deletion in dialog
    await page.click('button:has-text("Confirmar"), button:has-text("Sim"), button:has-text("Delete")')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Campaign should no longer be visible
    await expect(page.locator('text=Campaign to Delete')).not.toBeVisible()
    
    // Verify deletion in database
    const deletedCampaign = await testDb.campaign.findUnique({
      where: { id: campaign.id }
    })
    expect(deletedCampaign).toBeNull()
  })

  test('should handle campaign with player role', async ({ page }) => {
    // Create another user (GM)
    const gmUser = await testDb.user.create({
      data: {
        name: 'Game Master',
        email: 'gamemaster@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PLAYER',
      },
    })

    // Create campaign with GM as owner, test user as player
    const campaign = await testDb.campaign.create({
      data: {
        name: 'Player Campaign',
        description: 'Campaign where user is player',
        system: 'dnd5e',
        ownerId: gmUser.id,
        members: {
          create: [
            { userId: gmUser.id, role: 'GM' },
            { userId: testUser.id, role: 'PLAYER' }
          ]
        }
      }
    })

    await page.reload()
    
    // Should show campaign with player role
    await expect(page.locator('text=Player Campaign')).toBeVisible()
    await expect(page.locator('text=PLAYER, text=Jogador')).toBeVisible()
    
    // Should not show GM-only controls
    await expect(page.locator('button:has-text("Configurar"), button:has-text("Settings")')).not.toBeVisible()
    
    // Should still be able to enter campaign
    const playButton = page.locator(`button:has-text("Jogar"), button:has-text("Entrar"), button:has-text("Play")`).first()
    await playButton.click()
    
    await expect(page).toHaveURL(`/campaign/${campaign.id}/play`)
    
    // Should show player interface (no GM controls)
    await expect(page.locator('[data-testid="player-interface"], .player-panel')).toBeVisible()
  })
})