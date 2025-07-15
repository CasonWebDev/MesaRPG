import { BaseRPGSystem } from '../base-system';
import { Character } from '@prisma/client';
import { ValidationResult, TokenData, CharacterSummary } from '../types';
import { DnD5eCharacterSheet } from './character-sheet';
import { DnD5eMiniCard } from './mini-card';
import { DnD5eCharacterCreator } from './character-creator';
import { Character as DnDCharacter } from './types';

export class DnD5eRPGSystem extends BaseRPGSystem {
  id = 'dnd5e';
  name = 'D&D 5ª Edição';
  version = '1.0.0';
  description = 'Sistema completo de D&D 5ª Edição com cálculos automáticos';
  
  CharacterSheet = DnD5eCharacterSheet;
  CharacterMiniCard = DnD5eMiniCard;
  CharacterCreator = DnD5eCharacterCreator;
  
  validateCharacter(data: any): ValidationResult {
    const errors: string[] = [];
    
    // Validação básica
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Nome é obrigatório');
    }
    
    // Validação específica D&D 5e
    if (data.level && (data.level < 1 || data.level > 20)) {
      errors.push('Nível deve estar entre 1 e 20');
    }
    
    if (data.abilities) {
      const requiredAbilities = ['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'carisma'];
      for (const ability of requiredAbilities) {
        if (!data.abilities[ability] || data.abilities[ability] < 1 || data.abilities[ability] > 30) {
          errors.push(`Atributo ${ability} deve estar entre 1 e 30`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  getTokenData(character: Character): TokenData {
    const data = (character.data as any) || {};
    
    return {
      size: this.getSizeFromRace(data.race) || 'medium',
      hp: {
        current: data.currentHitPoints || data.maxHitPoints || 1,
        max: data.maxHitPoints || 1
      },
      ac: data.armorClass || 10,
      speed: data.speed || 30,
      initiative: this.calculateInitiative(data),
      conditions: data.conditions || []
    };
  }
  
  getCharacterSummary(characterData: any): CharacterSummary {
    // Handle both Character object and raw data
    const data = characterData?.data ? characterData.data : characterData;
    const characterName = characterData?.name || data?.name || 'Personagem';
    
    // Ensure data exists and has default values
    const safeData = data || {};
    
    const keyStats = [
      { name: 'Nível', value: safeData.level || 1 },
      { name: 'CA', value: safeData.armorClass || 10 },
      { name: 'Velocidade', value: `${safeData.speed || 30}ft` },
      { name: 'Iniciativa', value: this.getInitiativeModifier(safeData) }
    ];
    
    // Adicionar spell slots se for conjurador
    if (safeData.spellSlots && Object.keys(safeData.spellSlots).length > 0) {
      const totalSlots = Object.values(safeData.spellSlots).reduce((acc: number, slots: any) => acc + (slots.current || 0), 0);
      keyStats.push({ name: 'Spell Slots', value: totalSlots });
    }
    
    return {
      name: characterName,
      level: safeData.level || 1,
      class: safeData.class || 'Guerreiro',
      race: safeData.race || 'Humano',
      hp: {
        current: safeData.currentHitPoints || safeData.maxHitPoints || 1,
        max: safeData.maxHitPoints || 1
      },
      ac: safeData.armorClass || 10,
      keyStats
    };
  }
  
  // Métodos auxiliares específicos do D&D 5e
  private calculateInitiative(data: any): number {
    const dexModifier = Math.floor(((data?.abilities?.destreza || 10) - 10) / 2);
    return dexModifier + (data?.initiativeBonus || 0);
  }
  
  private getInitiativeModifier(data: any): string {
    const initiative = this.calculateInitiative(data);
    return initiative >= 0 ? `+${initiative}` : `${initiative}`;
  }
  
  private getSizeFromRace(race: string): TokenData['size'] {
    // Mapeamento básico de raças para tamanhos
    const smallRaces = ['halfling', 'gnomo', 'kobold'];
    const largeRaces = ['gigante', 'ogro'];
    
    const raceLower = race?.toLowerCase() || '';
    
    if (smallRaces.some(r => raceLower.includes(r))) return 'small';
    if (largeRaces.some(r => raceLower.includes(r))) return 'large';
    
    return 'medium';
  }
  
  // Configurações do sistema D&D 5e
  supportsSpells = true;
  supportsLevels = true;
  supportsClasses = true;
}