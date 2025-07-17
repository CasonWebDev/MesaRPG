# Testing Strategy for MesaRPG

## Overview

This document outlines the comprehensive testing strategy implemented for the MesaRPG application. The strategy follows a multi-layered approach with unit tests, integration tests, and end-to-end tests to ensure code quality, reliability, and maintainability.

## Testing Pyramid

Our testing strategy follows the test pyramid pattern:

```
      /\
     /  \
    / E2E \     10% - End-to-End Tests
   /______\
  /        \
 /Integration\ 20% - Integration Tests  
/__________/
/           \
/    Unit     \  70% - Unit Tests
/_____________\
```

### Testing Principles

1. **Fast Feedback**: Unit tests provide immediate feedback during development
2. **Confidence**: Integration tests ensure components work together correctly
3. **User Experience**: E2E tests validate complete user workflows
4. **Maintainability**: Tests are written to be readable and maintainable
5. **Reliability**: Tests are deterministic and don't produce false positives

## Test Types

### 1. Unit Tests (70%)

**Purpose**: Test individual functions, components, and hooks in isolation.

**Tools**: 
- Jest as test runner
- React Testing Library for component testing
- jsdom for DOM simulation

**Coverage**:
- Utility functions (`lib/utils/`)
- React hooks (`hooks/`)
- UI components (`components/`)
- Business logic functions

**Example Structure**:
```
tests/unit/
├── utils/
│   ├── dnd-utils.test.ts
│   ├── dice.test.ts
│   └── validation.test.ts
├── hooks/
│   ├── use-socket.test.ts
│   ├── use-characters.test.ts
│   └── use-active-map.test.ts
└── components/
    ├── button.test.tsx
    ├── chat-panel.test.tsx
    └── character-sheet.test.tsx
```

**Key Features**:
- Mock external dependencies
- Test edge cases and error conditions
- Validate component props and state
- Ensure accessibility compliance
- Test custom hooks behavior

### 2. Integration Tests (20%)

**Purpose**: Test API endpoints, database interactions, and component integration.

**Tools**:
- Jest for test execution
- Supertest for API testing
- MSW (Mock Service Worker) for API mocking
- Test PostgreSQL database

**Coverage**:
- API route handlers
- Database operations
- Authentication flows
- WebSocket communications
- Component integration

**Example Structure**:
```
tests/integration/
├── api/
│   ├── auth.test.ts
│   ├── campaigns.test.ts
│   ├── characters.test.ts
│   └── chat.test.ts
├── database/
│   ├── user-operations.test.ts
│   └── campaign-operations.test.ts
└── components/
    ├── game-interface.test.tsx
    └── sidebar-integration.test.tsx
```

**Key Features**:
- Real database interactions with test isolation
- API endpoint validation
- Authentication and authorization testing
- Data persistence verification
- Error handling validation

### 3. End-to-End Tests (10%)

**Purpose**: Test complete user workflows from browser perspective.

**Tools**:
- Playwright for browser automation
- Test database for data isolation
- Real browser instances

**Coverage**:
- User authentication flow
- Campaign creation and management
- Character creation and interaction
- Real-time chat and gameplay
- Cross-browser compatibility

**Example Structure**:
```
tests/e2e/
├── auth.spec.ts
├── campaign-management.spec.ts
├── gameplay.spec.ts
├── character-management.spec.ts
└── real-time-features.spec.ts
```

**Key Features**:
- Full browser automation
- Real user interactions
- Visual regression testing
- Performance validation
- Mobile responsiveness

## Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

### Playwright Configuration (`playwright.config.ts`)

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## Test Database Setup

### PostgreSQL Test Database

We use a dedicated PostgreSQL database for testing to ensure:
- Real database interactions
- Data isolation between tests
- Consistent test environment

**Setup Script** (`tests/db-setup.ts`):
```typescript
import { PrismaClient } from '@prisma/client'

export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/mesarpg_test'
    }
  }
})

export async function setupTestDatabase() {
  await testDb.$connect()
}

export async function teardownTestDatabase() {
  await testDb.$disconnect()
}
```

### Docker Compose for Testing

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: postgres:15
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: mesarpg_test
    ports:
      - "5433:5432"
    volumes:
      - test_data:/var/lib/postgresql/data

volumes:
  test_data:
```

## Mocking Strategy

### MSW (Mock Service Worker)

We use MSW to intercept HTTP requests during testing:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      success: true,
      user: { id: '1', name: 'Test User', email: 'test@example.com' }
    })
  }),
  // ... more handlers
]
```

### Component Mocking

Critical external dependencies are mocked:

```typescript
// tests/setup.ts
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: mockSession,
    status: 'authenticated',
  }),
}))

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket),
}))
```

## Test Execution

### Development Workflow

1. **Unit Tests During Development**:
   ```bash
   npm run test:watch
   ```

2. **Integration Tests Before Commit**:
   ```bash
   npm run test:integration
   ```

