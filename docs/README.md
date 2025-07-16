# MesaRPG - Documentação Completa

## 📖 Visão Geral

Bem-vindo à documentação completa do **MesaRPG**, uma plataforma funcional de Virtual Tabletop (VTT) para campanhas de RPG online. Esta documentação abrange todos os aspectos do sistema **ultra-básico e estável**, desde a configuração inicial até o grid tático com sistema de tokens simplificado.

## 🎯 O que é o MesaRPG?

O MesaRPG é um Virtual Tabletop **ultra-básico e estável** desenvolvido com tecnologias modernas, priorizando **simplicidade sobre complexidade**:

- **Grid Tático Básico** (800x600px fixo) com coordenadas pixel-based
- **Sistema de Tokens Ultra-Simples** com movimento livre para todos
- **Sincronização WebSocket** confiável sem conflitos
- **Chat Integrado** com comandos de dados funcionais
- **Gerenciamento Completo** de personagens, campanhas e conteúdo
- **Interface Simples** otimizada para estabilidade
- **Arquitetura Limpa** sem complexidade desnecessária

## 📚 Estrutura da Documentação

### 🔐 [01. Sistema de Autenticação](./01-authentication.md)
Implementação completa de autenticação com NextAuth.js, proteção de rotas, middleware e gerenciamento de sessões.

**Tópicos principais:**
- Configuração NextAuth.js
- Middleware de proteção
- Páginas de login/registro
- API de autenticação
- Hooks de sessão

### 🏛️ [02. Gerenciamento de Campanhas](./02-campaign-management.md)
Sistema completo para criação, configuração e administração de campanhas de RPG.

**Tópicos principais:**
- Dashboard dinâmico
- CRUD de campanhas
- Sistema de convites
- Gerenciamento de jogadores
- Configurações avançadas

### 👥 [03. Sistema de Personagens e Templates](./03-character-system.md)
Sistema avançado de personagens com templates dinâmicos, CRUD completo e interface diferenciada por role.

**Tópicos principais:**
- Tipos de personagens (PC, NPC, CREATURE)
- Templates dinâmicos de fichas
- Hook useCharacters
- Visualização de fichas
- Sistema de sidebar

### 💬 [04. Chat e Sistema em Tempo Real](./04-chat-realtime.md)
Implementação completa de chat em tempo real, WebSocket robusto e comandos de dados integrados.

**Tópicos principais:**
- Arquitetura WebSocket
- Sistema de comandos
- Engine de dados
- Hooks especializados
- Notificações em tempo real

### 🗺️ [05. Grid Tático e Sistema de Tokens](./05-tactical-grid.md)
Grid tático básico com sistema ultra-simples de tokens e movimento livre.

**Tópicos principais:**
- Frame fixo básico (800x600px)
- Sistema de coordenadas simples (pixels)
- Tokens com movimento livre
- Sincronização em tempo real
- Persistência garantida após refresh

### 📄 [06. Sistema de Handouts](./06-handouts-system.md)
Sistema completo de documentos e compartilhamento de conteúdo com controle granular de acesso.

**Tópicos principais:**
- Criação e edição de handouts
- Sistema de compartilhamento
- Suporte a anexos
- Notificações automáticas
- Hook useHandouts

### 📁 [07. Gerenciamento de Arquivos](./07-file-management.md)
Sistema avançado de upload, organização e gestão de assets digitais com suporte a múltiplos formatos.

**Tópicos principais:**
- Upload com drag & drop
- Categorização automática
- Preview de arquivos
- Integração com outras funcionalidades
- Validação de segurança

### 🔌 [08. Referência de APIs](./development/08-api-reference.md)
Documentação completa de todas as 30+ APIs REST implementadas no sistema.

**Tópicos principais:**
- APIs de autenticação
- APIs de campanhas
- APIs de personagens
- APIs de chat e mensagens
- APIs de mapas e handouts
- Exemplos de uso

### 🚀 [09. Configuração e Deploy](./core/09-setup-deployment.md)
Guia completo para configuração do ambiente de desenvolvimento, produção e deploy em diferentes plataformas.

**Tópicos principais:**
- Configuração do ambiente
- Variáveis de ambiente
- Deploy em Vercel/Railway/VPS
- Configuração de banco de dados
- Docker e Docker Compose

---

## 📋 Documentação de Melhorias - Julho 2025

### 🆕 [Resumo Executivo - Julho 2025](./executive-summary-july-2025.md)
Resumo completo de todas as melhorias implementadas durante a sessão de desenvolvimento de julho de 2025.

**Conteúdo:**
- Principais conquistas
- Métricas de impacto
- Valor entregue
- ROI das melhorias

### 🐛 [Correções de Bugs - Julho 2025](./core/bug-fixes-july-2025.md)
Documentação detalhada de todas as correções de bugs críticos implementadas.

