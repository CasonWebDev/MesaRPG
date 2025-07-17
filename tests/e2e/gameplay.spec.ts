import { test, expect } from '@playwright/test'
import { testDb, setupTestDatabase, teardownTestDatabase } from '../db-setup'
import bcrypt from 'bcryptjs'

test.describe('Gameplay Flow', () => {
  let testGM: any
  let testPlayer: any
  let testCampaign: any

  test.beforeAll(async () => {
    await setupTestDatabase()
  })

  test.afterAll(async () => {
    await teardownTestDatabase()
  })

  test.beforeEach(async ({ page }) => {
    // Clean up database
    await testDb.chatMessage.deleteMany()
    await testDb.character.deleteMany()
    await testDb.campaignMember.deleteMany()
    await testDb.campaign.deleteMany()
    await testDb.user.deleteMany()
    
    // Create test users
    testGM = await testDb.user.create({
      data: {
        name: 'Game Master',
        email: 'gm@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'PLAYER',
      },
    })

    testPlayer = await testDb.user.create({
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
        description: 'Test campaign for gameplay',
        system: 'dnd5e',
        ownerId: testGM.id,
        members: {
          create: [
            { userId: testGM.id, role: 'GM' },
            { userId: testPlayer.id, role: 'PLAYER' }
          ]
        }
      }
    })
  })

  test('GM should see full game interface', async ({ page }) => {
    // Login as GM
    await page.goto('/login')
    await page.fill('input[type="email"]', 'gm@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Navigate to campaign
    await page.goto(`/campaign/${testCampaign.id}/play`)
    
    // Should show GM interface
    await expect(page.locator('[data-testid="game-interface"], .game-container')).toBeVisible()
    
    // Should show chat panel
    await expect(page.locator('[data-testid="chat-panel"], .chat-container')).toBeVisible()
    
    // Should show sidebar with GM content
    await expect(page.locator('[data-testid="sidebar"], .sidebar')).toBeVisible()
    
    // Should show GM-specific tabs (NPCs, Creatures, etc.)
    await expect(page.locator('button:has-text("NPCs"), [data-tab="npcs"]')).toBeVisible()
    
    // Should show tactical grid
    await expect(page.locator('[data-testid="tactical-grid"], .tactical-grid')).toBeVisible()
  })

  test('Player should see player interface', async ({ page }) => {
    // Login as player
    await page.goto('/login')
    await page.fill('input[type="email"]', 'player@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Navigate to campaign
    await page.goto(`/campaign/${testCampaign.id}/play`)
    
    // Should show game interface
    await expect(page.locator('[data-testid="game-interface"], .game-container')).toBeVisible()
    
    // Should show chat panel
    await expect(page.locator('[data-testid="chat-panel"], .chat-container')).toBeVisible()
    
    // Should show sidebar with player content
    await expect(page.locator('[data-testid="sidebar"], .sidebar')).toBeVisible()
    
    // Should not show GM-only tabs
    await expect(page.locator('button:has-text("NPCs"), [data-tab="npcs"]')).not.toBeVisible()
    
    // Should show player character sheet tab
    await expect(page.locator('button:has-text("Ficha"), [data-tab="character"]')).toBeVisible()
  })

  test('should send and receive chat messages', async ({ page }) => {
    // Login as GM
    await page.goto('/login')
    await page.fill('input[type="email"]', 'gm@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto(`/campaign/${testCampaign.id}/play`)
    
    // Find chat input
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="mensagem"], input[placeholder*="message"]')
    await expect(chatInput).toBeVisible()
    
    // Send a message
    await chatInput.fill('Hello, this is a test message!')
    await page.keyboard.press('Enter')
    
    // Message should appear in chat
    await expect(page.locator('.chat-message, [data-testid="chat-message"]')).toContainText('Hello, this is a test message!')
    
    // Should show sender name
    await expect(page.locator('text=Game Master')).toBeVisible()
    
    // Verify message in database
    const message = await testDb.chatMessage.findFirst({
      where: { campaignId: testCampaign.id }
    })
    expect(message?.message).toBe('Hello, this is a test message!')
    expect(message?.userId).toBe(testGM.id)
  })

  test('should handle dice roll commands', async ({ page }) => {
    // Login as player
    await page.goto('/login')
    await page.fill('input[type="email"]', 'player@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto(`/campaign/${testCampaign.id}/play`)
    
    // Send dice roll command
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="mensagem"], input[placeholder*="message"]')
    await chatInput.fill('/r 1d20+5')
    await page.keyboard.press('Enter')
    
    // Should show dice roll result
    await expect(page.locator('.dice-roll, [data-testid="dice-roll"]')).toBeVisible()
    await expect(page.locator('text=1d20+5')).toBeVisible()
    
    // Should show roll result (number between 6-25)
    const rollResult = page.locator('.roll-result, [data-testid="roll-result"]')
    await expect(rollResult).toBeVisible()
  })

  test('should create and manage characters', async ({ page }) => {
    // Login as player
    await page.goto('/login')
    await page.fill('input[type="email"]', 'player@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto(`/campaign/${testCampaign.id}/play`)
    
    // Open character creation
    const createCharButton = page.locator('button:has-text("Criar Personagem"), button:has-text("Create Character"), [data-testid="create-character"]')
    if (await createCharButton.isVisible()) {
      await createCharButton.click()
    } else {
      // Look in sidebar or menu
      await page.click('[data-tab="character"], button:has-text("Ficha")')
      await page.click('button:has-text("Criar"), button:has-text("New")')
    }
    
    // Fill character creation form
    await page.fill('input[name="name"], input[placeholder*="nome"]', 'Test Character')
    
    // Select character type (PC)
    const typeSelect = page.locator('select[name="type"], [data-testid="character-type"]')
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('PC')
    }
    
    // Submit character creation
    await page.click('button[type="submit"]:has-text("Criar"), button:has-text("Create")')
    
    // Character should appear in interface
    await expect(page.locator('text=Test Character')).toBeVisible()
    
    // Verify character in database
    const character = await testDb.character.findFirst({
      where: { name: 'Test Character', campaignId: testCampaign.id }
    })
    expect(character).toBeTruthy()
    expect(character?.ownerId).toBe(testPlayer.id)
  })

  test('GM should create NPCs and creatures', async ({ page }) => {
    // Login as GM
    await page.goto('/login')
    await page.fill('input[type="email"]', 'gm@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto(`/campaign/${testCampaign.id}/play`)
    
    // Navigate to NPCs tab
    await page.click('button:has-text("NPCs"), [data-tab="npcs"]')
    
    // Create NPC
    const createNPCButton = page.locator('button:has-text("Criar NPC"), button:has-text("Create NPC"), [data-testid="create-npc"]')
    if (await createNPCButton.isVisible()) {
      await createNPCButton.click()
    } else {
      await page.click('button:has-text("Criar"), button:has-text("New")')
    }
    
    // Fill NPC form
    await page.fill('input[name="name"], input[placeholder*="nome"]', 'Town Guard')
    
    // Select NPC type
    const typeSelect = page.locator('select[name="type"], [data-testid="character-type"]')
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('NPC')
    }
    
    await page.click('button[type="submit"]:has-text("Criar"), button:has-text("Create")')
    
    // NPC should appear in NPCs list
    await expect(page.locator('text=Town Guard')).toBeVisible()
    
    // Navigate to Creatures tab
    await page.click('button:has-text("Creatures"), [data-tab="creatures"]')
    
    // Create Creature
    const createCreatureButton = page.locator('button:has-text("Criar Criatura"), [data-testid="create-creature"]')
    if (await createCreatureButton.isVisible()) {
      await createCreatureButton.click()
    } else {
      await page.click('button:has-text("Criar"), button:has-text("New")')
    }
    
    await page.fill('input[name="name"], input[placeholder*="nome"]', 'Orc Warrior')
    
    const creatureTypeSelect = page.locator('select[name="type"], [data-testid="character-type"]')
    if (await creatureTypeSelect.isVisible()) {
      await creatureTypeSelect.selectOption('CREATURE')
    }
    
    await page.click('button[type="submit"]:has-text("Criar"), button:has-text("Create")')
    
    // Creature should appear in creatures list
    await expect(page.locator('text=Orc Warrior')).toBeVisible()
  })

  test('should move tokens on tactical grid', async ({ page }) => {
    // Create a test character first
    await testDb.character.create({
      data: {
        name: 'Test Token Character',
        type: 'PC',
        campaignId: testCampaign.id,
        createdById: testPlayer.id,
        ownerId: testPlayer.id,
        data: { class: 'Fighter' }
      }
    })

    // Login as player
    await page.goto('/login')
    await page.fill('input[type="email"]', 'player@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto(`/campaign/${testCampaign.id}/play`)
    
    // Wait for grid to load
    const tacticalGrid = page.locator('[data-testid="tactical-grid"], .tactical-grid')
    await expect(tacticalGrid).toBeVisible()
    
    // Look for character token
    const token = page.locator('[data-testid="token"], .token').first()
    if (await token.isVisible()) {
      // Get initial position
      const initialBounds = await token.boundingBox()
      
      // Drag token to new position
      if (initialBounds) {
        await page.mouse.move(initialBounds.x + initialBounds.width / 2, initialBounds.y + initialBounds.height / 2)
        await page.mouse.down()
        await page.mouse.move(initialBounds.x + 100, initialBounds.y + 100)
        await page.mouse.up()
        
        // Token should be in new position
        const newBounds = await token.boundingBox()
        expect(newBounds?.x).not.toBe(initialBounds.x)
        expect(newBounds?.y).not.toBe(initialBounds.y)
      }
    }
  })

  test('should handle real-time updates between GM and player', async ({ browser }) => {
    // Create two pages - one for GM, one for player
    const gmPage = await browser.newPage()
    const playerPage = await browser.newPage()
    
    // Login GM
    await gmPage.goto('/login')
    await gmPage.fill('input[type="email"]', 'gm@example.com')
    await gmPage.fill('input[type="password"]', 'password123')
    await gmPage.click('button[type="submit"]')
    await gmPage.goto(`/campaign/${testCampaign.id}/play`)
    
    // Login Player
    await playerPage.goto('/login')
    await playerPage.fill('input[type="email"]', 'player@example.com')
    await playerPage.fill('input[type="password"]', 'password123')
    await playerPage.click('button[type="submit"]')
    await playerPage.goto(`/campaign/${testCampaign.id}/play`)
    
    // GM sends a message
    const gmChatInput = gmPage.locator('[data-testid="chat-input"], input[placeholder*="mensagem"]')
    await gmChatInput.fill('GM message for real-time test')
    await gmPage.keyboard.press('Enter')
    
    // Player should see the message
    await expect(playerPage.locator('text=GM message for real-time test')).toBeVisible({ timeout: 5000 })
    
    // Player responds
    const playerChatInput = playerPage.locator('[data-testid="chat-input"], input[placeholder*="mensagem"]')
    await playerChatInput.fill('Player response')
    await playerPage.keyboard.press('Enter')
    
    // GM should see the response
    await expect(gmPage.locator('text=Player response')).toBeVisible({ timeout: 5000 })
    
    await gmPage.close()
    await playerPage.close()
  })

  test('should show connected players', async ({ page }) => {
    // Login as GM
    await page.goto('/login')
    await page.fill('input[type="email"]', 'gm@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto(`/campaign/${testCampaign.id}/play`)
    
    // Should show players panel
    const playersPanel = page.locator('[data-testid="players-panel"], .players-container')
    await expect(playersPanel).toBeVisible()
    
    // Should show GM as connected
    await expect(page.locator('text=Game Master')).toBeVisible()
    
    // Should show online status
    await expect(page.locator('.online-indicator, [data-testid="online-status"]')).toBeVisible()
  })

  test('should handle OOC (Out of Character) messages', async ({ page }) => {
    // Login as player
    await page.goto('/login')
    await page.fill('input[type="email"]', 'player@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await page.goto(`/campaign/${testCampaign.id}/play`)
    
    // Send OOC message
    const chatInput = page.locator('[data-testid="chat-input"], input[placeholder*="mensagem"]')
    await chatInput.fill('/ooc This is an out of character message')
    await page.keyboard.press('Enter')
    
    // Should show OOC message with different styling
    await expect(page.locator('.ooc-message, [data-message-type="OOC"]')).toBeVisible()
    await expect(page.locator('text=This is an out of character message')).toBeVisible()
  })
})