# 5. Como Escrever Novos Testes

## 🎯 Guia Prático para Criação de Testes

Este guia ensina como criar novos testes seguindo os padrões estabelecidos e funcionais do projeto MesaRPG.

## 📋 Antes de Começar

### Estrutura de Arquivos
```
tests/
├── unit/                    # Testes unitários
│   ├── components/         # Componentes React
│   ├── utils/              # Funções utilitárias
│   ├── hooks/              # React hooks
│   └── pages/              # Páginas Next.js
├── integration/            # Testes de integração
│   ├── api/               # Endpoints de API
│   └── database/          # Operações de banco
└── e2e/                   # Testes end-to-end
    ├── auth.spec.ts       # Fluxos de autenticação
    └── gameplay.spec.ts   # Fluxos de jogo
```

### Convenções de Naming
```bash
# Arquivos de teste
ComponentName.test.tsx      # Para componentes React
functionName.test.ts        # Para funções TypeScript
feature-name.test.js        # Para módulos JavaScript
FeatureFlow.spec.ts         # Para testes E2E
```

### Imports Necessários
```typescript
// Para componentes React
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Para funções utilitárias
import { functionName } from '@/lib/utils/module-name'

// Para testes E2E
import { test, expect } from '@playwright/test'
```

## 🧪 1. Testes Unitários

### A. Testando Componentes React

#### Template Básico
```typescript
// tests/unit/components/new-component.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { NewComponent } from '@/components/NewComponent'

describe('NewComponent', () => {
  it('should render correctly', () => {
    render(<NewComponent />)
    
    const component = screen.getByTestId('new-component')
    expect(component).toBeInTheDocument()
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<NewComponent onClick={handleClick} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### Exemplo Completo - Modal Component
```typescript
// tests/unit/components/modal.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '@/components/Modal'

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render when open', () => {
      render(<Modal {...defaultProps} />)
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(<Modal {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onClose when close button clicked', () => {
      render(<Modal {...defaultProps} />)
      
      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should close on escape key', () => {
      render(<Modal {...defaultProps} />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should focus on modal when opened', () => {
      render(<Modal {...defaultProps} />)
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveFocus()
    })

    it('should have correct ARIA attributes', () => {
      render(<Modal {...defaultProps} />)
      
      const modal = screen.getByRole('dialog')
      expect(modal).toHaveAttribute('aria-modal', 'true')
      expect(modal).toHaveAttribute('aria-labelledby')
    })
  })
})
```

### B. Testando Funções Utilitárias

#### Template Básico
```typescript
// tests/unit/utils/new-utils.test.ts
import { functionName } from '@/lib/utils/new-utils'

describe('functionName', () => {
  it('should handle normal case', () => {
    const result = functionName('input')
    expect(result).toBe('expected')
  })

  it('should handle edge cases', () => {
    expect(functionName('')).toBe('default')
    expect(functionName(null)).toBe('default')
    expect(functionName(undefined)).toBe('default')
  })
})
```

#### Exemplo Completo - Validation Utils
```typescript
// tests/unit/utils/validation.test.ts
import { 
  validateEmail, 
  validatePassword, 
  validateCampaignName 
} from '@/lib/utils/validation'

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@gmail.com'
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('should reject invalid emails', () => {
      const invalidEmails = [
        '',
        'invalid',
        '@example.com',
        'user@',
        'user name@example.com'
      ]

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })
  })

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'MyStr0ngP@ssw0rd',
        'AnotherGood123!',
        'Complex$Pass9'
      ]

      strongPasswords.forEach(password => {
        const result = validatePassword(password)
        expect(result.isValid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    it('should reject weak passwords', () => {
      const result = validatePassword('weak')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password must be at least 8 characters')
    })

    it('should return specific error messages', () => {
      const result = validatePassword('password')
      
      expect(result.errors).toContain('Must contain at least one number')
      expect(result.errors).toContain('Must contain at least one uppercase letter')
    })
  })

  describe('validateCampaignName', () => {
    it('should accept valid campaign names', () => {
      expect(validateCampaignName('My Campaign')).toBe(true)
      expect(validateCampaignName('Adventure #1')).toBe(true)
    })

    it('should reject empty or too short names', () => {
      expect(validateCampaignName('')).toBe(false)
      expect(validateCampaignName('A')).toBe(false)
    })

    it('should reject too long names', () => {
      const longName = 'A'.repeat(101)
      expect(validateCampaignName(longName)).toBe(false)
    })
  })
})
```

### C. Testando React Hooks

#### Template para Hooks
```typescript
// tests/unit/hooks/use-local-storage.test.ts
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/use-local-storage'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return initial value when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useLocalStorage('key', 'default'))
    
    expect(result.current[0]).toBe('default')
  })

  it('should update localStorage when value changes', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'))
    
    act(() => {
      result.current[1]('updated')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('key', 'updated')
  })
})
```

## 🔗 2. Testes de Integração

### Template para API Testing
```typescript
// tests/integration/api/new-endpoint.test.ts
import { testDb, setupTestDatabase, teardownTestDatabase } from '@/tests/db-setup'
import { NextRequest } from 'next/server'
import { POST as createHandler } from '@/app/api/new-endpoint/route'

