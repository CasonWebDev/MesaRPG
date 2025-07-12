export interface DiceRoll {
  dice: string
  rolls: number[]
  total: number
  modifier: number
  expression: string
}

export interface DiceResult {
  rolls: DiceRoll[]
  total: number
  expression: string
  success: boolean
}

export function rollDice(expression: string): DiceResult {
  try {
    // Normalizar a expressão removendo espaços
    const normalized = expression.replace(/\s+/g, '')
    
    // Regex para capturar dados no formato XdY+Z ou XdY-Z
    const diceRegex = /(\d+)d(\d+)([+-]\d+)?/gi
    const rolls: DiceRoll[] = []
    let total = 0
    let processedExpression = normalized

    // Processar cada conjunto de dados
    let match
    while ((match = diceRegex.exec(normalized)) !== null) {
      const numDice = parseInt(match[1])
      const numSides = parseInt(match[2])
      const modifier = match[3] ? parseInt(match[3]) : 0

      // Validar limites
      if (numDice > 100) throw new Error('Máximo de 100 dados por rolagem')
      if (numSides > 1000) throw new Error('Máximo de 1000 lados por dado')
      if (numDice < 1) throw new Error('Mínimo de 1 dado')
      if (numSides < 2) throw new Error('Mínimo de 2 lados por dado')

      // Rolar os dados
      const diceRolls = []
      for (let i = 0; i < numDice; i++) {
        diceRolls.push(Math.floor(Math.random() * numSides) + 1)
      }

      const diceTotal = diceRolls.reduce((sum, roll) => sum + roll, 0) + modifier

      rolls.push({
        dice: `${numDice}d${numSides}`,
        rolls: diceRolls,
        total: diceTotal,
        modifier,
        expression: match[0]
      })

      total += diceTotal
    }

    // Processar modificadores adicionais fora dos dados
    const modifierRegex = /(?:^|[^d])([+-]\d+)(?![d\d])/g
    let modifierMatch
    while ((modifierMatch = modifierRegex.exec(normalized)) !== null) {
      const modifier = parseInt(modifierMatch[1])
      total += modifier
    }

    if (rolls.length === 0) {
      throw new Error('Formato inválido. Use XdY (ex: 2d6, 1d20+5)')
    }

    return {
      rolls,
      total,
      expression: normalized,
      success: true
    }

  } catch (error) {
    return {
      rolls: [],
      total: 0,
      expression,
      success: false
    }
  }
}

export function formatDiceResult(result: DiceResult): string {
  if (!result.success) {
    return `❌ Erro ao rolar: ${result.expression}`
  }

  const rollDetails = result.rolls.map(roll => {
    const rollsText = roll.rolls.join(', ')
    const modifierText = roll.modifier !== 0 ? ` ${roll.modifier >= 0 ? '+' : ''}${roll.modifier}` : ''
    return `${roll.dice}: [${rollsText}]${modifierText} = ${roll.total}`
  }).join(' | ')

  return `🎲 ${result.expression} = **${result.total}**\n${rollDetails}`
}

export function parseDiceCommand(message: string): { isDiceRoll: boolean; diceExpression?: string; description?: string } {
  // Comandos de dados: /roll, /r, /dice
  const diceCommandRegex = /^\/(?:roll|r|dice)\s+(.+)$/i
  const match = message.match(diceCommandRegex)
  
  if (match) {
    const fullExpression = match[1].trim()
    
    // Separar expressão de dados da descrição (se houver)
    const parts = fullExpression.split(/\s+/)
    const diceExpression = parts[0]
    const description = parts.length > 1 ? parts.slice(1).join(' ') : undefined
    
    return {
      isDiceRoll: true,
      diceExpression,
      description
    }
  }

  return { isDiceRoll: false }
}

export function createDiceMessage(diceExpression: string, description?: string): string {
  const result = rollDice(diceExpression)
  const formattedResult = formatDiceResult(result)
  
  if (description) {
    return `**${description}**\n${formattedResult}`
  }
  
  return formattedResult
}

// Funções auxiliares para dados comuns
export const commonDiceRolls = {
  d4: () => rollDice('1d4'),
  d6: () => rollDice('1d6'),
  d8: () => rollDice('1d8'),
  d10: () => rollDice('1d10'),
  d12: () => rollDice('1d12'),
  d20: () => rollDice('1d20'),
  d100: () => rollDice('1d100'),
  
  // Rolagens comuns de D&D
  ability: () => rollDice('4d6'), // Para atributos (normalmente se remove o menor)
  initiative: () => rollDice('1d20'),
  damage: {
    sword: () => rollDice('1d8'),
    dagger: () => rollDice('1d4'),
    greataxe: () => rollDice('1d12'),
    fireball: () => rollDice('8d6')
  }
}

export function getRandomDiceEmoji(): string {
  const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
  return diceEmojis[Math.floor(Math.random() * diceEmojis.length)]
}