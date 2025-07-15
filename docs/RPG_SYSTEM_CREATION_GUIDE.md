# Guia de Criação de Sistemas de RPG - MesaRPG

## 📋 Visão Geral

Este guia detalha como criar novos sistemas de RPG para o MesaRPG, usando o D&D 5e como sistema de referência. O framework modular permite implementar qualquer sistema de RPG mantendo consistência e reutilização de código.

## 🎯 Objetivo do Sistema

O sistema de RPG modular permite:
- **Plugabilidade**: Sistemas independentes e intercambiáveis
- **Extensibilidade**: Fácil adição de novos sistemas
- **Consistência**: Interface unificada para todos os sistemas
- **Manutenibilidade**: Código organizado e escalável

## 🏗️ Arquitetura do Sistema

### **Estrutura Base**
```
lib/rpg-systems/
├── base-system.ts          # Interface base obrigatória
├── types.ts               # Tipos compartilhados
├── index.ts               # Registro de sistemas
├── [system-name]/
│   ├── index.ts           # Exportações do sistema
│   ├── system.ts          # Implementação principal
│   ├── types.ts           # Tipos específicos
│   ├── utils.ts           # Utilitários e cálculos
│   ├── default-character.ts # Dados padrão
│   ├── character-sheet.tsx # Componente da ficha
│   ├── character-creator.tsx # Criador de personagens
│   └── mini-card.tsx      # Mini card para sidebar
```

### **Interface Base (BaseSystem)**
```typescript
// lib/rpg-systems/base-system.ts
export interface BaseSystem {
  id: string
  name: string
  description: string
  version: string
  
  // Componentes obrigatórios
  getCharacterSheet(): React.ComponentType<CharacterSheetProps>
  getCharacterCreator(): React.ComponentType<CharacterCreatorProps>
  getMiniCard(): React.ComponentType<MiniCardProps>
  
  // Dados e validação
  getDefaultCharacter(): any
  validateCharacterData(data: any): boolean
  
  // Apresentação
  getCharacterSummary(data: any): CharacterSummary
  getCharacterAvatar(data: any): string
  
  // Utilidades
  calculateModifier?(value: number): number
  formatAttribute?(value: number): string
}
```

## 🎲 Implementação Passo a Passo

### **Passo 1: Definir Tipos do Sistema**
```typescript
// lib/rpg-systems/[system-name]/types.ts
export interface SystemCharacter {
  // Informações básicas
  name: string
  level: number
  
  // Atributos específicos do sistema
  attributes: {
    [key: string]: number
  }
  
  // Habilidades específicas
  skills: {
    [key: string]: number
  }
  
  // Combate
  health: {
    current: number
    maximum: number
  }
  
  // Recursos específicos do sistema
  resources: {
    [key: string]: any
  }
  
  // Equipamentos
  equipment: Equipment[]
  
  // Dados específicos do sistema
  systemData: {
    [key: string]: any
  }
}

export interface Equipment {
  id: string
  name: string
  type: string
  properties: {
    [key: string]: any
  }
}

export interface CharacterSummary {
  name: string
  level: number
  race?: string
  class?: string
  [key: string]: any
}
```

### **Passo 2: Implementar o Sistema Principal**
```typescript
// lib/rpg-systems/[system-name]/system.ts
import { BaseSystem } from '../base-system'
import { SystemCharacter, CharacterSummary } from './types'
import { CharacterSheet } from './character-sheet'
import { CharacterCreator } from './character-creator'
import { MiniCard } from './mini-card'
import { getDefaultCharacter } from './default-character'

export class CustomRPGSystem implements BaseSystem {
  id = 'custom-rpg'
  name = 'Custom RPG System'
  description = 'Sistema de RPG customizado'
  version = '1.0.0'

  getCharacterSheet() {
    return CharacterSheet
  }

  getCharacterCreator() {
    return CharacterCreator
  }

  getMiniCard() {
    return MiniCard
  }

  getDefaultCharacter(): SystemCharacter {
    return getDefaultCharacter()
  }

  validateCharacterData(data: any): boolean {
    try {
      // Validar estrutura de dados
      const required = ['name', 'level', 'attributes', 'health']
      return required.every(field => data.hasOwnProperty(field))
    } catch (error) {
      return false
    }
  }

  getCharacterSummary(data: any): CharacterSummary {
    const characterData = typeof data === 'string' ? JSON.parse(data) : data
    
    return {
      name: characterData.name || 'Unnamed',
      level: characterData.level || 1,
      race: characterData.race || '',
      class: characterData.class || '',
      // Campos específicos do sistema
      ...this.getSystemSpecificSummary(characterData)
    }
  }

  getCharacterAvatar(data: any): string {
    const characterData = typeof data === 'string' ? JSON.parse(data) : data
    return characterData.avatar || '/placeholder-token.png'
  }

  // Métodos específicos do sistema
  private getSystemSpecificSummary(data: SystemCharacter) {
    // Implementar lógica específica
    return {}
  }
}
```