describe('New Endpoint API', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await testDb.model.deleteMany()
  })

  it('should create new resource', async () => {
    const requestData = {
      name: 'Test Resource',
      value: 123
    }

    const request = new NextRequest('http://localhost:3000/api/new-endpoint', {
      method: 'POST',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await createHandler(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    
    // Verificar no banco
    const dbRecord = await testDb.model.findFirst({
      where: { name: 'Test Resource' }
    })
    expect(dbRecord).toBeTruthy()
  })
})
```

## 🌐 3. Testes End-to-End

### Template para E2E
```typescript
// tests/e2e/new-feature.spec.ts
import { test, expect } from '@playwright/test'
import { testDb, setupTestDatabase } from '../db-setup'

test.describe('New Feature Flow', () => {
  test.beforeAll(async () => {
    await setupTestDatabase()
  })

  test.beforeEach(async ({ page }) => {
    // Setup test data
    await testDb.user.deleteMany()
    
    const testUser = await testDb.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword'
      }
    })

    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
  })

  test('should complete feature workflow', async ({ page }) => {
    // Navigate to feature
    await page.goto('/feature-page')
    
    // Interact with feature
    await page.click('[data-testid="feature-button"]')
    await page.fill('[data-testid="feature-input"]', 'test input')
    await page.click('button:has-text("Submit")')
    
    // Verify result
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('text=Feature completed')).toBeVisible()
  })
})
```

## 🎨 Patterns e Best Practices

### 1. Arrange-Act-Assert (AAA)
```typescript
test('should calculate total price', () => {
  // Arrange - Preparar dados
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 }
  ]
  
  // Act - Executar função
  const total = calculateTotalPrice(items)
  
  // Assert - Verificar resultado
  expect(total).toBe(35)
})
```

### 2. Descriptive Test Names
```typescript
// ✅ Bom - Descreve comportamento específico
test('should return empty array when no characters exist')
test('should disable submit button when form is invalid')
test('should show error message when password is too short')

// ❌ Ruim - Muito genérico
test('character test')
test('form test')
test('error test')
```

### 3. Test Data Builders
```typescript
// tests/helpers/builders.ts
export const userBuilder = (overrides = {}) => ({
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'PLAYER',
  ...overrides
})

export const campaignBuilder = (overrides = {}) => ({
  id: 'test-campaign-id',
  name: 'Test Campaign',
  description: 'Test description',
  system: 'dnd5e',
  ...overrides
})

// Uso nos testes
test('should create campaign for user', () => {
  const user = userBuilder({ name: 'GM User' })
  const campaign = campaignBuilder({ ownerId: user.id })
  
  // Test implementation
})
```

### 4. Setup e Cleanup
```typescript
describe('Feature Tests', () => {
  let testUser: any
  let testCampaign: any

  beforeEach(async () => {
    // Setup comum para todos os testes
    testUser = await testDb.user.create({
      data: userBuilder()
    })
    
    testCampaign = await testDb.campaign.create({
      data: campaignBuilder({ ownerId: testUser.id })
    })
  })

  afterEach(async () => {
    // Cleanup após cada teste
    await testDb.campaign.deleteMany()
    await testDb.user.deleteMany()
  })

  test('should use setup data', () => {
    expect(testUser.id).toBeDefined()
    expect(testCampaign.ownerId).toBe(testUser.id)
  })
})
```

### 5. Mocking Strategies

#### Mock de Funções
```typescript
// Mock função específica
const mockCalculate = jest.fn()
mockCalculate.mockReturnValue(42)

