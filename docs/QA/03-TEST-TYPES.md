# 3. Tipos de Teste Implementados

## 📋 Visão Geral dos Tipos

O sistema de QA do MesaRPG implementa 3 tipos principais de testes, cada um com objetivos específicos e níveis diferentes de complexidade.

## 🔧 1. Testes Unitários (70% - ATIVO)

### Definição
Testes que validam **funções individuais** e **componentes isolados** sem dependências externas.

### Características
- ⚡ **Velocidade**: Muito rápida (< 1s)
- 🎯 **Escopo**: Função específica ou componente
- 🔄 **Frequência**: Executados constantemente
- 📊 **Coverage**: 70 testes passando

### Estrutura
```
tests/unit/
├── components/          # Testes de componentes React
│   └── button.test.tsx  # ✅ 19 testes - Interface completa
├── utils/               # Testes de funções utilitárias  
│   └── dnd-utils.test.ts # ✅ 39 testes - Sistema D&D 5e
├── hooks/               # Testes de React hooks
│   └── [pendente]       # ⚠️ Para implementar
└── pages/               # Testes de páginas
    └── [pendente]       # ⚠️ Para implementar
```

### Exemplos Implementados

#### A. Component Testing - Button (19 testes)
```typescript
// tests/unit/components/button.test.tsx
describe('Button Component', () => {
  it('should render different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>)
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground')

    rerender(<Button variant="destructive">Destructive</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground')
  })
})
```

**O que testa**:
- ✅ Renderização básica
- ✅ Variantes (default, destructive, outline, secondary, ghost, link)
- ✅ Tamanhos (default, sm, lg, icon)
- ✅ Estados (normal, disabled)
- ✅ Eventos (click, keyboard)
- ✅ Props customizadas
- ✅ Acessibilidade

#### B. Utils Testing - D&D 5e (39 testes)
```typescript
// tests/unit/utils/dnd-utils.test.ts
describe('calculateAbilityModifier', () => {
  it('should calculate correct ability modifiers', () => {
    expect(calculateAbilityModifier(10)).toBe(0)   // Baseline
    expect(calculateAbilityModifier(16)).toBe(3)   // High stat
    expect(calculateAbilityModifier(8)).toBe(-1)   // Low stat
  })
})
```

**O que testa**:
- ✅ Modificadores de habilidade
- ✅ Bônus de proficiência por nível
- ✅ Cálculo de pontos de vida
- ✅ Sistema de magias (slots, DC, ataque)
- ✅ Recursos de classe
- ✅ Proficiências
- ✅ Dados de vida

#### C. Math Testing - Funções Básicas (9 testes)
```typescript
// tests/unit/basic-math.test.js
describe('Basic Math Functions', () => {
  const add = (a, b) => a + b
  
  test('should add two positive numbers', () => {
    expect(add(2, 3)).toBe(5)
  })
})
```

**O que testa**:
- ✅ Operações matemáticas básicas
- ✅ Casos extremos (zero, negativos)
- ✅ Validação de entrada

### Padrões de Teste Unitário

#### 1. Arrange-Act-Assert (AAA)
```typescript
test('should calculate correct modifier', () => {
  // Arrange - Preparar dados
  const abilityScore = 16
  
  // Act - Executar função
  const modifier = calculateAbilityModifier(abilityScore)
  
  // Assert - Verificar resultado
  expect(modifier).toBe(3)
})
```

#### 2. Naming Convention
```typescript
// ✅ Bom: Descreve o comportamento
test('should return 0 for ability score 10')
test('should handle empty character list')
test('should render disabled button correctly')

// ❌ Ruim: Muito genérico
test('modifier test')
test('button test')
```

#### 3. Test Structure
```typescript
describe('ComponentName or FunctionName', () => {
  describe('specific behavior group', () => {
    beforeEach(() => {
      // Setup comum para este grupo
    })
    
    test('should behave in specific way', () => {
      // Teste específico
    })
  })
})
```

