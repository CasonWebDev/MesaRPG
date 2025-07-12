export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'image' | 'select' | 'attributes'

export type CharacterType = 'PC' | 'NPC' | 'CREATURE'

export interface AttributeDefinition {
  id: string
  name: string
  defaultValue?: number
}

export interface TemplateField {
  id: string
  name: string
  type: FieldType
  required?: boolean
  options?: string[] // Para tipo 'select'
  defaultValue?: any
  attributes?: AttributeDefinition[] // Para tipo 'attributes'
}

export interface SheetTemplate {
  id: string
  campaignId: string
  name: string
  type: CharacterType
  fields: TemplateField[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTemplateData {
  name: string
  type: CharacterType
  fields: TemplateField[]
  isDefault?: boolean
}

export interface UpdateTemplateData {
  name: string
  fields: TemplateField[]
  isDefault?: boolean
}

export const FIELD_TYPES: Record<FieldType, string> = {
  text: 'Texto Curto',
  textarea: 'Texto Longo',
  number: 'Número',
  boolean: 'Sim/Não',
  image: 'Imagem',
  select: 'Seleção',
  attributes: 'Atributos'
}

export const CHARACTER_TYPES: Record<CharacterType, string> = {
  PC: 'Personagem Jogável',
  NPC: 'Personagem Não-Jogável',
  CREATURE: 'Criatura'
}