3. **Full Test Suite**:
   ```bash
   npm run test:all
   ```

### CI/CD Pipeline

The GitHub Actions workflow runs tests in parallel:

1. **Lint and Type Check**: Code quality validation
2. **Unit Tests**: Fast feedback on logic
3. **Integration Tests**: API and database validation
4. **E2E Tests**: Complete user workflow validation
5. **Build Test**: Ensure application builds correctly

### Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

## Coverage Requirements

### Coverage Thresholds

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Reports

Coverage reports are generated in multiple formats:
- **HTML**: Interactive coverage report
- **LCOV**: For CI integration
- **Text**: Terminal output during testing

## Test Data Management

### Fixtures and Factories

We use test fixtures for consistent test data:

```typescript
// tests/fixtures/user.ts
export const createTestUser = (overrides = {}) => ({
  id: nanoid(),
  name: 'Test User',
  email: 'test@example.com',
  role: 'PLAYER',
  ...overrides,
})

// tests/fixtures/campaign.ts
export const createTestCampaign = (ownerId: string, overrides = {}) => ({
  id: nanoid(),
  name: 'Test Campaign',
  description: 'A test campaign',
  system: 'dnd5e',
  ownerId,
  ...overrides,
})
```

### Data Cleanup

Each test suite includes proper cleanup:

```typescript
beforeEach(async () => {
  await testDb.user.deleteMany()
  await testDb.campaign.deleteMany()
  // ... cleanup other tables
})
```

## Performance Testing

### Load Testing with Playwright

```typescript
test('should handle multiple concurrent users', async ({ browser }) => {
  const contexts = await Promise.all(
    Array(10).fill(0).map(() => browser.newContext())
  )
  
  const pages = await Promise.all(
    contexts.map(context => context.newPage())
  )
  
  // Test concurrent operations
  await Promise.all(
    pages.map(page => page.goto('/dashboard'))
  )
  
  // Cleanup
  await Promise.all(contexts.map(context => context.close()))
})
```

## Security Testing

### Authentication Tests

```typescript
describe('Authentication Security', () => {
  test('should reject requests without valid session', async () => {
    const response = await request(app)
      .get('/api/campaigns')
      .expect(401)
    
    expect(response.body.error).toBe('Não autorizado')
  })
  
  test('should prevent SQL injection in user inputs', async () => {
    const maliciousInput = "'; DROP TABLE users; --"
    const response = await request(app)
      .post('/api/campaigns/create')
      .send({ name: maliciousInput })
      .expect(400)
  })
})
```

## Accessibility Testing

### Automated A11y Tests

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

test('should be accessible', async () => {
  render(<Button>Click me</Button>)
  const results = await axe(document.body)
  expect(results).toHaveNoViolations()
})
```

## Best Practices

### 1. Test Naming

- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Include expected behavior and conditions

```typescript
test('should calculate correct ability modifier for score 16', () => {
  // Arrange
  const abilityScore = 16
  
  // Act
  const modifier = calculateAbilityModifier(abilityScore)
  
  // Assert
  expect(modifier).toBe(3)
})
```

### 2. Test Organization

- Group related tests with `describe` blocks
- Use `beforeEach` for common setup
- Keep tests independent and isolated

### 3. Mocking Guidelines

- Mock external dependencies
- Keep mocks close to reality
- Prefer real implementations when possible
- Document mock behavior

### 4. Assertion Quality

- Use specific assertions
- Test both positive and negative cases
- Include edge cases and error conditions

```typescript
test('should handle empty character list', () => {
  const result = getCharacterStats([])
  
  expect(result.total).toBe(0)
  expect(result.byType).toEqual({})
  expect(result.byLevel).toEqual({})
})
```

## Debugging Tests

### Jest Debugging

```bash
# Run specific test file
npm test -- auth.test.ts

# Run tests with verbose output
npm test -- --verbose

# Run tests in watch mode
npm run test:watch
```

### Playwright Debugging

```bash
# Run with UI mode
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Debug specific test
npx playwright test auth.spec.ts --debug
```

## Continuous Improvement

### Metrics to Monitor

1. **Test Coverage**: Maintain >70% coverage
2. **Test Execution Time**: Keep under 10 minutes total
3. **Flaky Tests**: Identify and fix unstable tests
4. **Test Maintenance**: Regular review and refactoring

### Review Process

1. **Weekly Test Review**: Analyze test results and coverage
2. **Monthly Strategy Review**: Evaluate testing strategy effectiveness
3. **Quarterly Tool Evaluation**: Consider new testing tools and practices

## Conclusion

This comprehensive testing strategy ensures the MesaRPG application maintains high quality, reliability, and user satisfaction. The multi-layered approach provides confidence in deployments while maintaining fast development cycles.

Regular review and improvement of this strategy ensures it continues to serve the project's evolving needs while incorporating industry best practices and new testing methodologies.