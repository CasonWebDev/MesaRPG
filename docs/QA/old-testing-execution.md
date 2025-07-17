# Testing Execution Guide

## Quick Start

### Prerequisites

1. **Node.js 18+** installed
2. **PostgreSQL** running locally or via Docker
3. **Environment variables** configured

### Environment Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd mesarpg-shell-v1
   npm install --legacy-peer-deps
   ```

2. **Setup test database**:
   ```bash
   # Option 1: Docker (Recommended)
   docker-compose -f docker-compose.test.yml up -d
   
   # Option 2: Local PostgreSQL
   createdb mesarpg_test
   ```

3. **Configure environment**:
   ```bash
   # Create .env.test.local
   DATABASE_URL="postgresql://test:test@localhost:5433/mesarpg_test"
   NEXTAUTH_SECRET="test-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Run initial setup**:
   ```bash
   npm run db:migrate:test
   npm run test:setup
   ```

## Test Commands

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/utils/dnd-utils.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="calculateAbilityModifier"
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm test -- tests/integration/api/auth.test.ts

# Run integration tests with verbose output
npm test -- tests/integration --verbose

# Reset test database before running
npm run db:test:reset && npm run test:integration
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
npm run test:e2e:headed

# Run specific E2E test
npx playwright test auth.spec.ts

# Run E2E tests for specific browser
npx playwright test --project=chromium

# Debug E2E test
npx playwright test auth.spec.ts --debug
```

### All Tests

```bash
# Run complete test suite
npm run test:all

# Run CI test pipeline
npm run ci:test
```

## Test Database Management

### Setup and Maintenance

```bash
# Initial database setup
npm run db:migrate:test

# Reset database (clean slate)
npm run db:test:reset

# Manual database operations
DATABASE_URL="postgresql://test:test@localhost:5433/mesarpg_test" npx prisma studio
```

### Docker Database Management

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Stop test database
docker-compose -f docker-compose.test.yml down

# Reset test database
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
npm run db:migrate:test
```

## Debugging Tests

### Jest Debugging

1. **Add debug configuration to VS Code** (`.vscode/launch.json`):
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Jest Tests",
     "program": "${workspaceFolder}/node_modules/.bin/jest",
     "args": ["--runInBand", "--no-cache", "--no-coverage"],
     "console": "integratedTerminal",
     "internalConsoleOptions": "neverOpen"
   }
   ```

2. **Debug specific test**:
   ```bash
   node --inspect-brk node_modules/.bin/jest --runInBand tests/unit/utils/dnd-utils.test.ts
   ```

3. **Use console.log for quick debugging**:
   ```javascript
   test('debug example', () => {
     const result = calculateAbilityModifier(16)
     console.log('Debug result:', result)
     expect(result).toBe(3)
   })
   ```

### Playwright Debugging

1. **Visual debugging with UI mode**:
   ```bash
   npm run test:e2e:ui
   ```

2. **Step-through debugging**:
   ```bash
   npx playwright test --debug
   ```

3. **Record new tests**:
   ```bash
   npx playwright codegen localhost:3000
   ```

4. **View test traces**:
   ```bash
   npx playwright show-trace test-results/auth-should-login/trace.zip
   ```

### Common Debugging Scenarios

#### Test Database Issues

```bash
# Check database connection
DATABASE_URL="postgresql://test:test@localhost:5433/mesarpg_test" npx prisma db push

# Inspect database state
DATABASE_URL="postgresql://test:test@localhost:5433/mesarpg_test" npx prisma studio

# Reset and re-migrate
npm run db:test:reset
npm run db:migrate:test
```

#### Authentication Test Issues

```javascript
// Mock session in tests
const mockSession = {
  user: { id: 'test-id', email: 'test@example.com', name: 'Test User' }
}

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSession, status: 'authenticated' })
}))
```

#### Socket.IO Test Issues

```javascript
// Mock socket implementation
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
  connected: true
}