## 🔗 2. Testes de Integração (20% - ESTRUTURA CRIADA)

### Definição
Testes que validam **interação entre módulos**, especialmente APIs e banco de dados.

### Características
- ⚡ **Velocidade**: Média (1-5s)
- 🎯 **Escopo**: Múltiplos módulos juntos
- 🔄 **Frequência**: CI/CD e antes de releases
- 📊 **Status**: Estrutura criada, execução pendente

### Estrutura
```
tests/integration/
├── api/                     # Testes de APIs
│   ├── auth.test.ts        # ✅ Estrutura - Autenticação
│   ├── campaigns.test.ts   # ✅ Estrutura - Campanhas CRUD
│   ├── characters.test.ts  # ✅ Estrutura - Personagens
│   └── chat.test.ts        # ✅ Estrutura - Sistema de chat
├── database/               # Testes de banco
│   ├── user-operations.test.ts     # ⚠️ Para implementar
│   └── campaign-operations.test.ts # ⚠️ Para implementar
└── services/               # Testes de serviços
    ├── socket-integration.test.ts  # ⚠️ Para implementar
    └── file-upload.test.ts         # ⚠️ Para implementar
```

### Exemplos Criados

#### A. API Testing - Authentication
```typescript
// tests/integration/api/auth.test.ts
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
    })

    const response = await registerHandler(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user.email).toBe('test@example.com')
    
    // Verificar no banco
    const dbUser = await testDb.user.findUnique({
      where: { email: 'test@example.com' }
    })
    expect(dbUser).toBeTruthy()
  })
})
```

#### B. API Testing - Campaigns CRUD
```typescript
// tests/integration/api/campaigns.test.ts
describe('Campaigns API Integration Tests', () => {
  beforeEach(async () => {
    await testDb.campaign.deleteMany()
    await testDb.user.deleteMany()
  })
  
  it('should create campaign with real database', async () => {
    // Test implementation with real DB operations
  })
})
```

### Database Testing Setup
```typescript
// tests/db-setup.ts
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://test:test@localhost:5432/mesarpg_test'
    }
  }
})

export async function setupTestDatabase() {
  await testDb.$connect()
}
```

### Benefícios dos Testes de Integração
- 🔍 **Detecta problemas** entre módulos
- 📊 **Valida fluxo completo** de dados
- 🗄️ **Testa persistência** real
- 🔐 **Valida autenticação** e autorização

## 🌐 3. Testes End-to-End (10% - ESTRUTURA CRIADA)

### Definição
Testes que simulam **jornadas completas do usuário** em um navegador real.

### Características
- ⚡ **Velocidade**: Lenta (10-30s)
- 🎯 **Escopo**: Fluxo completo do usuário
- 🔄 **Frequência**: Antes de releases importantes
- 📊 **Status**: Playwright configurado, cenários criados

### Estrutura
```
tests/e2e/
├── auth.spec.ts              # ✅ Fluxo de autenticação
├── campaign-management.spec.ts # ✅ Gerenciamento de campanhas
├── gameplay.spec.ts          # ✅ Fluxos de jogo
├── character-management.spec.ts # ⚠️ Para expandir
└── real-time-features.spec.ts   # ⚠️ Para expandir
```

### Exemplos Criados

#### A. Authentication Flow
```typescript
// tests/e2e/auth.spec.ts
test('should allow user registration', async ({ page }) => {
  await page.goto('/register')
  
  await page.fill('input[name="name"]', 'Test User')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
  
  // Verificar no banco
  const user = await testDb.user.findUnique({
    where: { email: 'test@example.com' }
  })
  expect(user).toBeTruthy()
})
```

