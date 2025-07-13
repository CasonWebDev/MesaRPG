# Deploy do MesaRPG no Railway - Documentação Completa

## 📋 Visão Geral

Este documento registra todo o processo de deploy do MesaRPG no Railway, incluindo problemas encontrados, soluções aplicadas e configurações finais.

## 🎯 Resultado Final

- **Aplicação Online**: https://mesarpg-production-f45e.up.railway.app
- **Status**: ✅ Funcionando completamente
- **Banco**: PostgreSQL no Railway
- **Sistema**: Docker + Node.js 18

## 📝 Processo de Deploy - Passo a Passo

### 1. Preparação do Projeto

#### 1.1 Arquivos Criados/Modificados
```bash
# Arquivos de configuração Railway
railway.json              # Configurações do Railway
.env.example              # Template de variáveis
nixpacks.toml             # Configuração Nixpacks (não funcionou)
Dockerfile                # Configuração Docker final
scripts/start.sh          # Script de inicialização (removido depois)
scripts/setup-production.sh  # Script auxiliar
scripts/reset-migrations.sh  # Script para reset de migrações

# Migrações
prisma/migrations/0_init/migration.sql  # Migração inicial PostgreSQL
```

#### 1.2 Alterações no Código
- **package.json**: Scripts de produção adicionados
- **prisma/schema.prisma**: Mudança de SQLite para PostgreSQL
- **Componentes**: Correção de cores (text-foreground bg-background)
- **Imagens**: Troca de placeholder.svg para placeholder.png

### 2. Setup Railway CLI

```bash
# 1. Instalação
npm install -g @railway/cli

# 2. Login
railway login

# 3. Inicialização do projeto
railway init  # Nome: MesaRPG

# 4. Adicionar PostgreSQL
railway add  # Database > PostgreSQL
```

### 3. Configuração de Variáveis

```bash
# Conectar ao serviço
railway service  # Escolher MesaRPG

# Configurar variáveis
railway variables --set "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
railway variables --set "NODE_ENV=production"
railway variables --set "NEXTAUTH_URL=https://mesarpg-production-f45e.up.railway.app"

# Conectar banco (via interface Railway)
# MesaRPG > Variables > Add Reference > Postgres > DATABASE_URL
```

### 4. Problemas Encontrados e Soluções

#### 4.1 Problema: Nixpacks não respeitava --legacy-peer-deps
**Erro**: `npm ci` falhava por conflitos de peer dependencies

**Soluções testadas**:
- ❌ nixpacks.toml
- ❌ railway.json buildCommand
- ❌ Remoção do package-lock.json

**Solução final**: Dockerfile customizado

#### 4.2 Problema: Migrações não executavam
**Erro**: Tabelas não existiam no PostgreSQL

**Soluções testadas**:
- ❌ prisma migrate deploy no Dockerfile
- ❌ prisma db push no start script
- ❌ railway run prisma migrate deploy

**Solução final**: SQL manual via railway connect postgres

#### 4.3 Problema: Dockerfile executava comandos destrutivos
**Erro**: `prisma db push --force-reset` quebrava o banco a cada deploy

**Sintomas**:
- PostgreSQL ficava inacessível
- Interface Railway não conectava
- Aplicação com erros P1001

**Solução**: Remoção dos comandos perigosos do Dockerfile

### 5. Configuração Final do Dockerfile

```dockerfile
# Use Node.js 18
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Copy prisma schema first
COPY prisma ./prisma

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application normally (SEM comandos Prisma!)
CMD ["npm", "start"]
```

### 6. Criação Manual das Tabelas

#### 6.1 Conexão ao PostgreSQL
```bash
# Conectar ao banco
railway service  # Escolher Postgres
railway connect postgres

# No psql, executar SQL completo
\i migration.sql  # ou colar SQL diretamente
```

#### 6.2 Schema PostgreSQL Completo
```sql
-- Enums
CREATE TYPE "Role" AS ENUM ('GM', 'PLAYER', 'ADMIN');
CREATE TYPE "FileCategory" AS ENUM ('MAP', 'TOKEN', 'AVATAR', 'HANDOUT', 'MISC');
CREATE TYPE "CharacterType" AS ENUM ('PC', 'NPC', 'CREATURE');
CREATE TYPE "MessageType" AS ENUM ('CHAT', 'DICE_ROLL', 'SYSTEM', 'OOC');
CREATE TYPE "TokenType" AS ENUM ('PC', 'NPC', 'CREATURE', 'CUSTOM');

-- Tabelas principais
users, campaigns, campaign_members, maps, characters, 
chat_messages, handouts, game_states, sheet_templates, 
files, campaign_invites, tokens

-- Índices e relacionamentos
[Ver arquivo migration.sql completo]
```

