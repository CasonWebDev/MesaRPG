# Plano de Desenvolvimento - MesaRPG Pós-Simplificação

## 📋 Visão Geral

Este documento apresenta o plano de desenvolvimento do MesaRPG após a grande simplificação de julho 2025, onde removemos sistemas complexos instáveis em favor de um sistema **ultra-básico e confiável**.

## 🏆 Status Atual - Sistema Production-Ready

### ✅ **O que temos e funciona perfeitamente:**
- **Grid Tático Básico** (800x600px fixo)
- **Sistema de Tokens Ultra-Simples** (coordenadas pixel-based)
- **Movimento Livre** para todos os usuários (sem permissões)
- **Sincronização WebSocket** confiável e sem conflitos
- **Persistência Garantida** de posições após refresh
- **Sistema de Personagens** completo com templates
- **Chat em Tempo Real** com comandos de dados
- **Gerenciamento de Mapas** com ativação em tempo real
- **Sistema de Handouts** com compartilhamento
- **Upload de Arquivos** e gerenciamento completo
- **Sistema de Convites** para campanhas

### 🚫 **O que foi removido (por causar instabilidade):**
- Sistema de coordenadas normalizadas complexas
- Verificações de permissão excessivas para tokens
- Toolbar com múltiplas ferramentas
- Sistema enhanced de qualquer tipo
- Zoom avançado com cálculos complexos
- Features que causavam loops infinitos

## 🎯 Filosofia de Desenvolvimento: "Menos é Mais"

### Princípios Fundamentais
1. **Estabilidade** sempre sobre features avançadas
2. **Simplicidade** bem executada supera complexidade instável
3. **Funcionalidade básica** que sempre funciona
4. **Movimento livre** baseado em confiança entre jogadores
5. **Performance** através de simplicidade, não otimização complexa

### Lições Aprendidas (Julho 2025)
- ❌ **Nunca mais**: Coordenadas normalizadas complexas
- ❌ **Nunca mais**: Sistema de permissões excessivo para tokens
- ❌ **Nunca mais**: Features que causam loops infinitos
- ❌ **Nunca mais**: Enhanced systems sem necessidade real
- ✅ **Sempre**: Testar em cenários simples primeiro
- ✅ **Sempre**: Priorizar estabilidade sobre funcionalidade
- ✅ **Sempre**: Manter sistemas simples e previsíveis

---

## 🚀 FASE 1: MELHORIAS CONSERVADORAS (1-2 meses)

### **Prioridade**: Baixa (apenas se realmente necessário)
### **Complexidade**: Muito baixa (sem mudanças arquiteturais)

### 1.1 Melhorias Visuais Simples
- [ ] **Indicadores de conexão** WebSocket (verde/vermelho simples)
- [ ] **Seleção visual** de tokens (apenas borda, sem funcionalidade)
- [ ] **Preview de snap** durante movimento (visual apenas)
- [ ] **Feedback visual** de loading durante uploads
- [ ] **Toast notifications** melhoradas para ações de tokens

### 1.2 Configurações Básicas Opcionais
- [ ] **Snap para grid** simples (opcional, sem coordenadas normalizadas)
- [ ] **Tamanho de token** configurável (pequeno/médio/grande)
- [ ] **Grid visible/hidden** toggle simples
- [ ] **Configurações de usuário** (tema, notificações)

### 1.3 Quality of Life
- [ ] **Undo/Redo** para movimento de tokens (máximo 5 ações)
- [ ] **Duplicar token** (criar cópia em posição adjacente)
- [ ] **Centralizar mapa** button
- [ ] **Reset posições** para tokens selecionados

**⚠️ Critérios rigorosos para implementação:**
- Máximo 200 linhas de código por feature
- Zero mudanças em hooks existentes
- Nenhum sistema de coordenadas complexo
- Deve funcionar perfeitamente em 1 dia de desenvolvimento

---

## 🎨 FASE 2: FUNCIONALIDADES SIMPLES (2-4 meses)

### **Prioridade**: Muito baixa (apenas se usuários pedirem muito)
### **Complexidade**: Baixa (sem mexer no core)

### 2.1 Sistema de Desenho Ultra-Básico
- [ ] **Pen tool** simples (apenas uma cor, apenas GM)
- [ ] **Borracha** para remover desenhos
- [ ] **Limpar tudo** button
- [ ] Persistência via `gameState.drawings` (JSON simples)
- [ ] Sincronização via WebSocket (sem batching complexo)

**Implementação mínima:**
```typescript
interface SimpleDrawing {
  id: string
  points: Array<{ x: number; y: number }> // Pixels absolutos
  color: string                           // Apenas vermelho
  createdBy: string
}
```

### 2.2 Fog of War Minimalista
- [ ] **Click para ocultar** áreas (apenas GM)
- [ ] **Click para revelar** áreas (apenas GM)
- [ ] **Limpar fog** button
- [ ] Persistência simples via `gameState.fog`

**Implementação mínima:**
```typescript
interface SimpleFog {
  hiddenAreas: Array<{ x: number; y: number; w: number; h: number }>
}
```

