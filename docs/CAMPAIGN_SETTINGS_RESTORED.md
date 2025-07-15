# Página de Configurações da Campanha - Restaurada

## 📋 Visão Geral

A página de configurações da campanha foi restaurada para permitir que Game Masters (GMs) gerenciem suas campanhas, especialmente o **sistema de convites de jogadores**, que é essencial para o funcionamento do MesaRPG.

## 🎯 Funcionalidades Restauradas

### **1. Acesso às Configurações**
- **Dashboard**: Botão "Configurações" no dropdown menu dos cards de campanha
- **Interface de Jogo**: Botão "Configurações" no header (apenas para GMs)
- **Rota**: `/campaign/[id]/settings`

### **2. Abas de Configuração**
- **Geral**: Configurações básicas da campanha
- **Jogadores**: Gerenciamento de jogadores e sistema de convites

## 🏗️ Arquitetura Implementada

### **Páginas e Componentes**
```
app/campaign/[id]/settings/
├── page.tsx                    # Server Component principal
└── settings-client.tsx         # Client Component com tabs

components/settings/
├── general-settings.tsx        # Configurações gerais
└── player-management.tsx       # Gerenciamento de jogadores
```

### **APIs Utilizadas**
- `PUT /api/campaigns/[id]` - Atualizar configurações gerais
- `POST /api/campaigns/[id]/create-invite` - Criar convites
- `POST /api/campaigns/[id]/remove-player` - Remover jogadores
- `GET /api/campaigns/[id]/players` - Listar membros

## 📄 Implementação das Páginas

### **1. Página Principal (Server Component)**
```typescript
// app/campaign/[id]/settings/page.tsx
export default async function CampaignSettingsPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  const resolvedParams = await params

  // Verificar se usuário é GM da campanha
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: resolvedParams.id,
      ownerId: user.id
    },
    include: {
      owner: true,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      }
    }
  })

  return <SettingsClient campaign={campaign} />
}
```

### **2. Cliente das Configurações**
```typescript
// app/campaign/[id]/settings/settings-client.tsx
export function SettingsClient({ campaign }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="general">Geral</TabsTrigger>
        <TabsTrigger value="players">Jogadores</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">
        <GeneralSettings campaign={campaign} />
      </TabsContent>
      
      <TabsContent value="players">
        <PlayerManagement 
          campaignId={campaign.id} 
          members={campaign.members}
        />
      </TabsContent>
    </Tabs>
  )
}
```

## ⚙️ Configurações Gerais

### **Funcionalidades**
- **Nome da Campanha**: Edição do nome
- **Sistema de RPG**: Seleção do sistema (D&D 5e, Pathfinder, etc.)
- **Descrição**: Texto descritivo da campanha
- **Validação**: Validação em tempo real
- **Feedback**: Toast notifications