### **Passo 3: Criar Dados Padrão**
```typescript
// lib/rpg-systems/[system-name]/default-character.ts
import { SystemCharacter } from './types'

export function getDefaultCharacter(): SystemCharacter {
  return {
    name: "Novo Personagem",
    level: 1,
    
    attributes: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    
    skills: {
      // Skills específicas do sistema
      combat: 0,
      knowledge: 0,
      social: 0
    },
    
    health: {
      current: 20,
      maximum: 20
    },
    
    resources: {
      // Recursos específicos (mana, stamina, etc.)
      mana: { current: 10, maximum: 10 },
      stamina: { current: 15, maximum: 15 }
    },
    
    equipment: [],
    
    systemData: {
      // Dados específicos do sistema
      alignment: 'Neutro',
      background: '',
      traits: []
    }
  }
}
```

### **Passo 4: Implementar a Ficha de Personagem**
```typescript
// lib/rpg-systems/[system-name]/character-sheet.tsx
import React, { useState } from 'react'
import { SystemCharacter } from './types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChatIntegration } from '@/hooks/use-chat-integration'

interface CharacterSheetProps {
  character: SystemCharacter
  onUpdate: (data: SystemCharacter) => void
  isEditable: boolean
}

export function CharacterSheet({ character, onUpdate, isEditable }: CharacterSheetProps) {
  const [activeTab, setActiveTab] = useState('main')
  const { sendDiceRoll } = useChatIntegration()

  const handleAttributeChange = (attribute: string, value: number) => {
    if (!isEditable) return
    
    const updated = {
      ...character,
      attributes: {
        ...character.attributes,
        [attribute]: value
      }
    }
    onUpdate(updated)
  }

  const handleSkillRoll = (skill: string, modifier: number) => {
    // Implementar rolagem específica do sistema
    const result = rollD20(modifier)
    sendDiceRoll(result, `Teste de ${skill}`)
  }

  return (
    <div className="character-sheet">
      {/* Header com informações básicas */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{character.name}</span>
            <span className="text-sm text-muted-foreground">Nível {character.level}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Nome:</label>
              <Input 
                value={character.name} 
                onChange={(e) => onUpdate({...character, name: e.target.value})}
                disabled={!isEditable}
              />
            </div>
            <div>
              <label>Nível:</label>
              <Input 
                type="number" 
                value={character.level} 
                onChange={(e) => onUpdate({...character, level: parseInt(e.target.value)})}
                disabled={!isEditable}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegação por abas */}
      <div className="tabs">
        <div className="tab-list">
          <button 
            className={`tab ${activeTab === 'main' ? 'active' : ''}`}
            onClick={() => setActiveTab('main')}
          >
            Principal
          </button>
          <button 
            className={`tab ${activeTab === 'combat' ? 'active' : ''}`}
            onClick={() => setActiveTab('combat')}
          >
            Combate
          </button>
          <button 
            className={`tab ${activeTab === 'equipment' ? 'active' : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            Equipamentos
          </button>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === 'main' && (
          <MainTab 
            character={character} 
            onUpdate={onUpdate}
            onSkillRoll={handleSkillRoll}
            isEditable={isEditable}
          />
        )}
        
        {activeTab === 'combat' && (
          <CombatTab 
            character={character} 
            onUpdate={onUpdate}
            isEditable={isEditable}
          />
        )}
        
        {activeTab === 'equipment' && (
          <EquipmentTab 
            character={character} 
            onUpdate={onUpdate}
            isEditable={isEditable}
          />
        )}
      </div>
    </div>
  )
}