**Bugs Resolvidos:**
- NaN Children Error (React)
- NextAuth CLIENT_FETCH_ERROR
- WebSocket "Not in this campaign"
- Level Display Width Issue
- Dice6 Import Error

### 🎨 [Melhorias de UX/UI - Julho 2025](./features/12-ux-improvements.md)
Documentação completa das melhorias de experiência do usuário implementadas.

**Melhorias Implementadas:**
- Sistema de rolagem contextual
- Interface de spell slots aprimorada
- Sistema de level up flexível
- Correções visuais diversas

### 🔧 [Melhorias Técnicas - Julho 2025](./development/technical-improvements-july-2025.md)
Documentação das melhorias técnicas e arquiteturais implementadas.

**Melhorias Técnicas:**
- Sistema de autenticação robusto
- WebSocket com auto-recovery
- Validação defensiva
- Build otimizado

### 📊 [Features Implementadas - Julho 2025](./features/11-recent-improvements.md)
Documentação detalhada de todas as features ajustadas e implementadas.

**Features Documentadas:**
- Sistema D&D 5e completo
- Sistema de spell slots automático
- Melhorias de interface
- Correções de estabilidade

## 🏗️ Arquitetura Técnica

### Stack Principal
```
Frontend:  Next.js 15 (App Router) + React 18
Backend:   API Routes + Custom Socket.IO Server
Database:  SQLite (dev) / PostgreSQL (prod) + Prisma ORM
Auth:      NextAuth.js com JWT
Real-time: Socket.IO com singleton pattern
UI:        TailwindCSS + shadcn/ui + Lucide Icons
Types:     TypeScript completo
```

### Funcionalidades Implementadas

#### ✅ **Sistema Completo (Production-Ready)**
- 🔐 Autenticação completa (login, registro, proteção de rotas)
- 🏠 Dashboard dinâmico (criação e listagem de campanhas)
- 🎮 Interface de jogo (roles GM/Jogador, sidebar unificada)
- 💬 Chat em tempo real (mensagens, comandos de dados, OOC)
- 👥 Sistema de personagens (criação, visualização, gerenciamento)
- 📋 Templates de fichas (campos dinâmicos, validação)
- 🎭 NPCs e Criaturas (listagem, criação, mini resumos)
- 👑 Visão do Mestre (fichas dos jogadores, gerenciamento completo)
- 🛡️ Visão do Jogador (sua ficha, criação de personagem)
- 📄 Sistema de Handouts (documentos, compartilhamento, anexos)
- 🗺️ Sistema de Mapas Avançado (upload, ativação em tempo real)

#### 🎯 **Grid Tático Ultra-Básico**
- **Frame Fixo**: 800x600px para simplicidade
- **Coordenadas Simples**: Sistema pixel-based direto
- **Movimento Livre**: Todos podem mover qualquer token
- **Zero Complexidade**: Sem ferramentas avançadas

#### 🎪 **Sistema de Tokens Ultra-Simples**
- Movimentação livre para todos os usuários
- Sincronização WebSocket confiável
- Coordenadas em pixels (top/left)
- Persistência automática no banco
- Tipos básicos (PC/NPC/CREATURE) com cores diferentes

#### 🌐 **WebSocket Robusto**
- Singleton pattern para conexão compartilhada
- Fallback HTTP para maior confiabilidade
- Auto-reconnection e error handling
- Events especializados para diferentes funcionalidades

## 📊 Status do Projeto

### **Progresso**: 10/13 fases concluídas (77%) + Simplificação Completa
- ✅ **Backend**: Sistema completo com 30+ APIs
- ✅ **Frontend**: Interface integrada e simplificada
- ✅ **Real-time**: Chat + WebSocket sem conflitos
- ✅ **Database**: Schema estável e limpo
- ✅ **Personagens**: Sistema completo CRUD + Templates
- ✅ **Handouts**: Sistema completo de documentos
- ✅ **Mapas**: Sistema básico com grid funcional
- ✅ **Arquivos**: Upload e gerenciamento completo
- ✅ **Configurações**: Interface completa de configuração
- ✅ **Limpeza**: Remoção de código complexo instável

### **🎯 Estado Funcional**: Production-Ready (Sistema Básico)

O projeto está **totalmente funcional** para uso em campanhas de RPG, oferecendo uma experiência **estável e confiável** baseada em simplicidade.

## 🚀 Quick Start

### Configuração Rápida
```bash
# Clone o repositório
git clone <repository-url>
cd mesarpg-shell-v1

# Instalar dependências
npm install --legacy-peer-deps

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas configurações

# Configurar banco de dados
npx prisma migrate dev

# Executar em desenvolvimento
npm run dev
```

