# Referência Completa de APIs

## Visão Geral

O MesaRPG possui mais de 30 APIs REST implementadas, oferecendo funcionalidades completas para autenticação, gerenciamento de campanhas, personagens, chat, mapas, handouts e muito mais. Todas as APIs seguem padrões REST e retornam JSON.

## Autenticação

Todas as APIs (exceto registro e login) requerem autenticação via NextAuth.js. O token JWT é gerenciado automaticamente pelos cookies de sessão.

### Headers Obrigatórios
```typescript
{
  'Content-Type': 'application/json',
  'Cookie': 'next-auth.session-token=...' // Automático via NextAuth
}
```

## APIs de Autenticação

### POST /api/auth/register
Registra um novo usuário no sistema.

**Request Body:**
```typescript
{
  name: string     // Nome completo (obrigatório)
  email: string    // Email único (obrigatório)
  password: string // Senha (min 6 caracteres)
}
```

**Response (201):**
```typescript
{
  success: boolean
  message: string
  user: {
    id: string
    name: string
    email: string
  }
}
```

**Errors:**
- `400` - Dados inválidos ou email já cadastrado
- `500` - Erro interno do servidor

### NextAuth Endpoints
- `GET/POST /api/auth/[...nextauth]` - Gerenciado pelo NextAuth.js
- `GET /api/auth/session` - Obter sessão atual
- `POST /api/auth/signout` - Logout

## APIs de Campanhas

### GET /api/campaigns
Lista campanhas do usuário (próprias e participações).

**Query Parameters:**
```typescript
{
  page?: number      // Página (padrão: 1)
  limit?: number     // Itens por página (padrão: 20)
  search?: string    // Busca por nome
}
```

**Response (200):**
```typescript
{
  ownedCampaigns: Campaign[]      // Campanhas que o usuário criou
  memberCampaigns: Campaign[]     // Campanhas que participa
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
```

### POST /api/campaigns/create
Cria uma nova campanha.

**Request Body:**
```typescript
{
  name: string        // Nome da campanha (obrigatório)
  description?: string // Descrição opcional
  system: string      // Sistema de RPG (D&D 5e, Pathfinder, etc.)
}
```

**Response (201):**
```typescript
{
  id: string
  name: string
  description: string | null
  system: string
  ownerId: string
  createdAt: string
  updatedAt: string
}
```

### GET /api/campaigns/[id]
Obtém detalhes de uma campanha específica.

**Path Parameters:**
- `id` - ID da campanha

**Response (200):**
```typescript
{
  id: string
  name: string
  description: string | null
  system: string
  ownerId: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string
  }
  members: Array<{
    id: string
    role: string
    user: {
      id: string
      name: string
    }
  }>
  _count: {
    characters: number
    maps: number
    handouts: number
  }
}
```

### PUT /api/campaigns/[id]
Atualiza uma campanha (apenas owner).

**Request Body:**
```typescript
{
  name?: string
  description?: string
  system?: string
}
```

**Response (200):** Campaign object atualizado

### DELETE /api/campaigns/[id]
Exclui uma campanha (apenas owner).

**Response (200):**
```typescript
{
  success: boolean
}
```

## APIs de Personagens

### GET /api/campaigns/[id]/characters
Lista personagens da campanha com filtros avançados.

**Query Parameters:**
```typescript
{
  type?: 'PC' | 'NPC' | 'CREATURE'  // Filtro por tipo
  creator?: 'GM' | 'PLAYER'         // Filtro por criador
  search?: string                   // Busca por nome
  page?: number                     // Paginação
  limit?: number                    // Itens por página
}
```

**Response (200):**
```typescript
{
  characters: Array<{
    id: string
    name: string
    type: 'PC' | 'NPC' | 'CREATURE'
    avatar: string | null
    data: object                    // Dados dinâmicos da ficha
    createdAt: string
    updatedAt: string
    createdBy: {
      id: string
      name: string
    }
  }>
  pagination: PaginationInfo
}
```

### POST /api/campaigns/[id]/characters
Cria um novo personagem.

**Request Body:**
```typescript
{
  name: string                      // Nome do personagem
  type: 'PC' | 'NPC' | 'CREATURE' // Tipo (obrigatório)
  avatar?: string                   // URL do avatar
  data?: object                     // Dados da ficha
}
```

