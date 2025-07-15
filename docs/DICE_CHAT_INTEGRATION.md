# Sistema de Dados e Integração com Chat - Documentação

## 📋 Visão Geral

O sistema de dados integrado permite rolagem de dados diretamente das fichas de personagem com resultados automáticos no chat em tempo real. Suporta todos os tipos de rolagem do D&D 5e incluindo ataques, dano, magias, testes de atributo e resistência.

## 🎯 Funcionalidades Principais

### **1. Rolagem de Dados Completa**
- Suporte a todos os tipos de dados (d4, d6, d8, d10, d12, d20, d100)
- Vantagem e desvantagem automática
- Modificadores dinâmicos
- Detecção de críticos (natural 20)

### **2. Integração com Chat**
- Resultados aparecem automaticamente no chat
- Mensagens formatadas com contexto
- Identificação do jogador que rolou
- Timestamp automático

### **3. Tipos de Rolagem**
- **Ataques**: d20 + modificador → rolagem de dano
- **Dano**: Multiplicador crítico automático
- **Magias**: Dano, cura, save DC
- **Testes**: Atributos, perícias, resistências
- **Custom**: Rolagens personalizadas

## 🏗️ Implementação Técnica

### **Hook de Integração**
```typescript
// hooks/use-chat-integration.ts
export const useChatIntegration = () => {
  const { socket } = useSocket()
  
  const sendDiceRoll = useCallback((result: DiceResult, context: string) => {
    if (!socket) return
    
    const message = formatDiceMessage(result, context)
    
    socket.emit('chat:send', {
      text: message,
      type: 'dice',
      timestamp: new Date().toISOString(),
      diceResult: result
    })
  }, [socket])
  
  const formatDiceMessage = (result: DiceResult, context: string) => {
    const { total, rolls, modifier, critical, advantage, formula } = result
    
    let message = `🎲 **${context}**\n`
    message += `**Fórmula:** ${formula}\n`
    message += `**Rolagens:** [${rolls.join(', ')}]`
    
    if (modifier !== 0) {
      message += ` + ${modifier}`
    }
    
    if (advantage === 'advantage') {
      message += ` (Vantagem)`
    } else if (advantage === 'disadvantage') {
      message += ` (Desvantagem)`
    }
    
    message += `\n**Total:** ${total}`
    
    if (critical) {
      message += ` ⚡ **CRÍTICO!**`
    }
    
    return message
  }
  
  return { sendDiceRoll }
}
```

### **Componente DiceRoller**
```typescript
// components/dnd-character-sheet/ui/dice-roller.tsx
export function DiceRoller({ 
  sides, 
  count = 1, 
  modifier = 0, 
  advantage = 'normal',
  label,
  onRoll 
}: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false)
  const { sendDiceRoll } = useChatIntegration()
  
  const handleRoll = () => {
    setIsRolling(true)
    
    const result = rollDice({
      sides,
      count,
      modifier,
      advantage
    })
    
    // Enviar para chat
    sendDiceRoll(result, label || `${count}d${sides}`)
    
    // Callback para componente pai
    onRoll?.(result)
    
    setTimeout(() => setIsRolling(false), 500)
  }
  
  return (
    <Button
      onClick={handleRoll}
      disabled={isRolling}
      className="dice-roller"
    >
      {isRolling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Dice6 className="h-4 w-4 mr-2" />
          {label || `${count}d${sides}`}
        </>
      )}
    </Button>
  )
}
```

