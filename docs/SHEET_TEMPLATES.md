# Sistema de Templates de Ficha

## 📋 Visão Geral

O Sistema de Templates de Ficha permite que GMs criem e personalizem fichas de personagem, NPCs e criaturas para suas campanhas de RPG. O sistema oferece diferentes tipos de campos que podem ser configurados e organizados através de uma interface drag-and-drop com preview em tempo real.

## 🎯 Funcionalidades Principais

- **Template único por tipo**: Cada campanha pode ter apenas um template para PC, NPC e CREATURE
- **7 tipos de campos diferentes**: text, textarea, number, boolean, image, select e attributes
- **Editor inline**: Integrado diretamente nos accordions de configuração
- **Preview em tempo real**: Visualização instantânea de como a ficha ficará
- **Drag & drop**: Reordenação de campos através de arrastar e soltar
- **Validação completa**: Sistema robusto de validação frontend e backend

## 🏗️ Arquitetura Técnica

### **Stack Principal**
- **Frontend**: React com TypeScript
- **UI**: TailwindCSS + shadcn/ui
- **Drag & Drop**: @dnd-kit/core
- **Validação**: Zod (frontend e backend)
- **Database**: Prisma ORM

### **Estrutura de Arquivos**

```
components/settings/
├── sheet-templates.tsx           # Componente principal com accordions
├── template-section.tsx          # Seção individual por tipo (PC/NPC/CREATURE)
├── sheet-template-editor.tsx     # Editor principal com preview
├── template-dialog.tsx           # Modal (deprecated - não usado)
├── template-list.tsx             # Lista de templates (deprecated - não usado)
└── fields/
    ├── field-editor.tsx          # Switch entre tipos de campo
    ├── field-preview.tsx         # Preview dos campos
    ├── field-list.tsx            # Lista com drag & drop
    ├── text-field.tsx            # Campo de texto
    ├── textarea-field.tsx        # Campo de texto longo
    ├── number-field.tsx          # Campo numérico
    ├── boolean-field.tsx         # Campo sim/não
    ├── image-field.tsx           # Campo de imagem
    ├── select-field.tsx          # Campo de seleção
    └── attributes-field.tsx      # Campo de atributos (novo)

hooks/
└── use-templates.ts              # Hook para gerenciar templates via API

lib/
└── field-validation.ts           # Sistema de validação de campos

types/
└── sheet-template.ts             # Tipos TypeScript

app/api/campaigns/[id]/templates/
├── route.ts                      # GET e POST para templates
└── [templateId]/route.ts         # PUT, DELETE e GET individual
```

## 🔧 Tipos de Campo

### **1. Text (Texto Curto)**
```typescript
{
  type: 'text',
  name: 'Nome do Personagem',
  defaultValue: 'Aventureiro',
  required: true
}
```
- **Uso**: Nomes, títulos, valores curtos
- **Validação**: Máximo 255 caracteres
- **Preview**: Input de texto simples

### **2. Textarea (Texto Longo)**
```typescript
{
  type: 'textarea',
  name: 'História do Personagem',
  defaultValue: 'Era uma vez...',
  required: false
}
```
- **Uso**: Descrições, histórias, notas
- **Validação**: Máximo 10.000 caracteres
- **Preview**: Textarea expansível

### **3. Number (Número)**
```typescript
{
  type: 'number',
  name: 'Força',
  defaultValue: 10,
  options: ['1', '20'], // [min, max]
  required: true
}
```
- **Uso**: Atributos, pontos de vida, estatísticas
- **Validação**: Valores mínimo e máximo
- **Preview**: Input numérico

### **4. Boolean (Sim/Não)**
```typescript
{
  type: 'boolean',
  name: 'Tem Magia',
  defaultValue: false,
  required: false
}
```
- **Uso**: Flags, características true/false
- **Validação**: Booleano
- **Preview**: Checkbox

### **5. Image (Imagem)**
```typescript
{
  type: 'image',
  name: 'Avatar',
  defaultValue: 'https://example.com/avatar.jpg',
  options: ['5'], // tamanho máximo em MB
  required: false
}
```
- **Uso**: Avatares, tokens, ilustrações
- **Validação**: URL válida, extensões de imagem
- **Preview**: Placeholder de imagem + botão upload

