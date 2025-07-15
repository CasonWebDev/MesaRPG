# Sistema D&D 5e Completo - Documentação Técnica

## 📋 Visão Geral

O MesaRPG implementa um sistema completo de D&D 5e com fichas de personagem funcionais, sistema de dados integrado, rolagem de armas e magias, e gerenciamento de recursos. Este documento detalha a implementação técnica do sistema.

## 🏗️ Arquitetura do Sistema

### **Estrutura Modular**
```
lib/rpg-systems/
├── base-system.ts              # Interface base para todos os sistemas
├── types.ts                    # Tipos compartilhados
├── index.ts                    # Registro de sistemas
├── dnd5e/
│   ├── system.ts              # Implementação do sistema D&D 5e
│   ├── types.ts               # Tipos específicos do D&D 5e
│   ├── utils.ts               # Utilitários e cálculos
│   ├── default-character.ts   # Dados padrão do personagem
│   ├── character-sheet.tsx    # Wrapper da ficha
│   ├── character-creator.tsx  # Criador de personagens
│   ├── mini-card.tsx          # Mini card para sidebar
│   └── index.ts               # Exportações do sistema
└── generic/
    ├── system.ts              # Sistema genérico
    ├── character-sheet.tsx    # Ficha genérica
    └── index.ts               # Exportações genéricas
```

### **Sistema de Fichas de Personagem**
```
components/dnd-character-sheet/
├── index.tsx                  # Componente principal
├── front-page.tsx            # Página principal da ficha
├── spells-page.tsx           # Página de magias
├── equipment-page.tsx        # Página de equipamentos
├── features-page.tsx         # Página de características
├── personality-page.tsx      # Página de personalidade
├── notes-page.tsx            # Página de anotações
└── ui/
    ├── ability-score.tsx     # Componente de atributos
    ├── stat-box.tsx          # Caixas de estatísticas
    ├── dice-roller.tsx       # Sistema de rolagem
    ├── damage-roller.tsx     # Rolagem de dano
    ├── spell-roller.tsx      # Rolagem de magias
    ├── weapon-attack.tsx     # Sistema de ataques
    ├── currency-tracker.tsx  # Tracker de moedas
    └── [outros componentes]
```

## 🎯 Funcionalidades Implementadas

### **1. Sistema de Atributos**
- **Seis atributos principais**: Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma
- **Cálculo automático de modificadores**: (atributo - 10) / 2
- **Testes de resistência**: Rolagem automática com modificadores
- **Perícias**: Sistema completo com proficiências

### **2. Sistema de Dados Integrado**
```typescript
// Componente DiceRoller
interface DiceRollerProps {
  sides: number
  count?: number
  modifier?: number
  advantage?: AdvantageType
  onRoll?: (result: DiceResult) => void
}

// Tipos de vantagem
type AdvantageType = 'normal' | 'advantage' | 'disadvantage'

// Resultado da rolagem
interface DiceResult {
  total: number
  rolls: number[]
  modifier: number
  critical: boolean
  advantage: AdvantageType
  formula: string
}
```

### **3. Sistema de Combate**
- **Ataques com armas**: d20 + modificador → damage roll
- **Críticos**: Detecção automática (20 natural)
- **Vantagem/Desvantagem**: Implementação correta
- **Dano**: Multiplicador crítico aplicado corretamente

### **4. Sistema de Magias**
- **Níveis de magia**: 0-9 (truques a 9º nível)
- **Slots de magia**: Rastreamento automático
- **Rolagem de magias**: Damage, healing, save DC
- **Preparação**: Sistema de magias preparadas

### **5. Sistema de Recursos**
- **Pontos de vida**: HP atual, máximo, temporário
- **Classe de Armadura**: Cálculo automático
- **Velocidade**: Configurável por raça
- **Dados de vida**: Rastreamento por nível

## 🔧 Implementação Técnica

### **Hook de Integração com Chat**
```typescript
// hooks/use-chat-integration.ts
export const useChatIntegration = () => {
  const sendDiceRoll = useCallback((result: DiceResult, context: string) => {
    const message = formatDiceMessage(result, context)
    socket.emit('chat:send', {
      text: message,
      type: 'dice',
      timestamp: new Date().toISOString()
    })
  }, [socket])

  return { sendDiceRoll }
}
```

### **Sistema de Armas**
```typescript
// components/dnd-character-sheet/ui/weapon-attack.tsx
export function WeaponAttack({ weapon, character, onAttackRoll, onDamageRoll }) {
  const [canRollDamage, setCanRollDamage] = useState(false)
  const [lastAttackRoll, setLastAttackRoll] = useState<DiceResult | null>(null)

  const handleAttackRoll = (result: DiceResult) => {
    setLastAttackRoll(result)
    setCanRollDamage(true)
    onAttackRoll?.(result)
  }

  const handleDamageRoll = (result: DiceResult) => {
    const isCritical = lastAttackRoll?.critical || false
    const finalResult = isCritical ? applyCriticalMultiplier(result) : result
    onDamageRoll?.(finalResult)
  }

  return (
    <div className="weapon-attack">
      <DiceRoller
        sides={20}
        modifier={getAttackModifier(weapon, character)}
        onRoll={handleAttackRoll}
      />
      {canRollDamage && (
        <DamageRoller
          damage={weapon.damage}
          critical={lastAttackRoll?.critical}
          onRoll={handleDamageRoll}
        />
      )}
    </div>
  )
}
```

