# 🔗 Mapeamento Prisma ↔ PostgreSQL

## 📋 Visão Geral

Este documento apresenta o mapeamento completo entre os modelos Prisma (camelCase) e as tabelas PostgreSQL (snake_case), facilitando a compreensão da estrutura do banco de dados e debugging de queries.

## 🏗️ Convenções de Mapeamento

### **Padrão de Nomenclatura**
```prisma
// Prisma Model (camelCase)
model Campaign {
  createdAt DateTime @default(now()) @map("created_at")
  ownerId   String   @map("owner_id")
  isActive  Boolean  @default(true) @map("is_active")
}
```

```sql
-- PostgreSQL Table (snake_case)
CREATE TABLE campaigns (
  created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  owner_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true
);
```

## 🗂️ Mapeamento Detalhado por Modelo

### **1. User → users**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(PLAYER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  @@map("users")
}
```

| Campo Prisma | Campo PostgreSQL | Tipo PostgreSQL | Observações |
|-------------|------------------|-----------------|-------------|
| `id` | `id` | `TEXT PRIMARY KEY` | Auto-generated cuid |
| `email` | `email` | `TEXT UNIQUE` | Unique constraint |
| `name` | `name` | `TEXT` | Opcional |
| `password` | `password` | `TEXT` | Hash bcrypt |
| `role` | `role` | `"Role"` | Enum: GM, PLAYER, ADMIN |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | Auto timestamp |
| `updatedAt` | `updated_at` | `TIMESTAMP(3)` | Auto update |

### **2. Campaign → campaigns**
```prisma
model Campaign {
  id          String   @id @default(cuid())
  name        String
  description String?
  rpgSystem   String   @default("generic") @map("rpg_system")
  ownerId     String   @map("owner_id")
  isActive    Boolean  @default(true) @map("is_active")
  playerLimit Int?     @default(8) @map("player_limit")
  settings    String   @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@map("campaigns")
}
```

| Campo Prisma | Campo PostgreSQL | Tipo PostgreSQL | Observações |
|-------------|------------------|-----------------|-------------|
| `id` | `id` | `TEXT PRIMARY KEY` | Auto-generated cuid |
| `name` | `name` | `TEXT` | Nome da campanha |
| `description` | `description` | `TEXT` | Opcional |
| `rpgSystem` | `rpg_system` | `TEXT` | Sistema RPG (default: "generic") |
| `ownerId` | `owner_id` | `TEXT` | FK para users.id |
| `isActive` | `is_active` | `BOOLEAN` | Default: true |
| `playerLimit` | `player_limit` | `INTEGER` | Default: 8 |
| `settings` | `settings` | `TEXT` | JSON serializado |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | Auto timestamp |
| `updatedAt` | `updated_at` | `TIMESTAMP(3)` | Auto update |

### **3. CampaignMember → campaign_members**
```prisma
model CampaignMember {
  id         String   @id @default(cuid())
  campaignId String   @map("campaign_id")
  userId     String   @map("user_id")
  role       Role     @default(PLAYER)
  joinedAt   DateTime @default(now()) @map("joined_at")
  @@unique([campaignId, userId])
  @@map("campaign_members")
}
```

| Campo Prisma | Campo PostgreSQL | Tipo PostgreSQL | Observações |
|-------------|------------------|-----------------|-------------|
| `id` | `id` | `TEXT PRIMARY KEY` | Auto-generated cuid |
| `campaignId` | `campaign_id` | `TEXT` | FK para campaigns.id |
| `userId` | `user_id` | `TEXT` | FK para users.id |
| `role` | `role` | `"Role"` | Default: PLAYER |
| `joinedAt` | `joined_at` | `TIMESTAMP(3)` | Auto timestamp |

### **4. Character → characters**
```prisma
model Character {
  id         String        @id @default(cuid())
  campaignId String        @map("campaign_id")
  userId     String?       @map("user_id")
  name       String
  type       CharacterType
  data       String        @default("{}")
  tokenData  String        @default("{}") @map("token_data")
  templateId String?       @map("template_id")
  createdAt  DateTime      @default(now()) @map("created_at")
  updatedAt  DateTime      @updatedAt @map("updated_at")
  @@map("characters")
}
```

| Campo Prisma | Campo PostgreSQL | Tipo PostgreSQL | Observações |
|-------------|------------------|-----------------|-------------|
| `id` | `id` | `TEXT PRIMARY KEY` | Auto-generated cuid |
| `campaignId` | `campaign_id` | `TEXT` | FK para campaigns.id |
| `userId` | `user_id` | `TEXT` | FK para users.id (opcional) |
| `name` | `name` | `TEXT` | Nome do personagem |
| `type` | `type` | `"CharacterType"` | Enum: PC, NPC, CREATURE |
| `data` | `data` | `TEXT` | JSON com dados da ficha |
| `tokenData` | `token_data` | `TEXT` | JSON com dados do token |
| `templateId` | `template_id` | `TEXT` | FK para sheet_templates.id |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | Auto timestamp |
| `updatedAt` | `updated_at` | `TIMESTAMP(3)` | Auto update |

### **5. ChatMessage → chat_messages**
```prisma
model ChatMessage {
  id         String      @id @default(cuid())
  campaignId String      @map("campaign_id")
  userId     String      @map("user_id")
  message    String
  type       MessageType @default(CHAT)
  metadata   String      @default("{}")
  createdAt  DateTime    @default(now()) @map("created_at")
  @@map("chat_messages")
}
```

| Campo Prisma | Campo PostgreSQL | Tipo PostgreSQL | Observações |
|-------------|------------------|-----------------|-------------|
| `id` | `id` | `TEXT PRIMARY KEY` | Auto-generated cuid |
| `campaignId` | `campaign_id` | `TEXT` | FK para campaigns.id |
| `userId` | `user_id` | `TEXT` | FK para users.id |
| `message` | `message` | `TEXT` | Conteúdo da mensagem |
| `type` | `type` | `"MessageType"` | Enum: CHAT, DICE_ROLL, SYSTEM, OOC |
| `metadata` | `metadata` | `TEXT` | JSON com metadados |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | Auto timestamp |

### **6. Map → maps**
```prisma
model Map {
  id          String   @id @default(cuid())
  campaignId  String   @map("campaign_id")
  name        String
  description String?
  imageUrl    String?  @map("image_url")
  isActive    Boolean  @default(false) @map("is_active")
  gridSize    Int      @default(20) @map("grid_size")
  settings    String   @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  @@map("maps")
}
```

| Campo Prisma | Campo PostgreSQL | Tipo PostgreSQL | Observações |
|-------------|------------------|-----------------|-------------|
| `id` | `id` | `TEXT PRIMARY KEY` | Auto-generated cuid |
| `campaignId` | `campaign_id` | `TEXT` | FK para campaigns.id |
| `name` | `name` | `TEXT` | Nome do mapa |
| `description` | `description` | `TEXT` | Opcional |
| `imageUrl` | `image_url` | `TEXT` | URL da imagem |
| `isActive` | `is_active` | `BOOLEAN` | Default: false |
| `gridSize` | `grid_size` | `INTEGER` | Default: 20 |
| `settings` | `settings` | `TEXT` | JSON config |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | Auto timestamp |
| `updatedAt` | `updated_at` | `TIMESTAMP(3)` | Auto update |

### **7. Token → tokens**
```prisma
model Token {
  id           String     @id @default(cuid())
  campaignId   String     @map("campaign_id")
  name         String
  x            Float
  y            Float
  imageUrl     String?    @map("image_url")
  size         Float      @default(1)
  rotation     Float      @default(0)
  visible      Boolean    @default(true)
  characterId  String?    @map("character_id")
  ownerId      String     @map("owner_id")
  type         TokenType  @default(CUSTOM)
  autoCreated  Boolean    @default(false) @map("auto_created")
  syncAvatar   Boolean    @default(false) @map("sync_avatar")
  borderColor  String     @default("#6b7280") @map("border_color")
  showName     Boolean    @default(true) @map("show_name")
  showHealthBar Boolean   @default(false) @map("show_health_bar")
  conditions   String     @default("[]")
  canPlayerMove Boolean?  @map("can_player_move")
  locked       Boolean    @default(false)
  hidden       Boolean    @default(false)
  ownershipType String    @default("manual") @map("ownership_type")
  lastSyncAt   DateTime?  @map("last_sync_at")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")
  createdBy    String     @map("created_by")
  @@map("tokens")
}
```

| Campo Prisma | Campo PostgreSQL | Tipo PostgreSQL | Observações |
|-------------|------------------|-----------------|-------------|
| `id` | `id` | `TEXT PRIMARY KEY` | Auto-generated cuid |
| `campaignId` | `campaign_id` | `TEXT` | FK para campaigns.id |
| `name` | `name` | `TEXT` | Nome do token |
| `x` | `x` | `DOUBLE PRECISION` | Coordenada X |
| `y` | `y` | `DOUBLE PRECISION` | Coordenada Y |
| `imageUrl` | `image_url` | `TEXT` | URL da imagem |
| `size` | `size` | `DOUBLE PRECISION` | Tamanho (default: 1) |
| `rotation` | `rotation` | `DOUBLE PRECISION` | Rotação (default: 0) |
| `visible` | `visible` | `BOOLEAN` | Visibilidade |
| `characterId` | `character_id` | `TEXT` | FK para characters.id |
| `ownerId` | `owner_id` | `TEXT` | FK para users.id |
| `type` | `type` | `"TokenType"` | Enum: PC, NPC, CREATURE, CUSTOM |
| `autoCreated` | `auto_created` | `BOOLEAN` | Token criado automaticamente |
| `syncAvatar` | `sync_avatar` | `BOOLEAN` | Sincronizar avatar |
| `borderColor` | `border_color` | `TEXT` | Cor da borda |
| `showName` | `show_name` | `BOOLEAN` | Mostrar nome |
| `showHealthBar` | `show_health_bar` | `BOOLEAN` | Mostrar barra de vida |
| `conditions` | `conditions` | `TEXT` | JSON com condições |
| `canPlayerMove` | `can_player_move` | `BOOLEAN` | Jogador pode mover |
| `locked` | `locked` | `BOOLEAN` | Token travado |
| `hidden` | `hidden` | `BOOLEAN` | Token oculto |
| `ownershipType` | `ownership_type` | `TEXT` | Tipo de posse |
| `lastSyncAt` | `last_sync_at` | `TIMESTAMP(3)` | Última sincronização |
| `createdAt` | `created_at` | `TIMESTAMP(3)` | Auto timestamp |
| `updatedAt` | `updated_at` | `TIMESTAMP(3)` | Auto update |
| `createdBy` | `created_by` | `TEXT` | FK para users.id |

### **8. Demais Modelos**

**Handout → handouts**
- `sharedWith` → `shared_with`
- Demais campos seguem padrão

**GameState → game_states**
- `activeMapId` → `active_map_id`
- `gameData` → `game_data`
- `gridConfig` → `grid_config`
- `fogAreas` → `fog_areas`
- `mapFrozen` → `map_frozen`
- `frozenBy` → `frozen_by`
- `frozenAt` → `frozen_at`
- `lastActivity` → `last_activity`

**SheetTemplate → sheet_templates**
- `isDefault` → `is_default`
- Demais campos seguem padrão

**File → files**
- `originalName` → `original_name`
- `uploadedById` → `uploaded_by_id`

**CampaignInvite → campaign_invites**
- `createdById` → `created_by_id`
- `usedById` → `used_by_id`
- `expiresAt` → `expires_at`
- `usedAt` → `used_at`

## 🎯 Queries Úteis

### **Verificar Estrutura da Tabela**
```sql
-- Ver todas as colunas de uma tabela
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;
```

### **Verificar Foreign Keys**
```sql
-- Ver todas as foreign keys
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### **Verificar Enums**
```sql
-- Ver todos os enums
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
ORDER BY t.typname, e.enumsortorder;
```

