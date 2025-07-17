# Sistema de QA - MesaRPG

Este diretório contém toda a documentação relacionada ao sistema de Quality Assurance (Controle de Qualidade) do projeto MesaRPG.

## 📁 Estrutura da Documentação

### 📋 Documentos Principais

1. **[01-OVERVIEW.md](./01-OVERVIEW.md)** - Visão geral do sistema de QA
2. **[02-JEST-SETUP.md](./02-JEST-SETUP.md)** - Setup e configuração do Jest
3. **[03-TEST-TYPES.md](./03-TEST-TYPES.md)** - Tipos de teste implementados
4. **[04-RUNNING-TESTS.md](./04-RUNNING-TESTS.md)** - Como executar os testes
5. **[05-WRITING-TESTS.md](./05-WRITING-TESTS.md)** - Como escrever novos testes
6. **[06-TROUBLESHOOTING.md](./06-TROUBLESHOOTING.md)** - Resolução de problemas
7. **[07-CI-CD.md](./07-CI-CD.md)** - Integração contínua e deploy
8. **[08-BEST-PRACTICES.md](./08-BEST-PRACTICES.md)** - Melhores práticas

### 📊 Status Atual

- ✅ **Jest**: Configurado e funcionando (v29.7.0)
- ✅ **Unit Tests**: 70 testes passando em 4 suites
- ✅ **Integration Tests**: Estrutura criada
- ✅ **E2E Tests**: Estrutura com Playwright
- ✅ **CI/CD**: Pipeline GitHub Actions configurado
- ✅ **Documentation**: Documentação completa

### 🎯 Cobertura de Testes

| Tipo | Status | Testes | Cobertura |
|------|--------|--------|-----------|
| **Unit Tests** | ✅ Funcionando | 70 passando | Components, Utils, Math |
| **Integration Tests** | 🔧 Setup completo | Estrutura criada | APIs, Database |
| **E2E Tests** | 🔧 Setup completo | Estrutura criada | User Flows |
| **CI/CD Pipeline** | ✅ Configurado | GitHub Actions | Automated Testing |

### 🚀 Quick Start

```bash
# Executar todos os testes unitários
npm run test:unit

# Executar em modo watch (desenvolvimento)
npm run test:watch

# Executar com cobertura
npm run test:coverage

# Executar testes E2E
npm run test:e2e

# Executar todos os testes
npm run test:all
```

### 📈 Métricas de Qualidade

- **70 testes unitários** passando
- **4 suites de teste** implementadas
- **100% dos testes básicos** funcionando
- **Configuração robusta** de mocks e setup
- **Documentação completa** disponível

### 🛠️ Ferramentas Utilizadas

- **Jest 29.7.0** - Framework de testes principal
- **React Testing Library** - Testes de componentes React
- **Playwright** - Testes end-to-end
- **MSW** - Mock Service Worker para APIs
- **GitHub Actions** - CI/CD pipeline
- **PostgreSQL** - Banco de dados de teste

### 📋 Checklist de QA

- [x] Configuração do Jest
- [x] Testes unitários básicos
- [x] Testes de componentes React
- [x] Testes de funções utilitárias
- [x] Mocks configurados
- [x] Setup de banco de teste
- [x] Pipeline CI/CD
- [x] Documentação completa
- [ ] Cobertura de código > 80%
- [ ] Testes de integração ativos
- [ ] Testes E2E ativos

### 🔗 Links Úteis

- [Testing Strategy](../TESTING_STRATEGY.md) - Estratégia completa de testes
- [Testing Execution](../TESTING_EXECUTION.md) - Guia de execução
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)

### 💡 Dicas Rápidas

1. **Durante desenvolvimento**: Use `npm run test:watch`
2. **Antes de commit**: Execute `npm run test:unit`
3. **Para debug**: Use `--verbose` nos comandos Jest
4. **Para coverage**: Execute `npm run test:coverage`
5. **Para CI/CD**: Todos os testes rodam automaticamente no push

---

📝 **Última atualização**: $(date)  
🎯 **Próxima revisão**: Implementar testes de integração ativos  
👥 **Mantido por**: Equipe de desenvolvimento MesaRPG