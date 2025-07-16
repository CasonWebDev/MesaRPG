"use client"

import { useSocket } from './use-socket'

export interface ChatRollResult {
  type: 'attack' | 'damage' | 'ability' | 'skill' | 'save'
  characterName: string
  label: string
  total: number
  breakdown: string
  isCritical?: boolean
  advantage?: 'normal' | 'advantage' | 'disadvantage'
}

export const useChatIntegration = (campaignId: string, characterName: string) => {
  const { sendMessage } = useSocket(campaignId)

  const sendRollToChat = (rollResult: ChatRollResult) => {
    let message = `**${rollResult.characterName}** rolou ${rollResult.label}:\n`
    
    // Add advantage/disadvantage info
    if (rollResult.advantage && rollResult.advantage !== 'normal') {
      message += `*(${rollResult.advantage === 'advantage' ? 'vantagem' : 'desvantagem'})*\n`
    }
    
    // Add critical info
    if (rollResult.isCritical) {
      message += `⚡ **CRÍTICO!** `
    }
    
    message += `**Total: ${rollResult.total}**`
    
    // Add breakdown
    if (rollResult.breakdown) {
      message += `\n*${rollResult.breakdown}*`
    }

    sendMessage(message, 'DICE_ROLL', rollResult)
  }

  const sendAttackRoll = (weaponName: string, attackResult: any, damageResult?: any) => {
    let message = `**${characterName}** ataca com ${weaponName}:\n`
    
    // Attack roll
    if (attackResult.advantage !== 'normal') {
      message += `*(${attackResult.advantage === 'advantage' ? 'vantagem' : 'desvantagem'})*\n`
    }
    
    if (attackResult.isCritical) {
      message += `⚡ **ACERTO CRÍTICO!** `
    }
    
    message += `**Ataque: ${attackResult.total}**`
    message += `\n*Dados: ${attackResult.rolls.join(', ')}`
    if (attackResult.modifier !== 0) {
      message += ` ${attackResult.modifier >= 0 ? '+' : ''}${attackResult.modifier}`
    }
    message += '*'
    
    // Damage roll if provided
    if (damageResult) {
      message += `\n**Dano: ${damageResult.total}**`
      if (damageResult.isCritical) {
        message += ` ⚡`
      }
      message += `\n*${damageResult.breakdown}*`
    }

    sendMessage(message, 'DICE_ROLL', { type: 'attack', weaponName, attackResult, damageResult })
  }

  const sendSpellRoll = (spellName: string, spellLevel: number, rollResult: any) => {
    let message = `**${characterName}** conjura ${spellName} (nível ${spellLevel}):\n`
    
    if (rollResult.type === 'damage') {
      message += `**Dano: ${rollResult.total}**`
      if (rollResult.isCritical) {
        message += ` ⚡`
      }
      message += `\n*${rollResult.breakdown}*`
    } else if (rollResult.type === 'save') {
      message += `**CD de Resistência: ${rollResult.total}**`
    }

    sendMessage(message, 'DICE_ROLL', { type: 'spell', spellName, spellLevel, rollResult })
  }

  return {
    sendRollToChat,
    sendAttackRoll,
    sendSpellRoll
  }
}