## 🔧 Comandos Essenciais Railway

### Comandos Básicos
```bash
# Status do projeto
railway status

# Logs em tempo real
railway logs --follow

# Listar serviços
railway service

# Conectar a serviço específico
railway service  # Escolher da lista

# Criar domínio
railway domain create

# Ver variáveis
railway variables

# Fazer deploy
railway up
```

### Comandos de Banco
```bash
# Conectar ao PostgreSQL
railway service  # Escolher Postgres
railway connect postgres

# Adicionar novo banco
railway add  # Database > PostgreSQL
```

## ⚠️ Problemas Críticos Identificados

### 1. Comandos Destrutivos no Docker
**NUNCA usar no Dockerfile de produção**:
```bash
prisma db push --force-reset --accept-data-loss  # PERIGOSO!
prisma migrate reset                             # PERIGOSO!
```

### 2. Múltiplos PostgreSQL
- Railway pode criar múltiplas instâncias
- Verificar sempre qual banco tem as tabelas
- Remover instâncias órfãs

### 3. URLs e Dominios
- PostgreSQL tem URL própria (não usar para aplicação)
- MesaRPG tem URL própria para acesso
- Verificar sempre `railway domain` no serviço correto

## 📊 Variáveis de Ambiente Finais

```env
# Essenciais para funcionamento
DATABASE_URL=postgresql://postgres:password@postgres.railway.internal:5432/railway
NEXTAUTH_SECRET=RXJfAC5P6PgjMHY9EdzTyCm5ocdC1pbI157nRSVfq+I=
NEXTAUTH_URL=https://mesarpg-production-f45e.up.railway.app
NODE_ENV=production

# Automáticas do Railway
RAILWAY_ENVIRONMENT=production
RAILWAY_PROJECT_ID=4cce4449-7709-42fb-951a-24a39963466d
RAILWAY_SERVICE_NAME=MesaRPG
RAILWAY_PUBLIC_DOMAIN=mesarpg-production-f45e.up.railway.app
```

## 🎮 Funcionalidades Testadas e Funcionando

### ✅ Autenticação
- [x] Registro de usuários
- [x] Login/logout
- [x] Proteção de rotas
- [x] Redirecionamentos

### ✅ Interface
- [x] Páginas de login/register com background correto
- [x] Modal de criar campanha com texto visível
- [x] Dashboard responsivo
- [x] Navegação fluida

### ✅ Backend
- [x] APIs de campanhas
- [x] APIs de personagens  
- [x] APIs de chat
- [x] APIs de mapas/tokens
- [x] Sistema de arquivos
- [x] WebSocket funcionando

## 🚀 Deploy Workflow Final

### Para deploy seguro:
1. **Fazer alterações no código**
2. **Commit e push** (se usando git)
3. **railway up** (deploy manual)
4. **Verificar logs**: `railway logs`
5. **Testar aplicação**

### Para mudanças no banco:
1. **SEMPRE conectar manualmente**: `railway connect postgres`
2. **Executar SQL específico** (não automático)
3. **Verificar dados**: consultas SQL
4. **Nunca usar** comandos destrutivos no Docker

## 💰 Custos Railway

- **Hobby Plan**: $5/mês
  - Inclui PostgreSQL
  - Adequado para projetos pequenos/médios
- **Pro Plan**: $20/mês  
  - Mais recursos e performance

## 🔮 Próximos Passos

### Melhorias Recomendadas
1. **Integração Git** para deploy automático
2. **Backup automático** do PostgreSQL
3. **Monitoring** com health checks
4. **CDN** para assets estáticos
5. **Redis** para sessões (se necessário)

### Considerações de Produção
- Configurar **domínio customizado**
- Implementar **SSL certificates**
- Adicionar **rate limiting**
- Configurar **alertas de erro**
- Planejar **estratégia de backup**

## 📚 Referências

- [Railway Documentation](https://docs.railway.com/)
- [Railway CLI Reference](https://docs.railway.com/reference/cli-api)
- [PostgreSQL no Railway](https://docs.railway.com/guides/database-view)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Railway Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway)

---

## 🎯 Conclusão

O deploy foi **bem-sucedido** após superar desafios técnicos importantes:

1. **Configuração correta** do ambiente Railway
2. **Resolução de conflitos** de dependências via Docker
3. **Setup manual** do PostgreSQL para máxima segurança
4. **Eliminação de comandos destrutivos** que causavam instabilidade

O **MesaRPG está online, estável e totalmente funcional** no Railway! 🎉

**URL Final**: https://mesarpg-production-f45e.up.railway.app