**Response (201):** Character object criado

### GET /api/campaigns/[id]/characters/[characterId]
Obtém detalhes de um personagem específico.

**Response (200):** Character object completo

### PUT /api/campaigns/[id]/characters/[characterId]
Atualiza um personagem (owner ou criador).

**Request Body:**
```typescript
{
  name?: string
  avatar?: string
  data?: object
}
```

**Response (200):** Character object atualizado

### DELETE /api/campaigns/[id]/characters/[characterId]
Exclui um personagem (owner ou criador).

**Response (200):**
```typescript
{
  success: boolean
}
```

## APIs de Templates de Fichas

### GET /api/campaigns/[id]/sheet-templates
Lista templates de fichas da campanha.

**Response (200):**
```typescript
{
  templates: Array<{
    id: string
    name: string
    type: 'PC' | 'NPC' | 'CREATURE'
    fields: object                  // Definição dos campos
    isDefault: boolean
    createdAt: string
  }>
}
```

### POST /api/campaigns/[id]/sheet-templates
Cria ou atualiza templates (apenas GM).

**Request Body:**
```typescript
{
  name: string
  type: 'PC' | 'NPC' | 'CREATURE'
  fields: object                    // Estrutura dos campos
  isDefault?: boolean               // Definir como padrão
}
```

### GET /api/campaigns/[id]/templates
Alias para sheet-templates com validação.

### POST /api/campaigns/[id]/templates
Alias para criação de templates.

### GET /api/campaigns/[id]/templates/[templateId]
Obtém template específico.

### PUT /api/campaigns/[id]/templates/[templateId]
Atualiza template específico.

### DELETE /api/campaigns/[id]/templates/[templateId]
Exclui template específico.

## APIs de Chat e Mensagens

### GET /api/campaigns/[id]/messages
Carrega histórico de mensagens do chat.

**Query Parameters:**
```typescript
{
  page?: number      // Página (padrão: 1)
  limit?: number     // Mensagens por página (padrão: 50)
  before?: string    // Carregar mensagens antes desta data
}
```

**Response (200):**
```typescript
{
  messages: Array<{
    id: string
    content: string
    type: 'message' | 'roll' | 'ooc'
    createdAt: string
    user: {
      id: string
      name: string
    }
  }>
  hasMore: boolean
}
```

### POST /api/campaigns/[id]/messages
Envia uma nova mensagem.

**Request Body:**
```typescript
{
  content: string                   // Conteúdo da mensagem
  type?: 'message' | 'roll' | 'ooc' // Tipo (padrão: message)
}
```

**Response (201):** Message object criado

**Comandos Especiais:**
- `/r [expressão]` - Rola dados (ex: `/r 1d20+5`)
- `/ooc [mensagem]` - Mensagem Out of Character

## APIs de Mapas

### GET /api/campaigns/[id]/maps
Lista mapas da campanha.

**Query Parameters:**
```typescript
{
  active?: boolean   // Filtrar apenas mapas ativos
  search?: string    // Busca por nome
}
```

**Response (200):**
```typescript
{
  maps: Array<{
    id: string
    name: string
    imageUrl: string
    isActive: boolean
    gridConfig: {
      size: number
      visible: boolean
      snap: boolean
    }
    createdAt: string
    updatedAt: string
  }>
}
```

### POST /api/campaigns/[id]/maps
Cria um novo mapa (apenas GM).

**Request Body:**
```typescript
{
  name: string          // Nome do mapa
  imageUrl: string      // URL da imagem
  gridConfig?: {
    size?: number       // Tamanho do grid em pixels
    visible?: boolean   // Grid visível
    snap?: boolean      // Snap de tokens
  }
}
```

**Response (201):** Map object criado

### PUT /api/campaigns/[id]/maps/[mapId]
Atualiza um mapa.

**Request Body:**
```typescript
{
  name?: string
  imageUrl?: string
  gridConfig?: object
}
```

### DELETE /api/campaigns/[id]/maps/[mapId]
Exclui um mapa.

### POST /api/campaigns/[id]/maps/[mapId]/activate
Ativa um mapa (apenas GM).

**Response (200):**
```typescript
{
  success: boolean
  activeMap: Map
}
```

## APIs de Handouts

### GET /api/campaigns/[id]/handouts
Lista handouts da campanha.