jest.mock('socket.io-client', () => ({
  io: jest.fn(() => mockSocket)
}))
```

## Coverage Analysis

### Generating Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Coverage Thresholds

The project maintains these coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Improving Coverage

1. **Identify uncovered code**:
   ```bash
   npm run test:coverage -- --verbose
   ```

2. **Focus on critical paths**:
   - API endpoints
   - Authentication logic
   - Database operations
   - Core business logic

3. **Add tests for edge cases**:
   - Error conditions
   - Boundary values
   - Invalid inputs

## Performance Testing

### Load Testing with Artillery

```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run tests/performance/load-test.yml
```

### E2E Performance Testing

```javascript
test('page load performance', async ({ page }) => {
  const start = Date.now()
  await page.goto('/dashboard')
  const loadTime = Date.now() - start
  
  expect(loadTime).toBeLessThan(3000) // 3 seconds max
})
```

## CI/CD Integration

### GitHub Actions Workflow

The CI pipeline runs automatically on:
- **Push to main/development**
- **Pull requests**

### Local CI Simulation

```bash
# Run the same checks as CI
npm run lint
npm run type-check
npm run test:unit
npm run test:integration
npm run build
```

### Environment Variables for CI

Required secrets in GitHub:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Test Data Management

### Creating Test Fixtures

```javascript
// tests/fixtures/campaign.ts
export const createTestCampaign = (overrides = {}) => ({
  id: nanoid(),
  name: 'Test Campaign',
  description: 'Test description',
  system: 'dnd5e',
  ...overrides
})
```

### Using Factories

```javascript
// In test files
beforeEach(async () => {
  testUser = await testDb.user.create({
    data: createTestUser({ email: 'gm@example.com' })
  })
  
  testCampaign = await testDb.campaign.create({
    data: createTestCampaign({ ownerId: testUser.id })
  })
})
```

## Error Handling in Tests

### API Error Testing

```javascript
test('should handle database connection errors', async () => {
  // Mock database failure
  jest.spyOn(testDb.user, 'create').mockRejectedValue(new Error('DB Error'))
  
  const response = await request(app)
    .post('/api/auth/register')
    .send(validUserData)
    .expect(500)
  
  expect(response.body.error).toBe('Erro interno do servidor')
})
```

### Component Error Testing

```javascript
test('should handle API errors gracefully', async () => {
  // Mock API failure
  server.use(
    http.post('/api/campaigns/create', () => {
      return HttpResponse.json({ error: 'Server error' }, { status: 500 })
    })
  )
  
  render(<CreateCampaignDialog />)
  
  await userEvent.click(screen.getByRole('button', { name: /criar/i }))
  
  expect(await screen.findByText(/erro/i)).toBeInTheDocument()
})
```

## Parallel Test Execution

### Jest Parallel Execution

```javascript
// jest.config.js
module.exports = {
  maxWorkers: process.env.CI ? 1 : '50%',
  testTimeout: 30000,
}
```

### Playwright Parallel Execution

```javascript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
})
```

## Test Maintenance

### Regular Maintenance Tasks

1. **Weekly**:
   - Review failing tests
   - Update test dependencies
   - Check coverage reports

2. **Monthly**:
   - Refactor duplicate test code
   - Update test fixtures
   - Review test execution times

3. **Quarterly**:
   - Evaluate testing tools
   - Update testing strategy
   - Performance testing review

### Test Refactoring

```javascript
// Before: Repetitive setup
test('user can create campaign', async () => {
  const user = await testDb.user.create({ data: { ... } })
  // ... test code
})

test('user can delete campaign', async () => {
  const user = await testDb.user.create({ data: { ... } })
  // ... test code
})

// After: Shared setup
describe('Campaign Management', () => {
  let testUser
  
  beforeEach(async () => {
    testUser = await testDb.user.create({ data: createTestUser() })
  })
  
  test('user can create campaign', async () => {
    // ... test code using testUser
  })
  
  test('user can delete campaign', async () => {
    // ... test code using testUser
  })
})
```

## Troubleshooting

### Common Issues

1. **Port conflicts**:
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database connection issues**:
   ```bash
   # Check PostgreSQL status
   pg_isready -h localhost -p 5433
   
   # Restart database
   docker-compose -f docker-compose.test.yml restart
   ```

3. **Cache issues**:
   ```bash
   # Clear Jest cache
   npm test -- --clearCache
   
   # Clear npm cache
   npm cache clean --force
   ```

4. **Memory issues**:
   ```bash
   # Increase Node.js memory limit
   NODE_OPTIONS="--max-old-space-size=4096" npm test
   ```

### Getting Help

1. **Check test logs**: Look for detailed error messages
2. **Review configuration**: Ensure all config files are correct
3. **Verify environment**: Check all required dependencies
4. **Consult documentation**: Review testing framework docs
5. **Ask for help**: Create detailed issue with reproduction steps

## Test Reporting

### HTML Reports

```bash
# Jest HTML reporter
npm install --save-dev jest-html-reporter

# Playwright HTML reporter (default)
npm run test:e2e
npx playwright show-report
```

### CI Reports

GitHub Actions automatically generates:
- Test result summaries
- Coverage reports
- Artifact uploads for failures

### Custom Reporting

```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'MesaRPG Test Report',
      outputPath: 'test-results/report.html'
    }]
  ]
}
```

This comprehensive guide covers all aspects of test execution for the MesaRPG project. Follow these guidelines to ensure reliable, maintainable, and effective testing practices.