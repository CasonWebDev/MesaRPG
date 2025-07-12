# Sistema de Tokens Avançado

## Visão Geral

O sistema de tokens do MesaRPG oferece uma experiência completa e intuitiva para gerenciamento de representações visuais de personagens no grid tático. Combina simplicidade de uso com funcionalidades avançadas, mantendo sincronização perfeita entre todos os usuários conectados.

## Funcionalidades Principais

### 🎯 Criação de Tokens

#### Tokens Genéricos
- **Acesso**: Botão direito no grid vazio → "Adicionar token genérico"
- **Características**: 
  - Placeholder genérico (`/placeholder-generic.png`)
  - Tamanho médio (40px) por padrão
  - Movimento livre para todos os usuários
  - Posicionamento no local do clique

#### Tokens de Personagens
- **Método**: Vinculação de tokens existentes a fichas de personagens
- **Suporte**: PC, NPC, CREATURE
- **Automatização**: Avatar e nome atualizados automaticamente
- **Placeholders específicos**: Cada tipo tem seu placeholder elegante

### 🔗 Sistema de Vinculação

#### Modal de Vinculação
```typescript
// Acesso via menu de contexto do token
<LinkCharacterModal
  isOpen={isOpen}
  onClose={handleClose}
  onSelectCharacter={handleSelectCharacter}
  campaignId={campaignId}
  userRole={userRole}
  userId={userId}
  tokenName={tokenName}
/>
```

#### Processo de Vinculação
1. **Seleção**: Usuário clica em "Vincular a Ficha de Personagem"
2. **Modal**: Lista de personagens disponíveis com busca e filtros
3. **Avatar**: Sistema detecta automaticamente campo de imagem do template
4. **Sincronização**: Dados do personagem aplicados ao token em tempo real
5. **Persistência**: Vinculação salva no banco de dados

#### Dados Sincronizados
- **Nome**: Nome do personagem aplicado ao token
- **Avatar**: Imagem da ficha ou placeholder específico do tipo
- **Tipo**: PC, NPC ou CREATURE para identificação visual
- **Proprietário**: Referência ao criador do personagem

### 📏 Sistema de Tamanhos

#### Opções Disponíveis
- **Pequeno**: 20px de diâmetro
- **Médio**: 40px de diâmetro (padrão)
- **Grande**: 60px de diâmetro