### **Implementação**
```typescript
// components/settings/general-settings.tsx
export function GeneralSettings({ campaign }: GeneralSettingsProps) {
  const [formData, setFormData] = useState({
    name: campaign.name,
    description: campaign.description || "",
    system: campaign.system
  })

  const handleSubmit = async (e: React.FormEvent) => {
    const response = await fetch(`/api/campaigns/${campaign.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (response.ok) {
      toast.success('Configurações atualizadas com sucesso!')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input value={formData.name} onChange={...} />
      <Select value={formData.system} onValueChange={...} />
      <Textarea value={formData.description} onChange={...} />
      <Button type="submit">Salvar Configurações</Button>
    </form>
  )
}
```

## 👥 Gerenciamento de Jogadores

### **Funcionalidades Principais**
- **Criar Convites**: Geração de links de convite com email
- **Gerenciar Membros**: Visualização e remoção de jogadores
- **Expiração**: Convites expiram em 24 horas
- **Validação**: Verificação de duplicatas e permissões

### **Seção de Convites**
```typescript
// Criação de convites
const handleCreateInvite = async () => {
  const response = await fetch(`/api/campaigns/${campaignId}/create-invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: inviteEmail })
  })

  const data = await response.json()
  setInviteUrl(data.inviteUrl)
  toast.success('Convite criado com sucesso!')
}

// Interface de convite
<div className="flex gap-2">
  <Input
    type="email"
    value={inviteEmail}
    onChange={(e) => setInviteEmail(e.target.value)}
    placeholder="email@exemplo.com"
  />
  <Button onClick={handleCreateInvite}>
    Criar Convite
  </Button>
</div>

{inviteUrl && (
  <div className="p-4 bg-muted rounded-lg">
    <Input value={inviteUrl} readOnly />
    <Button onClick={handleCopyInvite}>
      <Copy className="h-4 w-4" />
    </Button>
    <p className="text-sm text-muted-foreground">
      Este link expira em 24 horas
    </p>
  </div>
)}
```

### **Lista de Membros**
```typescript
// Visualização de membros
{members.map((member) => (
  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
        <span>{member.user.name?.charAt(0) || member.user.email.charAt(0)}</span>
      </div>
      <div>
        <div className="font-medium">{member.user.name || member.user.email}</div>
        <div className="text-sm text-muted-foreground">
          Entrou em {format(new Date(member.joinedAt), 'dd/MM/yyyy')}
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Badge variant={member.role === 'GM' ? 'default' : 'secondary'}>
        {member.role === 'GM' ? 'Mestre' : 'Jogador'}
      </Badge>
      
      {member.role !== 'GM' && (
        <Button onClick={() => handleRemovePlayer(member.user.id)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  </div>
))}
```

## 🔗 Integração com Sistema de Convites

### **Fluxo Completo**
1. **GM cria convite** na página de configurações
2. **Link é gerado** com token único
3. **Jogador acessa link** (`/invite/[token]`)
4. **Jogador aceita convite** (se logado)
5. **Jogador é adicionado** à campanha como membro
6. **Convite é marcado** como usado

### **APIs Integradas**
```typescript
// Criar convite
POST /api/campaigns/[id]/create-invite
{
  "email": "jogador@exemplo.com"
}

// Resposta
{
  "inviteUrl": "http://localhost:3000/invite/abc123-def456-..."
}

// Aceitar convite
POST /api/invites/[token]
// Adiciona usuário como membro e marca convite como usado
```

## 🎨 Interface de Usuario

### **Design Responsivo**
- **Layout com tabs** para organização
- **Cards informativos** para cada seção
- **Feedback visual** com toast notifications
- **Estados de loading** para operações async
- **Validação em tempo real** nos formulários

### **Acessibilidade**
- **Navegação por teclado** nas tabs
- **Labels apropriados** em todos os campos
- **Feedback de erro** claro e acessível
- **Contrast adequado** para todos os elementos

## 🔐 Segurança e Validação

### **Permissões**
- **Apenas GMs** podem acessar configurações
- **Validação de ownership** em todas as operações
- **Verificação de sessão** obrigatória
- **Proteção contra CSRF** com tokens

### **Validação de Dados**
```typescript
// Validação de formulário
const formData = {
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  system: z.enum(['dnd5e', 'pathfinder', 'call-of-cthulhu', 'savage-worlds', 'generic'])
}

// Validação de convite
const inviteData = {
  email: z.string().email('Email inválido')
}
```

## 🚀 Benefícios da Restauração

### **1. Funcionalidade Essencial**
- **Sistema de convites** é fundamental para funcionamento
- **Gerenciamento de jogadores** necessário para GMs
- **Configurações básicas** para customização

### **2. Experiência do Usuário**
- **Acesso fácil** via dashboard e interface de jogo
- **Interface intuitiva** com tabs organizadas
- **Feedback imediato** com toast notifications
- **Validação clara** de erros e sucessos

### **3. Integração Perfeita**
- **APIs existentes** já implementadas
- **Componentes reutilizáveis** do sistema de design
- **Validação robusta** com Zod e TypeScript
- **Estilo consistente** com resto da aplicação

## 📝 Conclusão

A página de configurações da campanha foi **restaurada com sucesso**, oferecendo:

- ✅ **Sistema de convites** totalmente funcional
- ✅ **Gerenciamento de jogadores** completo
- ✅ **Configurações gerais** da campanha
- ✅ **Interface intuitiva** e responsiva
- ✅ **Integração perfeita** com APIs existentes
- ✅ **Segurança robusta** com validação completa

Esta restauração garante que GMs possam **convidar jogadores** e **gerenciar campanhas** de forma eficiente, mantendo a funcionalidade essencial do MesaRPG.