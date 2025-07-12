# Sistema de Personagens e Templates

## Visão Geral

O sistema de personagens do MesaRPG é um dos mais avançados componentes da plataforma, oferecendo CRUD completo para personagens (PC, NPC, CREATURE), sistema de templates dinâmicos de fichas, e interface diferenciada para GMs e jogadores.

## Tipos de Personagens

### 1. Player Character (PC)
- **Descrição**: Personagens controlados pelos jogadores
- **Criação**: Jogadores e GMs podem criar
- **Visualização**: Disponível para o dono e GM
- **Edição**: Dono do personagem (com possíveis restrições do GM)

### 2. Non-Player Character (NPC)
- **Descrição**: Personagens controlados pelo GM
- **Criação**: Apenas GMs
- **Visualização**: GM e jogadores (se compartilhado)
- **Edição**: Apenas GM

### 3. Creature
- **Descrição**: Monstros, animais e outras entidades
- **Criação**: Apenas GMs
- **Visualização**: GM (jogadores apenas se necessário)
- **Edição**: Apenas GM

## Estrutura de Dados

### Character Model (Prisma)
```prisma
model Character {
  id          String   @id @default(cuid())
  name        String
  type        String   // PC, NPC, CREATURE
  avatar      String?
  data        Json     // Dados dinâmicos da ficha
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relacionamentos
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id], onDelete: Cascade)
  
  // Índices
  @@index([campaignId, type])
  @@index([createdById])
}
```

### Sheet Template Model
```prisma
model SheetTemplate {
  id          String   @id @default(cuid())
  name        String
  type        String   // PC, NPC, CREATURE
  fields      Json     // Definição dos campos
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relacionamentos
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  @@index([campaignId, type])
}
```

## APIs de Personagens

### 1. Listagem com Filtros Avançados
```typescript
// GET /api/campaigns/[id]/characters
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(request.url)
  
  const type = searchParams.get('type') // PC, NPC, CREATURE
  const creator = searchParams.get('creator') // GM, PLAYER
  const search = searchParams.get('search')
  
  // Verificar acesso à campanha
  const hasAccess = await validateCampaignMembership(params.id, session.user.id)
  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  const whereClause = {
    campaignId: params.id,
    ...(type && { type }),
    ...(creator === 'PLAYER' && { 
      type: 'PC',
      createdById: session.user.id 
    }),
    ...(creator === 'GM' && { 
      type: { in: ['NPC', 'CREATURE'] }
    }),
    ...(search && {
      name: { contains: search, mode: 'insensitive' }
    })
  }
  
  const characters = await prisma.character.findMany({
    where: whereClause,
    include: {
      createdBy: {
        select: { id: true, name: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })
  
  return NextResponse.json(characters)
}
```

### 2. Criação de Personagens
```typescript
// POST /api/campaigns/[id]/characters
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  // Validar acesso
  const userRole = await validateCampaignMembership(params.id, session.user.id)
  if (!userRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  // Validar permissões por tipo
  if (body.type !== 'PC' && userRole !== 'owner') {
    return NextResponse.json({ 
      error: "Only GMs can create NPCs and Creatures" 
    }, { status: 403 })
  }
  
  // Buscar template padrão
  const template = await prisma.sheetTemplate.findFirst({
    where: {
      campaignId: params.id,
      type: body.type,
      isDefault: true
    }
  })
  
  const character = await prisma.character.create({
    data: {
      name: body.name,
      type: body.type,
      avatar: body.avatar,
      data: body.data || template?.fields || {},
      campaignId: params.id,
      createdById: session.user.id
    },
    include: {
      createdBy: {
        select: { id: true, name: true }
      }
    }
  })
  
  return NextResponse.json(character, { status: 201 })
}
```

### 3. Busca de Personagem Específico
```typescript
// GET /api/campaigns/[id]/characters/[characterId]
export async function GET(
  request: Request,
  { params }: { params: { id: string, characterId: string } }
) {
  const session = await getServerSession(authOptions)
  
  const character = await prisma.character.findFirst({
    where: {
      id: params.characterId,
      campaignId: params.id,
      OR: [
        // Owner sempre pode ver
        { createdById: session.user.id },
        // GM da campanha pode ver todos
        { campaign: { ownerId: session.user.id } },
        // Jogadores podem ver PCs compartilhados
        { 
          type: 'PC',
          campaign: { 
            members: { 
              some: { userId: session.user.id } 
            } 
          }
        }
      ]
    },
    include: {
      createdBy: {
        select: { id: true, name: true }
      },
      campaign: {
        select: { id: true, name: true, ownerId: true }
      }
    }
  })
  
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 })
  }
  
  return NextResponse.json(character)
}
```

