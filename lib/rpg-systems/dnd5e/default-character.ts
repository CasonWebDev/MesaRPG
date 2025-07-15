import { Character } from './types';

export function createDefaultCharacter(): Character {
  return {
    name: '',
    class: 'Guerreiro',
    race: 'Humano',
    level: 1,
    background: '',
    alignment: 'Neutro',
    experience: 0,
    inspiration: false,
    proficiencyBonus: 2,
    
    abilities: {
      forca: 10,
      destreza: 10,
      constituicao: 10,
      inteligencia: 10,
      sabedoria: 10,
      carisma: 10
    },
    
    skills: {
      acrobacia: 0,
      arcanismo: 0,
      atletismo: 0,
      atuacao: 0,
      blefe: 0,
      furtividade: 0,
      historia: 0,
      intimidacao: 0,
      intuicao: 0,
      investigacao: 0,
      lidarComAnimais: 0,
      medicina: 0,
      natureza: 0,
      percepcao: 0,
      persuasao: 0,
      prestidigitacao: 0,
      religiao: 0,
      sobrevivencia: 0
    },
    
    skillProficiencies: [],
    
    savingThrows: {
      forca: false,
      destreza: false,
      constituicao: false,
      inteligencia: false,
      sabedoria: false,
      carisma: false
    },
    
    armorClass: 10,
    initiative: 0,
    speed: 30,
    
    maxHitPoints: 10,
    currentHitPoints: 10,
    temporaryHitPoints: 0,
    hitDiceTotal: '1d8',
    hitDiceUsed: 0,
    
    deathSaves: {
      successes: 0,
      failures: 0
    },
    
    attacksAndSpellcasting: [],
    
    inventory: [],
    equippedArmorId: null,
    equippedShieldId: null,
    
    features: [],
    traits: [],
    
    spells: {},
    spellSlots: {},
    spellcastingAbility: null,
    spellSaveDC: 8,
    spellAttackBonus: 0,
    
    proficiencies: {
      languages: [],
      weapons: [],
      armor: [],
      tools: []
    },
    
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    
    conditions: [],
    exhaustion: 0,
    notes: '',
    
    avatar: ''
  };
}