### 2.3 Melhorias de Chat
- [ ] **Histórico local** (últimas 100 mensagens no localStorage)
- [ ] **Comandos básicos** adicionais (`/clear`, `/help`)
- [ ] **Ping jogadores** com `@usuario`
- [ ] **Export de log** (apenas texto simples)

**⚠️ Critérios ainda mais rigorosos:**
- Máximo 500 linhas de código por funcionalidade completa
- Zero dependências novas
- Deve ser removível em 1 hora se der problema
- Implementação em branch separada, merge apenas se 100% estável

---

## 🔧 FASE 3: MELHORIAS TÉCNICAS (3-6 meses)

### **Prioridade**: Muito baixa (apenas para melhorar manutenção)

### 3.1 Otimizações Básicas
- [ ] **Debounce** para movimento de tokens (evitar spam WebSocket)
- [ ] **Retry logic** simples para falhas de WebSocket
- [ ] **Cleanup** automático de tokens órfãos
- [ ] **Compression** básica para dados de gameState

### 3.2 Monitoramento Simples
- [ ] **Health check** endpoint (`/api/health`)
- [ ] **Métricas básicas** (usuários online, campanhas ativas)
- [ ] **Logs estruturados** para debugging
- [ ] **Error boundary** para componentes críticos

### 3.3 Testes Básicos
- [ ] **API tests** para endpoints críticos
- [ ] **WebSocket tests** básicos
- [ ] **Integration tests** para fluxos principais
- [ ] **Performance baseline** measurements

---

## 📊 Métricas de Qualidade

### Sistema Atual (Production-Ready)
- ✅ **Estabilidade**: 100% (zero crashes críticos)
- ✅ **Performance**: Excelente (zero lag perceptível)
- ✅ **Usabilidade**: Alta (workflow simples e intuitivo)
- ✅ **Manutenibilidade**: Muito alta (código simples e claro)

### Objetivos para Futuras Fases
- 🎯 **Manter 100% de estabilidade** (prioridade absoluta)
- 🎯 **Adicionar valor real** para usuários
- 🎯 **Não adicionar complexidade** desnecessária
- 🎯 **Facilidade de remoção** se feature não funcionar

---

## 🚨 Regras de Desenvolvimento Pós-Simplificação

### ❌ **NUNCA FAZER:**
1. **Sistemas de coordenadas normalizadas** ou complexas
2. **Permissões granulares** para tokens
3. **Features que requerem loops** ou cálculos pesados
4. **Múltiplas conexões WebSocket** ou padrões complexos
5. **Otimizações prematuras** que complicam o código
6. **Dependencies pesadas** ou frameworks complexos
7. **Features "porque seria legal"** sem necessidade real

### ✅ **SEMPRE FAZER:**
1. **Testar em cenário mais simples** possível primeiro
2. **Implementar em branch isolada** para reverter facilmente
3. **Documentar claramente** o que foi adicionado
4. **Validar com usuários reais** antes de merge
5. **Manter backup** da versão anterior
6. **Code review rigoroso** focado em simplicidade
7. **Questionar se realmente é necessário**

---

## 🎯 Cronograma Realístico

### **Q3 2025: Consolidação**
- Documentação completa do sistema atual
- Cleanup final de código órfão
- Performance baseline measurements
- User feedback collection

### **Q4 2025: Melhorias Conservadoras (se necessário)**
- Implementar apenas features Fase 1 que usuários realmente pedirem
- Foco em polish e refinamento
- Zero mudanças arquiteturais

### **2026: Funcionalidades Simples (talvez)**
- Avaliar necessidade real de Fase 2
- Apenas se sistema atual for insuficiente para usuários
- Manter mesmos critérios rigorosos

---

## 💡 Diretrizes para Tomada de Decisão

### Perguntas antes de implementar qualquer feature:

1. **"O sistema atual é insuficiente?"** - Se não, não implemente
2. **"Posso implementar em <100 linhas?"** - Se não, simplifique ou desista
3. **"Posso remover em <1 hora se der problema?"** - Se não, não faça
4. **"Isso quebra a simplicidade atual?"** - Se sim, definitivamente não faça
5. **"Usuários reais pediram isso?"** - Se não, provavelmente não é necessário

### Fluxo de Decisão:
```
Nova Ideia → É realmente necessária? → NÃO → Arquivar
           ↓
           SIM → É simples de implementar? → NÃO → Simplificar ou Arquivar  
           ↓
           SIM → Implementar em branch → Testar → Funciona perfeitamente? → NÃO → Remover
           ↓
           SIM → Merge
```

---

## 🏆 Conclusão

O MesaRPG está **completo e funcional** como VTT básico. Futuras melhorias devem ser:

- **Extremamente conservadoras**
- **Totalmente opcionais**
- **Facilmente removíveis**
- **Baseadas em necessidade real de usuários**

O sistema atual demonstra que **simplicidade bem executada supera complexidade instável**. Este deve ser o norte para todo desenvolvimento futuro.

**Status**: ✅ **Production-Ready** como sistema básico de VTT para RPG online