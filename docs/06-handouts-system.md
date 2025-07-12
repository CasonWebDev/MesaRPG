# Sistema de Handouts e Documentos

## Visão Geral

O sistema de Handouts é uma funcionalidade avançada que permite aos GMs criar, gerenciar e compartilhar documentos, informações e recursos com jogadores de forma controlada e organizada. Oferece controle granular de acesso, suporte a anexos e notificações em tempo real.

## Funcionalidades Principais

### 1. Criação e Edição de Handouts
- **Editor Rico**: Interface para criação de documentos estruturados
- **Categorização**: Sistema de tags e categorias
- **Versionamento**: Histórico de alterações
- **Preview**: Visualização antes da publicação

### 2. Sistema de Compartilhamento
- **Controle de Acesso**: Privado, GM apenas, ou compartilhado com jogadores
- **Compartilhamento Seletivo**: Escolher jogadores específicos
- **Notificações**: Alertas automáticos quando handouts são compartilhados
- **Status de Leitura**: Tracking de quem visualizou

### 3. Suporte a Anexos
- **Múltiplos Formatos**: Imagens, PDFs, documentos
- **Upload Integrado**: Sistema de upload com validação
- **Preview**: Visualização de anexos na interface
- **Download**: Controle de download para jogadores

## Estrutura de Dados

### Handout Model (Prisma)
```prisma
model Handout {
  id          String   @id @default(cuid())
  title       String
  content     String   @db.Text
  isShared    Boolean  @default(false)
  category    String?
  tags        String[] @default([])
  attachments Json     @default("[]")
  metadata    Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relacionamentos
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id], onDelete: Cascade)
  
  // Compartilhamento
  sharedWith  HandoutShare[]
  viewedBy    HandoutView[]
  
  @@index([campaignId, isShared])
  @@index([createdById])
}

model HandoutShare {
  id         String   @id @default(cuid())
  sharedAt   DateTime @default(now())
  
  // Relacionamentos
  handoutId  String
  handout    Handout  @relation(fields: [handoutId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  sharedById String
  sharedBy   User     @relation("HandoutSharedBy", fields: [sharedById], references: [id], onDelete: Cascade)
  
  @@unique([handoutId, userId])
}

model HandoutView {
  id        String   @id @default(cuid())
  viewedAt  DateTime @default(now())
  
  // Relacionamentos
  handoutId String
  handout   Handout  @relation(fields: [handoutId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([handoutId, userId])
}
```

## APIs de Handouts

### 1. Listagem com Filtros
```typescript
// app/api/campaigns/[id]/handouts/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(request.url)
  
  // Verificar acesso à campanha
  const userRole = await validateCampaignMembership(params.id, session.user.id)
  if (!userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  const category = searchParams.get('category')
  const shared = searchParams.get('shared')
  const search = searchParams.get('search')
  
  // Construir filtros baseados no role do usuário
  const whereClause = {
    campaignId: params.id,
    ...(category && { category }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }),
    ...(userRole === 'owner' 
      ? {} // GM vê todos
      : { // Jogadores veem apenas compartilhados
          OR: [
            { isShared: true },
            { sharedWith: { some: { userId: session.user.id } } }
          ]
        }
    )
  }
  
  const handouts = await prisma.handout.findMany({
    where: whereClause,
    include: {
      createdBy: {
        select: { id: true, name: true }
      },
      sharedWith: {
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      },
      viewedBy: {
        where: { userId: session.user.id },
        select: { viewedAt: true }
      },
      _count: {
        select: {
          viewedBy: true,
          sharedWith: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
  
  return NextResponse.json(handouts)
}
```

### 2. Criação de Handouts
```typescript
// POST /api/campaigns/[id]/handouts
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  // Verificar se é GM (apenas GMs podem criar handouts)
  const isOwner = await validateCampaignOwnership(params.id, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ 
      error: "Only GMs can create handouts" 
    }, { status: 403 })
  }
  
  // Validar dados de entrada
  const validatedData = handoutSchema.parse(body)
  
  const handout = await prisma.handout.create({
    data: {
      title: validatedData.title,
      content: validatedData.content,
      category: validatedData.category,
      tags: validatedData.tags || [],
      attachments: validatedData.attachments || [],
      metadata: validatedData.metadata || {},
      isShared: validatedData.isShared || false,
      campaignId: params.id,
      createdById: session.user.id
    },
    include: {
      createdBy: {
        select: { id: true, name: true }
      }
    }
  })
  
  return NextResponse.json(handout, { status: 201 })
}
```

