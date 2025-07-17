# 🔌 Referência Completa de APIs

## 📋 Visão Geral

O MesaRPG implementa uma API RESTful completa com 30+ endpoints, seguindo padrões modernos de desenvolvimento, autenticação JWT, validação robusta e tratamento de erros. Esta documentação fornece uma referência completa para todos os endpoints disponíveis.

## 🔐 Autenticação

### **Método de Autenticação**
- **Tipo**: JWT via NextAuth.js
- **Header**: `Authorization: Bearer {token}`
- **Duração**: 30 dias
- **Renovação**: Automática

### **Estrutura de Resposta**
```typescript
interface APIResponse<T> {
  success?: boolean
  data?: T
  error?: string
  details?: any
}
```

## 🚀 Endpoints de Autenticação

### **POST /api/auth/register**
Registra um novo usuário no sistema.

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "clr123456",
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "PLAYER"
  }
}
```

**Validações:**
- Nome: 2-50 caracteres
- Email: formato válido
- Senha: 6-100 caracteres
- Email único

### **POST /api/auth/[...nextauth]**
Endpoints do NextAuth.js para login/logout.

**Login Request:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Login Response:**
```json
{
  "user": {
    "id": "clr123456",
    "name": "João Silva",
    "email": "joao@email.com",
    "role": "PLAYER"
  },
  "expires": "2025-02-15T10:00:00.000Z"
}
```

## 🏛️ Endpoints de Campanhas

### **GET /api/campaigns**
Lista todas as campanhas do usuário autenticado.

**Response (200):**
```json
{
  "campaigns": [
    {
      "id": "clr789012",
      "name": "A Ameaça do Dragão",
      "description": "Campanha épica de D&D 5e",
      "rpgSystem": "dnd5e",
      "userRole": "GM",
      "createdAt": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

### **POST /api/campaigns/create**
Cria uma nova campanha.

**Request Body:**
```json
{
  "name": "Nova Campanha",
  "description": "Descrição da campanha",
  "rpgSystem": "dnd5e"
}
```

**Response (201):**
```json
{
  "success": true,
  "campaign": {
    "id": "clr789012",
    "name": "Nova Campanha",
    "description": "Descrição da campanha",
    "rpgSystem": "dnd5e",
    "createdAt": "2025-01-01T10:00:00.000Z"
  }
}
```

### **GET /api/campaigns/[id]**
Obtém detalhes de uma campanha específica.

**Response (200):**
```json
{
  "campaign": {
    "id": "clr789012",
    "name": "A Ameaça do Dragão",
    "description": "Campanha épica de D&D 5e",
    "rpgSystem": "dnd5e",
    "ownerId": "clr123456",
    "isActive": true,
    "playerLimit": 8,
    "createdAt": "2025-01-01T10:00:00.000Z",
    "owner": {
      "id": "clr123456",
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "members": [
      {
        "id": "clr234567",
        "user": {
          "id": "clr345678",
          "name": "Maria Santos",
          "email": "maria@email.com"
        },
        "role": "PLAYER",
        "joinedAt": "2025-01-02T10:00:00.000Z"
      }
    ]
  }
}
```

### **PUT /api/campaigns/[id]**
Atualiza uma campanha (apenas GM).

**Request Body:**
```json
{
  "name": "Nome Atualizado",
  "description": "Nova descrição",
  "rpgSystem": "pathfinder",
  "playerLimit": 6
}
```

**Response (200):**
```json
{
  "message": "Campanha atualizada com sucesso",
  "campaign": {
    "id": "clr789012",
    "name": "Nome Atualizado",
    "description": "Nova descrição",
    "rpgSystem": "pathfinder",
    "playerLimit": 6,
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### **DELETE /api/campaigns/[id]**
Remove uma campanha (apenas GM).

**Response (200):**
```json
{
  "message": "Campanha removida com sucesso"
}
```

## 👥 Endpoints de Personagens

### **GET /api/campaigns/[id]/characters**
Lista personagens de uma campanha com filtros.

**Query Parameters:**
- `type`: "PC" | "NPC" | "CREATURE"
- `userId`: ID do usuário
- `search`: Texto para busca

**Example:** `GET /api/campaigns/clr789012/characters?type=PC&search=Aragorn`

**Response (200):**
```json
{
  "characters": [
    {
      "id": "clr456789",
      "name": "Aragorn",
      "type": "PC",
      "data": "{\"level\":5,\"class\":\"Ranger\"}",
      "userId": "clr345678",
      "templateId": "clr567890",
      "createdAt": "2025-01-03T10:00:00.000Z",
      "user": {
        "id": "clr345678",
        "name": "Maria Santos"
      },
      "template": {
        "id": "clr567890",
        "name": "D&D 5e PC"
      }
    }
  ]
}
```

### **POST /api/campaigns/[id]/characters**
Cria um novo personagem.

**Request Body:**
```json
{
  "name": "Legolas",
  "type": "PC",
  "userId": "clr345678",
  "templateId": "clr567890",
  "data": {
    "level": 1,
    "class": "Ranger",
    "race": "Elf"
  }
}
```

**Response (201):**
```json
{
  "character": {
    "id": "clr456789",
    "name": "Legolas",
    "type": "PC",
    "data": "{\"level\":1,\"class\":\"Ranger\",\"race\":\"Elf\"}",
    "userId": "clr345678",
    "templateId": "clr567890",
    "createdAt": "2025-01-03T10:00:00.000Z",
    "user": {
      "id": "clr345678",
      "name": "Maria Santos"
    },
    "template": {
      "id": "clr567890",
      "name": "D&D 5e PC"
    }
  }
}
```

### **GET /api/campaigns/[id]/characters/[characterId]**
Obtém um personagem específico.

**Response (200):**
```json
{
  "character": {
    "id": "clr456789",
    "name": "Aragorn",
    "type": "PC",
    "data": "{\"level\":5,\"class\":\"Ranger\"}",
    "userId": "clr345678",
    "templateId": "clr567890",
    "createdAt": "2025-01-03T10:00:00.000Z",
    "user": {
      "id": "clr345678",
      "name": "Maria Santos"
    },
    "template": {
      "id": "clr567890",
      "name": "D&D 5e PC"
    }
  }
}
```

### **PUT /api/campaigns/[id]/characters/[characterId]**
Atualiza um personagem.

**Request Body:**
```json
{
  "name": "Aragorn, Rei de Gondor",
  "data": {
    "level": 6,
    "class": "Ranger",
    "hitPoints": 48
  }
}
```

### **DELETE /api/campaigns/[id]/characters/[characterId]**
Remove um personagem.

**Response (200):**
```json
{
  "message": "Personagem removido com sucesso"
}
```

### **POST /api/campaigns/[id]/characters/[characterId]/transfer**
Transfere um personagem para outro jogador (apenas GM).

**Request Body:**
```json
{
  "newUserId": "clr234567"
}
```

**Response (200):**
```json
{
  "character": {
    "id": "clr456789",
    "name": "Aragorn",
    "userId": "clr234567",
    "user": {
      "id": "clr234567",
      "name": "Pedro Costa"
    }
  }
}
```

## 💬 Endpoints de Chat

### **GET /api/campaigns/[id]/messages**
Obtém histórico de mensagens de chat.

**Query Parameters:**
- `limit`: Número máximo de mensagens (default: 50)
- `offset`: Offset para paginação (default: 0)

**Response (200):**
```json
{
  "messages": [
    {
      "id": "clr890123",
      "message": "Olá, pessoal!",
      "type": "CHAT",
      "metadata": "{}",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "user": {
        "id": "clr123456",
        "name": "João Silva"
      }
    },
    {
      "id": "clr890124",
      "message": "🎲 **Ataque**: 15 + 3 = **18**",
      "type": "DICE_ROLL",
      "metadata": "{\"roll\":15,\"modifier\":3}",
      "createdAt": "2025-01-15T10:01:00.000Z",
      "user": {
        "id": "clr345678",
        "name": "Maria Santos"
      }
    }
  ]
}
```

### **POST /api/campaigns/[id]/messages**
Envia uma mensagem de chat.

**Request Body:**
```json
{
  "message": "Vamos iniciar a aventura!",
  "type": "CHAT",
  "metadata": {}
}
```

**Response (201):**
```json
{
  "message": {
    "id": "clr890125",
    "message": "Vamos iniciar a aventura!",
    "type": "CHAT",
    "metadata": "{}",
    "createdAt": "2025-01-15T10:02:00.000Z",
    "user": {
      "id": "clr123456",
      "name": "João Silva"
    }
  }
}
```

## 🗺️ Endpoints de Mapas

### **GET /api/campaigns/[id]/maps**
Lista todos os mapas de uma campanha.

**Response (200):**
```json
{
  "maps": [
    {
      "id": "clr567890",
      "name": "Taverna do Javali",
      "description": "Taverna inicial",
      "imageUrl": "/uploads/taverna.jpg",
      "isActive": true,
      "gridSize": 20,
      "createdAt": "2025-01-05T10:00:00.000Z"
    }
  ]
}
```

### **POST /api/campaigns/[id]/maps**
Cria um novo mapa.

**Request Body:**
```json
{
  "name": "Floresta Sombria",
  "description": "Floresta perigosa",
  "imageUrl": "/uploads/floresta.jpg",
  "gridSize": 25
}
```

**Response (201):**
```json
{
  "map": {
    "id": "clr567891",
    "name": "Floresta Sombria",
    "description": "Floresta perigosa",
    "imageUrl": "/uploads/floresta.jpg",
    "isActive": false,
    "gridSize": 25,
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### **PUT /api/campaigns/[id]/maps/[mapId]**
Atualiza um mapa.

**Request Body:**
```json
{
  "name": "Floresta Sombria Atualizada",
  "description": "Nova descrição",
  "gridSize": 30
}
```

### **DELETE /api/campaigns/[id]/maps/[mapId]**
Remove um mapa.

**Response (200):**
```json
{
  "message": "Mapa removido com sucesso"
}
```

### **POST /api/campaigns/[id]/maps/[mapId]/activate**
Ativa um mapa (apenas GM).

**Response (200):**
```json
{
  "message": "Mapa ativado com sucesso",
  "map": {
    "id": "clr567891",
    "name": "Floresta Sombria",
    "isActive": true
  }
}
```

## 📄 Endpoints de Handouts

### **GET /api/campaigns/[id]/handouts**
Lista handouts de uma campanha.

**Query Parameters:**
- `shared`: "true" | "false" - Filtrar por compartilhamento

**Response (200):**
```json
{
  "handouts": [
    {
      "id": "clr678901",
      "name": "Regras da Casa",
      "content": "Regras específicas desta campanha...",
      "sharedWith": "[\"clr345678\"]",
      "createdAt": "2025-01-10T10:00:00.000Z"
    }
  ]
}
```

### **POST /api/campaigns/[id]/handouts**
Cria um novo handout.

**Request Body:**
```json
{
  "name": "Informações da Cidade",
  "content": "A cidade de Pedravale é conhecida por...",
  "attachments": []
}
```

**Response (201):**
```json
{
  "handout": {
    "id": "clr678902",
    "name": "Informações da Cidade",
    "content": "A cidade de Pedravale é conhecida por...",
    "sharedWith": "[]",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### **POST /api/campaigns/[id]/handouts/[handoutId]/share**
Compartilha um handout com jogadores.

**Request Body:**
```json
{
  "playerIds": ["clr345678", "clr234567"]
}
```

**Response (200):**
```json
{
  "message": "Handout compartilhado com sucesso",
  "handout": {
    "id": "clr678902",
    "name": "Informações da Cidade",
    "sharedWith": "[\"clr345678\",\"clr234567\"]"
  }
}
```

## 🎮 Endpoints de Estado do Jogo

### **GET /api/campaigns/[id]/game-state**
Obtém o estado atual do jogo.

**Response (200):**
```json
{
  "gameState": {
    "id": "clr789012",
    "campaignId": "clr456789",
    "activeMapId": "clr567890",
    "tokens": "[{\"id\":\"token1\",\"x\":100,\"y\":150}]",
    "gameData": "{}",
    "mapFrozen": false,
    "lastActivity": "2025-01-15T10:00:00.000Z"
  }
}
```

### **POST /api/campaigns/[id]/game-state**
Atualiza o estado do jogo.

**Request Body:**
```json
{
  "tokens": [
    {
      "id": "token1",
      "x": 120,
      "y": 160,
      "name": "Aragorn"
    }
  ],
  "gameData": {
    "initiative": ["clr456789", "clr345678"]
  }
}
```

## 🔒 Endpoints de Controle de Mapa

### **GET /api/campaigns/[id]/freeze-map**
Obtém o estado de congelamento do mapa.

**Response (200):**
```json
{
  "mapFrozen": false,
  "frozenBy": null,
  "frozenByName": null,
  "frozenAt": null
}
```

### **POST /api/campaigns/[id]/freeze-map**
Congela ou descongela o mapa (apenas GM).

**Request Body:**
```json
{
  "frozen": true
}
```

**Response (200):**
```json
{
  "success": true,
  "mapFrozen": true,
  "frozenBy": "clr123456",
  "frozenByName": "João Silva",
  "frozenAt": "2025-01-15T10:00:00.000Z"
}
```

## 🎯 Endpoints de Tokens

### **GET /api/campaigns/[id]/tokens**
Lista tokens de uma campanha.

**Response (200):**
```json
{
  "tokens": [
    {
      "id": "clr890123",
      "name": "Aragorn",
      "x": 100,
      "y": 150,
      "imageUrl": "/uploads/aragorn.jpg",
      "size": 1,
      "visible": true,
      "characterId": "clr456789"
    }
  ]
}
```

### **POST /api/campaigns/[id]/tokens**
Cria um novo token.

**Request Body:**
```json
{
  "name": "Goblin",
  "x": 200,
  "y": 250,
  "imageUrl": "/uploads/goblin.jpg",
  "characterId": "clr567890"
}
```

## 📤 Endpoints de Upload

### **POST /api/upload**
Faz upload de arquivos.

**Request:** `multipart/form-data`
- `file`: Arquivo a ser enviado
- `category`: "map" | "token" | "avatar" | "handout" | "misc"
- `campaignId`: ID da campanha

**Response (200):**
```json
{
  "file": {
    "id": "clr901234",
    "name": "map_001.jpg",
    "originalName": "taverna.jpg",
    "url": "/uploads/clr901234_map_001.jpg",
    "type": "image/jpeg",
    "size": 1024000,
    "category": "map"
  }
}
```

## 🎫 Endpoints de Convites

### **POST /api/campaigns/[id]/create-invite**
Cria um convite para a campanha (apenas GM).

**Request Body:**
```json
{
  "email": "novo@email.com"
}
```

**Response (201):**
```json
{
  "invite": {
    "id": "clr012345",
    "token": "abc123def456",
    "email": "novo@email.com",
    "expiresAt": "2025-01-16T10:00:00.000Z",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### **GET /api/invites/[token]**
Valida um convite.

**Response (200):**
```json
{
  "invite": {
    "id": "clr012345",
    "token": "abc123def456",
    "campaign": {
      "id": "clr789012",
      "name": "A Ameaça do Dragão",
      "description": "Campanha épica de D&D 5e",
      "rpgSystem": "dnd5e"
    },
    "createdBy": {
      "name": "João Silva"
    },
    "expiresAt": "2025-01-16T10:00:00.000Z"
  }
}
```

### **POST /api/invites/[token]**
Aceita um convite.

**Response (200):**
```json
{
  "success": true,
  "campaign": {
    "id": "clr789012",
    "name": "A Ameaça do Dragão"
  },
  "membership": {
    "id": "clr123456",
    "role": "Jogador"
  }
}
```

## ⚠️ Códigos de Erro

### **HTTP Status Codes**
- `200`: OK - Operação bem-sucedida
- `201`: Created - Recurso criado com sucesso
- `400`: Bad Request - Dados inválidos
- `401`: Unauthorized - Não autenticado
- `403`: Forbidden - Não autorizado
- `404`: Not Found - Recurso não encontrado
- `409`: Conflict - Conflito (ex: email já existe)
- `500`: Internal Server Error - Erro interno

### **Estrutura de Erro**
```json
{
  "error": "Mensagem de erro",
  "details": {
    "field": "Detalhes específicos do erro"
  }
}
```

## 🔄 Rate Limiting

### **Limites Atuais**
- **Registros**: 5 por hora por IP
- **Login**: 10 tentativas por hora por IP
- **Upload**: 100 MB por arquivo
- **Mensagens**: 60 por minuto por usuário

### **Headers de Rate Limiting**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1642608000
```

## 🧪 Testes de API

### **Exemplos com curl**
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@email.com","password":"senha123"}'

# Criar campanha
curl -X POST http://localhost:3000/api/campaigns/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Campaign","rpgSystem":"dnd5e"}'

# Listar personagens
curl -X GET http://localhost:3000/api/campaigns/CAMPAIGN_ID/characters \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Conclusão

A API do MesaRPG é **completa, bem estruturada e production-ready**, oferecendo:

- ✅ **30+ endpoints** RESTful
- ✅ **Autenticação segura** com JWT
- ✅ **Validação robusta** com Zod
- ✅ **Documentação completa** com exemplos
- ✅ **Tratamento de erros** consistente
- ✅ **Performance otimizada** com rate limiting
- ✅ **Testabilidade** com exemplos práticos

**Status**: API completa e pronta para integração com clientes web e mobile.

---

*Documentação atualizada em: Janeiro 2025*  
*Versão da API: 1.0.0*  
*Próxima revisão: Implementação de versionamento*