### Variáveis Essenciais
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="seu-secret-aqui-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

O projeto estará disponível em `http://localhost:3000`

## 🔄 Fluxo Completo de Uso

### Para Game Masters (GMs)
1. **Registro/Login** → **Dashboard** → **Criar Campanha**
2. **Configurar Campanha** → **Criar Templates de Ficha** → **Convidar Jogadores**
3. **Upload de Mapas** → **Criar NPCs/Criaturas** → **Preparar Handouts**
4. **Ativar Mapa** → **Interface de Jogo** → **Grid Tático Básico**
5. **Mover Tokens Livremente** → **Chat em Tempo Real** + **Comandos de Dados**
6. **Gerenciar Estado do Jogo** com persistência automática

### Para Jogadores
1. **Aceitar Convite** → **Entrar na Campanha** → **Criar Personagem**
2. **Interface de Jogo** → **Visualizar Ficha** → **Mover Tokens Livremente**
3. **Chat com GM e Outros Jogadores** → **Interagir com Grid Básico** → **Visualizar Handouts**
4. **Receber Notificações** de mapas, handouts e sincronização de tokens

## 🛠️ Arquivos Importantes

### Configuração Principal
- `next.config.js` - Configuração do Next.js
- `tailwind.config.js` - Configuração do TailwindCSS
- `prisma/schema.prisma` - Schema do banco de dados
- `lib/auth.ts` - Configuração de autenticação
- `middleware.ts` - Middleware de proteção de rotas

### APIs Principais
- `app/api/auth/` - APIs de autenticação
- `app/api/campaigns/` - APIs de campanhas
- `app/api/upload/` - APIs de upload de arquivos
- `lib/socket-bridge.js` - Servidor WebSocket

### Componentes Principais
- `components/game/` - Interface principal do jogo
- `components/sidebar-content/` - Conteúdo da sidebar
- `components/file-manager/` - Gerenciador de arquivos
- `hooks/` - Hooks customizados React

## 🔍 Busca Rápida

### Por Funcionalidade
- **Autenticação**: [01-authentication.md](./01-authentication.md)
- **Campanhas**: [02-campaign-management.md](./02-campaign-management.md)
- **Personagens**: [03-character-system.md](./03-character-system.md)
- **Chat**: [04-chat-realtime.md](./04-chat-realtime.md)
- **Grid Tático**: [05-tactical-grid.md](./05-tactical-grid.md)
- **Handouts**: [06-handouts-system.md](./06-handouts-system.md)
- **Arquivos**: [07-file-management.md](./07-file-management.md)

### Por Tipo de Usuário
- **Desenvolvedores**: [08-api-reference.md](./08-api-reference.md) + [09-setup-deployment.md](./09-setup-deployment.md)
- **Game Masters**: [02-campaign-management.md](./02-campaign-management.md) + [05-tactical-grid.md](./05-tactical-grid.md)
- **Jogadores**: [03-character-system.md](./03-character-system.md) + [04-chat-realtime.md](./04-chat-realtime.md)
- **Administradores**: [09-setup-deployment.md](./09-setup-deployment.md)

## 📞 Suporte e Contribuição

### Reportar Problemas
- Abra uma issue no repositório
- Inclua logs relevantes
- Descreva steps para reproduzir

### Contribuir
1. Fork do repositório
2. Criar branch feature
3. Implementar changes
4. Testes locais
5. Pull request

### Recursos Adicionais
- **Discord**: Comunidade de desenvolvedores
- **Wiki**: Exemplos e tutoriais
- **API Docs**: Documentação interativa

## 🏆 Conclusão

O **MesaRPG** representa um Virtual Tabletop **básico e extremamente estável** que prioriza funcionalidade sobre complexidade. Com **30+ APIs**, **grid tático simples**, **sistema de tokens ultra-básico** e **arquitetura limpa**, oferece uma experiência **confiável** para campanhas de RPG online.

### **🎯 Filosofia: Menos é Mais**
- **Grid Tático**: Básico e funcional sem bugs
- **Sistema de Tokens**: Ultra-simples com movimento livre
- **WebSocket**: Singleton robusto sem conflitos
- **Coordenadas**: Sistema pixel-based direto e previsível
- **Performance**: Excelente através de simplicidade
- **UX/UI**: Interface limpa focada em estabilidade

### **🏆 Lições Aprendidas (Julho 2025)**
**Simplicidade bem executada supera complexidade instável.** O sistema atual demonstra que features básicas que sempre funcionam são superiores a sistemas avançados instáveis.

Esta documentação foi **atualizada em Julho 2025** após a grande simplificação do projeto. Para a versão mais atual, consulte sempre este repositório.

---

**MesaRPG** - *RPG online simples, estável e funcional*