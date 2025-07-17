# 4. Como Executar os Testes

## 🚀 Comandos Básicos

### Execução Rápida
```bash
# Executar todos os testes unitários (recomendado)
npm run test:unit

# Executar em modo watch (desenvolvimento)
npm run test:watch

# Executar testes específicos
npx jest tests/unit/simple.test.js
```

### Execução Completa
```bash
# Todos os tipos de teste
npm run test:all

# Com relatório de cobertura
npm run test:coverage

# Validação completa antes de commit
npm run ci:test
```

## 📋 Guia Detalhado por Tipo

### 1. Testes Unitários ✅ (FUNCIONANDO)

#### Comandos Principais
```bash
# Execução básica - 70 testes passando
npm run test:unit

# Modo watch - re-executa quando arquivos mudam
npm run test:watch

# Com informações detalhadas
npm run test:unit -- --verbose

# Arquivo específico
npx jest tests/unit/components/button.test.tsx
```

#### Exemplo de Execução
```bash
$ npm run test:unit

> my-v0-project@0.1.0 test:unit
> jest --testPathPattern=tests/unit

PASS tests/unit/components/button.test.tsx
PASS tests/unit/utils/dnd-utils.test.ts
PASS tests/unit/basic-math.test.js
PASS tests/unit/simple.test.js

Test Suites: 4 passed, 4 total
Tests:       70 passed, 70 total
Snapshots:   0 total
Time:        0.843 s
```

#### Testes por Categoria
```bash
# Componentes React (19 testes)
npx jest tests/unit/components/

# Funções utilitárias (39 testes)
npx jest tests/unit/utils/

# Testes matemáticos (9 testes)
npx jest tests/unit/basic-math.test.js

# Testes simples (3 testes)
npx jest tests/unit/simple.test.js
```

### 2. Testes de Integração 🔧 (ESTRUTURA CRIADA)

#### Comandos (Quando Ativos)
```bash
# Executar testes de integração
npm run test:integration

# Com setup de banco de teste
npm run db:test:reset && npm run test:integration

# APIs específicas
npx jest tests/integration/api/auth.test.ts
```

#### Setup Necessário
```bash
# 1. Banco de teste PostgreSQL
docker-compose -f docker-compose.test.yml up -d

# 2. Executar migrações
npm run db:migrate:test

# 3. Executar testes
npm run test:integration
```

### 3. Testes E2E 🔧 (ESTRUTURA CRIADA)

#### Comandos Playwright
```bash
# Executar testes E2E
npm run test:e2e

# Com interface visual
npm run test:e2e:ui

# Com browser visível
npm run test:e2e:headed

# Browser específico
npx playwright test --project=chromium
```

#### Debug E2E
```bash
# Modo debug passo-a-passo
npx playwright test --debug

# Gravar novos testes
npx playwright codegen localhost:3000

# Ver traces de execução
npx playwright show-trace test-results/trace.zip
```

## 🔍 Execução por Padrão

### Por Nome de Teste
```bash
# Testes que contenham "button" no nome
npx jest --testNamePattern="button"

# Testes que contenham "calculate" no nome
npx jest --testNamePattern="calculate"

# Testes de um describe específico
npx jest --testNamePattern="Button Component"
```

### Por Arquivo
```bash
# Arquivo específico completo
npx jest tests/unit/components/button.test.tsx

# Múltiplos arquivos
npx jest tests/unit/utils/ tests/unit/components/

# Por extensão
npx jest --testRegex='.*\\.test\\.tsx?$'
```

### Por Tag ou Grupo
```bash
# Executar apenas testes unitários
npm run test:unit

# Executar apenas testes de integração
npm run test:integration

# Executar apenas componentes
npx jest tests/unit/components/
```

## 📊 Relatórios e Coverage

### Coverage Básico
```bash
# Gerar relatório de cobertura
npm run test:coverage

# Ver relatório HTML
open coverage/lcov-report/index.html
```

### Coverage Detalhado
```bash
# Com threshold de 70%
npm run test:coverage

# Coverage de arquivo específico
npx jest --coverage tests/unit/utils/dnd-utils.test.ts

# Coverage apenas de src modificados
npx jest --coverage --changedSince=main
```

### Exemplo de Relatório
```bash
$ npm run test:coverage

----------------------|---------|----------|---------|---------|
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files            |   85.23 |    78.45 |   82.16 |   84.89 |
 components/ui        |   98.76 |    95.23 |   100   |   98.45 |
  button.tsx         |   98.76 |    95.23 |   100   |   98.45 |
 lib/utils           |   89.34 |    78.23 |   91.67 |   88.92 |
  dnd-utils.ts       |   89.34 |    78.23 |   91.67 |   88.92 |
----------------------|---------|----------|---------|---------|
```

