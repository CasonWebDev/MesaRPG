import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://test:test@localhost:5432/mesarpg_test',
    },
  },
})

export async function setupTestDatabase() {
  // Clean up existing data
  await prisma.chatMessage.deleteMany()
  await prisma.token.deleteMany()
  await prisma.gameState.deleteMany()
  await prisma.map.deleteMany()
  await prisma.handout.deleteMany()
  await prisma.character.deleteMany()
  await prisma.campaignMember.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.user.deleteMany()
  
  console.log('✅ Test database cleaned up')
}

export async function teardownTestDatabase() {
  await prisma.$disconnect()
}

export { prisma as testDb }