### **6. Select (Seleção)**
```typescript
{
  type: 'select',
  name: 'Classe',
  options: ['Guerreiro', 'Mago', 'Ladino'],
  defaultValue: 'Guerreiro',
  required: true
}
```
- **Uso**: Classes, raças, opções predefinidas
- **Validação**: Valor deve estar nas opções
- **Preview**: Select dropdown

### **7. Attributes (Atributos) - NOVO**
```typescript
{
  type: 'attributes',
  name: 'Atributos Principais',
  attributes: [
    { id: 'str', name: 'Força', defaultValue: 10 },
    { id: 'dex', name: 'Destreza', defaultValue: 10 },
    { id: 'con', name: 'Constituição', defaultValue: 10 },
    { id: 'int', name: 'Inteligência', defaultValue: 10 }
  ],
  required: true
}
```
- **Uso**: Grupos de atributos numéricos (D&D, RPG stats)
- **Validação**: Cada atributo deve ter nome e valor numérico
- **Preview**: Grid 2x2 com cards quadrados para cada atributo

## 💾 Estrutura de Dados

### **Template Field Interface**
```typescript
interface TemplateField {
  id: string                    // ID único do campo
  name: string                  // Nome do campo
  type: FieldType              // Tipo do campo
  required?: boolean           // Se é obrigatório
  options?: string[]           // Opções para select, min/max para number
  defaultValue?: any           // Valor padrão
  attributes?: AttributeDefinition[] // Para tipo 'attributes'
}
```

### **Attribute Definition Interface**
```typescript
interface AttributeDefinition {
  id: string           // ID único do atributo
  name: string         // Nome do atributo (ex: "Força")
  defaultValue?: number // Valor padrão numérico
}
```

### **Database Schema (Prisma)**
```prisma
model SheetTemplate {
  id         String   @id @default(cuid())
  campaignId String
  name       String   // Nome fixo por tipo
  type       CharacterType // PC, NPC, CREATURE
  fields     String   @default("[]") // JSON dos campos
  isDefault  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  @@map("sheet_templates")
}
```

## 🚀 Como Usar

### **1. Acessar Templates**
```
/campaign/[id]/settings → Aba "Templates de Ficha"
```

### **2. Editar Template**
1. Abrir accordion do tipo desejado (PC/NPC/CREATURE)
2. Editar campos diretamente na interface
3. Usar drag & drop para reordenar
4. Visualizar preview em tempo real
5. Clicar "Salvar Template" quando houver mudanças

### **3. Adicionar Novo Campo**
1. Selecionar tipo no dropdown
2. Clicar "Adicionar Campo"
3. Configurar propriedades do campo
4. Campo aparece automaticamente no preview

### **4. Configurar Campo de Atributos**
1. Selecionar "Atributos" no dropdown
2. Definir nome do grupo (ex: "Atributos Principais")
3. Adicionar atributos individuais com nomes e valores
4. Preview mostra em formato quadrado (grid 2x2)

## 🔧 APIs Disponíveis

### **GET /api/campaigns/[id]/templates**
Busca templates da campanha
```typescript
// Query params
?type=PC|NPC|CREATURE  // Filtrar por tipo (opcional)

// Response
{
  templates: SheetTemplate[]
}
```

### **POST /api/campaigns/[id]/templates**
Cria novo template
```typescript
// Body
{
  name: string,
  type: 'PC' | 'NPC' | 'CREATURE',
  fields: TemplateField[],
  isDefault: boolean
}

// Response
{
  template: SheetTemplate
}
```

### **PUT /api/campaigns/[id]/templates/[templateId]**
Atualiza template existente
```typescript
// Body
{
  name: string,
  fields: TemplateField[],
  isDefault: boolean
}
```

### **DELETE /api/campaigns/[id]/templates/[templateId]**
Remove template
```typescript
// Response
{
  message: 'Template deletado com sucesso'
}
```

## ⚠️ Validações e Restrições

### **Validações Frontend**
- Nome do campo obrigatório
- Pelo menos um campo por template
- Todos os campos devem ter nome válido
- Atributos devem ter nomes únicos