### **Sistema de Rolagem**
```typescript
// lib/dice.ts
export interface DiceResult {
  total: number
  rolls: number[]
  modifier: number
  critical: boolean
  advantage: AdvantageType
  formula: string
}

export function rollDice({
  sides,
  count = 1,
  modifier = 0,
  advantage = 'normal'
}: RollDiceParams): DiceResult {
  let rolls: number[] = []
  
  if (advantage === 'advantage') {
    // Rola 2 dados e pega o maior
    const roll1 = rollSingle(sides, count)
    const roll2 = rollSingle(sides, count)
    rolls = roll1.sum > roll2.sum ? roll1.rolls : roll2.rolls
  } else if (advantage === 'disadvantage') {
    // Rola 2 dados e pega o menor
    const roll1 = rollSingle(sides, count)
    const roll2 = rollSingle(sides, count)
    rolls = roll1.sum < roll2.sum ? roll1.rolls : roll2.rolls
  } else {
    // Rolagem normal
    rolls = rollSingle(sides, count).rolls
  }
  
  const sum = rolls.reduce((a, b) => a + b, 0)
  const total = sum + modifier
  const critical = sides === 20 && rolls.includes(20)
  
  return {
    total,
    rolls,
    modifier,
    critical,
    advantage,
    formula: formatFormula(count, sides, modifier, advantage)
  }
}

function rollSingle(sides: number, count: number) {
  const rolls = Array.from({ length: count }, () => 
    Math.floor(Math.random() * sides) + 1
  )
  return { rolls, sum: rolls.reduce((a, b) => a + b, 0) }
}
```

## 🗡️ Sistema de Ataques

### **Componente WeaponAttack**
```typescript
// components/dnd-character-sheet/ui/weapon-attack.tsx
export function WeaponAttack({ 
  weapon, 
  character, 
  onAttackRoll, 
  onDamageRoll 
}: WeaponAttackProps) {
  const [canRollDamage, setCanRollDamage] = useState(false)
  const [lastAttackRoll, setLastAttackRoll] = useState<DiceResult | null>(null)
  const [advantage, setAdvantage] = useState<AdvantageType>('normal')
  
  const attackModifier = getAttackModifier(weapon, character)
  const damageModifier = getDamageModifier(weapon, character)
  
  const handleAttackRoll = (result: DiceResult) => {
    setLastAttackRoll(result)
    setCanRollDamage(true)
    onAttackRoll?.(result)
  }
  
  const handleDamageRoll = (result: DiceResult) => {
    const isCritical = lastAttackRoll?.critical || false
    const finalResult = isCritical ? 
      applyCriticalMultiplier(result, weapon.criticalMultiplier) : 
      result
    
    onDamageRoll?.(finalResult)
    setCanRollDamage(false)
    setLastAttackRoll(null)
  }
  
  return (
    <div className="weapon-attack-container">
      <div className="attack-header">
        <h3>{weapon.name}</h3>
        <AdvantageSelector 
          value={advantage} 
          onChange={setAdvantage} 
        />
      </div>
      
      <div className="attack-actions">
        <DiceRoller
          sides={20}
          modifier={attackModifier}
          advantage={advantage}
          label={`Ataque: ${weapon.name}`}
          onRoll={handleAttackRoll}
        />
        
        {canRollDamage && (
          <DamageRoller
            damage={weapon.damage}
            modifier={damageModifier}
            critical={lastAttackRoll?.critical}
            label={`Dano: ${weapon.name}`}
            onRoll={handleDamageRoll}
          />
        )}
      </div>
    </div>
  )
}
```