### 4. Atualização de Personagens
```typescript
// PUT /api/campaigns/[id]/characters/[characterId]
export async function PUT(
  request: Request,
  { params }: { params: { id: string, characterId: string } }
) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  // Verificar permissões de edição
  const character = await prisma.character.findFirst({
    where: {
      id: params.characterId,
      campaignId: params.id,
      OR: [
        { createdById: session.user.id },
        { campaign: { ownerId: session.user.id } }
      ]
    }
  })
  
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 })
  }
  
  const updatedCharacter = await prisma.character.update({
    where: { id: params.characterId },
    data: {
      name: body.name,
      avatar: body.avatar,
      data: body.data
    },
    include: {
      createdBy: {
        select: { id: true, name: true }
      }
    }
  })
  
  return NextResponse.json(updatedCharacter)
}
```

### 5. Exclusão de Personagens
```typescript
// DELETE /api/campaigns/[id]/characters/[characterId]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string, characterId: string } }
) {
  const session = await getServerSession(authOptions)
  
  // Verificar permissões de exclusão
  const character = await prisma.character.findFirst({
    where: {
      id: params.characterId,
      campaignId: params.id,
      OR: [
        { createdById: session.user.id },
        { campaign: { ownerId: session.user.id } }
      ]
    }
  })
  
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 })
  }
  
  await prisma.character.delete({
    where: { id: params.characterId }
  })
  
  return NextResponse.json({ success: true })
}
```

## Sistema de Templates