## 🔧 Debugging Guide

### **Problemas Comuns**

1. **Campo não encontrado**
   ```
   Unknown field `system` for select statement
   ```
   **Solução**: Verificar se o campo foi mapeado corretamente. Use `rpgSystem` ao invés de `system`.

2. **Tipo incompatível**
   ```
   Type mismatch: expected String, got Number
   ```
   **Solução**: Verificar se o tipo Prisma corresponde ao PostgreSQL.

3. **Constraint violation**
   ```
   Foreign key constraint fails
   ```
   **Solução**: Verificar se o ID referenciado existe na tabela pai.

### **Validação de Schema**
```bash
# Gerar cliente Prisma
npx prisma generate

# Aplicar migrações
npx prisma migrate deploy

# Verificar conexão
npx prisma db pull
```

## 📊 Resumo de Mapeamentos

| Padrão Prisma | Padrão PostgreSQL | Exemplo |
|---------------|-------------------|---------|
| `camelCase` | `snake_case` | `createdAt` → `created_at` |
| `Model` | `table` | `Campaign` → `campaigns` |
| `relation` | `foreign_key` | `ownerId` → `owner_id` |
| `enum` | `"EnumType"` | `Role` → `"Role"` |
| `DateTime` | `TIMESTAMP(3)` | `createdAt` → `created_at` |
| `String` | `TEXT` | `name` → `name` |
| `Int` | `INTEGER` | `playerLimit` → `player_limit` |
| `Boolean` | `BOOLEAN` | `isActive` → `is_active` |
| `Float` | `DOUBLE PRECISION` | `x` → `x` |

---

*Documentação atualizada em: Julho 2025*  
*Versão: Prisma 6.x + PostgreSQL 15+*  
*Próxima revisão: Após validação em produção*