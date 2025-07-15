import { BaseRPGSystem } from '../base-system';
import { Character } from '@prisma/client';
import { ValidationResult, TokenData, CharacterSummary } from '../types';
import { TemplateBasedCharacterSheet } from './character-sheet';
import { TemplateBasedMiniCard } from './mini-card';
import { TemplateBasedCreator } from './character-creator';

export class GenericRPGSystem extends BaseRPGSystem {
  id = 'generic';
  name = 'Sistema Genérico';
  version = '1.0.0';
  description = 'Sistema baseado em templates (mantém compatibilidade total)';
  
  CharacterSheet = TemplateBasedCharacterSheet;
  CharacterMiniCard = TemplateBasedMiniCard;
  CharacterCreator = TemplateBasedCreator;
  
  validateCharacter(data: any): ValidationResult {
    const errors: string[] = [];
    
    // Validação básica
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Nome é obrigatório');
    }
    
    // Validação específica do template (se existir)
    if (data.templateId && data.templateFields) {
      // Validar campos obrigatórios do template
      // TODO: Implementar validação baseada no template
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  getTokenData(character: Character): TokenData {
    const data = character.data as any;
    
    return {
      size: data.size || 'medium',
      hp: {
        current: data.hp || data.currentHp || 1,
        max: data.maxHp || data.hp || 1
      },
      ac: data.ac || data.armorClass || 10,
      speed: data.speed || 30,
      initiative: data.initiative || 0,
      conditions: data.conditions || []
    };
  }
  
  getCharacterSummary(character: Character): CharacterSummary {
    const data = character.data as any;
    
    const keyStats = [];
    
    // Adicionar stats baseados nos campos do template
    if (data.level) keyStats.push({ name: 'Level', value: data.level });
    if (data.hp) keyStats.push({ name: 'HP', value: `${data.currentHp || data.hp}/${data.maxHp || data.hp}` });
    if (data.ac) keyStats.push({ name: 'AC', value: data.ac });
    
    return {
      name: character.name,
      level: data.level,
      class: data.class,
      race: data.race,
      hp: {
        current: data.currentHp || data.hp || 1,
        max: data.maxHp || data.hp || 1
      },
      ac: data.ac || data.armorClass || 10,
      keyStats
    };
  }
  
  // Configurações do sistema genérico
  supportsSpells = false;
  supportsLevels = true;
  supportsClasses = true;
}