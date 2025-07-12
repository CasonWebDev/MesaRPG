# Sistema de Gerenciamento de Campanhas

## Visão Geral

O sistema de gerenciamento de campanhas é o núcleo do MesaRPG, permitindo que Game Masters (GMs) criem, configurem e administrem campanhas de RPG, enquanto jogadores podem descobrir e participar de sessões.

## Funcionalidades Principais

### 1. Dashboard de Campanhas
- **Arquivo**: `app/dashboard/page.tsx`
- **Tipo**: Server Component
- **Funcionalidades**:
  - Listagem dinâmica de campanhas do usuário
  - Separação entre campanhas próprias (como GM) e participação (como Jogador)
  - Estado vazio com call-to-action para criar primeira campanha
  - Cards informativos com dados da campanha

### 2. Criação de Campanhas
- **Dialog**: `components/create-campaign-dialog.tsx`
- **API**: `POST /api/campaigns/create`
- **Funcionalidades**:
  - Formulário com validação completa
  - Seleção de sistema de RPG
  - Toast notifications para feedback
  - Redirecionamento automático após criação

### 3. Configurações da Campanha
- **Página**: `app/campaign/[id]/settings/page.tsx`
- **Funcionalidades**:
  - Interface tabbed para organização
  - Configurações gerais da campanha
  - Gerenciamento de jogadores
  - Editor de templates de ficha
  - Sistema de convites

## Estrutura de Dados

### Campaign Model (Prisma)
```prisma
model Campaign {
  id               String            @id @default(cuid())
  name             String
  description      String?
  system           String            // Sistema de RPG (D&D 5e, Pathfinder, etc.)
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  
  // Relacionamentos
  ownerId          String
  owner            User              @relation("CampaignOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members          CampaignMember[]
  maps             Map[]
  characters       Character[]
  chatMessages     ChatMessage[]
  handouts         Handout[]
  gameState        GameState?
  sheetTemplates   SheetTemplate[]
  files            File[]
}

model CampaignMember {
  id           String     @id @default(cuid())
  role         String     @default("PLAYER") // PLAYER, GM
  joinedAt     DateTime   @default(now())
  
  // Relacionamentos
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaignId   String
  campaign     Campaign   @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  @@unique([userId, campaignId])
}
```

### Campaign Invite Model
```prisma
model CampaignInvite {
  id           String    @id @default(cuid())
  token        String    @unique
  email        String?
  expiresAt    DateTime
  usedAt       DateTime?
  createdAt    DateTime  @default(now())
  
  // Relacionamentos
  campaignId   String
  campaign     Campaign  @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  createdById  String
  createdBy    User      @relation(fields: [createdById], references: [id], onDelete: Cascade)
}
```

## APIs Implementadas

### 1. Listagem de Campanhas
```typescript
// GET /api/campaigns
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  // Busca campanhas próprias e participações
  const ownedCampaigns = await prisma.campaign.findMany({
    where: { ownerId: session.user.id },
    include: { members: true }
  })
  
  const memberCampaigns = await prisma.campaignMember.findMany({
    where: { userId: session.user.id },
    include: { campaign: true }
  })
  
  return NextResponse.json({
    ownedCampaigns,
    memberCampaigns: memberCampaigns.map(m => m.campaign)
  })
}
```

### 2. Criação de Campanhas
```typescript
// POST /api/campaigns/create
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  const campaign = await prisma.campaign.create({
    data: {
      name: body.name,
      description: body.description,
      system: body.system,
      ownerId: session.user.id
    }
  })
  
  return NextResponse.json(campaign, { status: 201 })
}
```

### 3. Detalhes da Campanha
```typescript
// GET /api/campaigns/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: params.id,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } }
      ]
    },
    include: {
      owner: true,
      members: { include: { user: true } },
      _count: {
        select: {
          characters: true,
          maps: true,
          handouts: true
        }
      }
    }
  })
  
  return NextResponse.json(campaign)
}
```

### 4. Atualização de Campanhas
```typescript
// PUT /api/campaigns/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  // Verificar se usuário é o owner
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: params.id,
      ownerId: session.user.id
    }
  })
  
  if (!campaign) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  const updatedCampaign = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      name: body.name,
      description: body.description,
      system: body.system
    }
  })
  
  return NextResponse.json(updatedCampaign)
}
```