**Query Parameters:**
```typescript
{
  category?: string     // Filtro por categoria
  shared?: boolean      // Filtrar por status de compartilhamento
  search?: string       // Busca por título/conteúdo
}
```

**Response (200):**
```typescript
{
  handouts: Array<{
    id: string
    title: string
    content: string
    category: string | null
    tags: string[]
    attachments: object[]
    isShared: boolean
    createdAt: string
    updatedAt: string
    createdBy: {
      id: string
      name: string
    }
    _count: {
      viewedBy: number
      sharedWith: number
    }
    viewedBy: Array<{ viewedAt: string }> // Para o usuário atual
  }>
}
```

### POST /api/campaigns/[id]/handouts
Cria um novo handout (apenas GM).

**Request Body:**
```typescript
{
  title: string         // Título do handout
  content: string       // Conteúdo em Markdown
  category?: string     // Categoria opcional
  tags?: string[]       // Tags opcionais
  attachments?: Array<{
    filename: string
    url: string
    size: number
    type: string
  }>
  isShared?: boolean    // Compartilhar com todos
}
```

### PUT /api/campaigns/[id]/handouts/[handoutId]
Atualiza um handout.

### DELETE /api/campaigns/[id]/handouts/[handoutId]
Exclui um handout.

### POST /api/campaigns/[id]/handouts/[handoutId]/share
Compartilha handout com jogadores.

**Request Body:**
```typescript
{
  shareAll?: boolean    // Compartilhar com todos
  userIds?: string[]    // IDs de usuários específicos
}
```

### POST /api/campaigns/[id]/handouts/[handoutId]/view
Marca handout como visualizado.

**Response (200):**
```typescript
{
  success: boolean
}
```

## APIs de Tokens (Sistema Básico)

### GET /api/campaigns/[id]/tokens
Obtém tokens da campanha (baseados em personagens).

**Response (200):**
```typescript
{
  tokens: Array<{
    id: string
    src: string               // URL da imagem/avatar
    alt: string               // Nome do token
    name: string              // Nome para exibição
    position: {
      top: number             // Posição em pixels
      left: number            // Posição em pixels
    }
    borderColor: string       // Cor da borda baseada no tipo
    canPlayerMove: boolean    // Sempre true no sistema atual
    ownerId?: string          // ID do proprietário
    characterId?: string      // ID do personagem vinculado
    characterType?: 'PC' | 'NPC' | 'CREATURE'
    hidden?: boolean
    locked?: boolean
    scale?: number
    rotation?: number
    opacity?: number
  }>
  userRole: 'GM' | 'PLAYER'
  userId: string
}
```

### POST /api/campaigns/[id]/tokens
Cria token baseado em personagem.

**Request Body:**
```typescript
{
  characterId: string       // ID do personagem
  position?: {
    top: number
    left: number
  }
}
```

### GET /api/campaigns/[id]/auto-tokens
API básica para sistema de tokens automáticos (simplificado).

**Response (200):**
```typescript
{
  success: true
  message: "Basic token system active"
}
```

## APIs de Estado do Jogo

### GET /api/campaigns/[id]/game-state
Obtém estado atual do jogo (tokens e mapa ativo).

**Response (200):**
```typescript
{
  tokens: string            // JSON string dos tokens
  activeMapId: string | null
  gameData: string          // Dados adicionais do jogo
  lastActivity: string
  campaignId: string
}
```

### POST /api/campaigns/[id]/game-state
Atualiza estado do jogo.

**Request Body:**
```typescript
{
  tokens?: TokenData[]      // Array de tokens
}
```

## APIs de Gerenciamento de Jogadores

### GET /api/campaigns/[id]/players
Lista membros da campanha.

**Response (200):**
```typescript
{
  members: Array<{
    id: string
    role: 'PLAYER' | 'GM'
    joinedAt: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
}
```

### POST /api/campaigns/[id]/add-player
Adiciona jogador à campanha (apenas GM).

**Request Body:**
```typescript
{
  userId: string        // ID do usuário a adicionar
  role?: string         // Role (padrão: PLAYER)
}
```

### POST /api/campaigns/[id]/remove-player
Remove jogador da campanha (apenas GM).

**Request Body:**
```typescript
{
  userId: string        // ID do usuário a remover
}
```

