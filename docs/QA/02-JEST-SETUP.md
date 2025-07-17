# 2. Setup e Configuração do Jest

## 📦 Instalação Completa

### Dependências Principais
```bash
# Framework de testes principal
npm install --save-dev jest@29.7.0

# Tipos TypeScript
npm install --save-dev @types/jest@29.5.14

# Ambiente DOM
npm install --save-dev jest-environment-jsdom@29.7.0

# React Testing Library
npm install --save-dev @testing-library/react@16.1.0
npm install --save-dev @testing-library/jest-dom@6.5.0
npm install --save-dev @testing-library/user-event@14.5.2
```

### Comando de Instalação Completo
```bash
npm install --save-dev jest@29.7.0 @types/jest@29.5.14 jest-environment-jsdom@29.7.0 @testing-library/react@16.1.0 @testing-library/jest-dom@6.5.0 @testing-library/user-event@14.5.2 --force
```

## ⚙️ Configuração do Jest

### jest.config.js
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/tests/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: [
    '<rootDir>/tests/**/*.(test|spec).(js|jsx|ts|tsx)',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testTimeout: 30000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

### Principais Configurações Explicadas

#### setupFilesAfterEnv
```javascript
setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
```
- **O que faz**: Executa setup antes de cada teste
- **Arquivo**: `tests/setup.ts` contém mocks globais
- **Benefício**: Configuração centralizada

#### moduleNameMapper
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```
- **O que faz**: Resolve imports com `@/`
- **Exemplo**: `@/components/Button` → `./components/Button`
- **Benefício**: Mesmos imports do código principal

#### testEnvironment
```javascript
testEnvironment: 'jsdom'
```
- **O que faz**: Simula ambiente de browser
- **Benefício**: Permite testar componentes React
- **Alternativa**: `node` para testes de API

#### coverageThreshold
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```
- **O que faz**: Define metas mínimas de cobertura
- **Benefício**: Força qualidade dos testes
- **Falha**: Se cobertura < 70%, testes falham

## 🔧 Arquivo de Setup (tests/setup.ts)

### Setup Completo Funcional
```typescript
import '@testing-library/jest-dom'

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/mesarpg_test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    has: jest.fn(),
    getAll: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PLAYER',
      },
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock Socket.IO
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  })),
}))

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.location
Object.defineProperty(window, 'location', {
  writable: true,
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: jest.fn(),
    assign: jest.fn(),
    replace: jest.fn(),
  },
})

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

// Mock fetch
global.fetch = jest.fn()

// Suppress console errors in tests unless explicitly testing them
const originalError = console.error
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
```

### Mocks Explicados

#### Next.js Router Mock
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    // ... outros métodos
  }),
}))
```
- **Por que**: Componentes usam `useRouter` do Next.js
- **O que faz**: Simula navegação sem mudar página real
- **Benefício**: Testes isolados

#### NextAuth Mock
```typescript
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 'test-user-id' } },
    status: 'authenticated',
  })),
}))
```
- **Por que**: Muitos componentes dependem de autenticação
- **O que faz**: Simula usuário logado
- **Customização**: Pode ser alterado por teste específico

#### Browser APIs Mock
```typescript
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}
```
- **Por que**: APIs não existem no ambiente Node.js
- **O que faz**: Implementação vazia que não quebra
- **Benefício**: Componentes funcionam normalmente

## 📝 Scripts do Package.json

### Scripts Principais
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "playwright test",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "ci:test": "npm run lint && npm run type-check && npm run test:unit"
  }
}
```

### Scripts Explicados

#### test:watch
```bash
npm run test:watch
```
- **O que faz**: Re-executa testes quando arquivos mudam
- **Uso**: Durante desenvolvimento
- **Benefício**: Feedback imediato

#### test:coverage
```bash
npm run test:coverage
```
- **O que faz**: Gera relatório de cobertura de código
- **Arquivo**: `coverage/lcov-report/index.html`
- **Benefício**: Visualiza áreas não testadas

#### test:unit
```bash
npm run test:unit
```
- **O que faz**: Executa apenas testes unitários
- **Padrão**: `tests/unit/**/*.test.(js|ts|tsx)`
- **Benefício**: Execução rápida

## 🚀 Comandos de Execução

### Desenvolvimento Diário
```bash
# Modo watch para desenvolvimento ativo
npm run test:watch

# Testar arquivo específico
npx jest tests/unit/components/button.test.tsx

# Testar padrão específico
npx jest --testNamePattern="Button"
```

### Validação Antes de Commit
```bash
# Executar todos os testes unitários
npm run test:unit

# Verificar cobertura
npm run test:coverage

# Executar linting
npm run lint
```

### Debug e Troubleshooting
```bash
# Executar com informações detalhadas
npx jest --verbose

# Executar teste específico com debug
npx jest tests/unit/simple.test.js --verbose

# Limpar cache se necessário
npx jest --clearCache
```

## ⚠️ Problemas Comuns e Soluções

### 1. "jest: command not found"
**Problema**: Jest não está no PATH
**Solução**:
```bash
npx jest --version  # Usar npx
# ou
npm install -g jest  # Instalar globalmente
```

### 2. "Cannot find module '@/...'"
**Problema**: Module mapper não configurado
**Solução**: Verificar `moduleNameMapper` no jest.config.js

### 3. "useSession is not a function"
**Problema**: Mock do NextAuth quebrado
**Solução**: Verificar mock no tests/setup.ts

### 4. Testes lentos
**Problema**: Muitos testes ou setup pesado
**Solução**:
```bash
# Executar em paralelo
npx jest --maxWorkers=4

# Executar apenas arquivos alterados
npx jest --onlyChanged
```

## 📊 Verificação da Instalação

### Teste de Funcionamento
```bash
# 1. Verificar versão do Jest
npx jest --version
# Deve retornar: 29.7.0

# 2. Executar teste simples
npx jest tests/unit/simple.test.js
# Deve passar 3 testes

# 3. Executar todos os testes unitários
npm run test:unit
# Deve passar 70 testes em 4 suites

# 4. Verificar cobertura
npm run test:coverage
# Deve gerar relatório em coverage/
```

### Validação Completa
```bash
# Executar checklist completo
npm run lint              # ✅ Sem erros de linting
npm run type-check        # ✅ Sem erros TypeScript  
npm run test:unit         # ✅ 70 testes passando
npm run test:coverage     # ✅ Relatório gerado
```

## 🎯 Próximos Passos

1. **Criar mais testes** seguindo os exemplos funcionais
2. **Expandir cobertura** para hooks e pages
3. **Ativar testes de integração** quando resolver dependências
4. **Implementar testes E2E** para fluxos críticos

O Jest está **completamente configurado e funcional** para desenvolvimento contínuo de testes no MesaRPG! 🚀