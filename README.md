# MesaRPG v1.0 🎲

> **Uma plataforma Virtual Tabletop (VTT) completa e funcional para campanhas de RPG**

**MesaRPG** é uma aplicação web moderna construída com Next.js 15 que oferece uma experiência completa de RPG online para mestres e jogadores. Com recursos em tempo real, sistema de personagens dinâmico, grid tático funcional e interface intuitiva.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Version](https://img.shields.io/badge/Version-v1.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 **Características Principais**

### **🎮 Interface de Jogo Completa**
- **Sidebar Unificada**: Abas organizadas (Comunicação/Conteúdo) com navegação fluida
- **Chat em Tempo Real**: Sistema WebSocket com comandos de dados integrados (`/r`, `/ooc`)
- **Grid Tático Funcional**: Mapa de 800x600px com sistema de tokens estável
- **Players Conectados**: Visualização em tempo real de jogadores ativos

### **👥 Sistema de Personagens Avançado**
- **CRUD Completo**: Criação, edição e gerenciamento de PCs, NPCs e Criaturas
- **Templates Dinâmicos**: Fichas customizáveis com campos flexíveis
- **Visualização Inteligente**: Renderização automática baseada em templates
- **Mini Resumos**: Prévia de personagens na sidebar com avatares

### **🗺️ Mapas e Grid Tático**
- **Templates de Mapa**: 3 ambientes pré-definidos (Deserto, Masmorra, Floresta)
- **Upload Personalizado**: Suporte a imagens customizadas
- **Ativação em Tempo Real**: Mudança de mapas sincronizada via WebSocket
- **Sistema de Tokens Simplificado**: Movimento livre com sincronização perfeita

### **📄 Sistema de Handouts**
- **Documentos Compartilhados**: Criação e gerenciamento de conteúdo
- **Controle de Acesso**: Sistema GM → Jogadores com notificações
- **Anexos**: Suporte a múltiplos tipos de arquivo

### **⚙️ Configurações da Campanha**
- **Gerenciamento de Jogadores**: Sistema de convites com links únicos e expiração
- **Editor de Templates**: Interface drag & drop para criação de fichas dinâmicas
- **Configurações Gerais**: Personalização completa (nome, descrição, sistema RPG)
- **Sistema de Convites**: Links únicos com expiração de 24 horas

### **🎨 Sistema de Temas**
- **Tema Claro**: Design profissional com cores vermelhas
- **Tema Escuro**: Tons de chumbo com destaques laranja
- **Transições Suaves**: Animações de 300ms para mudanças confortáveis
- **Persistência**: Salvamento automático no localStorage

---

## 🏗️ **Arquitetura Técnica**

### **Stack Principal**
```typescript
Frontend:    Next.js 15 (App Router) + TypeScript
Backend:     API Routes + Custom Server Node.js
Database:    SQLite + Prisma ORM
Auth:        NextAuth.js
Real-time:   Socket.IO
UI:          TailwindCSS + shadcn/ui
```

### **Estrutura do Projeto**
```
📁 MesaRPG/
├── 📁 app/                  # Next.js App Router
│   ├── 📁 api/             # API Routes (30+ endpoints)
│   ├── 📁 campaign/        # Páginas de campanha
│   └── 📁 dashboard/       # Dashboard principal
├── 📁 components/          # Componentes React
│   ├── 📁 game/           # Componentes de jogo (Chat, Grid, etc.)
│   ├── 📁 ui/             # Componentes shadcn/ui
│   └── 📁 providers/      # Context providers
├── 📁 lib/                 # Utilitários e configurações
│   ├── 📁 rpg-systems/    # Sistema modular de RPG
│   └── auth.ts            # Configuração NextAuth
├── 📁 hooks/              # Custom React hooks
├── 📁 prisma/             # Database schema e migrations
└── 📁 docs/               # Documentação organizada
```

### **APIs Implementadas (30+ Endpoints)**
- **Autenticação**: Login, registro, sessões
- **Campanhas**: CRUD completo, configurações
- **Personagens**: Criação, edição, templates
- **Chat**: Mensagens em tempo real, comandos
- **Mapas**: Upload, ativação, gerenciamento
- **Handouts**: Documentos, compartilhamento
- **Arquivos**: Upload, categorização
- **Convites**: Criação, validação, expiração

---

## 🎯 **Como Usar**

### **Instalação**
```bash
# Clonar o repositório
git clone https://github.com/your-username/mesarpg-shell-v1.git
cd mesarpg-shell-v1

# Instalar dependências
npm install --legacy-peer-deps

# Configurar banco de dados
npx prisma migrate dev

# Executar em desenvolvimento
npm run dev
```

### **Variáveis de Ambiente**
Crie um arquivo `.env.local`:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### **Fluxo de Uso**
1. **Registro/Login** → Acesso à plataforma
2. **Criar Campanha** → Configurar sistema RPG
3. **Convidar Jogadores** → Sistema de convites
4. **Gerenciar Personagens** → Criar PCs, NPCs, Criaturas
5. **Jogar** → Chat, grid tático, handouts

---

## 🎮 **Funcionalidades em Destaque**

### **Sistema de Chat Avançado**
- **Comandos de Dados**: `/r 1d20+5` para rolagens
- **Mensagens OOC**: `/ooc` para comunicação fora do personagem
- **Histórico Persistente**: Mensagens salvas no banco
- **Sincronização**: Tempo real via WebSocket

### **Grid Tático Funcional**
- **Tokens Simples**: Sistema ultra-estável
- **Movimento Livre**: Sem restrições de permissão
- **Sincronização**: Movimento em tempo real
- **Mapas Dinâmicos**: Troca automática de cenários

### **Sistema de Personagens Inteligente**
- **Templates Flexíveis**: Campos dinâmicos por sistema RPG
- **Visualização Adaptativa**: Renderização automática
- **Três Tipos**: PC (Jogador), NPC (Mestre), Creature (Bestiário)
- **Busca Avançada**: Filtros por tipo e criador

### **Gerenciamento de Arquivo**
- **Upload Drag & Drop**: Interface intuitiva
- **Categorização**: Mapas, handouts, avatares
- **Validação**: Tipos e tamanhos permitidos
- **Preview**: Visualização integrada

---

## 📊 **Métricas de Build**

### **Performance**
- **First Load JS**: ~101 kB (compartilhado)
- **Páginas Principais**: 3-67 kB (otimizadas)
- **Build Time**: ~45 segundos
- **Bundle Size**: Otimizado com tree-shaking

### **Cobertura de Funcionalidades**
- ✅ **Autenticação**: 100% funcional
- ✅ **Dashboard**: 100% funcional
- ✅ **Campanhas**: 100% funcional
- ✅ **Personagens**: 100% funcional
- ✅ **Chat**: 100% funcional
- ✅ **Grid Tático**: 100% funcional
- ✅ **Handouts**: 100% funcional
- ✅ **Configurações**: 100% funcional
- ✅ **Temas**: 100% funcional

---

## 🔧 **Desenvolvimento**

### **Scripts Disponíveis**
```bash
npm run dev          # Desenvolvimento
npm run build        # Build de produção
npm run start        # Executar produção
npm run lint         # Linting
npm run db:reset     # Reset do banco
npm run db:migrate   # Migração do banco
```

### **Estrutura de Desenvolvimento**
```
📁 docs/
├── 📁 core/         # Documentação essencial
├── 📁 features/     # Funcionalidades específicas
└── 📁 development/  # Guias de desenvolvimento
```

### **Ambiente de Desenvolvimento**
- **Node.js**: 18+ recomendado
- **Database**: SQLite (desenvolvimento)
- **Package Manager**: npm
- **TypeScript**: Strict mode habilitado

---

## 🚀 **Deploy**

### **Opções de Deploy**
- **Railway**: Configuração automática via `railway.json`
- **Vercel**: Suporte nativo ao Next.js
- **Docker**: Dockerfile incluído
- **VPS**: Scripts de setup incluídos

### **Configuração de Produção**
```bash
# Build otimizado
npm run build

# Executar em produção
npm start

# Configurar banco de produção
DATABASE_URL="postgresql://user:pass@host:5432/db"
```

---

## 🤝 **Contribuindo**

### **Guidelines**
1. **Fork** o projeto
2. **Crie** uma branch para sua feature
3. **Commit** suas mudanças
4. **Push** para a branch
5. **Abra** um Pull Request

### **Padrões de Código**
- **TypeScript**: Strict mode
- **ESLint**: Configuração padrão
- **Prettier**: Formatação automática
- **Commits**: Conventional commits

---

## 📝 **Documentação**

### **Documentação Completa**
- 📖 **[Guia de Autenticação](docs/core/01-authentication.md)**
- 📖 **[Gerenciamento de Campanhas](docs/core/02-campaign-management.md)**
- 📖 **[Sistema de Personagens](docs/features/03-character-system.md)**
- 📖 **[Chat em Tempo Real](docs/features/04-chat-realtime.md)**
- 📖 **[Grid Tático](docs/features/05-tactical-grid.md)**
- 📖 **[Sistema de Handouts](docs/features/06-handouts-system.md)**
- 📖 **[Gerenciamento de Arquivos](docs/features/07-file-management.md)**
- 📖 **[Referência da API](docs/development/08-api-reference.md)**
- 📖 **[Setup e Deploy](docs/core/09-setup-deployment.md)**
- 📖 **[Roadmap](docs/development/10-development-roadmap.md)**

---

## 🏆 **Status do Projeto**

### **Versão Atual: v1.0**
- **Status**: ✅ **Production Ready**
- **Fases Concluídas**: 15/15 (100%)
- **Funcionalidades**: 100% implementadas
- **Estabilidade**: Sistema rock-solid
- **Performance**: Otimizado para produção

### **Próximas Versões**
- **v1.1**: Funcionalidades avançadas de combate
- **v1.2**: Sistema de macros e automação
- **v1.3**: Integração com APIs externas
- **v2.0**: Recursos de audio/vídeo

---

## 📄 **Licença**

Este projeto está licenciado sob a **MIT License**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🎯 **Conclusão**

O **MesaRPG** representa um Virtual Tabletop **completo e funcional** que oferece:

- ✅ **30+ APIs** totalmente implementadas
- ✅ **Interface moderna** com design responsivo
- ✅ **Sistema em tempo real** ultra-estável
- ✅ **Arquitetura escalável** bem estruturada
- ✅ **Código limpo** e bem documentado
- ✅ **Performance otimizada** para produção

**Pronto para uso em campanhas reais** com estabilidade e confiabilidade comprovadas!

---

*🎮 Desenvolvido com ❤️ para a comunidade RPG*  
*📅 Última atualização: 2025*  
*🔧 Status: COMPLETO E FUNCIONAL*