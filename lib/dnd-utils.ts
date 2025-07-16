import type { Character, SkillName, Skill, Ability, ConditionName } from "./dnd-types"

export const ABILITIES_PT: { [key in Ability]: string } = {
  forca: "Força",
  destreza: "Destreza",
  constituicao: "Constituição",
  inteligencia: "Inteligência",
  sabedoria: "Sabedoria",
  carisma: "Carisma",
}

export const CONDITIONS_LIST: ConditionName[] = [
  "Agarrado",
  "Amedrontado",
  "Atordoado",
  "Caído",
  "Cego",
  "Enfeitiçado",
  "Envenenado",
  "Impedido",
  "Incapacitado",
  "Inconsciente",
  "Invisível",
  "Paralisado",
  "Petrificado",
  "Surdo",
]

export const CLASS_DATA: {
  [key: string]: { 
    hitDie: number; 
    savingThrows: Ability[]; 
    spellcastingAbility: Ability | null;
    armorProficiencies: string[];
    weaponProficiencies: string[];
    skillChoices: { skills: SkillName[]; choose: number };
  }
} = {
  Bárbaro: { 
    hitDie: 12, 
    savingThrows: ["forca", "constituicao"], 
    spellcastingAbility: null,
    armorProficiencies: ["Armadura Leve", "Armadura Média", "Escudos"],
    weaponProficiencies: ["Armas Simples", "Armas Marciais"],
    skillChoices: { skills: ["Adestrar Animais", "Atletismo", "Intimidação", "Natureza", "Percepção", "Sobrevivência"], choose: 2 }
  },
  Bardo: { 
    hitDie: 8, 
    savingThrows: ["destreza", "carisma"], 
    spellcastingAbility: "carisma",
    armorProficiencies: ["Armadura Leve"],
    weaponProficiencies: ["Armas Simples", "Bestas de Mão", "Espadas Longas", "Rapieiras", "Espadas Curtas"],
    skillChoices: { skills: ["Acrobacia", "Adestrar Animais", "Arcanismo", "Atletismo", "Atuação", "Enganação", "História", "Intimidação", "Intuição", "Investigação", "Medicina", "Natureza", "Percepção", "Persuasão", "Prestidigitação", "Religião", "Sobrevivência"], choose: 3 }
  },
  Clérigo: { 
    hitDie: 8, 
    savingThrows: ["sabedoria", "carisma"], 
    spellcastingAbility: "sabedoria",
    armorProficiencies: ["Armadura Leve", "Armadura Média", "Escudos"],
    weaponProficiencies: ["Armas Simples"],
    skillChoices: { skills: ["História", "Intuição", "Medicina", "Persuasão", "Religião"], choose: 2 }
  },
  Druida: { 
    hitDie: 8, 
    savingThrows: ["inteligencia", "sabedoria"], 
    spellcastingAbility: "sabedoria",
    armorProficiencies: ["Armadura Leve", "Armadura Média", "Escudos (não metálicos)"],
    weaponProficiencies: ["Clavas", "Adagas", "Dardos", "Azagaias", "Maças", "Bordões", "Cimitarras", "Foices", "Fundas", "Lanças"],
    skillChoices: { skills: ["Arcanismo", "Adestrar Animais", "Intuição", "Medicina", "Natureza", "Percepção", "Religião", "Sobrevivência"], choose: 2 }
  },
  Feiticeiro: { 
    hitDie: 6, 
    savingThrows: ["constituicao", "carisma"], 
    spellcastingAbility: "carisma",
    armorProficiencies: [],
    weaponProficiencies: ["Adagas", "Dardos", "Fundas", "Bordões", "Bestas Leves"],
    skillChoices: { skills: ["Arcanismo", "Enganação", "Intuição", "Intimidação", "Persuasão", "Religião"], choose: 2 }
  },
  Guerreiro: { 
    hitDie: 10, 
    savingThrows: ["forca", "constituicao"], 
    spellcastingAbility: null,
    armorProficiencies: ["Todas as Armaduras", "Escudos"],
    weaponProficiencies: ["Armas Simples", "Armas Marciais"],
    skillChoices: { skills: ["Acrobacia", "Adestrar Animais", "Atletismo", "História", "Intuição", "Intimidação", "Percepção", "Sobrevivência"], choose: 2 }
  },
  Ladino: { 
    hitDie: 8, 
    savingThrows: ["destreza", "inteligencia"], 
    spellcastingAbility: null,
    armorProficiencies: ["Armadura Leve"],
    weaponProficiencies: ["Armas Simples", "Bestas de Mão", "Espadas Longas", "Rapieiras", "Espadas Curtas"],
    skillChoices: { skills: ["Acrobacia", "Atletismo", "Enganação", "Furtividade", "Intimidação", "Intuição", "Investigação", "Percepção", "Atuação", "Persuasão", "Prestidigitação"], choose: 4 }
  },
  Mago: { 
    hitDie: 6, 
    savingThrows: ["inteligencia", "sabedoria"], 
    spellcastingAbility: "inteligencia",
    armorProficiencies: [],
    weaponProficiencies: ["Adagas", "Dardos", "Fundas", "Bordões", "Bestas Leves"],
    skillChoices: { skills: ["Arcanismo", "História", "Intuição", "Investigação", "Medicina", "Religião"], choose: 2 }
  },
  Monge: { 
    hitDie: 8, 
    savingThrows: ["forca", "destreza"], 
    spellcastingAbility: null,
    armorProficiencies: [],
    weaponProficiencies: ["Armas Simples", "Espadas Curtas"],
    skillChoices: { skills: ["Acrobacia", "Atletismo", "História", "Intuição", "Religião", "Furtividade"], choose: 2 }
  },
  Paladino: { 
    hitDie: 10, 
    savingThrows: ["sabedoria", "carisma"], 
    spellcastingAbility: "carisma",
    armorProficiencies: ["Todas as Armaduras", "Escudos"],
    weaponProficiencies: ["Armas Simples", "Armas Marciais"],
    skillChoices: { skills: ["Atletismo", "Intuição", "Intimidação", "Medicina", "Persuasão", "Religião"], choose: 2 }
  },
  Ranger: { 
    hitDie: 10, 
    savingThrows: ["forca", "destreza"], 
    spellcastingAbility: "sabedoria",
    armorProficiencies: ["Armadura Leve", "Armadura Média", "Escudos"],
    weaponProficiencies: ["Armas Simples", "Armas Marciais"],
    skillChoices: { skills: ["Adestrar Animais", "Atletismo", "Furtividade", "Intuição", "Investigação", "Natureza", "Percepção", "Sobrevivência"], choose: 3 }
  },
}