### 1. Hook useCharacterTemplates
```typescript
// hooks/use-characters.ts
export function useCharacterTemplates(campaignId: string) {
  const [templates, setTemplates] = useState<SheetTemplate[]>([])
  const [loading, setLoading] = useState(true)
  
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/sheet-templates`)
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }, [campaignId])
  
  const getTemplateForType = useCallback((type: string) => {
    return templates.find(t => t.type === type && t.isDefault) || 
           templates.find(t => t.type === type)
  }, [templates])
  
  const getDefaultFields = useCallback((type: string) => {
    const template = getTemplateForType(type)
    return template?.fields || getDefaultFieldsForType(type)
  }, [getTemplateForType])
  
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])
  
  return {
    templates,
    loading,
    getTemplateForType,
    getDefaultFields,
    refetch: fetchTemplates
  }
}
```

### 2. Templates Padrão
```typescript
function getDefaultFieldsForType(type: string) {
  switch (type) {
    case 'PC':
      return {
        basicInfo: {
          level: 1,
          class: '',
          race: '',
          background: ''
        },
        attributes: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10
        },
        combat: {
          hitPoints: 0,
          armorClass: 10,
          speed: 30
        },
        skills: {},
        equipment: [],
        spells: [],
        notes: ''
      }
    
    case 'NPC':
      return {
        basicInfo: {
          role: '',
          location: '',
          faction: ''
        },
        personality: {
          traits: '',
          ideals: '',
          bonds: '',
          flaws: ''
        },
        appearance: '',
        background: '',
        notes: ''
      }
    
    case 'CREATURE':
      return {
        stats: {
          size: 'Medium',
          type: 'humanoid',
          alignment: 'neutral',
          hitPoints: 1,
          armorClass: 10,
          speed: 30
        },
        attributes: {
          strength: 10,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10
        },
        abilities: [],
        actions: [],
        legendary: [],
        description: ''
      }
    
    default:
      return {}
  }
}
```

### 3. API de Templates
```typescript
// GET /api/campaigns/[id]/sheet-templates
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  // Verificar acesso à campanha
  const hasAccess = await validateCampaignMembership(params.id, session.user.id)
  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  const templates = await prisma.sheetTemplate.findMany({
    where: { campaignId: params.id },
    orderBy: [
      { isDefault: 'desc' },
      { type: 'asc' },
      { name: 'asc' }
    ]
  })
  
  return NextResponse.json(templates)
}
```

### 4. Criação/Atualização de Templates
```typescript
// POST /api/campaigns/[id]/sheet-templates
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  // Apenas GMs podem criar templates
  const isOwner = await validateCampaignOwnership(params.id, session.user.id)
  if (!isOwner) {
    return NextResponse.json({ error: "Only GMs can create templates" }, { status: 403 })
  }
  
  // Se está definindo como padrão, remover padrão dos outros
  if (body.isDefault) {
    await prisma.sheetTemplate.updateMany({
      where: {
        campaignId: params.id,
        type: body.type
      },
      data: { isDefault: false }
    })
  }
  
  const template = await prisma.sheetTemplate.create({
    data: {
      name: body.name,
      type: body.type,
      fields: body.fields,
      isDefault: body.isDefault || false,
      campaignId: params.id
    }
  })
  
  return NextResponse.json(template, { status: 201 })
}
```

## Hook useCharacters

### 1. Implementação Principal
```typescript
export function useCharacters(campaignId: string) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchCharacters = useCallback(async (filters?: CharacterFilters) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters?.type) params.append('type', filters.type)
      if (filters?.creator) params.append('creator', filters.creator)
      if (filters?.search) params.append('search', filters.search)
      
      const response = await fetch(
        `/api/campaigns/${campaignId}/characters?${params}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch characters')
      }
      
      const data = await response.json()
      setCharacters(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [campaignId])
  
  // Funções especializadas
  const getNPCs = useCallback(() => {
    return characters.filter(c => c.type === 'NPC')
  }, [characters])
  
  const getCreatures = useCallback(() => {
    return characters.filter(c => c.type === 'CREATURE')
  }, [characters])
  
  const getPCs = useCallback(() => {
    return characters.filter(c => c.type === 'PC')
  }, [characters])
  
  const getPlayerCharacters = useCallback((userId: string) => {
    return characters.filter(c => c.type === 'PC' && c.createdById === userId)
  }, [characters])
  
  // Funções de mutação
  const createCharacter = useCallback(async (data: CreateCharacterData) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create character')
      }
      
      const newCharacter = await response.json()
      setCharacters(prev => [newCharacter, ...prev])
      return newCharacter
    } catch (error) {
      throw error
    }
  }, [campaignId])
  
  const updateCharacter = useCallback(async (
    characterId: string, 
    data: UpdateCharacterData
  ) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/characters/${characterId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to update character')
      }
      
      const updatedCharacter = await response.json()
      setCharacters(prev => 
        prev.map(c => c.id === characterId ? updatedCharacter : c)
      )
      return updatedCharacter
    } catch (error) {
      throw error
    }
  }, [campaignId])
  
  const deleteCharacter = useCallback(async (characterId: string) => {
    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/characters/${characterId}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) {
        throw new Error('Failed to delete character')
      }
      
      setCharacters(prev => prev.filter(c => c.id !== characterId))
    } catch (error) {
      throw error
    }
  }, [campaignId])
  
  // Estatísticas
  const getStats = useCallback(() => {
    return {
      total: characters.length,
      pcs: characters.filter(c => c.type === 'PC').length,
      npcs: characters.filter(c => c.type === 'NPC').length,
      creatures: characters.filter(c => c.type === 'CREATURE').length
    }
  }, [characters])
  
  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])
  
  return {
    characters,
    loading,
    error,
    fetchCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    getNPCs,
    getCreatures,
    getPCs,
    getPlayerCharacters,
    getStats
  }
}
```

### 2. Filtros e Busca
```typescript
interface CharacterFilters {
  type?: 'PC' | 'NPC' | 'CREATURE'
  creator?: 'GM' | 'PLAYER'
  search?: string
}

export function useCharacterFilters() {
  const [filters, setFilters] = useState<CharacterFilters>({})
  
  const updateFilter = useCallback((key: keyof CharacterFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])
  
  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])
  
  return {
    filters,
    updateFilter,
    clearFilters
  }
}
```

## Componentes de Interface

### 1. Dialog de Criação Unificado
```typescript
// components/create-character-dialog.tsx
export function CreateCharacterDialog({ 
  children, 
  campaignId, 
  type, 
  onSuccess 
}: {
  children: React.ReactNode
  campaignId: string
  type?: 'PC' | 'NPC' | 'CREATURE'
  onSuccess?: (character: Character) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { getDefaultFields } = useCharacterTemplates(campaignId)
  
  const form = useForm<CreateCharacterData>({
    resolver: zodResolver(createCharacterSchema),
    defaultValues: {
      name: '',
      type: type || 'PC',
      avatar: '',
      data: {}
    }
  })
  
  const onSubmit = async (data: CreateCharacterData) => {
    try {
      setLoading(true)
      
      // Incluir campos padrão do template
      const defaultFields = getDefaultFields(data.type)
      const characterData = {
        ...data,
        data: { ...defaultFields, ...data.data }
      }
      
      const response = await fetch(`/api/campaigns/${campaignId}/characters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(characterData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create character')
      }
      
      const character = await response.json()
      toast.success('Personagem criado com sucesso!')
      onSuccess?.(character)
      setOpen(false)
      form.reset()
    } catch (error) {
      toast.error('Erro ao criar personagem')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Personagem</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do personagem" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {!type && (
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PC">Personagem (PC)</SelectItem>
                        <SelectItem value="NPC">NPC</SelectItem>
                        <SelectItem value="CREATURE">Criatura</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar (URL)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/avatar.jpg" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

### 2. Visualização de Fichas
```typescript
// components/character-sheet-view.tsx
export function CharacterSheetView({ character }: { character: Character }) {
  const { getTemplateForType } = useCharacterTemplates(character.campaignId)
  
  const template = getTemplateForType(character.type)
  const fields = template?.fields || character.data
  
  const renderField = (key: string, value: any, fieldConfig?: any) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <div key={key} className="space-y-2">
          <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
          <div className="pl-4 space-y-1">
            {Object.entries(value).map(([subKey, subValue]) => 
              renderField(subKey, subValue)
            )}
          </div>
        </div>
      )
    }
    
    return (
      <div key={key} className="flex justify-between items-center">
        <span className="text-sm font-medium capitalize">
          {key.replace(/([A-Z])/g, ' $1')}:
        </span>
        <span className="text-sm">{String(value || '-')}</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header com avatar e informações básicas */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={character.avatar || undefined} />
          <AvatarFallback>
            {character.name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h2 className="text-2xl font-bold">{character.name}</h2>
          <p className="text-muted-foreground">{character.type}</p>
          <p className="text-sm text-muted-foreground">
            Criado por {character.createdBy.name}
          </p>
        </div>
      </div>
      
      {/* Campos dinâmicos */}
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(character.data).map(([key, value]) => 
          renderField(key, value)
        )}
      </div>
    </div>
  )
}
```

### 3. Listas na Sidebar

#### Lista de NPCs
```typescript
// components/sidebar-content/npc-list.tsx
export function NpcList({ campaignId }: { campaignId: string }) {
  const { getNPCs, loading, createCharacter } = useCharacters(campaignId)
  const npcs = getNPCs()
  
  if (loading) {
    return <div className="p-4">Carregando NPCs...</div>
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">NPCs ({npcs.length})</h3>
        <CreateCharacterDialog 
          campaignId={campaignId} 
          type="NPC"
          onSuccess={() => {/* Refresh handled by hook */}}
        >
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </CreateCharacterDialog>
      </div>
      
      {npcs.length === 0 ? (
        <p className="text-sm text-muted-foreground p-2">
          Nenhum NPC criado ainda
        </p>
      ) : (
        <div className="space-y-1">
          {npcs.map(npc => (
            <ContentListItem
              key={npc.id}
              title={npc.name}
              subtitle={npc.data?.basicInfo?.role || 'NPC'}
              avatar={npc.avatar}
              onClick={() => {/* Abrir ficha */}}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

#### Lista de Criaturas
```typescript
// components/sidebar-content/creature-list.tsx
export function CreatureList({ campaignId }: { campaignId: string }) {
  const { getCreatures, loading } = useCharacters(campaignId)
  const creatures = getCreatures()
  
  if (loading) {
    return <div className="p-4">Carregando criaturas...</div>
  }
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Criaturas ({creatures.length})</h3>
        <CreateCharacterDialog 
          campaignId={campaignId} 
          type="CREATURE"
        >
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </CreateCharacterDialog>
      </div>
      
      {creatures.length === 0 ? (
        <p className="text-sm text-muted-foreground p-2">
          Nenhuma criatura criada ainda
        </p>
      ) : (
        <div className="space-y-1">
          {creatures.map(creature => (
            <ContentListItem
              key={creature.id}
              title={creature.name}
              subtitle={creature.data?.stats?.type || 'Criatura'}
              avatar={creature.avatar}
              onClick={() => {/* Abrir ficha */}}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

#### Painel de Ficha do Jogador
```typescript
// components/sidebar-content/player-character-sheet-panel.tsx
export function PlayerCharacterSheetPanel({ 
  campaignId, 
  userId 
}: { 
  campaignId: string
  userId: string 
}) {
  const { getPlayerCharacters, loading } = useCharacters(campaignId)
  const playerCharacters = getPlayerCharacters(userId)
  const mainCharacter = playerCharacters[0] // Personagem principal
  
  if (loading) {
    return <div className="p-4">Carregando ficha...</div>
  }
  
  if (!mainCharacter) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Você ainda não tem um personagem nesta campanha
        </p>
        <CreateCharacterDialog 
          campaignId={campaignId} 
          type="PC"
        >
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Criar Personagem
          </Button>
        </CreateCharacterDialog>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Mini resumo do personagem */}
      <div className="p-3 border rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={mainCharacter.avatar || undefined} />
            <AvatarFallback>
              {mainCharacter.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-medium">{mainCharacter.name}</h4>
            <p className="text-sm text-muted-foreground">
              {mainCharacter.data?.basicInfo?.class || 'Aventureiro'} Nv. {mainCharacter.data?.basicInfo?.level || 1}
            </p>
          </div>
        </div>
        
        {/* Informações rápidas */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>HP:</span>
            <span>{mainCharacter.data?.combat?.hitPoints || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>CA:</span>
            <span>{mainCharacter.data?.combat?.armorClass || 10}</span>
          </div>
        </div>
        
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full mt-3"
          onClick={() => {/* Abrir ficha completa */}}
        >
          Ver Ficha Completa
        </Button>
      </div>
      
      {/* Outros personagens (se houver) */}
      {playerCharacters.length > 1 && (
        <div>
          <h4 className="font-medium mb-2">Outros Personagens</h4>
          <div className="space-y-1">
            {playerCharacters.slice(1).map(character => (
              <ContentListItem
                key={character.id}
                title={character.name}
                subtitle={character.data?.basicInfo?.class || 'PC'}
                avatar={character.avatar}
                onClick={() => {/* Trocar personagem ativo */}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

## Correções Implementadas

### 1. Loop Infinito em useCharacterTemplates
- **Problema**: Funções não memoizadas causavam re-renders infinitos
- **Solução**: Implementação de `useCallback` em `getTemplateForType` e `getDefaultFields`

### 2. TypeError em toLowerCase
- **Problema**: Tentativa de `toLowerCase()` em propriedades undefined
- **Solução**: Validação de null/undefined antes de operações de string

### 3. Campo type Obrigatório
- **Problema**: Campo `type` não enviado para API na criação
- **Solução**: Inclusão do campo type baseado no template na requisição

### 4. Parsing de API Response
- **Problema**: Parsing incorreto da resposta da API
- **Solução**: Integração com useCharacters hook e correção do fluxo de dados

## Validação e Schemas

### 1. Schema de Criação
```typescript
const createCharacterSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  type: z.enum(["PC", "NPC", "CREATURE"]),
  avatar: z.string().url().optional().or(z.literal("")),
  data: z.record(z.any()).optional()
})
```

### 2. Schema de Atualização
```typescript
const updateCharacterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional().or(z.literal("")),
  data: z.record(z.any()).optional()
})
```

### 3. Validação de Permissões
```typescript
async function validateCharacterAccess(
  characterId: string,
  userId: string,
  action: 'read' | 'write' | 'delete'
): Promise<boolean> {
  const character = await prisma.character.findFirst({
    where: { id: characterId },
    include: { campaign: true }
  })
  
  if (!character) return false
  
  // Owner sempre pode fazer tudo
  if (character.createdById === userId) return true
  
  // GM da campanha pode fazer tudo
  if (character.campaign.ownerId === userId) return true
  
  // Jogadores podem ler PCs compartilhados
  if (action === 'read' && character.type === 'PC') {
    const isMember = await prisma.campaignMember.findFirst({
      where: {
        campaignId: character.campaignId,
        userId: userId
      }
    })
    return !!isMember
  }
  
  return false
}
```

## Próximos Passos

### Melhorias Futuras
- [ ] Sistema de aprovação de personagens pelo GM
- [ ] Versionamento de fichas
- [ ] Templates de personagem compartilháveis
- [ ] Importação/exportação de personagens
- [ ] Calculadora automática de atributos
- [ ] Sistema de progressão automática
- [ ] Integração com compêndios externos

### Funcionalidades Avançadas
- [ ] Personagens temporários (guests)
- [ ] Sistema de backup de fichas
- [ ] Histórico de alterações
- [ ] Comparação de versões
- [ ] Tags e categorização
- [ ] Busca avançada com filtros múltiplos