### **Componente DamageRoller**
```typescript
// components/dnd-character-sheet/ui/damage-roller.tsx
export function DamageRoller({ 
  damage, 
  modifier = 0, 
  critical = false, 
  label,
  onRoll 
}: DamageRollerProps) {
  const { sendDiceRoll } = useChatIntegration()
  
  const handleRoll = () => {
    const result = rollDamage({
      damage,
      modifier,
      critical
    })
    
    const contextLabel = critical ? 
      `${label} (CRÍTICO!)` : 
      label || 'Dano'
    
    sendDiceRoll(result, contextLabel)
    onRoll?.(result)
  }
  
  return (
    <Button
      onClick={handleRoll}
      variant="destructive"
      className="damage-roller"
    >
      <Zap className="h-4 w-4 mr-2" />
      {critical ? 'Dano Crítico' : 'Dano'}
    </Button>
  )
}

function rollDamage({
  damage,
  modifier,
  critical
}: RollDamageParams): DiceResult {
  // Parse damage string (ex: "1d8", "2d6+1")
  const damageRegex = /(\d+)d(\d+)(?:\+(\d+))?/
  const match = damage.match(damageRegex)
  
  if (!match) {
    throw new Error('Formato de dano inválido')
  }
  
  let [, countStr, sidesStr, bonusStr] = match
  let count = parseInt(countStr)
  const sides = parseInt(sidesStr)
  const bonus = parseInt(bonusStr || '0')
  
  // Dobrar dados em crítico
  if (critical) {
    count *= 2
  }
  
  const rolls = Array.from({ length: count }, () => 
    Math.floor(Math.random() * sides) + 1
  )
  
  const sum = rolls.reduce((a, b) => a + b, 0)
  const total = sum + bonus + modifier
  
  return {
    total,
    rolls,
    modifier: bonus + modifier,
    critical,
    advantage: 'normal',
    formula: formatDamageFormula(countStr, sides, bonus, modifier, critical)
  }
}
```

## 🎭 Sistema de Magias

### **Componente SpellRoller**
```typescript
// components/dnd-character-sheet/ui/spell-roller.tsx
export function SpellRoller({ 
  spell, 
  character, 
  spellLevel,
  onRoll 
}: SpellRollerProps) {
  const { sendDiceRoll } = useChatIntegration()
  
  const spellcastingModifier = getSpellcastingModifier(character)
  const spellSaveDC = 8 + character.proficiencyBonus + spellcastingModifier
  
  const handleDamageRoll = () => {
    const damage = getSpellDamage(spell, spellLevel)
    const result = rollSpellDamage(damage)
    
    sendDiceRoll(result, `${spell.name} (Dano)`)
    onRoll?.(result)
  }
  
  const handleHealingRoll = () => {
    const healing = getSpellHealing(spell, spellLevel)
    const result = rollSpellHealing(healing)
    
    sendDiceRoll(result, `${spell.name} (Cura)`)
    onRoll?.(result)
  }
  
  const handleSaveRoll = () => {
    const result = {
      total: spellSaveDC,
      rolls: [],
      modifier: 0,
      critical: false,
      advantage: 'normal' as AdvantageType,
      formula: `CD ${spellSaveDC}`
    }
    
    sendDiceRoll(result, `${spell.name} (Resistência)`)
    onRoll?.(result)
  }
  
  return (
    <div className="spell-roller">
      <div className="spell-header">
        <h4>{spell.name}</h4>
        <span className="spell-level">Nível {spellLevel}</span>
      </div>
      
      <div className="spell-actions">
        {spell.damage && (
          <Button onClick={handleDamageRoll} variant="destructive">
            <Zap className="h-4 w-4 mr-2" />
            Dano
          </Button>
        )}
        
        {spell.healing && (
          <Button onClick={handleHealingRoll} variant="outline">
            <Heart className="h-4 w-4 mr-2" />
            Cura
          </Button>
        )}
        
        {spell.save && (
          <Button onClick={handleSaveRoll} variant="secondary">
            <Shield className="h-4 w-4 mr-2" />
            CD {spellSaveDC}
          </Button>
        )}
      </div>
    </div>
  )
}
```

## 💬 Formatação de Mensagens

### **Tipos de Mensagem**
```typescript
// Ataque
🎲 **Ataque: Espada Longa**
**Fórmula:** 1d20+5
**Rolagens:** [18] + 5
**Total:** 23

// Dano
🎲 **Dano: Espada Longa**
**Fórmula:** 1d8+3
**Rolagens:** [6] + 3
**Total:** 9

// Crítico
🎲 **Dano: Espada Longa (CRÍTICO!)**
**Fórmula:** 2d8+3
**Rolagens:** [6, 4] + 3
**Total:** 13 ⚡ **CRÍTICO!**

// Magia
🎲 **Bola de Fogo (Dano)**
**Fórmula:** 8d6
**Rolagens:** [3, 6, 2, 4, 5, 1, 6, 3]
**Total:** 30

// Resistência
🎲 **Bola de Fogo (Resistência)**
**Fórmula:** CD 15
**Total:** 15

// Vantagem
🎲 **Teste de Percepção**
**Fórmula:** 1d20+3
**Rolagens:** [16] + 3 (Vantagem)
**Total:** 19
```