### 3. Atualização de Handouts
```typescript
// PUT /api/campaigns/[id]/handouts/[handoutId]
export async function PUT(
  request: Request,
  { params }: { params: { id: string, handoutId: string } }
) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  // Verificar se é o criador ou GM da campanha
  const handout = await prisma.handout.findFirst({
    where: {
      id: params.handoutId,
      campaignId: params.id,
      OR: [
        { createdById: session.user.id },
        { campaign: { ownerId: session.user.id } }
      ]
    }
  })
  
  if (!handout) {
    return NextResponse.json({ error: "Handout not found" }, { status: 404 })
  }
  
  const updatedHandout = await prisma.handout.update({
    where: { id: params.handoutId },
    data: {
      title: body.title,
      content: body.content,
      category: body.category,
      tags: body.tags,
      attachments: body.attachments,
      metadata: body.metadata,
      isShared: body.isShared
    },
    include: {
      createdBy: {
        select: { id: true, name: true }
      },
      sharedWith: {
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      }
    }
  })
  
  return NextResponse.json(updatedHandout)
}
```

### 4. Sistema de Compartilhamento
```typescript
// POST /api/campaigns/[id]/handouts/[handoutId]/share
export async function POST(
  request: Request,
  { params }: { params: { id: string, handoutId: string } }
) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  // Verificar se é GM
  const isOwner = await validateCampaignOwnership(params.id, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ error: "Only GMs can share handouts" }, { status: 403 })
  }
  
  const { userIds, shareAll } = body
  
  if (shareAll) {
    // Compartilhar com todos os jogadores da campanha
    await prisma.handout.update({
      where: { id: params.handoutId },
      data: { isShared: true }
    })
    
    // Notificar via WebSocket
    io.to(`campaign:${params.id}`).emit('handout:shared', {
      handoutId: params.handoutId,
      type: 'all'
    })
  } else {
    // Compartilhar com jogadores específicos
    const shareData = userIds.map((userId: string) => ({
      handoutId: params.handoutId,
      userId,
      sharedById: session.user.id
    }))
    
    await prisma.handoutShare.createMany({
      data: shareData,
      skipDuplicates: true
    })
    
    // Notificar jogadores específicos
    userIds.forEach((userId: string) => {
      io.to(`user:${userId}`).emit('handout:shared', {
        handoutId: params.handoutId,
        type: 'personal'
      })
    })
  }
  
  return NextResponse.json({ success: true })
}
```

### 5. Marcar como Visualizado
```typescript
// POST /api/campaigns/[id]/handouts/[handoutId]/view
export async function POST(
  request: Request,
  { params }: { params: { id: string, handoutId: string } }
) {
  const session = await getServerSession(authOptions)
  
  // Verificar acesso ao handout
  const handout = await prisma.handout.findFirst({
    where: {
      id: params.handoutId,
      campaignId: params.id,
      OR: [
        { isShared: true },
        { createdById: session.user.id },
        { sharedWith: { some: { userId: session.user.id } } },
        { campaign: { ownerId: session.user.id } }
      ]
    }
  })
  
  if (!handout) {
    return NextResponse.json({ error: "Handout not found" }, { status: 404 })
  }
  
  // Criar registro de visualização
  await prisma.handoutView.upsert({
    where: {
      handoutId_userId: {
        handoutId: params.handoutId,
        userId: session.user.id
      }
    },
    update: {
      viewedAt: new Date()
    },
    create: {
      handoutId: params.handoutId,
      userId: session.user.id
    }
  })
  
  return NextResponse.json({ success: true })
}
```

## Componentes de Interface