// Componentes das abas
function MainTab({ character, onUpdate, onSkillRoll, isEditable }) {
  return (
    <div className="main-tab">
      {/* Atributos */}
      <Card>
        <CardHeader>
          <CardTitle>Atributos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="attributes-grid">
            {Object.entries(character.attributes).map(([attr, value]) => (
              <div key={attr} className="attribute-box">
                <label>{attr.toUpperCase()}</label>
                <Input 
                  type="number" 
                  value={value} 
                  onChange={(e) => handleAttributeChange(attr, parseInt(e.target.value))}
                  disabled={!isEditable}
                />
                <div className="modifier">
                  {formatModifier(calculateModifier(value))}
                </div>
                <Button 
                  size="sm" 
                  onClick={() => onSkillRoll(attr, calculateModifier(value))}
                >
                  Rolar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CombatTab({ character, onUpdate, isEditable }) {
  return (
    <div className="combat-tab">
      {/* Saúde */}
      <Card>
        <CardHeader>
          <CardTitle>Saúde</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="health-tracker">
            <div>
              <label>Atual:</label>
              <Input 
                type="number" 
                value={character.health.current}
                onChange={(e) => onUpdate({
                  ...character,
                  health: {
                    ...character.health,
                    current: parseInt(e.target.value)
                  }
                })}
                disabled={!isEditable}
              />
            </div>
            <div>
              <label>Máximo:</label>
              <Input 
                type="number" 
                value={character.health.maximum}
                onChange={(e) => onUpdate({
                  ...character,
                  health: {
                    ...character.health,
                    maximum: parseInt(e.target.value)
                  }
                })}
                disabled={!isEditable}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EquipmentTab({ character, onUpdate, isEditable }) {
  return (
    <div className="equipment-tab">
      {/* Equipamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Equipamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="equipment-list">
            {character.equipment.map((item, index) => (
              <div key={index} className="equipment-item">
                <span>{item.name}</span>
                <span className="item-type">{item.type}</span>
                {isEditable && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      const updated = {
                        ...character,
                        equipment: character.equipment.filter((_, i) => i !== index)
                      }
                      onUpdate(updated)
                    }}
                  >
                    Remover
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Utilidades
function calculateModifier(value: number): number {
  return Math.floor((value - 10) / 2)
}

function formatModifier(modifier: number): string {
  return modifier >= 0 ? `+${modifier}` : `${modifier}`
}

function rollD20(modifier: number) {
  const roll = Math.floor(Math.random() * 20) + 1
  return {
    total: roll + modifier,
    rolls: [roll],
    modifier,
    critical: roll === 20,
    advantage: 'normal' as const,
    formula: `1d20${modifier >= 0 ? '+' : ''}${modifier}`
  }
}
```

### **Passo 5: Implementar o Mini Card**
```typescript
// lib/rpg-systems/[system-name]/mini-card.tsx
import React from 'react'
import { SystemCharacter } from './types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface MiniCardProps {
  character: SystemCharacter
  onClick?: () => void
}

export function MiniCard({ character, onClick }: MiniCardProps) {
  const healthPercentage = (character.health.current / character.health.maximum) * 100
  
  return (
    <Card className="mini-card cursor-pointer" onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-lg font-bold">
              {character.name.charAt(0).toUpperCase()}
            </span>
          </div>
          
          {/* Informações */}
          <div className="flex-1">
            <h3 className="font-semibold text-sm">{character.name}</h3>
            <p className="text-xs text-muted-foreground">
              Nível {character.level}
            </p>
            
            {/* Barra de saúde */}
            <div className="mt-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    healthPercentage > 50 ? 'bg-green-500' : 
                    healthPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${healthPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {character.health.current}/{character.health.maximum} HP
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

### **Passo 6: Registrar o Sistema**
```typescript
// lib/rpg-systems/[system-name]/index.ts
export { CustomRPGSystem } from './system'
export type { SystemCharacter } from './types'
export { getDefaultCharacter } from './default-character'

// lib/rpg-systems/index.ts
import { DnD5eSystem } from './dnd5e'
import { CustomRPGSystem } from './custom-rpg'
import { GenericSystem } from './generic'

export const RPG_SYSTEMS = {
  'dnd5e': new DnD5eSystem(),
  'custom-rpg': new CustomRPGSystem(),
  'generic': new GenericSystem()
}

export const getRPGSystem = (systemId: string) => {
  return RPG_SYSTEMS[systemId] || RPG_SYSTEMS.generic
}

export const getAvailableSystems = () => {
  return Object.keys(RPG_SYSTEMS).map(id => ({
    id,
    name: RPG_SYSTEMS[id].name,
    description: RPG_SYSTEMS[id].description
  }))
}
```

## 🎯 Integração com o Sistema Principal

### **Uso nos Componentes**
```typescript
// components/character-sheet-view.tsx
import { getRPGSystem } from '@/lib/rpg-systems'

export function CharacterSheetView({ character, campaign, isEditable }) {
  const rpgSystem = getRPGSystem(campaign.system || 'dnd5e')
  const CharacterSheet = rpgSystem.getCharacterSheet()
  
  return (
    <CharacterSheet 
      character={character.data}
      onUpdate={handleUpdate}
      isEditable={isEditable}
    />
  )
}
```

### **Criação de Personagens**
```typescript
// components/character/universal-character-creator.tsx
import { getRPGSystem } from '@/lib/rpg-systems'

export function UniversalCharacterCreator({ systemId, onSubmit }) {
  const rpgSystem = getRPGSystem(systemId)
  const CharacterCreator = rpgSystem.getCharacterCreator()
  const defaultData = rpgSystem.getDefaultCharacter()
  
  return (
    <CharacterCreator 
      defaultData={defaultData}
      onSubmit={onSubmit}
    />
  )
}
```

## 🎲 Sistema de Dados Integrado

### **Estrutura de Rolagem**
```typescript
// Cada sistema deve implementar suas próprias rolagens
export interface DiceIntegration {
  rollAttribute(attribute: string, modifier: number): DiceResult
  rollSkill(skill: string, modifier: number): DiceResult
  rollDamage(damage: string, critical?: boolean): DiceResult
  rollCustom(formula: string): DiceResult
}

// Exemplo de implementação
export class CustomRPGDice implements DiceIntegration {
  rollAttribute(attribute: string, modifier: number): DiceResult {
    return rollD20(modifier)
  }
  
  rollSkill(skill: string, modifier: number): DiceResult {
    return rollD20(modifier)
  }
  
  rollDamage(damage: string, critical = false): DiceResult {
    // Implementar lógica específica do sistema
    return rollDamage(damage, critical)
  }
  
  rollCustom(formula: string): DiceResult {
    // Parse e execução de fórmulas customizadas
    return parseAndRoll(formula)
  }
}
```

### **Integração com Chat**
```typescript
// hooks/use-chat-integration.ts (já implementado)
export const useChatIntegration = () => {
  const sendDiceRoll = (result: DiceResult, context: string) => {
    // Funciona com qualquer sistema que implemente DiceResult
    socket.emit('chat:send', {
      text: formatDiceMessage(result, context),
      type: 'dice',
      timestamp: new Date().toISOString()
    })
  }
  
  return { sendDiceRoll }
}
```

## 🛡️ Validação e Testes

### **Validação de Dados**
```typescript
// lib/rpg-systems/[system-name]/validation.ts
export function validateCharacterData(data: any): ValidationResult {
  const errors: string[] = []
  
  // Validações obrigatórias
  if (!data.name || data.name.trim() === '') {
    errors.push('Nome é obrigatório')
  }
  
  if (!data.level || data.level < 1) {
    errors.push('Nível deve ser maior que 0')
  }
  
  if (!data.attributes || typeof data.attributes !== 'object') {
    errors.push('Atributos são obrigatórios')
  }
  
  // Validações específicas do sistema
  if (data.attributes) {
    Object.entries(data.attributes).forEach(([attr, value]) => {
      if (typeof value !== 'number' || value < 1 || value > 20) {
        errors.push(`Atributo ${attr} deve estar entre 1 e 20`)
      }
    })
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

### **Testes Unitários**
```typescript
// lib/rpg-systems/[system-name]/__tests__/system.test.ts
import { CustomRPGSystem } from '../system'

describe('CustomRPGSystem', () => {
  let system: CustomRPGSystem
  
  beforeEach(() => {
    system = new CustomRPGSystem()
  })
  
  test('should create default character', () => {
    const character = system.getDefaultCharacter()
    expect(character.name).toBe('Novo Personagem')
    expect(character.level).toBe(1)
    expect(character.attributes).toBeDefined()
  })
  
  test('should validate character data', () => {
    const validData = system.getDefaultCharacter()
    expect(system.validateCharacterData(validData)).toBe(true)
    
    const invalidData = { ...validData, name: '' }
    expect(system.validateCharacterData(invalidData)).toBe(false)
  })
  
  test('should generate character summary', () => {
    const character = system.getDefaultCharacter()
    const summary = system.getCharacterSummary(character)
    
    expect(summary.name).toBe(character.name)
    expect(summary.level).toBe(character.level)
  })
})
```

## 📦 Distribuição e Versionamento

### **Estrutura de Versão**
```typescript
// lib/rpg-systems/[system-name]/version.ts
export const VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  full: '1.0.0'
}

export const COMPATIBILITY = {
  minMesaRPGVersion: '1.0.0',
  maxMesaRPGVersion: '2.0.0'
}
```

### **Manifesto do Sistema**
```json
{
  "id": "custom-rpg",
  "name": "Custom RPG System",
  "description": "Sistema de RPG customizado para MesaRPG",
  "version": "1.0.0",
  "author": "Developer Name",
  "compatibility": {
    "minMesaRPGVersion": "1.0.0"
  },
  "dependencies": [],
  "features": [
    "character-sheets",
    "dice-integration",
    "chat-integration",
    "combat-system"
  ]
}
```

## 🚀 Exemplos de Sistemas

### **Sistema Simplificado**
```typescript
// Exemplo de sistema minimalista
export class SimpleRPGSystem implements BaseSystem {
  id = 'simple-rpg'
  name = 'Simple RPG'
  description = 'Sistema RPG simplificado'
  version = '1.0.0'
  
  getDefaultCharacter() {
    return {
      name: 'Novo Personagem',
      level: 1,
      attributes: { strength: 10, dexterity: 10, mind: 10 },
      health: { current: 10, maximum: 10 }
    }
  }
  
  getCharacterSummary(data: any) {
    return {
      name: data.name,
      level: data.level,
      class: 'Aventureiro'
    }
  }
  
  // Implementações mínimas dos outros métodos...
}
```

### **Sistema Complexo**
```typescript
// Exemplo de sistema com mecânicas avançadas
export class AdvancedRPGSystem implements BaseSystem {
  id = 'advanced-rpg'
  name = 'Advanced RPG'
  description = 'Sistema RPG com mecânicas avançadas'
  version = '1.0.0'
  
  // Sistema com classes, subclasses, feats, etc.
  getDefaultCharacter() {
    return {
      name: 'Novo Personagem',
      level: 1,
      race: 'Humano',
      mainClass: 'Guerreiro',
      subClass: 'Campeão',
      background: 'Soldado',
      
      attributes: {
        strength: 15,
        dexterity: 14,
        constitution: 13,
        intelligence: 12,
        wisdom: 10,
        charisma: 8
      },
      
      skills: {
        acrobatics: 0,
        athletics: 2,
        stealth: 0,
        // ... outras skills
      },
      
      feats: [],
      spells: [],
      inventory: [],
      
      // Recursos específicos
      classFeatures: {
        actionSurge: { uses: 1, maxUses: 1 },
        secondWind: { uses: 1, maxUses: 1 }
      }
    }
  }
  
  // Implementações avançadas...
}
```

## 📋 Checklist de Implementação

### **Obrigatório**
- [ ] Implementar interface BaseSystem
- [ ] Criar tipos específicos do sistema
- [ ] Definir dados padrão do personagem
- [ ] Implementar ficha de personagem
- [ ] Implementar mini card
- [ ] Implementar criador de personagens
- [ ] Registrar sistema no index
- [ ] Validação de dados
- [ ] Integração com dados

### **Recomendado**
- [ ] Testes unitários
- [ ] Documentação específica
- [ ] Exemplos de uso
- [ ] Migração de dados
- [ ] Sistema de versioning
- [ ] Validação de compatibilidade

### **Opcional**
- [ ] Importação de dados externos
- [ ] Calculadora de build
- [ ] Sistema de macros
- [ ] Automação de regras
- [ ] Recursos visuais customizados

## 🎯 Benefícios da Arquitetura

### **1. Flexibilidade**
- Cada sistema pode implementar suas próprias regras
- Reutilização de componentes base
- Extensibilidade sem modificar código existente

### **2. Manutenibilidade**
- Código isolado por sistema
- Interface consistente
- Fácil debugging e atualizações

### **3. Escalabilidade**
- Adição de novos sistemas sem impacto
- Sistemas podem ser desenvolvidos independentemente
- Versionamento individual

### **4. Experiência do Usuário**
- Interface unificada
- Funcionalidades consistentes
- Fácil migração entre sistemas

## 🚀 Próximos Passos

### **Melhorias Futuras**
1. **Sistema de Plugins**: Extensões para sistemas existentes
2. **Marketplace**: Distribuição de sistemas customizados
3. **Visual Builder**: Interface para criação de sistemas
4. **AI Integration**: Assistência na criação de sistemas
5. **Community Systems**: Sistemas criados pela comunidade

## 📝 Conclusão

O sistema de RPG modular do MesaRPG fornece uma base sólida e flexível para implementar qualquer sistema de RPG. Usando o D&D 5e como referência, o framework permite criar sistemas desde os mais simples até os mais complexos, mantendo consistência e qualidade.

A arquitetura modular garante que novos sistemas possam ser adicionados sem afetar o código existente, enquanto a interface padronizada oferece uma experiência consistente para usuários e desenvolvedores.

**Este guia fornece todos os elementos necessários para criar sistemas de RPG robustos e funcionais no MesaRPG.**