## 🔧 Configurações e Customização

### **Seletor de Vantagem**
```typescript
// components/dnd-character-sheet/ui/advantage-selector.tsx
export function AdvantageSelector({ 
  value, 
  onChange 
}: AdvantageSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="normal">Normal</SelectItem>
        <SelectItem value="advantage">Vantagem</SelectItem>
        <SelectItem value="disadvantage">Desvantagem</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

### **Modificadores Dinâmicos**
```typescript
// lib/dnd-utils.ts
export function getAttackModifier(weapon: Weapon, character: Character): number {
  const ability = weapon.ability || 'strength'
  const abilityModifier = getAbilityModifier(character.abilities[ability])
  const proficiencyBonus = character.proficiencyBonus || 2
  
  return abilityModifier + (weapon.proficient ? proficiencyBonus : 0)
}

export function getDamageModifier(weapon: Weapon, character: Character): number {
  const ability = weapon.ability || 'strength'
  return getAbilityModifier(character.abilities[ability])
}

export function getSpellcastingModifier(character: Character): number {
  const spellcastingAbility = character.spellcastingAbility || 'intelligence'
  return getAbilityModifier(character.abilities[spellcastingAbility])
}
```

## 🌐 Integração com WebSocket

### **Eventos de Dados**
```typescript
// lib/socket-bridge.js
io.on('connection', (socket) => {
  socket.on('chat:send', (data) => {
    if (data.type === 'dice') {
      // Processar rolagem de dados
      const message = {
        ...data,
        userId: socket.userId,
        userName: socket.userName,
        id: generateId(),
        timestamp: new Date().toISOString()
      }
      
      // Enviar para todos na campanha
      socket.to(data.campaignId).emit('chat:message', message)
      socket.emit('chat:message', message)
    }
  })
})
```

### **Histórico de Rolagens**
```typescript
// Armazenar rolagens no banco
const message = await prisma.chatMessage.create({
  data: {
    text: data.text,
    type: data.type,
    campaignId: data.campaignId,
    userId: socket.userId,
    diceResult: data.diceResult ? JSON.stringify(data.diceResult) : null
  }
})
```

## 📊 Estatísticas e Analytics

### **Tracking de Rolagens**
```typescript
interface DiceStats {
  totalRolls: number
  averageRoll: number
  criticalHits: number
  criticalFails: number
  mostUsedDice: string
  playerStats: {
    [playerId: string]: {
      totalRolls: number
      averageRoll: number
      criticals: number
    }
  }
}
```

## 🎯 Benefícios da Implementação

### **1. Experiência Integrada**
- Rolagens diretas da ficha
- Resultados automáticos no chat
- Contexto preservado

### **2. Funcionalidade Completa**
- Todos os tipos de rolagem
- Modificadores automáticos
- Vantagem/desvantagem

### **3. Feedback Visual**
- Animações de rolagem
- Destaque para críticos
- Formatação rica

## 🚀 Próximos Passos

### **Melhorias Futuras**
1. **Estatísticas**: Dashboard de rolagens
2. **Macros**: Rolagens personalizadas
3. **Rerolls**: Opção de rolar novamente
4. **Animations**: Efeitos visuais
5. **Sound**: Efeitos sonoros

## 📝 Conclusão

O sistema de dados com integração ao chat está **totalmente implementado e funcional**, oferecendo uma experiência completa de rolagem de dados para D&D 5e. A integração perfeita com o chat em tempo real e a automatização de modificadores criam uma experiência fluida e imersiva para jogadores e mestres.

O sistema é **robusto, extensível e fácil de usar**, suportando todos os tipos de rolagem necessários para uma campanha de D&D 5e online.