### GET /api/campaigns/[id]/search-players
Busca usuários para convidar.

**Query Parameters:**
```typescript
{
  q: string             // Query de busca (nome/email)
}
```

**Response (200):**
```typescript
{
  users: Array<{
    id: string
    name: string
    email: string
  }>
}
```

## APIs de Sistema de Convites

### POST /api/campaigns/[id]/create-invite
Cria link de convite para campanha (apenas GM).

**Request Body:**
```typescript
{
  email?: string        // Email do convidado (opcional)
  expiresIn?: number    // Horas para expiração (padrão: 24)
}
```

**Response (201):**
```typescript
{
  token: string
  inviteUrl: string     // URL completa do convite
  expiresAt: string
}
```

### GET /api/invites/[token]
Valida token de convite.

**Response (200):**
```typescript
{
  valid: boolean
  invite: {
    id: string
    token: string
    campaign: {
      id: string
      name: string
      system: string
    }
    createdBy: {
      name: string
    }
    expiresAt: string
    isExpired: boolean
    isUsed: boolean
  }
}
```

### POST /api/invites/[token]
Aceita convite para campanha.

**Response (200):**
```typescript
{
  success: boolean
  campaign: Campaign
}
```

## APIs de Upload de Arquivos

### GET /api/upload
Lista arquivos do usuário.

**Query Parameters:**
```typescript
{
  campaignId?: string   // Filtrar por campanha
  category?: string     // image, document, audio, video, other
  search?: string       // Busca por nome
  page?: number
  limit?: number
  sortBy?: string       // createdAt, originalName, size
  sortOrder?: string    // asc, desc
}
```

**Response (200):**
```typescript
{
  files: Array<{
    id: string
    filename: string
    originalName: string
    mimeType: string
    size: number
    url: string
    thumbnailUrl: string | null
    category: string
    tags: string[]
    isPublic: boolean
    createdAt: string
    uploadedBy: {
      id: string
      name: string
    }
  }>
  pagination: PaginationInfo
}
```

### POST /api/upload
Faz upload de arquivos.

**Request Body (FormData):**
```typescript
{
  files: File[]         // Arquivos para upload
  campaignId?: string   // Campanha associada
  category?: string     // Categoria dos arquivos
}
```

**Response (201):**
```typescript
{
  success: boolean
  files: FileRecord[]   // Arquivos criados
}
```

### DELETE /api/upload/[fileId]
Exclui arquivo.

**Response (200):**
```typescript
{
  success: boolean
}
```

### GET /api/campaigns/[id]/files
Alias para upload com filtro de campanha.

## APIs Auxiliares

### GET /api/campaigns/[id]/content
Obtém conteúdo geral da campanha (estatísticas).

**Response (200):**
```typescript
{
  stats: {
    characters: {
      total: number
      pcs: number
      npcs: number
      creatures: number
    }
    maps: {
      total: number
      active: number
    }
    handouts: {
      total: number
      shared: number
    }
    files: {
      total: number
      size: number      // Total em bytes
    }
  }
}
```

### POST /api/user/update
Atualiza dados do usuário.

**Request Body:**
```typescript
{
  name?: string
  email?: string
  preferences?: object
}
```

## Códigos de Status HTTP

### Sucessos
- `200` - OK
- `201` - Created
- `204` - No Content

### Erros do Cliente
- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (não autenticado)
- `403` - Forbidden (sem permissão)
- `404` - Not Found (recurso não encontrado)
- `409` - Conflict (conflito de dados)
- `422` - Unprocessable Entity (validação falhou)

### Erros do Servidor
- `500` - Internal Server Error
- `503` - Service Unavailable

## Padrões de Response

### Sucesso Padrão
```typescript
{
  // Dados da resposta
}
```

### Erro Padrão
```typescript
{
  error: string         // Mensagem de erro
  code?: string         // Código específico do erro
  details?: object      // Detalhes adicionais
}
```

### Paginação Padrão
```typescript
{
  data: any[]
  pagination: {
    page: number        // Página atual
    limit: number       // Itens por página
    total: number       // Total de itens
    pages: number       // Total de páginas
    hasNext: boolean    // Tem próxima página
    hasPrev: boolean    // Tem página anterior
  }
}
```

## Rate Limiting

