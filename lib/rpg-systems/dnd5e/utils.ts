import type { Character, SkillName, Skill, Ability, ConditionName } from "./types"

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
  [key: string]: { hitDie: number; savingThrows: Ability[]; spellcastingAbility: Ability | null }
} = {
  Bárbaro: { hitDie: 12, savingThrows: ["forca", "constituicao"], spellcastingAbility: null },
  Bardo: { hitDie: 8, savingThrows: ["destreza", "carisma"], spellcastingAbility: "carisma" },
  Clérigo: { hitDie: 8, savingThrows: ["sabedoria", "carisma"], spellcastingAbility: "sabedoria" },
  Feiticeiro: { hitDie: 6, savingThrows: ["constituicao", "carisma"], spellcastingAbility: "carisma" },
  Guerreiro: { hitDie: 10, savingThrows: ["forca", "constituicao"], spellcastingAbility: null },
  Ladino: { hitDie: 8, savingThrows: ["destreza", "inteligencia"], spellcastingAbility: null },
  Mago: { hitDie: 6, savingThrows: ["inteligencia", "sabedoria"], spellcastingAbility: "inteligencia" },
  Monge: { hitDie: 8, savingThrows: ["forca", "destreza"], spellcastingAbility: null },
  Paladino: { hitDie: 10, savingThrows: ["sabedoria", "carisma"], spellcastingAbility: "carisma" },
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
  customAttacks: [],
  classResources: [],
  age: "",
  height: "",
  weight: "",
  eyes: "",
  skin: "",
  hair: "",
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