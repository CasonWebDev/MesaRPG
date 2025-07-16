import { Character } from '@prisma/client';

export interface RPGSystem {
  id: string;
  name: string;
  version: string;
  description: string;
  
  // Componentes obrigatórios
  CharacterSheet: React.ComponentType<CharacterSheetProps>;
  CharacterMiniCard: React.ComponentType<CharacterMiniCardProps>;
  CharacterCreator: React.ComponentType<CharacterCreatorProps>;
  
  // Funções obrigatórias
  validateCharacter: (data: any) => ValidationResult;
  getTokenData: (character: Character) => TokenData;
  getCharacterSummary: (character: Character) => CharacterSummary;
  
  // Configurações opcionais
  supportsSpells?: boolean;
  supportsLevels?: boolean;
  supportsClasses?: boolean;
}

export interface CharacterSheetProps {
  characterData: any;
  onDataChange?: (field: string, value: any) => void;
  isEditing: boolean;
  characterType: 'PC' | 'NPC' | 'CREATURE';
  campaignId?: string;
  userName?: string;
}

export interface CharacterMiniCardProps {
  character: Character;
  onClick?: () => void;
  campaignId: string;
}

export interface CharacterCreatorProps {
  campaignId: string;
  characterType: 'PC' | 'NPC' | 'CREATURE';
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface TokenData {
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  hp: {
    current: number;
    max: number;
  };
  ac: number;
  speed: number;
  initiative?: number;
  conditions?: string[];
}

export interface CharacterSummary {
  name: string;
  level?: number;
  class?: string;
  race?: string;
  hp?: {
    current: number;
    max: number;
  };
  ac?: number;
  keyStats?: Array<{
    name: string;
    value: string | number;
  }>;
}