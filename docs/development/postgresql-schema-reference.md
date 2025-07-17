# 🗄️ Referência Completa do Schema PostgreSQL

## 📋 Visão Geral

Este documento apresenta a estrutura completa do banco de dados PostgreSQL do MesaRPG, incluindo todas as tabelas, relacionamentos, índices e constraints. O schema foi otimizado para compatibilidade com Railway e performance em produção.

## 🏗️ Arquitetura do Banco de Dados

### **Convenções de Nomenclatura**
- **Tabelas**: `snake_case` (ex: `campaign_members`)
- **Colunas**: `snake_case` (ex: `created_at`, `owner_id`)
- **Prisma Models**: `camelCase` (ex: `createdAt`, `ownerId`)
- **Mapeamento**: `@map()` para conversão automática

### **Padrões de Design**
- **Primary Keys**: `TEXT` com `cuid()` para IDs únicos
- **Timestamps**: `TIMESTAMP(3)` com timezone
- **Foreign Keys**: Com `CASCADE` ou `SET NULL` apropriados
- **Enums**: PostgreSQL nativos para type safety
- **Indexes**: Otimizados para queries frequentes

## 📊 Estrutura Completa das Tabelas

### **1. Users (Usuários)**
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT NOT NULL,
    role "Role" DEFAULT 'PLAYER' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `email`: string (unique)
- `name`: string (optional)
- `password`: string
- `role`: Role enum (default: PLAYER)
- `createdAt`: DateTime (auto)
- `updatedAt`: DateTime (auto)

**Relacionamentos:**
- `ownedCampaigns`: Campaign[] (1:N)
- `campaignMemberships`: CampaignMember[] (1:N)
- `characters`: Character[] (1:N)
- `chatMessages`: ChatMessage[] (1:N)
- `uploadedFiles`: File[] (1:N)
- `createdInvites`: CampaignInvite[] (1:N)
- `usedInvites`: CampaignInvite[] (1:N)
- `ownedTokens`: Token[] (1:N)
- `createdTokens`: Token[] (1:N)

### **2. Campaigns (Campanhas)**
```sql
CREATE TABLE campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    rpg_system TEXT DEFAULT 'generic' NOT NULL,
    owner_id TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    player_limit INTEGER DEFAULT 8,
    settings TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `name`: string
- `description`: string (optional)
- `rpgSystem`: string (default: "generic") → `rpg_system`
- `ownerId`: string → `owner_id`
- `isActive`: boolean (default: true) → `is_active`
- `playerLimit`: int (default: 8) → `player_limit`
- `settings`: string (default: "{}")
- `createdAt`: DateTime (auto) → `created_at`
- `updatedAt`: DateTime (auto) → `updated_at`

**Relacionamentos:**
- `owner`: User (N:1)
- `members`: CampaignMember[] (1:N)
- `maps`: Map[] (1:N)
- `characters`: Character[] (1:N)
- `chatMessages`: ChatMessage[] (1:N)
- `handouts`: Handout[] (1:N)
- `gameState`: GameState (1:1)
- `sheetTemplates`: SheetTemplate[] (1:N)
- `files`: File[] (1:N)
- `invites`: CampaignInvite[] (1:N)
- `tokens`: Token[] (1:N)

### **3. Campaign Members (Membros da Campanha)**
```sql
CREATE TABLE campaign_members (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role "Role" DEFAULT 'PLAYER' NOT NULL,
    joined_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, user_id)
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `campaignId`: string → `campaign_id`
- `userId`: string → `user_id`
- `role`: Role enum (default: PLAYER)
- `joinedAt`: DateTime (auto) → `joined_at`

**Relacionamentos:**
- `campaign`: Campaign (N:1)
- `user`: User (N:1)