### 5. Exclusão de Campanhas
```typescript
// DELETE /api/campaigns/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  
  // Verificar ownership
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: params.id,
      ownerId: session.user.id
    }
  })
  
  if (!campaign) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  await prisma.campaign.delete({
    where: { id: params.id }
  })
  
  return NextResponse.json({ success: true })
}
```

## Sistema de Convites

### 1. Criação de Convites
```typescript
// POST /api/campaigns/[id]/create-invite
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  // Verificar se é GM da campanha
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: params.id,
      ownerId: session.user.id
    }
  })
  
  if (!campaign) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // 24 horas
  
  const invite = await prisma.campaignInvite.create({
    data: {
      token,
      email: body.email,
      expiresAt,
      campaignId: params.id,
      createdById: session.user.id
    }
  })
  
  return NextResponse.json({
    inviteUrl: `${process.env.NEXTAUTH_URL}/invite/${token}`
  })
}
```

### 2. Página de Aceite de Convites
```typescript
// app/invite/[token]/page.tsx
export default async function InvitePage({
  params
}: {
  params: { token: string }
}) {
  const invite = await prisma.campaignInvite.findUnique({
    where: { token: params.token },
    include: { campaign: true, createdBy: true }
  })
  
  if (!invite || invite.expiresAt < new Date() || invite.usedAt) {
    return <InvalidInvite />
  }
  
  return <InviteAcceptPage invite={invite} />
}
```

### 3. API de Aceite de Convites
```typescript
// POST /api/invites/[token]
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const session = await getServerSession(authOptions)
  
  const invite = await prisma.campaignInvite.findUnique({
    where: { token: params.token },
    include: { campaign: true }
  })
  
  if (!invite || invite.expiresAt < new Date() || invite.usedAt) {
    return NextResponse.json({ error: "Invalid invite" }, { status: 400 })
  }
  
  // Verificar se já é membro
  const existingMember = await prisma.campaignMember.findUnique({
    where: {
      userId_campaignId: {
        userId: session.user.id,
        campaignId: invite.campaignId
      }
    }
  })
  
  if (existingMember) {
    return NextResponse.json({ error: "Already a member" }, { status: 400 })
  }
  
  // Adicionar como membro e marcar convite como usado
  await prisma.$transaction([
    prisma.campaignMember.create({
      data: {
        userId: session.user.id,
        campaignId: invite.campaignId,
        role: "PLAYER"
      }
    }),
    prisma.campaignInvite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() }
    })
  ])
  
  return NextResponse.json({ success: true })
}
```

## Gerenciamento de Jogadores

### 1. Componente de Gerenciamento
- **Arquivo**: `components/settings/player-management.tsx`
- **Funcionalidades**:
  - Lista de membros atuais
  - Criação de convites
  - Remoção de jogadores
  - Alteração de roles (futuro)

### 2. API de Busca de Jogadores
```typescript
// GET /api/campaigns/[id]/search-players
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } }
      ],
      // Excluir membros atuais
      campaignMemberships: {
        none: { campaignId: params.id }
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    },
    take: 10
  })
  
  return NextResponse.json(users)
}
```

### 3. API para Adicionar Jogador
```typescript
// POST /api/campaigns/[id]/add-player
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  // Verificar se é GM
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: params.id,
      ownerId: session.user.id
    }
  })
  
  if (!campaign) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  const member = await prisma.campaignMember.create({
    data: {
      userId: body.userId,
      campaignId: params.id,
      role: "PLAYER"
    },
    include: { user: true }
  })
  
  return NextResponse.json(member)
}
```

### 4. API para Remover Jogador
```typescript
// POST /api/campaigns/[id]/remove-player
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const body = await request.json()
  
  // Verificar se é GM
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: params.id,
      ownerId: session.user.id
    }
  })
  
  if (!campaign) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }
  
  await prisma.campaignMember.delete({
    where: {
      userId_campaignId: {
        userId: body.userId,
        campaignId: params.id
      }
    }
  })
  
  return NextResponse.json({ success: true })
}
```

## Configurações Gerais

### 1. Componente de Configurações
- **Arquivo**: `components/settings/general-settings.tsx`
- **Funcionalidades**:
  - Edição de nome e descrição
  - Alteração de sistema de RPG
  - Configurações avançadas
  - Validação em tempo real