### 1. Lista de Handouts
```typescript
// components/sidebar-content/handout-list.tsx
export function HandoutList({ 
  campaignId, 
  userRole 
}: { 
  campaignId: string
  userRole: 'owner' | 'member'
}) {
  const [handouts, setHandouts] = useState<Handout[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    shared: ''
  })
  const [selectedHandout, setSelectedHandout] = useState<Handout | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState<Handout | null>(null)
  
  // Carregar handouts
  const fetchHandouts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.category) params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)
      if (filters.shared) params.append('shared', filters.shared)
      
      const response = await fetch(
        `/api/campaigns/${campaignId}/handouts?${params}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setHandouts(data)
      }
    } catch (error) {
      console.error('Error fetching handouts:', error)
    } finally {
      setLoading(false)
    }
  }, [campaignId, filters])
  
  useEffect(() => {
    fetchHandouts()
  }, [fetchHandouts])
  
  // Categorias disponíveis
  const categories = useMemo(() => {
    const cats = new Set(handouts.map(h => h.category).filter(Boolean))
    return Array.from(cats)
  }, [handouts])
  
  // Filtrar handouts
  const filteredHandouts = useMemo(() => {
    return handouts.filter(handout => {
      if (filters.category && handout.category !== filters.category) return false
      if (filters.shared === 'true' && !handout.isShared) return false
      if (filters.shared === 'false' && handout.isShared) return false
      return true
    })
  }, [handouts, filters])
  
  const handleViewHandout = async (handout: Handout) => {
    setSelectedHandout(handout)
    
    // Marcar como visualizado
    await fetch(`/api/campaigns/${campaignId}/handouts/${handout.id}/view`, {
      method: 'POST'
    })
  }
  
  const handleShareHandout = (handout: Handout) => {
    setShowShareModal(handout)
  }
  
  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Header com filtros */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">
            Handouts ({filteredHandouts.length})
          </h3>
          {userRole === 'owner' && (
            <Button 
              size="sm" 
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Filtros */}
        <div className="space-y-2">
          <Input
            placeholder="Buscar handouts..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              search: e.target.value 
            }))}
          />
          
          <div className="flex gap-2">
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ 
                ...prev, 
                category: value 
              }))}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {userRole === 'owner' && (
              <Select
                value={filters.shared}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  shared: value 
                }))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="true">Compartilhados</SelectItem>
                  <SelectItem value="false">Privados</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
      
      {/* Lista de handouts */}
      {filteredHandouts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p>Nenhum handout encontrado</p>
          {userRole === 'owner' && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setShowCreateModal(true)}
            >
              Criar primeiro handout
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredHandouts.map(handout => (
            <HandoutListItem
              key={handout.id}
              handout={handout}
              userRole={userRole}
              onView={() => handleViewHandout(handout)}
              onShare={() => handleShareHandout(handout)}
            />
          ))}
        </div>
      )}
      
      {/* Modais */}
      {showCreateModal && (
        <CreateHandoutModal
          campaignId={campaignId}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchHandouts}
        />
      )}
      
      {selectedHandout && (
        <ViewHandoutModal
          handout={selectedHandout}
          isOpen={!!selectedHandout}
          onClose={() => setSelectedHandout(null)}
        />
      )}
      
      {showShareModal && (
        <ShareHandoutModal
          handout={showShareModal}
          campaignId={campaignId}
          isOpen={!!showShareModal}
          onClose={() => setShowShareModal(null)}
          onSuccess={fetchHandouts}
        />
      )}
    </div>
  )
}
```

### 2. Item da Lista
```typescript
// components/handout-list-item.tsx
export function HandoutListItem({
  handout,
  userRole,
  onView,
  onShare
}: HandoutListItemProps) {
  const isViewed = handout.viewedBy?.length > 0
  const hasAttachments = handout.attachments && handout.attachments.length > 0
  
  return (
    <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 
              className="font-medium truncate cursor-pointer hover:text-primary"
              onClick={onView}
            >
              {handout.title}
            </h4>
            
            {/* Indicadores */}
            <div className="flex items-center gap-1">
              {handout.isShared && (
                <Badge variant="secondary" className="text-xs">
                  <Share2 className="h-3 w-3 mr-1" />
                  Compartilhado
                </Badge>
              )}
              
              {handout.category && (
                <Badge variant="outline" className="text-xs">
                  {handout.category}
                </Badge>
              )}
              
              {hasAttachments && (
                <Paperclip className="h-3 w-3 text-muted-foreground" />
              )}
              
              {!isViewed && userRole === 'member' && (
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {handout.content.substring(0, 100)}...
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              Por {handout.createdBy.name} • {formatDate(handout.updatedAt)}
            </span>
            
            {userRole === 'owner' && (
              <div className="flex items-center gap-1">
                {handout._count?.viewedBy > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {handout._count.viewedBy} visualizações
                  </span>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onView}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Compartilhar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3. Modal de Visualização
```typescript
// components/modals/view-handout-modal.tsx
export function ViewHandoutModal({
  handout,
  isOpen,
  onClose
}: ViewHandoutModalProps) {
  useEffect(() => {
    if (isOpen && handout) {
      // Marcar como visualizado quando modal abre
      fetch(`/api/campaigns/${handout.campaignId}/handouts/${handout.id}/view`, {
        method: 'POST'
      }).catch(console.error)
    }
  }, [isOpen, handout])
  
  if (!handout) return null
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>{handout.title}</DialogTitle>
              <DialogDescription>
                Criado por {handout.createdBy.name} • {formatDate(handout.createdAt)}
                {handout.updatedAt !== handout.createdAt && (
                  <span> • Atualizado em {formatDate(handout.updatedAt)}</span>
                )}
              </DialogDescription>
            </div>
            
            <div className="flex items-center gap-2">
              {handout.category && (
                <Badge variant="outline">{handout.category}</Badge>
              )}
              {handout.isShared && (
                <Badge variant="secondary">
                  <Share2 className="h-3 w-3 mr-1" />
                  Compartilhado
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Conteúdo principal */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{handout.content}</ReactMarkdown>
          </div>
          
          {/* Tags */}
          {handout.tags && handout.tags.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {handout.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Anexos */}
          {handout.attachments && handout.attachments.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Anexos</h4>
              <div className="grid gap-2">
                {handout.attachments.map((attachment: any, index: number) => (
                  <AttachmentPreview
                    key={index}
                    attachment={attachment}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 4. Modal de Compartilhamento
```typescript
// components/modals/share-handout-modal.tsx
export function ShareHandoutModal({
  handout,
  campaignId,
  isOpen,
  onClose,
  onSuccess
}: ShareHandoutModalProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [shareWithAll, setShareWithAll] = useState(handout.isShared)
  const [players, setPlayers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  
  // Carregar jogadores da campanha
  useEffect(() => {
    if (isOpen) {
      fetch(`/api/campaigns/${campaignId}/players`)
        .then(res => res.json())
        .then(data => setPlayers(data.members || []))
        .catch(console.error)
    }
  }, [isOpen, campaignId])
  
  const handleShare = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(
        `/api/campaigns/${campaignId}/handouts/${handout.id}/share`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shareAll: shareWithAll,
            userIds: shareWithAll ? [] : selectedPlayers
          })
        }
      )
      
      if (response.ok) {
        toast.success('Handout compartilhado com sucesso!')
        onSuccess?.()
        onClose()
      } else {
        toast.error('Erro ao compartilhar handout')
      }
    } catch (error) {
      toast.error('Erro ao compartilhar handout')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar Handout</DialogTitle>
          <DialogDescription>
            Escolha com quem compartilhar "{handout.title}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Opção compartilhar com todos */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="share-all"
              checked={shareWithAll}
              onCheckedChange={setShareWithAll}
            />
            <Label htmlFor="share-all">
              Compartilhar com todos os jogadores
            </Label>
          </div>
          
          {/* Seleção individual */}
          {!shareWithAll && (
            <div className="space-y-2">
              <Label>Selecionar jogadores específicos:</Label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {players.map(player => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={player.id}
                      checked={selectedPlayers.includes(player.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPlayers(prev => [...prev, player.id])
                        } else {
                          setSelectedPlayers(prev => 
                            prev.filter(id => id !== player.id)
                          )
                        }
                      }}
                    />
                    <Label htmlFor={player.id} className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {player.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {player.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Informações de compartilhamento atual */}
          {(handout.isShared || handout._count?.sharedWith > 0) && (
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Status atual:</h4>
              {handout.isShared && (
                <p className="text-sm">✓ Compartilhado com todos os jogadores</p>
              )}
              {handout._count?.sharedWith > 0 && (
                <p className="text-sm">
                  ✓ Compartilhado com {handout._count.sharedWith} jogador(es) específico(s)
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={loading || (!shareWithAll && selectedPlayers.length === 0)}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Compartilhar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Hook useHandouts

```typescript
// hooks/use-handouts.ts
export function useHandouts(campaignId: string) {
  const [handouts, setHandouts] = useState<Handout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchHandouts = useCallback(async (filters?: HandoutFilters) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters?.category) params.append('category', filters.category)
      if (filters?.search) params.append('search', filters.search)
      if (filters?.shared) params.append('shared', filters.shared)
      
      const response = await fetch(
        `/api/campaigns/${campaignId}/handouts?${params}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch handouts')
      }
      
      const data = await response.json()
      setHandouts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [campaignId])
  
  const createHandout = useCallback(async (data: CreateHandoutData) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/handouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create handout')
      }
      
      const newHandout = await response.json()
      setHandouts(prev => [newHandout, ...prev])
      return newHandout
    } catch (error) {
      throw error
    }
  }, [campaignId])
  
  const updateHandout = useCallback(async (
    handoutId: string, 
    data: UpdateHandoutData
  ) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/handouts/${handoutId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to update handout')
      }
      
      const updatedHandout = await response.json()
      setHandouts(prev => 
        prev.map(h => h.id === handoutId ? updatedHandout : h)
      )
      return updatedHandout
    } catch (error) {
      throw error
    }
  }, [campaignId])
  
  const deleteHandout = useCallback(async (handoutId: string) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/handouts/${handoutId}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) {
        throw new Error('Failed to delete handout')
      }
      
      setHandouts(prev => prev.filter(h => h.id !== handoutId))
    } catch (error) {
      throw error
    }
  }, [campaignId])
  
  const shareHandout = useCallback(async (
    handoutId: string,
    shareData: { shareAll?: boolean, userIds?: string[] }
  ) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/handouts/${handoutId}/share`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(shareData)
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to share handout')
      }
      
      await fetchHandouts() // Recarregar para atualizar status
    } catch (error) {
      throw error
    }
  }, [campaignId, fetchHandouts])
  
  const markAsViewed = useCallback(async (handoutId: string) => {
    try {
      await fetch(
        `/api/campaigns/${campaignId}/handouts/${handoutId}/view`,
        { method: 'POST' }
      )
      
      // Atualizar localmente
      setHandouts(prev => prev.map(h => 
        h.id === handoutId 
          ? { ...h, viewedBy: [{ viewedAt: new Date().toISOString() }] }
          : h
      ))
    } catch (error) {
      console.error('Error marking handout as viewed:', error)
    }
  }, [campaignId])
  
  // Estatísticas
  const getStats = useCallback(() => {
    return {
      total: handouts.length,
      shared: handouts.filter(h => h.isShared).length,
      private: handouts.filter(h => !h.isShared).length,
      withAttachments: handouts.filter(h => h.attachments?.length > 0).length
    }
  }, [handouts])
  
  useEffect(() => {
    fetchHandouts()
  }, [fetchHandouts])
  
  return {
    handouts,
    loading,
    error,
    fetchHandouts,
    createHandout,
    updateHandout,
    deleteHandout,
    shareHandout,
    markAsViewed,
    getStats
  }
}
```

## Notificações em Tempo Real

### 1. Hook de Notificações
```typescript
// hooks/use-handout-notifications.ts
export function useHandoutNotifications(campaignId: string) {
  const { socket } = useSocket(campaignId)
  
  useEffect(() => {
    if (!socket) return
    
    const onHandoutShared = (data: { handoutId: string, type: 'all' | 'personal' }) => {
      if (data.type === 'all') {
        toast.info('Um novo handout foi compartilhado com todos os jogadores', {
          action: {
            label: "Ver",
            onClick: () => {
              // Navegar para handout
            }
          }
        })
      } else {
        toast.info('Você recebeu um novo handout privado', {
          action: {
            label: "Ver",
            onClick: () => {
              // Navegar para handout
            }
          }
        })
      }
    }
    
    socket.on('handout:shared', onHandoutShared)
    
    return () => {
      socket.off('handout:shared', onHandoutShared)
    }
  }, [socket])
}
```

## Validação e Schemas

### 1. Schema de Criação
```typescript
const handoutSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    size: z.number(),
    type: z.string()
  })).optional(),
  isShared: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
})
```

## Próximos Passos

### Melhorias Futuras
- [ ] Editor rico WYSIWYG
- [ ] Sistema de comentários nos handouts
- [ ] Versionamento com diff visual
- [ ] Templates de handout pré-definidos
- [ ] Importação de PDFs como handouts
- [ ] Sistema de favoritos
- [ ] Busca full-text avançada
- [ ] Exportação de handouts

### Funcionalidades Avançadas
- [ ] Handouts interativos (com formulários)
- [ ] Integração com mapas (handouts vinculados a locais)
- [ ] Sistema de permissões granulares
- [ ] Handouts com prazo de expiração
- [ ] Estatísticas detalhadas de visualização
- [ ] Notificações por email
- [ ] Backup automático de handouts