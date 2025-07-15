export type Ability = "forca" | "destreza" | "constituicao" | "inteligencia" | "sabedoria" | "carisma"

export type SkillName =
  // Força
  | "Atletismo"
  // Destreza
  | "Acrobacia"
  | "Furtividade"
  | "Prestidigitação"
  // Inteligência
  | "Arcanismo"
  | "História"
  | "Investigação"
  | "Natureza"
  | "Religião"
  // Sabedoria
  | "Adestrar Animais"
  | "Intuição"
  | "Medicina"
  | "Percepção"
  | "Sobrevivência"
  // Carisma
  | "Atuação"
  | "Enganação"
  | "Intimidação"
  | "Persuasão"

export type ConditionName =
  | "Agarrado"
  | "Amedrontado"
  | "Atordoado"
  | "Caído"
  | "Cego"
  | "Enfeitiçado"
  | "Envenenado"
  | "Impedido"
  | "Incapacitado"
  | "Inconsciente"
  | "Invisível"
  | "Paralisado"
  | "Petrificado"
  | "Surdo"

export interface Skill {
  ability: Ability
}

// Base Item Interface
interface BaseItem {
  id: string
  name: string
  weight: number
  quantity: number
  description: string
  requiresAttunement: boolean
}

// Specific Item Types
export interface Weapon extends BaseItem {
  type: "weapon"
  ability: Ability
  damage: string
  proficient: boolean
}

export interface Armor extends BaseItem {
  type: "armor"
  baseAc: number
  armorType: "leve" | "media" | "pesada"
}

export interface Shield extends BaseItem {
  type: "shield"
  acBonus: number
}

export interface GenericItem extends BaseItem {
  type: "generic"
}

export type Item = Weapon | Armor | Shield | GenericItem

export interface Spell {
  id: string // Add ID for unique key
  name: string
  prepared: boolean
}

export interface Resource {
  id: string
  name: string
  current: number
  max: number
}

export interface SpellLevel {
  slotsTotal: number
  slotsExpended: number
  spells: Spell[]
}

export interface Attack {
  id: string
  name: string
  bonus: string
  damage: string
}

export interface Character {
  // Header
  name: string
  class: string
  subclass: string
  level: number
  background: string
  playerName: string
  race: string
  alignment: string
  experiencePoints: number

  // Abilities
  abilities: { [key in Ability]: number }

  // Combat Stats
  inspiration: number
  speed: number
  maxHitPoints: number
  currentHitPoints: number
  temporaryHitPoints: number
  hitDice: string
  usedHitDice: number
  deathSaves: { successes: number; failures: number }
  activeConditions: ConditionName[]
  exhaustionLevel: number

  // Proficiencies
  savingThrowProficiencies: Ability[]
  skillProficiencies: SkillName[]
  otherProficienciesAndLanguages: string

  // Equipment
  inventory: Item[]
  equippedArmorId: string | null
  equippedShieldId: string | null
  attunedItemIds: string[]
  currency: {
    cp: number
    sp: number
    ep: number
    gp: number
    pp: number
  }

  // Personality
  personalityTraits: string
  ideals: string
  bonds: string
  flaws: string
  characterBackstory: string

  // Features & Attacks
  featuresAndTraits: string
  customAttacks: Attack[] // Add custom attacks
  classResources: Resource[]
  customSpellSaveDC: number | null
  customSpellAttackBonus: number | null

  // Backstory Page
  age: string
  height: string
  weight: string
  eyes: string
  skin: string
  hair: string

  // Spells Page
  spellcastingClass: string
  spellcastingAbility: Ability | null
  spells: { [level: number]: SpellLevel }
}