#### Interface de Tamanhos
```typescript
// Menu de contexto com indicadores visuais
<button
  onClick={() => handleSizeChange('small')}
  className={`${currentSizeType === 'small' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
>
  Token Pequeno (20px)
</button>
```

#### Persistência de Tamanhos
- **WebSocket**: Sincronização em tempo real
- **Database**: Propriedades `tokenSize` e `sizeType` salvas
- **API**: Endpoints incluem propriedades de tamanho
- **Refresh-Safe**: Tamanhos mantidos após recarregar página

### 🗑️ Sistema de Deleção

#### Processo de Deleção
1. **Acesso**: Menu de contexto → "Deletar Token"
2. **Confirmação**: Dialog nativo de confirmação
3. **Permissões**: GM pode deletar qualquer token, jogadores apenas seus próprios
4. **Sincronização**: Remoção imediata em todos os clientes conectados

#### Implementação
```typescript
const handleDeleteToken = async (tokenId: string) => {
  const confirmDelete = window.confirm('Tem certeza que deseja deletar este token?')
  
  if (!confirmDelete) return

  await removeToken(tokenId)
}
```

## Arquitetura Técnica

### 🎨 Componente Token

#### Estrutura Base
```typescript
export function Token({
  token,
  isSelected,
  onSelect,
  onMove,
  canMove = true,
  role = 'PLAYER',
  userId,
  campaignId,
  zoomLevel = 1,
  onDelete,
  onLinkCharacter,
  onSizeChange
}: TokenProps) {
  // Estados locais
  const [isDragging, setIsDragging] = useState(false)
  const [contextMenu, setContextMenu] = useState<{...}>()
  
  // Tamanho dinâmico baseado em propriedades
  const tokenSize = token.tokenSize || 40
  const currentSizeType = token.sizeType || 'medium'
  
  // Movimento com limites dinâmicos
  const handleMouseMove = (e: MouseEvent) => {
    const maxX = parentRect.width - tokenSize
    const maxY = parentRect.height - tokenSize
    
    const finalPosition = {
      left: Math.max(0, Math.min(newX, maxX)),
      top: Math.max(0, Math.min(newY, maxY))
    }
  }
}
```

#### Renderização Responsiva
```typescript
return (
  <div
    ref={tokenRef}
    data-token-id={token.id}
    className={`absolute rounded-full border-2 cursor-pointer ${
      isDragging ? 'border-blue-500 scale-110 z-50' : 'border-white z-10'
    }`}
    style={{
      left: position.left,
      top: position.top,
      width: `${tokenSize}px`,
      height: `${tokenSize}px`
    }}
  >
    <Image
      src={token.src || "/placeholder.svg"}
      alt={token.alt}
      width={tokenSize}
      height={tokenSize}
      className="w-full h-full rounded-full object-cover"
    />
  </div>
)
```

### 🔄 Hook useTokens

#### Interface Completa
```typescript
interface UseTokensReturn {
  tokens: TokenData[]
  selectedTokenIds: string[]
  isLoading: boolean
  error: string | null
  selectToken: (tokenId: string) => void
  selectMultipleTokens: (tokenIds: string[]) => void
  clearSelection: () => void
  moveToken: (tokenId: string, position: { top: number; left: number }) => void
  createToken: (tokenData: Omit<TokenData, 'id'>) => Promise<void>
  updateToken: (tokenId: string, updates: Partial<TokenData>) => Promise<void>
  removeToken: (tokenId: string) => void
  refreshTokens: () => Promise<void>
}
```

#### Gerenciamento de Estado
```typescript
// Estados sincronizados via WebSocket
const [tokens, setTokens] = useState<TokenData[]>([])
const { 
  socket, 
  tokenMoves, 
  tokenCreations, 
  tokenUpdates, 
  tokenRefreshes,
  tokensCleared 
} = useSocket(campaignId)

// Processamento de eventos WebSocket
useEffect(() => {
  if (tokenUpdates.length > 0) {
    tokenUpdates.forEach(tokenUpdate => {
      const isSizeUpdate = tokenUpdate.updates?.tokenSize || tokenUpdate.updates?.sizeType
      if (isSizeUpdate) {
        console.log(`📏 Client: Size update for token ${tokenUpdate.tokenId}`)
      }
      
      setTokens(prevTokens => 
        prevTokens.map(token => 
          token.id === tokenUpdate.tokenId 
            ? { ...token, ...tokenUpdate.updates }
            : token
        )
      )
    })
    clearTokenUpdates()
  }
}, [tokenUpdates, clearTokenUpdates])
```

#### Atualização de Tokens
```typescript
const updateToken = useCallback(async (tokenId: string, updates: Partial<TokenData>) => {
  try {
    // Optimistic update local
    setTokens(prevTokens => 
      prevTokens.map(t => 
        t.id === tokenId ? { ...t, ...updates } : t
      )
    )

    // Sincronização via WebSocket
    if (socket && isConnected) {
      socket.emit('token_update', {
        campaignId,
        tokenId,
        updates: updates
      })
    }
  } catch (error) {
    // Revert em caso de erro
    const originalToken = tokens.find(t => t.id === tokenId)
    if (originalToken) {
      setTokens(prevTokens => 
        prevTokens.map(t => t.id === tokenId ? originalToken : t)
      )
    }
    throw error
  }
}, [tokens, campaignId, socket, isConnected])
```

### 🌐 Sincronização WebSocket

#### Server-Side (socket-bridge.js)
```javascript
// Atualização de tokens
socket.on('token_update', async (data) => {
  const { campaignId, tokenId, updates } = data
  
  // Debug para atualizações de tamanho
  const isSizeUpdate = updates.tokenSize || updates.sizeType
  if (isSizeUpdate) {
    console.log(`📏 Server: Size update for token ${tokenId}:`, {
      tokenSize: updates.tokenSize,
      sizeType: updates.sizeType
    })
  }

  // Atualizar no banco de dados
  const tokens = JSON.parse(gameState.tokens || '[]')
  const tokenIndex = tokens.findIndex(t => t.id === tokenId)
  
  if (tokenIndex !== -1) {
    tokens[tokenIndex] = { ...tokens[tokenIndex], ...updates }
    
    await prisma.gameState.update({
      where: { campaignId },
      data: {
        tokens: JSON.stringify(tokens),
        lastActivity: new Date()
      }
    })

    // Broadcast para outros usuários
    socket.to(campaignId).emit('game:token-updated', {
      tokenId,
      updates,
      userId: socket.data.userId
    })
  }
})
```

#### Eventos Suportados
- `token_create` - Criação de novos tokens
- `token_update` - Atualização de propriedades (tamanho, vinculação, etc.)
- `token_move` - Movimento de posição
- `token_clear_all` - Limpeza total do grid

### 📊 APIs de Suporte

#### GET /api/campaigns/[id]/tokens
```typescript
// Carregamento com propriedades de tamanho
const formattedTokens = tokens.map((token: any) => ({
  id: token.id,
  src: token.src || '/placeholder.svg',
  alt: token.alt || token.name || 'Token',
  name: token.name || token.alt || 'Token',
  position: token.position || { top: 100, left: 100 },
  borderColor: token.borderColor || 'border-gray-500',
  canPlayerMove: token.canPlayerMove !== false,
  ownerId: token.ownerId || null,
  characterId: token.characterId || null,
  characterType: token.characterType || null,
  hidden: token.hidden || false,
  locked: token.locked || false,
  scale: token.scale || 1,
  rotation: token.rotation || 0,
  opacity: token.opacity || 1,
  tokenSize: token.tokenSize || 40,
  sizeType: token.sizeType || 'medium'
}))
```

#### POST /api/campaigns/[id]/game-state
```typescript
// Persistência completa de estado do jogo
const gameState = await prisma.gameState.upsert({
  where: { campaignId },
  update: {
    tokens: tokens ? JSON.stringify(tokens) : undefined,
    gameData: gameData ? JSON.stringify(gameData) : undefined,
    activeMapId: activeMapId || undefined,
    lastActivity: new Date()
  },
  create: {
    campaignId,
    tokens: JSON.stringify(tokens || []),
    gameData: JSON.stringify(gameData || {}),
    activeMapId: activeMapId || null
  }
})
```

## Sistema de Placeholders

### 🎨 Placeholders Específicos

#### Função Utilitária
```typescript
const getTypePlaceholder = (type?: string) => {
  switch (type) {
    case 'PC':
      return '/placeholder-PC-token.png'
    case 'NPC':
      return '/placeholder-NPC-token.png'
    case 'CREATURE':
      return '/placeholder-Creature-token.png'
    default:
      return '/placeholder.svg'
  }
}
```

#### Integração com Templates
```typescript
// Sistema de avatar inteligente
const getCharacterAvatar = (character: any) => {
  try {
    const template = character.template
    if (!template?.fields) {
      return getTypePlaceholder(character.type)
    }
    
    const templateFields = Array.isArray(template.fields) 
      ? template.fields 
      : JSON.parse(template.fields)
    
    const imageField = templateFields.find((field: any) => field.type === 'image')
    if (!imageField) {
      return getTypePlaceholder(character.type)
    }
    
    const charData = typeof character.data === 'string' 
      ? JSON.parse(character.data) 
      : character.data
    
    return charData[imageField.name] || getTypePlaceholder(character.type)
  } catch (error) {
    return getTypePlaceholder(character.type)
  }
}
```

### 🖼️ Assets Visuais

#### Estrutura de Arquivos
```
public/
├── placeholder-PC-token.png       # Personagem jogável
├── placeholder-NPC-token.png      # Personagem não-jogável
├── placeholder-Creature-token.png # Criaturas e monstros
├── placeholder-generic.png        # Token genérico
└── placeholder.svg                # Fallback universal
```

#### Características dos Placeholders
- **Formato**: PNG com transparência
- **Dimensões**: Quadrados para melhor rendering circular
- **Estilo**: Consistente com a identidade visual do sistema
- **Otimização**: Comprimidos para carregamento rápido

## Menu de Contexto Avançado

### 🖱️ Interface Contextual

#### Estrutura do Menu
```typescript
{/* Token Context Menu */}
{contextMenu.visible && (
  <div className="fixed bg-white border border-gray-300 rounded-md shadow-lg py-1 z-50">
    {/* Seção de Vinculação */}
    <button
      onClick={handleLinkCharacter}
      disabled={isLinkedToCharacter}
      className={isLinkedToCharacter ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}
    >
      {isLinkedToCharacter ? 'Já Vinculado' : 'Vincular a Ficha de Personagem'}
    </button>
    
    {/* Seção de Tamanhos */}
    <div className="border-t border-gray-200 my-1"></div>
    <div className="px-4 py-1 text-xs text-gray-500 font-medium">Tamanho do Token</div>
    
    {['small', 'medium', 'large'].map(size => (
      <button
        key={size}
        onClick={() => handleSizeChange(size)}
        className={currentSizeType === size ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
      >
        Token {size === 'small' ? 'Pequeno (20px)' : size === 'medium' ? 'Médio (40px)' : 'Grande (60px)'}
      </button>
    ))}
    
    {/* Seção de Ações */}
    <div className="border-t border-gray-200 my-1"></div>
    <button
      onClick={handleDeleteToken}
      className="text-red-600 hover:bg-red-50"
    >
      Deletar Token
    </button>
  </div>
)}
```

#### Estados Visuais
- **Itens desabilitados**: Feedback visual para ações não disponíveis
- **Indicadores de estado**: Tamanho atual destacado
- **Separadores**: Divisões lógicas entre seções de funcionalidade
- **Cores semânticas**: Vermelho para ações destrutivas

### 🎯 Contexto do Grid

#### Menu do Grid Vazio
```typescript
// Context menu para área vazia
<div className="fixed bg-white border rounded-md shadow-lg py-1 z-50">
  <button onClick={handleCreateGenericToken}>
    Adicionar token genérico
  </button>
  {tokens && tokens.length > 0 && (
    <button onClick={handleClearGrid} className="text-red-600">
      Limpar Grid
    </button>
  )}
</div>
```

#### Funcionalidades do Grid
- **Criação rápida**: Token genérico na posição do clique
- **Limpeza total**: Confirmação antes de remover todos os tokens
- **Feedback visual**: Indicadores de estado e contador de tokens

## Performance e Otimizações

### ⚡ Otimizações Implementadas

#### Renders Otimizados
- **Componentes puros**: Memoização adequada de renders
- **Updates locais**: Optimistic updates para responsividade
- **Batch processing**: Múltiplas atualizações processadas em lote

#### Sincronização Eficiente
- **WebSocket singleton**: Uma conexão por campanha
- **Event debouncing**: Prevenção de spam de eventos
- **Error recovery**: Auto-reconnect e fallbacks HTTP

#### Persistência Inteligente
- **Lazy loading**: Carregamento sob demanda
- **Compression**: Dados otimizados para transferência
- **Caching**: Estados locais para performance

### 🔧 Configurações de Performance

#### WebSocket Settings
```typescript
const socketInstance = io('http://localhost:3001', {
  auth: { token: session.user.id },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000
})
```

#### Update Batching
```typescript
// Processamento em lote de atualizações
useEffect(() => {
  if (tokenUpdates.length > 0) {
    const batchSize = Math.min(tokenUpdates.length, 10)
    const batch = tokenUpdates.slice(0, batchSize)
    
    batch.forEach(processTokenUpdate)
    clearProcessedUpdates(batchSize)
  }
}, [tokenUpdates])
```

## Casos de Uso Avançados

### 🎮 Fluxos de Trabalho Típicos

#### 1. Preparação de Combate (GM)
1. **Ativar mapa** de combate via sidebar
2. **Criar tokens** para inimigos (botão direito → adicionar)
3. **Vincular NPCs** aos tokens criados
4. **Ajustar tamanhos** conforme necessário (criaturas grandes)
5. **Posicionar** strategicamente no mapa

#### 2. Entrada de Jogadores
1. **Tokens automáticos** criados para PCs da campanha
2. **Jogadores posicionam** seus próprios tokens
3. **Vinculação automática** a fichas de personagem
4. **Ajustes de tamanho** conforme preferência

#### 3. Durante o Combate
1. **Movimento livre** para todos os participantes
2. **Sincronização imediata** de posições
3. **Adição dinâmica** de novos tokens (invocações, etc.)
4. **Ajustes de tamanho** para efeitos temporários

### 🔄 Integração com Outros Sistemas

#### Personagens
- **Sincronização bidirecional** entre fichas e tokens
- **Avatares automáticos** baseados em templates
- **Criação dinâmica** para novos personagens

#### Mapas
- **Ativação automática** de tokens com mudança de mapa
- **Preservação de posições** por mapa
- **Notificações** de mudança de cenário

#### Chat
- **Comandos de token** via chat (futuro)
- **Notificações** de ações importantes
- **Log de eventos** para auditoria

## Troubleshooting

### 🐛 Problemas Comuns

#### Tokens não sincronizam
```typescript
// Verificar conexão WebSocket
if (!socket || !isConnected) {
  console.error('WebSocket não conectado')
  // Tentar reconectar ou usar fallback HTTP
}

// Verificar eventos
socket.on('game:token-updated', (data) => {
  console.log('Token update received:', data)
})
```

#### Tamanhos não persistem
```typescript
// Verificar se API inclui propriedades
const response = await fetch(`/api/campaigns/${campaignId}/tokens`)
const { tokens } = await response.json()

tokens.forEach(token => {
  if (!token.tokenSize || !token.sizeType) {
    console.warn('Token missing size properties:', token.id)
  }
})
```

#### Avatares não carregam
```typescript
// Verificar placeholders
const avatar = getCharacterAvatar(character)
if (!avatar || avatar === '/placeholder.svg') {
  console.log('Using fallback placeholder for:', character.type)
}
```

### 🔧 Debug Tools

#### Console Logging
```typescript
// Ativar debug detalhado
localStorage.setItem('debug-tokens', 'true')

// Logs automáticos para desenvolvimento
if (localStorage.getItem('debug-tokens')) {
  console.log('🎯 Token state:', { tokens, isLoading, error })
  console.log('📡 WebSocket state:', { isConnected, tokenMoves })
}
```

#### Performance Monitoring
```typescript
// Monitorar performance de renders
const renderStart = performance.now()
// ... render logic
const renderTime = performance.now() - renderStart
console.log(`Token render time: ${renderTime}ms`)
```

O sistema de tokens do MesaRPG oferece uma experiência completa e profissional para gerenciamento visual de personagens, combinando simplicidade de uso com funcionalidades avançadas e sincronização perfeita entre todos os participantes da campanha.