As APIs implementam rate limiting básico:
- **Autenticação**: 5 tentativas por minuto por IP
- **Upload**: 10 uploads por minuto por usuário
- **Chat**: 30 mensagens por minuto por usuário
- **Geral**: 100 requests por minuto por usuário autenticado

## WebSocket Events (Sistema Básico)

O sistema usa WebSocket para sincronização em tempo real:

### Events de Chat
- `chat:send` - Enviar mensagem
- `chat:message` - Receber mensagem

### Events de Tokens (Ultra-Básico)
- `token_move` - Mover token com posição em pixels
  ```typescript
  {
    campaignId: string
    tokenId: string
    position: { top: number; left: number }
  }
  ```
- `game:token-move` - Token movido (broadcast)
  ```typescript
  {
    tokenId: string
    position: { top: number; left: number }
    userId: string
  }
  ```

### Events de Mapas
- `game:map-activate` - Ativar mapa (GM only)
- `map:activated` - Mapa ativado (broadcast)

### Events de Campanha
- `campaign:join` - Entrar na campanha
- `campaign:leave` - Sair da campanha
- `player:join` - Jogador conectou
- `player:leave` - Jogador desconectou

### Características do Sistema WebSocket Atual
- **Movimento Livre**: Sem verificações de permissão
- **Coordenadas Simples**: Pixels absolutos (não normalizadas)
- **Persistência Garantida**: Posições salvas no `gameState.tokens`
- **Sincronização Confiável**: Sistema singleton sem conflitos

## Exemplos de Uso

### Criar Personagem
```typescript
const response = await fetch('/api/campaigns/123/characters', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Aragorn',
    type: 'PC',
    data: {
      level: 5,
      class: 'Ranger',
      hitPoints: 45
    }
  })
})

const character = await response.json()
```

### Upload de Arquivo
```typescript
const formData = new FormData()
formData.append('files', file)
formData.append('campaignId', '123')
formData.append('category', 'image')

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
})

const result = await response.json()
```

### Filtrar Handouts
```typescript
const params = new URLSearchParams({
  category: 'rules',
  shared: 'true',
  search: 'combat'
})

const response = await fetch(`/api/campaigns/123/handouts?${params}`)
const handouts = await response.json()
```

## Tratamento de Erros

### Exemplo de Wrapper
```typescript
async function apiCall(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Request failed')
    }
    
    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}
```

### Retry Logic
```typescript
async function apiCallWithRetry(url: string, options?: RequestInit, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiCall(url, options)
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

## Filosofia do Sistema Atual

### Simplicidade Sobre Complexidade
O sistema atual prioriza **estabilidade e simplicidade** sobre features avançadas:

- **Movimento Livre**: Todos podem mover qualquer token (baseado em confiança)
- **Coordenadas Simples**: Pixels absolutos em vez de coordenadas normalizadas
- **Sistema Ultra-Básico**: Sem verificações complexas de permissão
- **Persistência Garantida**: Todas as posições são salvas automaticamente

### Lições Aprendidas
- ❌ **Evitar**: Sistemas de coordenadas normalizadas complexas
- ❌ **Evitar**: Verificações de permissão excessivas
- ❌ **Evitar**: Features que causam loops infinitos
- ✅ **Priorizar**: Funcionalidade básica que sempre funciona
- ✅ **Priorizar**: Movimento fluido e responsivo
- ✅ **Priorizar**: Sincronização confiável via WebSocket

## Considerações de Performance

### Caching
- Cache de APIs simples e efetivo
- Imagens e assets com cache automático
- Estado de tokens em memória para responsividade

### Paginação
- Limite padrão de 20-50 itens por página
- Paginação simples sem infinite scroll complexo

### Otimização de Queries
- Queries Prisma otimizadas para o sistema básico
- Include seletivo apenas quando necessário
- Índices simples e efetivos

## Status do Sistema

**O MesaRPG está em estado "Production-Ready"** com sistema de tokens ultra-básico que garante:
- ✅ Movimento livre e fluido
- ✅ Sincronização perfeita via WebSocket
- ✅ Persistência garantida após refresh
- ✅ Zero bugs críticos
- ✅ Performance otimizada por simplicidade

Este é um guia das APIs do sistema **básico e estável** do MesaRPG. Para implementações, consulte os arquivos de rota correspondentes.