export const CLASS_RESOURCES: {
  [key: string]: Array<{
    name: string
    maxFormula: string // Formula like "level", "level + modWis", etc.
    rechargeType: 'short' | 'long' | 'manual'
    startingLevel: number
  }>
} = {
  Bárbaro: [
    { name: "Fúria", maxFormula: "level <= 2 ? 2 : level <= 5 ? 3 : level <= 11 ? 4 : level <= 16 ? 5 : 6", rechargeType: "long", startingLevel: 1 }
  ],
  Bardo: [
    { name: "Inspiração Bárdica", maxFormula: "proficiencyBonus", rechargeType: "short", startingLevel: 1 }
  ],
  Clérigo: [
    { name: "Canalizar Divindade", maxFormula: "level <= 5 ? 1 : level <= 17 ? 2 : 3", rechargeType: "short", startingLevel: 2 }
  ],
  Druida: [
    { name: "Forma Selvagem", maxFormula: "2", rechargeType: "short", startingLevel: 2 }
  ],
  Feiticeiro: [
    { name: "Pontos de Feitiçaria", maxFormula: "level", rechargeType: "long", startingLevel: 2 }
  ],
  Guerreiro: [
    { name: "Surto de Ação", maxFormula: "level <= 16 ? 1 : 2", rechargeType: "short", startingLevel: 2 }
  ],
  Ladino: [],
  Mago: [
    { name: "Recuperação Arcana", maxFormula: "1", rechargeType: "long", startingLevel: 1 }
  ],
  Monge: [
    { name: "Pontos de Ki", maxFormula: "level", rechargeType: "short", startingLevel: 2 }
  ],
  Paladino: [
    { name: "Canalizar Divindade", maxFormula: "level <= 5 ? 1 : level <= 17 ? 2 : 3", rechargeType: "short", startingLevel: 3 },
    { name: "Cura Divina", maxFormula: "modCha", rechargeType: "long", startingLevel: 1 }
  ],
  Ranger: [
    { name: "Inimigo Predileto", maxFormula: "1", rechargeType: "manual", startingLevel: 1 }
  ],
}