#### B. Campaign Management
```typescript
// tests/e2e/campaign-management.spec.ts
test('should create a new campaign', async ({ page }) => {
  // Login first
  await page.goto('/login')
  await page.fill('input[type="email"]', 'gm@example.com')
  await page.fill('input[type="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // Create campaign
  await page.click('button:has-text("Criar Campanha")')
  await page.fill('input[name="name"]', 'Test Campaign')
  await page.fill('textarea[name="description"]', 'Description')
  await page.click('button[type="submit"]')
  
  await expect(page.locator('text=Test Campaign')).toBeVisible()
})
```

#### C. Gameplay Features
```typescript
// tests/e2e/gameplay.spec.ts
test('should send and receive chat messages', async ({ page }) => {
  await page.goto(`/campaign/${testCampaign.id}/play`)
  
  const chatInput = page.locator('[data-testid="chat-input"]')
  await chatInput.fill('Hello, this is a test message!')
  await page.keyboard.press('Enter')
  
  await expect(page.locator('text=Hello, this is a test message!')).toBeVisible()
})
```

### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
  ],
})
```

## 📊 Comparação dos Tipos de Teste

| Aspecto | Unit Tests | Integration Tests | E2E Tests |
|---------|------------|------------------|-----------|
| **Velocidade** | ⚡ < 1s | ⚡ 1-5s | 🐌 10-30s |
| **Escopo** | Função/Componente | Módulos | Fluxo completo |
| **Isolamento** | ✅ Total | 🔄 Parcial | ❌ Real environment |
| **Confiabilidade** | ✅ Alta | 🔄 Média | ⚠️ Pode ser flaky |
| **Manutenção** | ✅ Baixa | 🔄 Média | ⚠️ Alta |
| **Feedback** | ✅ Imediato | 🔄 Rápido | 🐌 Demorado |
| **Status** | ✅ Ativo (70 testes) | 🔧 Estrutura criada | 🔧 Estrutura criada |

## 🎯 Estratégia de Implementação

### Prioridade 1 - Testes Unitários ✅
- **Status**: Completamente funcional
- **Cobertura**: 70 testes em 4 suites
- **Próximos passos**: Expandir para hooks e pages

### Prioridade 2 - Testes de Integração 🔧
- **Status**: Estrutura criada, execução pendente
- **Bloqueio**: Dependências complexas de mock
- **Próximos passos**: Resolver mocks e ativar execução

### Prioridade 3 - Testes E2E 🔧
- **Status**: Cenários criados, execução pendente
- **Bloqueio**: Dependências de browser e banco
- **Próximos passos**: Setup de ambiente E2E

## 📝 Guias de Implementação

### Para Testes Unitários
1. **Identificar função/componente** a testar
2. **Criar arquivo** `*.test.(js|ts|tsx)`
3. **Seguir padrão AAA** (Arrange-Act-Assert)
4. **Usar mocks** para dependências externas
5. **Testar casos extremos** e erros

### Para Testes de Integração
1. **Identificar fluxo** entre módulos
2. **Setup banco de teste** isolado
3. **Testar APIs** com dados reais
4. **Validar persistência** no banco
5. **Cleanup** após cada teste

### Para Testes E2E
1. **Identificar jornada crítica** do usuário
2. **Escrever cenário** passo-a-passo
3. **Usar seletores estáveis** (data-testid)
4. **Validar estado final** visível
5. **Considerar tempo** de execução

## 🔮 Evolução Futura

### Tipos Adicionais Planejados
- **Visual Regression Tests** - Mudanças de interface
- **Performance Tests** - Métricas de velocidade
- **Security Tests** - Vulnerabilidades
- **Load Tests** - Teste de carga
- **Accessibility Tests** - Conformidade a11y

### Automação Avançada
- **Snapshot Testing** - Comparação automática
- **Property-based Testing** - Geração automática de casos
- **Mutation Testing** - Qualidade dos testes
- **Cross-browser Testing** - Compatibilidade

O sistema de tipos de teste está **bem estruturado** e **pronto para crescimento** conforme as necessidades do projeto evoluem! 🚀