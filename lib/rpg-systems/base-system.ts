import { Character } from '@prisma/client';
import { RPGSystem, TokenData, CharacterSummary, ValidationResult } from './types';

export abstract class BaseRPGSystem implements RPGSystem {
  abstract id: string;
  abstract name: string;
  abstract version: string;
  abstract description: string;
  
  abstract CharacterSheet: React.ComponentType<any>;
  abstract CharacterMiniCard: React.ComponentType<any>;
  abstract CharacterCreator: React.ComponentType<any>;
  
  // Implementações padrão que podem ser sobrescritas
  validateCharacter(data: any): ValidationResult {
    const errors: string[] = [];
    
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Nome é obrigatório');
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
        current: data.currentHp || data.hp || 1,
        max: data.maxHp || data.hp || 1
      },
      ac: data.ac || data.armorClass || 10,
      speed: data.speed || 30,
      initiative: data.initiative || 0,
      conditions: data.conditions || []
    };
  }
  
  getCharacterSummary(characterData: any): CharacterSummary {
    // Handle both Character object and raw data
    const data = characterData?.data ? characterData.data : characterData;
    const characterName = characterData?.name || data?.name || 'Personagem';
    
    // Ensure data exists and has default values
    const safeData = data || {};
    
    return {
      name: characterName,
      level: safeData.level || 1,
      class: safeData.class || 'Básico',
      race: safeData.race || 'Humano',
      hp: {
        current: safeData.currentHp || safeData.hp || 1,
        max: safeData.maxHp || safeData.hp || 1
      },
      ac: data.ac || data.armorClass || 10,
      keyStats: []
    };
  }
  
  // Configurações padrão
  supportsSpells = false;
  supportsLevels = false;
  supportsClasses = false;
}