export const SPELL_SLOTS_BY_CLASS_LEVEL: { [key: string]: number[][] } = {
  // Full Casters (Wizard, Cleric, Bard, Druid, Sorcerer)
  Mago: [
    [2, 0, 0, 0, 0, 0, 0, 0, 0], // Level 1
    [3, 0, 0, 0, 0, 0, 0, 0, 0], // Level 2
    [4, 2, 0, 0, 0, 0, 0, 0, 0], // Level 3
    [4, 3, 0, 0, 0, 0, 0, 0, 0], // Level 4
    [4, 3, 2, 0, 0, 0, 0, 0, 0], // Level 5
    [4, 3, 3, 0, 0, 0, 0, 0, 0], // Level 6
    [4, 3, 3, 1, 0, 0, 0, 0, 0], // Level 7
    [4, 3, 3, 2, 0, 0, 0, 0, 0], // Level 8
    [4, 3, 3, 3, 1, 0, 0, 0, 0], // Level 9
    [4, 3, 3, 3, 2, 0, 0, 0, 0], // Level 10
    [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 11
    [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 12
    [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 13
    [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 14
    [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 15
    [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 16
    [4, 3, 3, 3, 2, 1, 1, 1, 1], // Level 17
    [4, 3, 3, 3, 3, 1, 1, 1, 1], // Level 18
    [4, 3, 3, 3, 3, 2, 1, 1, 1], // Level 19
    [4, 3, 3, 3, 3, 2, 2, 1, 1], // Level 20
  ],
  Clérigo: [
    [2, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
    [4, 3, 3, 2, 0, 0, 0, 0, 0],
    [4, 3, 3, 3, 1, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 2, 1, 1],
  ],
  Bardo: [
    [2, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
    [4, 3, 3, 2, 0, 0, 0, 0, 0],
    [4, 3, 3, 3, 1, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 2, 1, 1],
  ],
  Feiticeiro: [
    [2, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
    [4, 3, 3, 2, 0, 0, 0, 0, 0],
    [4, 3, 3, 3, 1, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 2, 1, 1],
  ],
  Druida: [
    [2, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
    [4, 3, 3, 2, 0, 0, 0, 0, 0],
    [4, 3, 3, 3, 1, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 0, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 0, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 0],
    [4, 3, 3, 3, 2, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 1, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 1, 1, 1],
    [4, 3, 3, 3, 3, 2, 2, 1, 1],
  ],
  // Half Casters (Paladin, Ranger)
  Paladino: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
    [4, 3, 3, 2, 0, 0, 0, 0, 0],
    [4, 3, 3, 2, 0, 0, 0, 0, 0],
    [4, 3, 3, 3, 1, 0, 0, 0, 0],
    [4, 3, 3, 3, 1, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 0, 0, 0, 0],
  ],
  Ranger: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
    [4, 3, 3, 2, 0, 0, 0, 0, 0],
    [4, 3, 3, 2, 0, 0, 0, 0, 0],
    [4, 3, 3, 3, 1, 0, 0, 0, 0],
    [4, 3, 3, 3, 1, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 0, 0, 0, 0],
    [4, 3, 3, 3, 2, 0, 0, 0, 0],
  ],
  // Third Casters (Eldritch Knight, Arcane Trickster)
  "Guerreiro (Cavaleiro Élfico)": [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
  ],
  "Ladino (Trapaceiro Arcano)": [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [3, 0, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 2, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 0, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 2, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 0, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
    [4, 3, 3, 1, 0, 0, 0, 0, 0],
  ],
}

export const initialCharacter: Character = {
  name: "",
  class: "",
  subclass: "",
  level: 1,
  background: "",
  playerName: "",
  race: "",
  alignment: "",
  experiencePoints: 0,
  abilities: {
    forca: 10,
    destreza: 10,
    constituicao: 10,
    inteligencia: 10,
    sabedoria: 10,
    carisma: 10,
  },
  inspiration: 0,
  armorClass: 10,
  speed: 9,
  maxHitPoints: 0,
  currentHitPoints: 0,
  temporaryHitPoints: 0,
  hitDice: "",
  usedHitDice: 0,
  deathSaves: { successes: 0, failures: 0 },
  activeConditions: [],
  exhaustionLevel: 0,
  savingThrowProficiencies: [],
  skillProficiencies: [],
  armorProficiencies: [],
  weaponProficiencies: [],
  otherProficienciesAndLanguages: "",
  inventory: [],
  equippedArmorId: null,
  equippedShieldId: null,
  attunedItemIds: [],
  currency: {
    cp: 0,
    sp: 0,
    ep: 0,
    gp: 0,
    pp: 0,
  },
  personalityTraits: "",
  ideals: "",
  bonds: "",
  flaws: "",
  characterBackstory: "",
  featuresAndTraits: "",
  additionalFeatures: "",
  features: [],
  customAttacks: [],
  classResources: [],
  age: "",
  height: "",
  weight: "",
  eyes: "",
  skin: "",
  hair: "",
  avatar: "",
  customSpellSaveDC: null,
  customSpellAttackBonus: null,
  spellcastingClass: "",
  spellcastingAbility: null,
  spells: {
    0: { slotsTotal: 0, slotsExpended: 0, spells: [] },
    1: { slotsTotal: 0, slotsExpended: 0, spells: [] },
    2: { slotsTotal: 0, slotsExpended: 0, spells: [] },
    3: { slotsTotal: 0, slotsExpended: 0, spells: [] },
    4: { slotsTotal: 0, slotsExpended: 0, spells: [] },
    5: { slotsTotal: 0, slotsExpended: 0, spells: [] },
    6: { slotsTotal: 0, slotsExpended: 0, spells: [] },
    7: { slotsTotal: 0, slotsExpended: 0, spells: [] },
    8: { slotsTotal: 0, slotsExpended: 0, spells: [] },
    9: { slotsTotal: 0, slotsExpended: 0, spells: [] },
  },
  notes: "",
}

export const SKILLS: { [key in SkillName]: Skill } = {
  // Força
  Atletismo: { ability: "forca" },
  // Destreza
  Acrobacia: { ability: "destreza" },
  Furtividade: { ability: "destreza" },
  Prestidigitação: { ability: "destreza" },
  // Inteligência
  Arcanismo: { ability: "inteligencia" },
  História: { ability: "inteligencia" },
  Investigação: { ability: "inteligencia" },
  Natureza: { ability: "inteligencia" },
  Religião: { ability: "inteligencia" },
  // Sabedoria
  "Adestrar Animais": { ability: "sabedoria" },
  Intuição: { ability: "sabedoria" },
  Medicina: { ability: "sabedoria" },
  Percepção: { ability: "sabedoria" },
  Sobrevivência: { ability: "sabedoria" },
  // Carisma
  Atuação: { ability: "carisma" },
  Enganação: { ability: "carisma" },
  Intimidação: { ability: "carisma" },
  Persuasão: { ability: "carisma" },
}

export function calculateAbilityModifier(score: number): number {
  if (isNaN(score) || score === undefined || score === null) {
    return 0
  }
  return Math.floor((score - 10) / 2)
}

export function calculateProficiencyBonus(level: number): number {
  if (isNaN(level) || level === undefined || level === null) {
    return 2
  }
  return 2 + Math.floor((level - 1) / 4)
}

export function calculateInitialHitPoints(conMod: number, className: keyof typeof CLASS_DATA): number {
  const classInfo = CLASS_DATA[className]
  if (!classInfo) return Math.max(1, conMod)
  return classInfo.hitDie + conMod
}

export function calculateSpellSaveDC(profBonus: number, abilityMod: number): number {
  return 8 + profBonus + abilityMod
}

export function calculateSpellAttackBonus(profBonus: number, abilityMod: number): number {
  return profBonus + abilityMod
}

export function getSpellSlotsForClass(className: string, level: number): number[] {
  const spellSlots = SPELL_SLOTS_BY_CLASS_LEVEL[className]
  if (!spellSlots || level < 1 || level > 20) {
    return [0, 0, 0, 0, 0, 0, 0, 0, 0] // No spell slots
  }
  return spellSlots[level - 1] // Arrays are 0-indexed, levels are 1-indexed
}

export function applySpellSlotsToCharacter(character: Character): Character {
  const spellSlots = getSpellSlotsForClass(character.class, character.level)
  
  // Create new spells object with updated slots
  const updatedSpells = { ...character.spells }
  
  // Update spell slots for levels 1-9
  for (let level = 1; level <= 9; level++) {
    const currentLevel = updatedSpells[level] || { slotsExpended: 0, slotsTotal: 0, spells: [] }
    const newTotal = spellSlots[level - 1] || 0
    
    // Only update if different, and preserve expended slots if they're valid
    if (currentLevel.slotsTotal !== newTotal) {
      updatedSpells[level] = {
        ...currentLevel,
        slotsTotal: newTotal,
        // If new total is less than expended, reset expended to match
        slotsExpended: Math.min(currentLevel.slotsExpended, newTotal)
      }
    }
  }
  
  return {
    ...character,
    spells: updatedSpells
  }
}

export function evaluateResourceFormula(formula: string, character: Character, calculatedStats: any): number {
  const level = character.level
  const proficiencyBonus = calculatedStats.proficiencyBonus
  const modWis = calculatedStats.abilityModifiers.sabedoria
  const modCha = calculatedStats.abilityModifiers.carisma
  const modCon = calculatedStats.abilityModifiers.constituicao
  const modInt = calculatedStats.abilityModifiers.inteligencia
  const modDex = calculatedStats.abilityModifiers.destreza
  const modStr = calculatedStats.abilityModifiers.forca
  
  try {
    // Replace variables in formula
    let evaluatedFormula = formula
      .replace(/level/g, level.toString())
      .replace(/proficiencyBonus/g, proficiencyBonus.toString())
      .replace(/modWis/g, modWis.toString())
      .replace(/modCha/g, modCha.toString())
      .replace(/modCon/g, modCon.toString())
      .replace(/modInt/g, modInt.toString())
      .replace(/modDex/g, modDex.toString())
      .replace(/modStr/g, modStr.toString())
    
    // Simple eval for basic formulas (safe for our controlled input)
    return Math.max(0, eval(evaluatedFormula))
  } catch (error) {
    console.error('Error evaluating resource formula:', formula, error)
    return 0
  }
}

export function applyClassResourcesToCharacter(character: Character, calculatedStats: any): Character {
  const classResources = CLASS_RESOURCES[character.class] || []
  
  // Get existing resources mapped by name
  const existingResourcesMap = new Map(
    character.classResources.map(r => [r.name, r])
  )
  
  // Generate new resources based on class templates
  const newResources = classResources
    .filter(template => character.level >= template.startingLevel)
    .map(template => {
      const existingResource = existingResourcesMap.get(template.name)
      const newMax = evaluateResourceFormula(template.maxFormula, character, calculatedStats)
      
      if (existingResource) {
        // Update existing resource, preserve current value if valid
        return {
          ...existingResource,
          max: newMax,
          current: Math.min(existingResource.current, newMax)
        }
      } else {
        // Create new resource
        return {
          id: `class_${template.name.toLowerCase().replace(/\s+/g, '_')}`,
          name: template.name,
          max: newMax,
          current: newMax // Start at full
        }
      }
    })
  
  // Keep custom resources (those not in class templates)
  const customResources = character.classResources.filter(resource => 
    !classResources.some(template => template.name === resource.name)
  )
  
  return {
    ...character,
    classResources: [...newResources, ...customResources]
  }
}

// Apply class proficiencies to character
export function applyClassProficienciesToCharacter(character: Character): Character {
  const classData = CLASS_DATA[character.class as keyof typeof CLASS_DATA]
  
  if (!classData) {
    return character
  }
  
  // Apply weapon and armor proficiencies automatically
  const updatedCharacter = {
    ...character,
    armorProficiencies: [...classData.armorProficiencies],
    weaponProficiencies: [...classData.weaponProficiencies],
    savingThrowProficiencies: [...classData.savingThrows],
    spellcastingAbility: classData.spellcastingAbility
  }
  
  return updatedCharacter
}

// Apply automatic hit dice calculation based on class and level
export function applyHitDiceToCharacter(character: Character): Character {
  const classData = CLASS_DATA[character.class as keyof typeof CLASS_DATA]
  
  if (!classData) {
    return character
  }
  
  // Calculate hit dice string (e.g., "5d12" for a level 5 Barbarian)
  const hitDiceString = `${character.level}d${classData.hitDie}`
  
  return {
    ...character,
    hitDice: hitDiceString
  }
}