### **Validações Backend**
- Apenas um template por tipo (PC/NPC/CREATURE)
- Usuário deve ser GM da campanha
- Campos devem seguir schema Zod
- Atributos devem ter valores numéricos válidos

### **Restrições do Sistema**
- ✅ Um template único por tipo
- ✅ Apenas GMs podem criar/editar
- ✅ Nomes fixos por tipo (não editáveis)
- ✅ Templates sempre marcados como padrão

## 🎨 Estilo Visual

### **Design System**
- **Cores**: Tema parchment com stone variants
- **Inputs**: Fundo branco (`bg-white`)
- **Cards**: `bg-stone-50/30` com bordas `border-stone-300`
- **Preview**: Cards `bg-stone-50/80`

### **Componentes Visuais**
- **Drag Handle**: `GripVertical` icon
- **Botões**: Primary para ações, Ghost para secundárias
- **Badges**: Para tipos de campo e status
- **Loading**: Spinner com texto descritivo

## 🔄 Fluxo de Dados

1. **Carregamento**: `useTemplates` hook busca dados da API
2. **Edição**: Estado local controla mudanças
3. **Validação**: Tempo real no frontend
4. **Salvamento**: POST/PUT para API com validação backend
5. **Preview**: Renderização instantânea dos campos

## 📝 Exemplos de Uso

### **Template de PC D&D**
```typescript
{
  name: "Ficha de Personagem",
  type: "PC",
  fields: [
    {
      type: "text",
      name: "Nome do Personagem",
      required: true
    },
    {
      type: "select",
      name: "Classe",
      options: ["Bárbaro", "Bardo", "Clérigo", "Druida"],
      required: true
    },
    {
      type: "attributes",
      name: "Atributos Principais",
      attributes: [
        { name: "Força", defaultValue: 10 },
        { name: "Destreza", defaultValue: 10 },
        { name: "Constituição", defaultValue: 10 },
        { name: "Inteligência", defaultValue: 10 },
        { name: "Sabedoria", defaultValue: 10 },
        { name: "Carisma", defaultValue: 10 }
      ]
    },
    {
      type: "number",
      name: "Pontos de Vida",
      defaultValue: 8,
      options: ["1", "200"]
    },
    {
      type: "textarea",
      name: "História",
      required: false
    }
  ]
}
```

### **Template de NPC Simples**
```typescript
{
  name: "Ficha de NPC",
  type: "NPC",
  fields: [
    {
      type: "text",
      name: "Nome",
      required: true
    },
    {
      type: "text",
      name: "Ocupação",
      required: true
    },
    {
      type: "select",
      name: "Atitude",
      options: ["Amigável", "Neutro", "Hostil"],
      defaultValue: "Neutro"
    },
    {
      type: "textarea",
      name: "Descrição",
      required: false
    }
  ]
}
```

## 🚧 Limitações Conhecidas

- **Apenas 1 template por tipo**: Por design, não é bug
- **Sem nested fields**: Campos não podem conter outros campos
- **Sem validação customizada**: Validação é fixa por tipo
- **Sem import/export**: Templates não podem ser compartilhados entre campanhas

## 🔮 Possíveis Melhorias Futuras

- **Presets de sistema**: Templates prontos para D&D, Pathfinder, etc.
- **Validação customizada**: Regras específicas por campo
- **Conditional fields**: Campos que aparecem baseado em outros
- **Calculated fields**: Campos que calculam valores automaticamente
- **Import/Export**: Compartilhamento de templates entre campanhas
- **Versioning**: Histórico de mudanças nos templates

## 📞 Troubleshooting

### **Erro: "Já existe um template deste tipo"**
- **Causa**: Tentativa de criar segundo template do mesmo tipo
- **Solução**: Editar template existente ou deletar antes de criar novo

### **Campos não salvam**
- **Causa**: Validação falhou ou campos sem nome
- **Solução**: Verificar se todos os campos têm nomes válidos

### **Preview não atualiza**
- **Causa**: Estado não sincronizado
- **Solução**: Recarregar página ou verificar console por erros

### **Drag & Drop não funciona**
- **Causa**: Conflito com outros event listeners
- **Solução**: Verificar se não há outros elementos capturando eventos

---

**Última atualização**: 2025-01-09  
**Versão**: 1.0.0  
**Autor**: Sistema MesaRPG