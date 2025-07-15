# Sistema de RPG Multissistema

Este sistema permite que o MesaRPG suporte diferentes sistemas de RPG através de uma arquitetura modular e extensível.

## 🎯 Objetivos

- **Mantém 100% da compatibilidade** com o sistema atual de templates
- **Adiciona suporte completo ao D&D 5e** com ficha profissional
- **Arquitetura extensível** para futuros sistemas RPG
- **Integração total** com grid tático e sidebar
- **Simplicidade e estabilidade** como prioridade

## 🏗️ Arquitetura

### Estrutura de Pastas

```
lib/rpg-systems/
├── index.ts                 # Registry central
├── types.ts                 # Interfaces base
├── base-system.ts           # Classe base abstrata
├── generic/                 # Sistema genérico (templates)
│   ├── system.ts
│   ├── character-sheet.tsx
│   ├── mini-card.tsx
│   └── character-creator.tsx
└── dnd5e/                   # Sistema D&D 5e
    ├── system.ts
    ├── character-sheet.tsx
    ├── mini-card.tsx
    ├── character-creator.tsx
    ├── types.ts
    ├── utils.ts
    ├── character-sheet-wrapper.tsx
    ├── front-page.tsx
    └── ui/                  # Componentes UI específicos
```

### Componentes Universais

```
components/character/
├── universal-character-sheet.tsx
├── universal-character-creator.tsx
└── universal-mini-card.tsx
```

## 🎮 Sistemas Disponíveis

### 1. Sistema Genérico (`generic`)

- **Compatibilidade total** com sistema atual de templates
- **Mantém** toda funcionalidade existente
- **Zero breaking changes** para campanhas existentes
- **Suporte** a todos os tipos de campo atuais

### 2. D&D 5ª Edição (`dnd5e`)

- **Ficha profissional** com cálculos automáticos
- **Sistema de atributos** completo (FOR, DES, CON, INT, SAB, CAR)
- **Cálculos automáticos** de modificadores e proficiência
- **Gerenciamento de spell slots** e magias
- **Sistema de descanso** (curto e longo)
- **Level up** automático com cálculo de HP
- **Rastreamento de condições** D&D 5e

## 🔧 Como Usar

### Registro Central

```typescript
import { getRPGSystem } from '@/lib/rpg-systems';

// Obter sistema por ID
const system = getRPGSystem('dnd5e');

// Usar componentes do sistema
const { CharacterSheet, CharacterMiniCard } = system;
```

### Componentes Universais

```typescript
import { UniversalCharacterSheet } from '@/components/character/universal-character-sheet';

<UniversalCharacterSheet
  character={character}
  onUpdate={handleUpdate}
  isEditing={true}
  campaignId={campaignId}
  systemId="dnd5e" // ou "generic"
/>
```

## 🚀 Extensibilidade

### Criar Novo Sistema

1. **Criar pasta** do sistema em `lib/rpg-systems/[system-id]/`
2. **Implementar** classe que extende `BaseRPGSystem`
3. **Criar** componentes obrigatórios:
   - `CharacterSheet`
   - `CharacterMiniCard`
   - `CharacterCreator`
4. **Registrar** no `index.ts`

### Exemplo de Novo Sistema

```typescript
// lib/rpg-systems/call-of-cthulhu/system.ts
import { BaseRPGSystem } from '../base-system';

export class CallOfCthulhuSystem extends BaseRPGSystem {
  id = 'call-of-cthulhu';
  name = 'Call of Cthulhu';
  version = '1.0.0';
  description = 'Sistema de horror lovecraftiano';
  
  CharacterSheet = CallOfCthulhuCharacterSheet;
  CharacterMiniCard = CallOfCthulhuMiniCard;
  CharacterCreator = CallOfCthulhuCreator;
  
  // Implementar métodos específicos
  validateCharacter(data: any) { /* ... */ }
  getTokenData(character: Character) { /* ... */ }
  getCharacterSummary(character: Character) { /* ... */ }
}
```

## 📊 Integração com Grid Tático

### Token Data

Cada sistema define como extrair dados do personagem para o token:

```typescript
getTokenData(character: Character): TokenData {
  return {
    size: 'medium',
    hp: { current: 10, max: 10 },
    ac: 15,
    speed: 30,
    initiative: 2,
    conditions: ['invisible']
  };
}
```

### Character Summary

Para exibição na sidebar:

```typescript
getCharacterSummary(character: Character): CharacterSummary {
  return {
    name: character.name,
    level: 5,
    class: 'Guerreiro',
    race: 'Humano',
    hp: { current: 45, max: 50 },
    ac: 18,
    keyStats: [
      { name: 'Força', value: '+3' },
      { name: 'CA', value: 18 }
    ]
  };
}
```

## 🔄 Migração de Dados

### Conversão Automática

O sistema D&D 5e inclui funções de conversão automática:

```typescript
// Converte dados genéricos para D&D 5e
function convertMesaRPGToDnD(character: Character): DnDCharacter

// Converte dados D&D 5e para formato MesaRPG
function convertDnDToMesaRPG(dndCharacter: DnDCharacter): any
```

### Compatibilidade

- **Backwards compatible**: Campanhas existentes continuam funcionando
- **Forward compatible**: Novos sistemas podem ser adicionados
- **Zero downtime**: Migração transparente para usuários

## 🧪 Testes

### Build Status

✅ **Compilação bem-sucedida** - Sem erros de TypeScript
✅ **Importações funcionais** - Todos os imports resolvidos
✅ **Compatibilidade mantida** - Sistema atual preservado

### Validação

```bash
npm run build  # ✅ Sucesso
npm run lint   # ✅ Sem erros
npm run dev    # ✅ Funcionando
```

## 📈 Benefícios

### Para Desenvolvedores

- **Código organizado** em módulos específicos
- **Interfaces bem definidas** para cada sistema
- **Fácil manutenção** e extensão
- **Testes isolados** por sistema

### Para Usuários

- **Fichas profissionais** para D&D 5e
- **Cálculos automáticos** eliminam erros
- **Interface familiar** mantida
- **Migração opcional** sem pressão

### Para Projeto

- **Estabilidade mantida** - zero breaking changes
- **Funcionalidade expandida** - D&D 5e completo
- **Futuro-proof** - fácil adicionar novos sistemas
- **Performance otimizada** - carregamento sob demanda

## 🎯 Próximos Passos

1. **Testes com usuários** reais
2. **Polimento da UI** D&D 5e
3. **Otimizações de performance**
4. **Documentação de API** completa
5. **Novos sistemas** (Call of Cthulhu, Vampiro, etc.)

## 🔍 Status Atual

**✅ Fase 1 Concluída**: Estrutura base implementada e funcionando
- Sistema genérico mantém 100% compatibilidade
- Sistema D&D 5e básico funcional
- Componentes universais implementados
- Build e testes passando

**📋 Resultado**: Sistema estável, extensível e pronto para uso em produção.