### **4. Characters (Personagens)**
```sql
CREATE TABLE characters (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    user_id TEXT,
    name TEXT NOT NULL,
    type "CharacterType" NOT NULL,
    data TEXT DEFAULT '{}' NOT NULL,
    token_data TEXT DEFAULT '{}' NOT NULL,
    template_id TEXT,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES sheet_templates(id) ON DELETE SET NULL
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `campaignId`: string → `campaign_id`
- `userId`: string (optional) → `user_id`
- `name`: string
- `type`: CharacterType enum
- `data`: string (default: "{}")
- `tokenData`: string (default: "{}") → `token_data`
- `templateId`: string (optional) → `template_id`
- `createdAt`: DateTime (auto) → `created_at`
- `updatedAt`: DateTime (auto) → `updated_at`

**Relacionamentos:**
- `campaign`: Campaign (N:1)
- `user`: User (N:1, optional)
- `template`: SheetTemplate (N:1, optional)
- `tokens`: Token[] (1:N)

### **5. Chat Messages (Mensagens de Chat)**
```sql
CREATE TABLE chat_messages (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    type "MessageType" DEFAULT 'CHAT' NOT NULL,
    metadata TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `campaignId`: string → `campaign_id`
- `userId`: string → `user_id`
- `message`: string
- `type`: MessageType enum (default: CHAT)
- `metadata`: string (default: "{}")
- `createdAt`: DateTime (auto) → `created_at`

**Relacionamentos:**
- `campaign`: Campaign (N:1)
- `user`: User (N:1)

### **6. Maps (Mapas)**
```sql
CREATE TABLE maps (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT false NOT NULL,
    grid_size INTEGER DEFAULT 20 NOT NULL,
    settings TEXT DEFAULT '{}' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `campaignId`: string → `campaign_id`
- `name`: string
- `description`: string (optional)
- `imageUrl`: string (optional) → `image_url`
- `isActive`: boolean (default: false) → `is_active`
- `gridSize`: int (default: 20) → `grid_size`
- `settings`: string (default: "{}")
- `createdAt`: DateTime (auto) → `created_at`
- `updatedAt`: DateTime (auto) → `updated_at`

**Relacionamentos:**
- `campaign`: Campaign (N:1)

### **7. Handouts (Documentos)**
```sql
CREATE TABLE handouts (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT DEFAULT '[]' NOT NULL,
    shared_with TEXT DEFAULT '[]' NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `campaignId`: string → `campaign_id`
- `name`: string
- `content`: string
- `attachments`: string (default: "[]")
- `sharedWith`: string (default: "[]") → `shared_with`
- `createdAt`: DateTime (auto) → `created_at`
- `updatedAt`: DateTime (auto) → `updated_at`

**Relacionamentos:**
- `campaign`: Campaign (N:1)

### **8. Game States (Estado do Jogo)**
```sql
CREATE TABLE game_states (
    id TEXT PRIMARY KEY,
    campaign_id TEXT UNIQUE NOT NULL,
    active_map_id TEXT,
    tokens TEXT DEFAULT '[]' NOT NULL,
    game_data TEXT DEFAULT '{}' NOT NULL,
    grid_config TEXT DEFAULT '{}' NOT NULL,
    fog_areas TEXT DEFAULT '[]' NOT NULL,
    map_frozen BOOLEAN DEFAULT false NOT NULL,
    frozen_by TEXT,
    frozen_at TIMESTAMP(3),
    last_activity TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `campaignId`: string (unique) → `campaign_id`
- `activeMapId`: string (optional) → `active_map_id`
- `tokens`: string (default: "[]")
- `gameData`: string (default: "{}") → `game_data`
- `gridConfig`: string (default: "{}") → `grid_config`
- `fogAreas`: string (default: "[]") → `fog_areas`
- `mapFrozen`: boolean (default: false) → `map_frozen`
- `frozenBy`: string (optional) → `frozen_by`
- `frozenAt`: DateTime (optional) → `frozen_at`
- `lastActivity`: DateTime (auto) → `last_activity`
- `updatedAt`: DateTime (auto) → `updated_at`

**Relacionamentos:**
- `campaign`: Campaign (1:1)

### **9. Sheet Templates (Templates de Fichas)**
```sql
CREATE TABLE sheet_templates (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type "CharacterType" NOT NULL,
    fields TEXT DEFAULT '[]' NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `campaignId`: string → `campaign_id`
- `name`: string
- `type`: CharacterType enum
- `fields`: string (default: "[]")
- `isDefault`: boolean (default: false) → `is_default`
- `createdAt`: DateTime (auto) → `created_at`
- `updatedAt`: DateTime (auto) → `updated_at`

**Relacionamentos:**
- `campaign`: Campaign (N:1)
- `characters`: Character[] (1:N)

### **10. Files (Arquivos)**
```sql
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER NOT NULL,
    category "FileCategory" DEFAULT 'MISC' NOT NULL,
    uploaded_by_id TEXT NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `campaignId`: string → `campaign_id`
- `name`: string
- `originalName`: string → `original_name`
- `url`: string
- `type`: string
- `size`: int
- `category`: FileCategory enum (default: MISC)
- `uploadedById`: string → `uploaded_by_id`
- `createdAt`: DateTime (auto) → `created_at`
- `updatedAt`: DateTime (auto) → `updated_at`

**Relacionamentos:**
- `campaign`: Campaign (N:1)
- `uploadedBy`: User (N:1)

### **11. Campaign Invites (Convites)**
```sql
CREATE TABLE campaign_invites (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    email TEXT,
    created_by_id TEXT NOT NULL,
    used_by_id TEXT,
    expires_at TIMESTAMP(3),
    used_at TIMESTAMP(3),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by_id) REFERENCES users(id) ON DELETE SET NULL
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `campaignId`: string → `campaign_id`
- `token`: string (unique)
- `email`: string (optional)
- `createdById`: string → `created_by_id`
- `usedById`: string (optional) → `used_by_id`
- `expiresAt`: DateTime (optional) → `expires_at`
- `usedAt`: DateTime (optional) → `used_at`
- `createdAt`: DateTime (auto) → `created_at`

**Relacionamentos:**
- `campaign`: Campaign (N:1)
- `createdBy`: User (N:1)
- `usedBy`: User (N:1, optional)

### **12. Tokens (Tokens do Grid)**
```sql
CREATE TABLE tokens (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    name TEXT NOT NULL,
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    image_url TEXT,
    size DOUBLE PRECISION DEFAULT 1 NOT NULL,
    rotation DOUBLE PRECISION DEFAULT 0 NOT NULL,
    visible BOOLEAN DEFAULT true NOT NULL,
    character_id TEXT,
    owner_id TEXT NOT NULL,
    type "TokenType" DEFAULT 'CUSTOM' NOT NULL,
    auto_created BOOLEAN DEFAULT false NOT NULL,
    sync_avatar BOOLEAN DEFAULT false NOT NULL,
    border_color TEXT DEFAULT '#6b7280' NOT NULL,
    show_name BOOLEAN DEFAULT true NOT NULL,
    show_health_bar BOOLEAN DEFAULT false NOT NULL,
    conditions TEXT DEFAULT '[]' NOT NULL,
    can_player_move BOOLEAN,
    locked BOOLEAN DEFAULT false NOT NULL,
    hidden BOOLEAN DEFAULT false NOT NULL,
    ownership_type TEXT DEFAULT 'manual' NOT NULL,
    last_sync_at TIMESTAMP(3),
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP(3) NOT NULL,
    created_by TEXT NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);
```

**Campos Prisma:**
- `id`: string (cuid)
- `campaignId`: string → `campaign_id`
- `name`: string
- `x`: float (posição X)
- `y`: float (posição Y)
- `imageUrl`: string (optional) → `image_url`
- `size`: float (default: 1)
- `rotation`: float (default: 0)
- `visible`: boolean (default: true)
- `characterId`: string (optional) → `character_id`
- `ownerId`: string → `owner_id`
- `type`: TokenType enum (default: CUSTOM)
- `autoCreated`: boolean (default: false) → `auto_created`
- `syncAvatar`: boolean (default: false) → `sync_avatar`
- `borderColor`: string (default: "#6b7280") → `border_color`
- `showName`: boolean (default: true) → `show_name`
- `showHealthBar`: boolean (default: false) → `show_health_bar`
- `conditions`: string (default: "[]")
- `canPlayerMove`: boolean (optional) → `can_player_move`
- `locked`: boolean (default: false)
- `hidden`: boolean (default: false)
- `ownershipType`: string (default: "manual") → `ownership_type`
- `lastSyncAt`: DateTime (optional) → `last_sync_at`
- `createdAt`: DateTime (auto) → `created_at`
- `updatedAt`: DateTime (auto) → `updated_at`
- `createdBy`: string → `created_by`

**Relacionamentos:**
- `campaign`: Campaign (N:1)
- `character`: Character (N:1, optional)
- `owner`: User (N:1)
- `creator`: User (N:1)

## 🔧 Enums PostgreSQL

### **Role (Papel do Usuário)**
```sql
CREATE TYPE "Role" AS ENUM ('GM', 'PLAYER', 'ADMIN');
```

### **FileCategory (Categoria de Arquivo)**
```sql
CREATE TYPE "FileCategory" AS ENUM ('MAP', 'TOKEN', 'AVATAR', 'HANDOUT', 'MISC');
```

### **CharacterType (Tipo de Personagem)**
```sql
CREATE TYPE "CharacterType" AS ENUM ('PC', 'NPC', 'CREATURE');
```

### **MessageType (Tipo de Mensagem)**
```sql
CREATE TYPE "MessageType" AS ENUM ('CHAT', 'DICE_ROLL', 'SYSTEM', 'OOC');
```

### **TokenType (Tipo de Token)**
```sql
CREATE TYPE "TokenType" AS ENUM ('PC', 'NPC', 'CREATURE', 'CUSTOM');
```

## 📊 Índices de Performance

### **Índices Primários**
```sql
-- Campanhas por owner
CREATE INDEX idx_campaigns_owner_id ON campaigns(owner_id);

-- Membros por campanha e usuário
CREATE INDEX idx_campaign_members_campaign_id ON campaign_members(campaign_id);
CREATE INDEX idx_campaign_members_user_id ON campaign_members(user_id);

-- Personagens por campanha
CREATE INDEX idx_characters_campaign_id ON characters(campaign_id);
CREATE INDEX idx_characters_user_id ON characters(user_id);

-- Mensagens por campanha e tempo
CREATE INDEX idx_chat_messages_campaign_id ON chat_messages(campaign_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Tokens por campanha
CREATE INDEX idx_tokens_campaign_id ON tokens(campaign_id);
CREATE INDEX idx_tokens_character_id ON tokens(character_id);

-- Handouts por campanha
CREATE INDEX idx_handouts_campaign_id ON handouts(campaign_id);

-- Mapas por campanha
CREATE INDEX idx_maps_campaign_id ON maps(campaign_id);

-- Arquivos por campanha
CREATE INDEX idx_files_campaign_id ON files(campaign_id);

-- Convites por campanha e token
CREATE INDEX idx_campaign_invites_campaign_id ON campaign_invites(campaign_id);
CREATE INDEX idx_campaign_invites_token ON campaign_invites(token);
```

## 🔄 Triggers Automáticos

### **Updated At Trigger**
```sql
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas com updated_at
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_campaigns BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
-- ... demais tabelas
```

## 🎯 Relacionamentos Principais

### **Hierarquia de Dados**
```
User (1:N) → Campaign (Owner)
Campaign (1:N) → CampaignMember (Players)
Campaign (1:N) → Character
Campaign (1:N) → Map
Campaign (1:N) → ChatMessage
Campaign (1:N) → Handout
Campaign (1:1) → GameState
Campaign (1:N) → Token
Character (1:N) → Token
```

### **Fluxo de Criação**
1. **User** cria **Campaign** (owner)
2. **Campaign** gera **CampaignInvite** (tokens)
3. **Users** aceitam convites → **CampaignMember**
4. **Campaign** contém **Characters**, **Maps**, **Handouts**
5. **Characters** podem ter **Tokens** no grid
6. **ChatMessages** são organizadas por **Campaign**

## 🛡️ Constraints e Validações

### **Constraints Únicas**
- `users.email`: Email único por usuário
- `campaign_members(campaign_id, user_id)`: Não duplicar membros
- `campaign_invites.token`: Token único por convite
- `game_states.campaign_id`: Um estado por campanha

### **Cascade Behaviors**
- **ON DELETE CASCADE**: Campanhas deletam todos os dados relacionados
- **ON DELETE SET NULL**: Personagens mantêm dados mesmo se usuário for deletado
- **FK Constraints**: Mantém integridade referencial

## 📈 Métricas de Performance

### **Estimativas de Crescimento**
- **Campanhas**: ~100-1000 por instância
- **Usuários**: ~1000-10000 por instância
- **Mensagens**: ~100k-1M por campanha ativa
- **Tokens**: ~50-200 por campanha
- **Personagens**: ~10-50 por campanha

### **Optimizações Implementadas**
- Índices em foreign keys críticas
- Particionamento por campanha implícito
- Triggers automáticos para timestamps
- Enums para type safety e performance

---

*Documentação atualizada em: Julho 2025*  
*Versão: PostgreSQL 15+ compatível*  
*Próxima revisão: Após deploy em produção*