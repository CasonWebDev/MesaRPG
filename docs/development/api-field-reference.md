# 🔌 Referência de Campos das APIs

## 📋 Visão Geral

Este documento lista todos os campos utilizados nas APIs do MesaRPG, mostrando a correspondência entre os nomes dos campos nos requests/responses e os campos reais do banco de dados PostgreSQL.

## 🎯 Campos Corrigidos (system → rpgSystem)

### **⚠️ Campo Removido**
- **Campo**: `system` 
- **Status**: ❌ **REMOVIDO** do schema
- **Motivo**: Duplicação com `rpgSystem`
- **Migração**: Todos os usos foram convertidos para `rpgSystem`

### **✅ Campo Atual**
- **Campo**: `rpgSystem`
- **Tipo**: `string`
- **Default**: `"generic"`
- **PostgreSQL**: `rpg_system`
- **Uso**: Sistema RPG da campanha (ex: "dnd5e", "pathfinder")

## 🔧 APIs Corrigidas

### **1. Campaign Create API**
**Endpoint**: `POST /api/campaigns/create`

**Request Body**:
```json
{
  "name": "string",
  "description": "string?",
  "rpgSystem": "string"  // ✅ Corrigido: era "system"
}
```

**Response**:
```json
{
  "success": true,
  "campaign": {
    "id": "string",
    "name": "string",
    "description": "string?",
    "rpgSystem": "string",  // ✅ Corrigido: era "system"
    "createdAt": "DateTime"
  }
}
```

### **2. Campaign Update API**
**Endpoint**: `PUT /api/campaigns/[id]/update`

**Request Body**:
```json
{
  "name": "string",
  "description": "string?",
  "rpgSystem": "string",  // ✅ Corrigido: era "system"
  "playerLimit": "number?"
}
```

**Response**:
```json
{
  "message": "string",
  "campaign": {
    "id": "string",
    "name": "string",
    "description": "string?",
    "rpgSystem": "string",  // ✅ Corrigido: era "system"
    "playerLimit": "number?",
    "createdAt": "DateTime",
    "updatedAt": "DateTime",
    "owner": {
      "id": "string",
      "name": "string",
      "email": "string"
    }
  }
}
```

### **3. Dashboard API**
**Endpoint**: `GET /dashboard` (Server Component)

**Prisma Query**:
```typescript
// ✅ Corrigido: usa rpgSystem
const user = await prisma.user.findUnique({
  include: {
    ownedCampaigns: {
      select: {
        id: true,
        name: true,
        description: true,
        rpgSystem: true,  // ✅ Corrigido: era "system"
        createdAt: true,
      }
    },
    campaignMemberships: {
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            description: true,
            rpgSystem: true,  // ✅ Corrigido: era "system"
            createdAt: true,
          }
        }
      }
    }
  }
})
```

**Data Transformation**:
```typescript
// ✅ Corrigido: mapeia rpgSystem para system (interface)
const campaigns = [
  ...user.ownedCampaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    description: campaign.description || "Sem descrição",
    system: campaign.rpgSystem,  // ✅ Corrigido: era campaign.system
    userRole: "Mestre" as const
  })),
  ...user.campaignMemberships.map(membership => ({
    id: membership.campaign.id,
    name: membership.campaign.name,
    description: membership.campaign.description || "Sem descrição",
    system: membership.campaign.rpgSystem,  // ✅ Corrigido: era membership.campaign.system
    userRole: "Jogador" as const
  }))
]
```

### **4. Invite API**
**Endpoint**: `GET /api/invites/[token]`

**Prisma Query**:
```typescript
// ✅ Corrigido: usa rpgSystem
const invite = await prisma.campaignInvite.findUnique({
  where: { token },
  include: {
    campaign: {
      select: {
        id: true,
        name: true,
        description: true,
        rpgSystem: true  // ✅ Corrigido: era "system"
      }
    }
  }
})
```

**Response**:
```json
{
  "invite": {
    "id": "string",
    "token": "string",
    "campaign": {
      "id": "string",
      "name": "string",
      "description": "string?",
      "rpgSystem": "string"  // ✅ Corrigido: era "system"
    },
    "createdBy": { "name": "string" },
    "expiresAt": "DateTime?",
    "createdAt": "DateTime"
  }
}
```

### **5. Edit Campaign Dialog**
**Component**: `components/edit-campaign-dialog.tsx`

**Form Data**:
```typescript
// ✅ Corrigido: usa rpgSystem
const [formData, setFormData] = useState({
  name: campaign.name,
  description: campaign.description,
  rpgSystem: campaign.system,  // ✅ Corrigido: era "system: campaign.system"
})
```

**Form Field**:
```typescript
// ✅ Corrigido: usa rpgSystem
<Input
  value={formData.rpgSystem}  // ✅ Corrigido: era formData.system
  onChange={(e) => handleInputChange("rpgSystem", e.target.value)}  // ✅ Corrigido: era "system"
/>
```