## 🐛 Debug e Troubleshooting

### Debug Básico
```bash
# Executar com informações detalhadas
npx jest --verbose

# Executar apenas um teste
npx jest --testNamePattern="should calculate ability modifier"

# Ver stack trace completo
npx jest --no-coverage tests/unit/utils/dnd-utils.test.ts
```

### Debug Avançado
```bash
# Limpar cache se necessário
npx jest --clearCache

# Executar sem parallel (mais debug info)
npx jest --runInBand

# Detectar testes lentos
npx jest --detectOpenHandles
```

### Problemas Comuns

#### 1. "jest: command not found"
```bash
# Solução: usar npx
npx jest --version

# Ou instalar globalmente
npm install -g jest
```

#### 2. Testes não encontrados
```bash
# Verificar padrão de arquivos
npx jest --listTests

# Verificar configuração
npx jest --showConfig
```

#### 3. Mocks não funcionando
```bash
# Verificar setup
cat tests/setup.ts

# Limpar mocks
npx jest --clearMocks
```

## ⚡ Otimização de Performance

### Execução Paralela
```bash
# Definir número de workers
npx jest --maxWorkers=4

# Usar metade dos cores disponíveis
npx jest --maxWorkers=50%

# Execução serial (debug)
npx jest --runInBand
```

### Cache e Otimização
```bash
# Usar cache (padrão)
npx jest --cache

# Ignorar cache
npx jest --no-cache

# Apenas arquivos alterados
npx jest --onlyChanged
```

### Watch Mode Otimizado
```bash
# Watch apenas arquivos relacionados
npm run test:watch

# Watch com coverage
npx jest --watch --coverage

# Watch pattern específico
npx jest --watchPathPattern=src/components
```

## 🔄 Fluxos de Trabalho

### Durante Desenvolvimento
```bash
# 1. Iniciar watch mode
npm run test:watch

# 2. Desenvolver código
# (testes re-executam automaticamente)

# 3. Verificar coverage ocasionalmente
npm run test:coverage
```

### Antes de Commit
```bash
# 1. Executar todos os testes unitários
npm run test:unit

# 2. Verificar linting
npm run lint

# 3. Verificar TypeScript
npm run type-check

# 4. Se tudo OK, fazer commit
```

### Antes de Push/PR
```bash
# Executar validação completa
npm run ci:test

# Ou individual:
npm run lint
npm run type-check
npm run test:unit
npm run build
```

### Release Testing
```bash
# 1. Testes unitários
npm run test:unit

# 2. Testes de integração (quando ativos)
npm run test:integration

# 3. Testes E2E (quando ativos)
npm run test:e2e

# 4. Coverage report
npm run test:coverage
```

## 📱 Execução em Diferentes Ambientes

### Local Development
```bash
# Setup inicial
npm install --legacy-peer-deps

# Executar testes
npm run test:unit
```

### CI/CD (GitHub Actions)
```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: |
    npm ci --legacy-peer-deps
    npm run test:unit
    npm run test:coverage
```

### Docker
```bash
# Build e test em container
docker-compose -f docker-compose.test.yml run --rm app npm run test:unit
```

## 📋 Checklist de Execução

### ✅ Diário (Desenvolvimento)
- [ ] `npm run test:watch` - Modo watch ativo
- [ ] Testes passando para código alterado
- [ ] Coverage mantida > 70%

### ✅ Semanal (Manutenção)
- [ ] `npm run test:coverage` - Verificar coverage geral
- [ ] `npm run test:unit` - Todos os testes passando
- [ ] Atualizar testes quebrados

### ✅ Release (Deploy)
- [ ] `npm run ci:test` - Validação completa
- [ ] Coverage report gerado
- [ ] Documentação atualizada
- [ ] Testes E2E validados (quando ativos)

## 🎯 Comandos de Produtividade

### Favoritos para Desenvolvimento
```bash
# Mais usado: watch mode
npm run test:watch

# Debug específico
npx jest tests/unit/components/button.test.tsx --verbose

# Coverage rápido
npm run test:coverage
```

### Validação Rápida
```bash
# Antes de commit (2-3 segundos)
npm run test:unit

# Validação completa (1-2 minutos)
npm run ci:test
```

### Desenvolvimento de Novos Testes
```bash
# Testar apenas arquivo atual
npx jest tests/unit/new-feature.test.ts --watch

# Com coverage do arquivo
npx jest tests/unit/new-feature.test.ts --coverage
```

O sistema de execução está **otimizado** e **bem documentado** para máxima produtividade no desenvolvimento! 🚀