// Mock módulo completo
jest.mock('@/lib/utils/calculations', () => ({
  calculate: jest.fn(() => 42),
  validate: jest.fn(() => true)
}))
```

#### Mock de Hooks
```typescript
// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: { id: 'test-id' }
  })
}))
```

#### Mock Condicional
```typescript
test('should handle loading state', () => {
  // Mock específico para este teste
  const useSessionMock = useSession as jest.Mock
  useSessionMock.mockReturnValue({
    data: null,
    status: 'loading'
  })

  render(<Component />)
  expect(screen.getByText('Loading...')).toBeInTheDocument()
})
```

## 🚨 Casos Extremos e Validações

### Testing Error States
```typescript
test('should handle API errors gracefully', async () => {
  // Mock API failure
  global.fetch = jest.fn().mockRejectedValue(new Error('API Error'))

  render(<ComponentThatFetchesData />)
  
  await waitFor(() => {
    expect(screen.getByText('Error loading data')).toBeInTheDocument()
  })
})
```

### Testing Loading States
```typescript
test('should show loading spinner', async () => {
  // Mock delayed response
  global.fetch = jest.fn(() =>
    new Promise(resolve => 
      setTimeout(() => resolve({ ok: true, json: () => ({}) }), 100)
    )
  )

  render(<Component />)
  
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
})
```

### Testing Edge Cases
```typescript
describe('Edge Cases', () => {
  test('should handle empty input', () => {
    expect(processData('')).toBe(null)
  })

  test('should handle null input', () => {
    expect(processData(null)).toBe(null)
  })

  test('should handle undefined input', () => {
    expect(processData(undefined)).toBe(null)
  })

  test('should handle very large numbers', () => {
    expect(processData(Number.MAX_SAFE_INTEGER)).toBeDefined()
  })
})
```

## 📋 Checklist para Novos Testes

### ✅ Antes de Escrever
- [ ] Identificar tipo de teste (unit/integration/e2e)
- [ ] Definir comportamento a ser testado
- [ ] Verificar se já existe teste similar
- [ ] Preparar dados de teste necessários

### ✅ Durante a Escrita
- [ ] Usar naming descritivo
- [ ] Seguir padrão AAA
- [ ] Testar casos normais e extremos
- [ ] Mockar dependências externas
- [ ] Adicionar assertions específicas

### ✅ Depois de Escrever
- [ ] Executar teste isoladamente
- [ ] Verificar se teste falha quando deveria
- [ ] Executar com coverage
- [ ] Refatorar se necessário
- [ ] Documentar casos complexos

## 🎯 Exemplos Específicos do MesaRPG

### Testando Sistema D&D
```typescript
test('should calculate spell save DC correctly', () => {
  const character = characterBuilder({
    level: 5,
    spellcastingAbility: 'INT',
    abilityScores: { INT: 16 }
  })

  const dc = calculateSpellSaveDC(character)
  
  // DC = 8 + proficiency bonus + ability modifier
  // DC = 8 + 3 + 3 = 14
  expect(dc).toBe(14)
})
```

### Testando Chat em Tempo Real
```typescript
test('should send chat message via WebSocket', async () => {
  const mockSocket = {
    emit: jest.fn(),
    connected: true
  }

  const { result } = renderHook(() => useSocket())
  result.current.socket = mockSocket

  act(() => {
    result.current.sendMessage('Hello world', 'CHAT')
  })

  expect(mockSocket.emit).toHaveBeenCalledWith('chat:send', {
    message: 'Hello world',
    type: 'CHAT'
  })
})
```

O sistema de escrita de testes está **bem estruturado** com **padrões claros** e **exemplos práticos** para facilitar o desenvolvimento de novos testes! 🚀