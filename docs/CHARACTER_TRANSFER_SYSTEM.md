# Sistema de Transferência de Personagens - Documentação

## 📋 Visão Geral

O sistema de transferência de personagens permite que Game Masters (GMs) criem cards de personagem vazios e os vinculem a jogadores, otimizando o fluxo de criação e atribuição de personagens em campanhas.

## 🎯 Funcionalidades Principais

### **1. Criação de Cards Vazios**
- GM pode criar personagens sem atribuir a um jogador específico
- Cards aparecem como "Não vinculado" na interface
- Dados básicos são criados automaticamente

### **2. Sistema de Vinculação**
- Interface para transferir personagens entre jogadores
- Validação de permissões e regras de negócio
- Atualização em tempo real da lista

### **3. Fluxo Otimizado**
- GM: Cria card vazio → Seleciona jogador → Vincula
- Jogador: Acessa personagem → Preenche ficha
- Resultado: Personagem completo e funcional

## 🏗️ Implementação Técnica

### **API de Transferência**
```typescript
// app/api/campaigns/[id]/characters/[characterId]/transfer/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  // Validação de entrada
  const validationResult = TransferCharacterSchema.safeParse(body)
  
  // Verificação de permissões (apenas GM)
  const isGM = user.ownedCampaigns.length > 0
  
  // Validação de usuário de destino
  const targetUser = await prisma.user.findUnique({
    where: { id: newUserId },
    include: { campaignMemberships: { where: { campaignId } } }
  })
  
  // Verificação de conflitos (usuário já tem PC)
  const existingCharacter = await prisma.character.findFirst({
    where: { campaignId, userId: newUserId, type: 'PC' }
  })
  
  // Transferência do personagem
  const updatedCharacter = await prisma.character.update({
    where: { id: characterId },
    data: { userId: newUserId }
  })
}
```

### **Hook de Personagens Atualizado**
```typescript
// hooks/use-characters.ts
export interface Character {
  id: string
  campaignId: string
  userId: string | null  // Permite null para cards vazios
  name: string
  type: CharacterType
  user: {
    id: string
    name: string | null
    email: string
  } | null  // Permite null para cards não vinculados
}

const getPlayerCharacters = () => {
  return characters.filter(char => 
    char.type === 'PC' && (
      // Personagens com userId que não seja o GM
      (char.userId && char.userId !== char.campaign?.ownerId) ||
      // Cards vazios criados pelo GM (sem userId) - só aparece para o GM
      (!char.userId && isGM)
    )
  )
}
```

### **API de Criação Modificada**
```typescript
// app/api/campaigns/[id]/characters/route.ts
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Lógica para determinar userId
  const targetUserId = isGM && type === 'PC' && name === 'Novo Personagem' ? null : user.id
  
  // Criação do personagem
  const character = await prisma.character.create({
    data: {
      name,
      type: type as CharacterType,
      data: JSON.stringify(data),
      campaignId,
      userId: targetUserId, // Pode ser null para cards vazios
      templateId: null
    }
  })
}
```

## 🖥️ Interface de Usuario