### **Sistema de Moedas**
```typescript
// components/dnd-character-sheet/ui/currency-tracker.tsx
const currencyTypes = [
  { key: 'copper', label: 'PC', value: currencies.copper },
  { key: 'silver', label: 'PP', value: currencies.silver },
  { key: 'electrum', label: 'PE', value: currencies.electrum },
  { key: 'gold', label: 'PO', value: currencies.gold },
  { key: 'platinum', label: 'PL', value: currencies.platinum }
]
```

## 🎮 Interface de Usuario

### **Layout da Ficha**
- **Página Principal**: Atributos, skills, combate básico
- **Página de Magias**: 3 colunas por níveis de magia
- **Página de Equipamentos**: 2 colunas (armas/items + inventário)
- **Navegação**: Tabs na parte inferior

### **Componentes Reutilizáveis**
- **AbilityScore**: Atributos com modificadores
- **StatBox**: Caixas de estatísticas padronizadas
- **BorderedBox**: Container com bordas estilizadas
- **AdvantageSelector**: Seletor de vantagem/desvantagem

## 📊 Dados do Personagem

### **Estrutura de Dados**
```typescript
interface DnD5eCharacter {
  // Informações básicas
  name: string
  level: number
  race: string
  class: string
  background: string
  alignment: string

  // Atributos
  abilities: {
    strength: number
    dexterity: number
    constitution: number
    intelligence: number
    wisdom: number
    charisma: number
  }

  // Combate
  hitPoints: {
    current: number
    maximum: number
    temporary: number
  }
  armorClass: number
  speed: number

  // Magias
  spells: {
    [level: string]: Spell[]
  }
  spellSlots: {
    [level: string]: { current: number, max: number }
  }

  // Equipamentos
  weapons: Weapon[]
  armor: Armor[]
  items: Item[]
  currencies: {
    copper: number
    silver: number
    electrum: number
    gold: number
    platinum: number
  }
}
```

## 🔄 Fluxo de Criação

### **1. Criação de Personagem**
```typescript
// Dados padrão aplicados automaticamente
const defaultCharacter = {
  name: "Novo Personagem",
  level: 1,
  race: "Humano",
  class: "Guerreiro",
  abilities: {
    strength: 15,
    dexterity: 14,
    constitution: 13,
    intelligence: 12,
    wisdom: 10,
    charisma: 8
  },
  hitPoints: { current: 10, maximum: 10, temporary: 0 },
  armorClass: 10,
  speed: 30
}
```

### **2. Fluxo de Rolagem**
1. **Usuário clica em botão de ataque**
2. **Sistema rola d20 + modificador**
3. **Resultado enviado para chat**
4. **Se crítico, habilita rolagem de dano**
5. **Rolagem de dano com multiplicador crítico**
6. **Resultado final enviado para chat**

## 🌐 Integração com Sistema

### **Registro do Sistema**
```typescript
// lib/rpg-systems/index.ts
import { DnD5eSystem } from './dnd5e'

export const RPG_SYSTEMS = {
  'dnd5e': DnD5eSystem,
  'generic': GenericSystem
}

export const getRPGSystem = (systemId: string) => {
  return RPG_SYSTEMS[systemId] || RPG_SYSTEMS.generic
}
```

### **Utilização nos Componentes**
```typescript
// Componentes podem usar o sistema registrado
const rpgSystem = getRPGSystem('dnd5e')
const characterSheet = rpgSystem.getCharacterSheet()
const miniCard = rpgSystem.getMiniCard()
```

## 🎯 Benefícios da Implementação

### **1. Modularidade**
- Sistemas independentes e plugáveis
- Fácil adição de novos sistemas de RPG
- Código reutilizável entre sistemas

### **2. Funcionalidade Completa**
- Sistema de dados integrado com chat
- Rolagem de ataques e magias
- Gerenciamento de recursos automático

### **3. Experiência do Usuário**
- Interface intuitiva e responsiva
- Feedback visual imediato
- Integração perfeita com o VTT

## 🚀 Próximos Passos

### **Melhorias Futuras**
1. **Sistema de Iniciativa**: Rastreamento de ordem de combate
2. **Automatização**: Cálculos automáticos de bônus
3. **Validação**: Regras de D&D 5e aplicadas
4. **Expansão**: Subclasses, raças adicionais
5. **Importação**: Suporte a D&D Beyond

## 📝 Conclusão

O sistema D&D 5e está **totalmente implementado e funcional**, oferecendo uma experiência completa de RPG digital. A arquitetura modular permite fácil manutenção e expansão, enquanto a integração com o chat e grid tático cria uma experiência unificada para jogadores e mestres.

A implementação prioriza **estabilidade e usabilidade**, fornecendo todas as ferramentas necessárias para campanhas de D&D 5e online de forma intuitiva e confiável.