### 2. Interface de Configuração
```typescript
interface CampaignSettings {
  name: string
  description?: string
  system: string
  isPublic: boolean
  allowPlayerCharacterCreation: boolean
  maxPlayers?: number
  settings: {
    diceRolling: 'public' | 'gm_only' | 'private'
    characterSheets: 'editable' | 'gm_approval' | 'read_only'
    handouts: 'gm_only' | 'shared'
  }
}
```

## Dashboard Interface

### 1. Server Component Principal
```typescript
// app/dashboard/page.tsx
export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  // Buscar campanhas do usuário
  const [ownedCampaigns, memberCampaigns] = await Promise.all([
    prisma.campaign.findMany({
      where: { ownerId: session.user.id },
      include: {
        members: { include: { user: true } },
        _count: {
          select: {
            characters: true,
            maps: true,
            handouts: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.campaignMember.findMany({
      where: { userId: session.user.id },
      include: {
        campaign: {
          include: {
            owner: true,
            _count: {
              select: {
                members: true,
                characters: true
              }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })
  ])
  
  return (
    <div className="container mx-auto py-6">
      <DashboardHeader />
      <CampaignGrid 
        ownedCampaigns={ownedCampaigns}
        memberCampaigns={memberCampaigns.map(m => m.campaign)}
      />
    </div>
  )
}
```

### 2. Campaign Cards
```typescript
function CampaignCard({ campaign, isOwner }: {
  campaign: Campaign & {
    owner?: User,
    members?: CampaignMember[],
    _count?: { characters: number, maps: number, handouts: number }
  },
  isOwner: boolean
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{campaign.name}</CardTitle>
            <CardDescription>{campaign.system}</CardDescription>
          </div>
          {isOwner && <OwnerBadge />}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {campaign.description || "Sem descrição"}
        </p>
        
        <div className="flex justify-between text-sm">
          <span>{campaign._count?.characters || 0} personagens</span>
          <span>{campaign._count?.maps || 0} mapas</span>
          <span>{campaign.members?.length || 0} jogadores</span>
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="flex gap-2 w-full">
          <Button asChild className="flex-1">
            <Link href={`/campaign/${campaign.id}/play`}>
              Entrar
            </Link>
          </Button>
          {isOwner && (
            <Button variant="outline" asChild>
              <Link href={`/campaign/${campaign.id}/settings`}>
                Configurar
              </Link>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
```

## Validação e Segurança

### 1. Validação de Ownership
```typescript
async function validateCampaignOwnership(
  campaignId: string, 
  userId: string
): Promise<boolean> {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      ownerId: userId
    }
  })
  
  return !!campaign
}
```

### 2. Validação de Membership
```typescript
async function validateCampaignMembership(
  campaignId: string,
  userId: string
): Promise<'owner' | 'member' | null> {
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    include: { members: true }
  })
  
  if (!campaign) return null
  if (campaign.ownerId === userId) return 'owner'
  return 'member'
}
```

### 3. Middleware de Autorização
```typescript
export function withCampaignAuth(
  handler: (req: Request, context: { params: { id: string } }) => Promise<Response>,
  requiredRole: 'owner' | 'member' = 'member'
) {
  return async (req: Request, context: { params: { id: string } }) => {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const userRole = await validateCampaignMembership(
      context.params.id,
      session.user.id
    )
    
    if (!userRole || (requiredRole === 'owner' && userRole !== 'owner')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    return handler(req, context)
  }
}
```

## Estados e Loading

### 1. Estado Vazio
```typescript
function EmptyState() {
  return (
    <div className="text-center py-12">
      <Dice6 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">
        Nenhuma campanha encontrada
      </h3>
      <p className="text-muted-foreground mb-4">
        Crie sua primeira campanha para começar a jogar!
      </p>
      <CreateCampaignDialog>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Criar Campanha
        </Button>
      </CreateCampaignDialog>
    </div>
  )
}
```

### 2. Loading States
```typescript
function CampaignCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-16 w-full mb-4" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  )
}
```

## Próximos Passos

### Melhorias Futuras
- [ ] Sistema de tags para campanhas
- [ ] Campanhas públicas/descobríveis
- [ ] Templates de campanha
- [ ] Arquivamento de campanhas
- [ ] Clonagem de campanhas
- [ ] Estatísticas avançadas
- [ ] Logs de atividade da campanha

### Integrações
- [ ] Integração com calendário
- [ ] Notificações por email
- [ ] Discord/Slack webhooks
- [ ] Backup automático
- [ ] Export/Import de campanhas