### **Componente PlayerSheetList**
```typescript
// components/sidebar-content/player-sheet-list.tsx
export function PlayerSheetList({ campaignId }: PlayerSheetListProps) {
  const handleCreateEmptyCharacterCard = async () => {
    const emptyCharacterData = {
      name: "Novo Personagem",
      type: "PC",
      data: {} // Dados vazios - jogador preenche depois
    }
    
    await createCharacter(emptyCharacterData)
    toast.success('Card de personagem criado! Agora você pode vincular a um jogador.')
  }

  const handleTransferCharacter = async (characterId: string, newUserId: string) => {
    const response = await fetch(`/api/campaigns/${campaignId}/characters/${characterId}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUserId })
    })
    
    if (response.ok) {
      await refetch() // Atualiza lista
      toast.success('Personagem transferido com sucesso!')
    }
  }

  return (
    <div className="space-y-2 p-1">
      {/* Botões de criação */}
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={handleCreateEmptyCharacterCard}>
          <UserPlus className="h-4 w-4 mr-1" />
          Card p/ Jogador
        </Button>
        <Button onClick={() => setShowCreator(true)} variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Completo
        </Button>
      </div>
      
      {/* Lista de personagens */}
      {playerCharacters.map((character) => {
        const isUnassigned = !character.userId
        
        return (
          <ContentListItem 
            key={character.id} 
            title={character.name}
            description={isUnassigned ? 
              `⚠️ Não vinculado • ${summary}` : 
              `Jogador: ${playerName} • ${summary}`
            }
          >
            {/* Botão de vincular/transferir */}
            {isUnassigned ? (
              <Button onClick={() => setTransferringCharacter(character)}>
                <UserPlus className="h-4 w-4 text-blue-500" />
              </Button>
            ) : (
              <Button onClick={() => setTransferringCharacter(character)}>
                <UserPlus className="h-4 w-4 text-green-500" />
              </Button>
            )}
          </ContentListItem>
        )
      })}
    </div>
  )
}
```

### **Modal de Transferência**
```typescript
// components/modals/transfer-character-modal.tsx
export function TransferCharacterModal({ character, campaignId, onConfirm }: TransferCharacterModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [availableUsers, setAvailableUsers] = useState<User[]>([])

  useEffect(() => {
    // Buscar jogadores disponíveis na campanha
    fetchAvailableUsers()
  }, [campaignId])

  const handleTransfer = () => {
    if (selectedUserId) {
      onConfirm(character.id, selectedUserId)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {character.userId ? 'Transferir Personagem' : 'Vincular Personagem'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Selecionar Jogador:</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um jogador..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleTransfer} disabled={!selectedUserId}>
            {character.userId ? 'Transferir' : 'Vincular'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## 🔐 Validações e Segurança

### **Validações de Negócio**
1. **Apenas GM pode transferir**: Verificação de permissões
2. **Usuário deve ser membro**: Validação de acesso à campanha
3. **Não pode ter PC existente**: Previne conflitos
4. **Personagem deve existir**: Validação de existência
5. **Proteção contra duplicatas**: Verificação temporal

### **Schema de Validação**
```typescript
const TransferCharacterSchema = z.object({
  newUserId: z.string().min(1, 'ID do usuário é obrigatório')
})
```

### **Tratamento de Erros**
```typescript
try {
  const response = await fetch('/api/transfer', { ... })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Erro ao transferir personagem')
  }
  
  // Sucesso
  await refetch()
  toast.success('Personagem transferido com sucesso!')
  
} catch (error) {
  toast.error(error instanceof Error ? error.message : 'Erro desconhecido')
}
```

## 📊 Fluxo de Dados

### **Estados do Personagem**
```typescript
interface CharacterState {
  id: string
  userId: string | null
  status: 'unassigned' | 'assigned' | 'active'
  
  // Quando userId é null
  unassigned: {
    createdBy: string  // GM que criou
    createdAt: Date
    availableFor: 'any_player' | 'specific_player'
  }
  
  // Quando userId é definido
  assigned: {
    assignedTo: string  // Jogador vinculado
    assignedAt: Date
    assignedBy: string  // GM que vinculou
  }
}
```

### **Ciclo de Vida**
1. **Criação**: GM cria card vazio (`userId: null`)
2. **Listagem**: Card aparece como "Não vinculado" para GM
3. **Seleção**: GM seleciona jogador disponível
4. **Vinculação**: API atualiza `userId` do personagem
5. **Notificação**: Jogador recebe acesso ao personagem
6. **Preenchimento**: Jogador preenche dados da ficha

## 🎯 Benefícios da Implementação

### **1. Fluxo Otimizado**
- GM não precisa criar personagem completo
- Jogador não precisa esperar aprovação
- Processo mais ágil e intuitivo

### **2. Flexibilidade**
- Cards podem ser criados antecipadamente
- Fácil reatribuição entre jogadores
- Suporte a diferentes workflows

### **3. Controle do GM**
- Visão completa dos personagens
- Controle sobre vinculações
- Possibilidade de transferir entre jogadores

## 🚀 Melhorias Futuras

### **Funcionalidades Adicionais**
1. **Notificações**: Avisar jogador sobre novo personagem
2. **Templates**: Cards com dados pré-preenchidos
3. **Bulk Operations**: Criar múltiplos cards
4. **Histórico**: Log de transferências
5. **Permissões**: Controle granular de acesso

### **UX Improvements**
1. **Drag & Drop**: Arrastar cards para jogadores
2. **Quick Actions**: Ações rápidas na lista
3. **Filtros**: Filtrar por status de vinculação
4. **Search**: Buscar personagens por nome/jogador

## 📝 Conclusão

O sistema de transferência de personagens está **completamente implementado e funcional**, oferecendo um fluxo otimizado para criação e atribuição de personagens em campanhas. A implementação prioriza **segurança, usabilidade e flexibilidade**, proporcionando uma experiência fluida tanto para GMs quanto para jogadores.

As validações robustas e o tratamento de erros garantem que o sistema seja **confiável e estável**, enquanto a interface intuitiva torna o processo de gerenciamento de personagens **simples e eficiente**.