**Validation**:
```typescript
// ✅ Corrigido: usa rpgSystem
disabled={isLoading || !formData.name.trim() || !formData.rpgSystem.trim()}  // ✅ Corrigido: era formData.system
```

## 📊 Todas as APIs por Endpoint

### **Campaign Management**
| Endpoint | Método | Campo Corrigido | Status |
|----------|---------|-----------------|--------|
| `/api/campaigns/create` | POST | `rpgSystem` | ✅ |
| `/api/campaigns/[id]/update` | PUT | `rpgSystem` | ✅ |
| `/api/campaigns/[id]` | GET | `rpgSystem` | ✅ |
| `/dashboard` | GET | `rpgSystem` | ✅ |

### **Invite System**
| Endpoint | Método | Campo Corrigido | Status |
|----------|---------|-----------------|--------|
| `/api/invites/[token]` | GET | `rpgSystem` | ✅ |
| `/api/invites/[token]` | POST | `rpgSystem` | ✅ |

### **Components**
| Componente | Campo Corrigido | Status |
|------------|-----------------|--------|
| `dashboard/page.tsx` | `rpgSystem` | ✅ |
| `edit-campaign-dialog.tsx` | `rpgSystem` | ✅ |
| `campaign-card.tsx` | Interface mantida | ✅ |

## 🔍 Outros Campos Importantes

### **User Fields**
```typescript
// Campos do usuário (sem mudanças)
{
  id: string,
  email: string,
  name: string?,
  role: "GM" | "PLAYER" | "ADMIN",
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### **Campaign Fields (Completo)**
```typescript
// Campos da campanha (com rpgSystem)
{
  id: string,
  name: string,
  description: string?,
  rpgSystem: string,      // ✅ Campo principal
  ownerId: string,
  isActive: boolean,
  playerLimit: number?,
  settings: string,       // JSON serializado
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### **Character Fields**
```typescript
// Campos do personagem (sem mudanças)
{
  id: string,
  campaignId: string,
  userId: string?,
  name: string,
  type: "PC" | "NPC" | "CREATURE",
  data: string,           // JSON da ficha
  tokenData: string,      // JSON do token
  templateId: string?,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### **Map Fields**
```typescript
// Campos do mapa (sem mudanças)
{
  id: string,
  campaignId: string,
  name: string,
  description: string?,
  imageUrl: string?,
  isActive: boolean,
  gridSize: number,
  settings: string,       // JSON config
  createdAt: DateTime,
  updatedAt: DateTime
}
```

## 🛠️ Debugging de Campos

### **Problemas Comuns**

1. **Campo 'system' não encontrado**
   ```
   Unknown field `system` for select statement
   ```
   **Solução**: Usar `rpgSystem` ao invés de `system`

2. **Validação de formulário**
   ```typescript
   // ❌ Errado
   !formData.system.trim()
   
   // ✅ Correto  
   !formData.rpgSystem.trim()
   ```

3. **Mapeamento de dados**
   ```typescript
   // ❌ Errado
   system: campaign.system
   
   // ✅ Correto
   system: campaign.rpgSystem
   ```

### **Validação de APIs**

**Teste de Criação**:
```bash
curl -X POST /api/campaigns/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Campaign",
    "description": "Test description",
    "rpgSystem": "dnd5e"
  }'
```

**Teste de Atualização**:
```bash
curl -X PUT /api/campaigns/[id]/update \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Campaign",
    "rpgSystem": "pathfinder"
  }'
```

## 📈 Impacto das Correções

### **Antes (Com Problema)**
```sql
-- ❌ Schema inconsistente
CREATE TABLE campaigns (
  system TEXT DEFAULT 'Generic',     -- Campo duplicado
  rpg_system TEXT DEFAULT 'generic'  -- Campo duplicado
);
```

```typescript
// ❌ API inconsistente
select: {
  system: true,     // Campo que não existe
  rpgSystem: true   // Campo real
}
```

### **Depois (Corrigido)**
```sql
-- ✅ Schema limpo
CREATE TABLE campaigns (
  rpg_system TEXT DEFAULT 'generic' NOT NULL  -- Campo único
);
```

```typescript
// ✅ API consistente
select: {
  rpgSystem: true   // Campo único e correto
}
```

### **Benefícios**
- **Consistency**: Schema único e consistente
- **Performance**: Menos campos desnecessários
- **Maintainability**: Mapeamento claro Prisma ↔ PostgreSQL
- **Type Safety**: Validação correta nos formulários
- **Deploy Ready**: Compatível com Railway PostgreSQL

---

*Documentação atualizada em: Julho 2025*  
*Versão: Pós-correção do campo system*  
*Próxima revisão: Após validação das APIs em produção*