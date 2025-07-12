import { nanoid } from 'nanoid'
import { TemplateField, AttributeDefinition } from '@/types/sheet-template'

export interface SheetPreset {
  system: string
  sheetType: string
  fields: Array<{
    type: string
    name: string
    default?: any
    required?: boolean
    options?: string[]
    min?: number
    max?: number
    groupName?: string
    attributes?: string[]
  }>
}

export const SHEET_PRESETS: SheetPreset[] = [
  // ==== D&D 5e ====
  {
    system: "D&D 5e",
    sheetType: "Personagem",
    fields: [
      { type: "image", name: "Avatar", default: "", required: false },
      { type: "text", name: "Nome", default: "", required: true },
      { type: "select", name: "Raça", options: ["Humano","Anão","Elfo","Halfling","Gnomo","Meio-Orc","Meio-Elfo"], default: "Humano" },
      { type: "select", name: "Classe", options: ["Bárbaro","Bardo","Clérigo","Druida","Guerreiro","Mago","Monge","Paladino","Patrulheiro","Ladino","Feiticeiro","Bruxo"], default: "Guerreiro" },
      { type: "numeric", name: "Nível", default: 1, min: 1, max: 20, required: true },
      { type: "attributes", groupName: "Atributos", attributes: ["Força","Destreza","Constituição","Inteligência","Sabedoria","Carisma"] },
      { type: "numeric", name: "PV Máximos", default: 10, min: 1, max: 999 },
      { type: "numeric", name: "CA", default: 10, min: 1, max: 30 },
      { type: "numeric", name: "Deslocamento", default: 30, min: 5, max: 60 },
      { type: "long_text", name: "História/Rolagem", default: "" },
      { type: "long_text", name: "Personalidade", default: "" },
      { type: "long_text", name: "Ideais", default: "" },
      { type: "long_text", name: "Vínculos", default: "" },
      { type: "long_text", name: "Defeitos", default: "" },
      { type: "attributes", groupName: "Perícias", attributes: ["Acrobacia","Arcanismo","Atletismo","Enganação","História","Intimidação","Investigação","Medicina","Natureza","Percepção","Prestidigitação","Religião","Sobrevivência"] },
      { type: "long_text", name: "Magias Conhecidas", default: "" },
      { type: "long_text", name: "Poderes Especiais", default: "" },
      { type: "long_text", name: "Equipamentos", default: "" },
      { type: "select", name: "Alinhamento", options: ["LB","NB","CB","LM","NM","CM","LN","NN","CN"], default: "NN" }
    ]
  },

  {
    system: "D&D 5e",
    sheetType: "NPC",
    fields: [
      { type: "image", name: "Avatar", default: "", required: false },
      { type: "text", name: "Nome do NPC", default: "", required: true },
      { type: "select", name: "Tipo", options: ["Humano","Monstro","Aberração","Morto-Vivo","Constructo"], default: "Humano" },
      { type: "numeric", name: "CR", default: 1, min: 0, max: 30 },
      { type: "numeric", name: "PV", default: 5, min: 1, max: 500 },
      { type: "numeric", name: "CA", default: 10, min: 1, max: 30 },
      { type: "attributes", groupName: "Atributos NPC", attributes: ["Força","Destreza","Constituição","Inteligência","Sabedoria","Carisma"] },
      { type: "attributes", groupName: "Perícias NPC", attributes: ["Percepção","Furtividade","Intimidação","Enganação"] },
      { type: "long_text", name: "Descrição/História", default: "" },
      { type: "long_text", name: "Habilidades Especiais", default: "" },
      { type: "long_text", name: "Equipamentos", default: "" }
    ]
  },

  {
    system: "D&D 5e",
    sheetType: "Criatura",
    fields: [
      { type: "image", name: "Avatar", default: "", required: false },
      { type: "text", name: "Espécie", default: "", required: true },
      { type: "select", name: "Tamanho", options: ["Minúsculo","Pequeno","Médio","Grande","Enorme","Colossal"], default: "Médio" },
      { type: "numeric", name: "CR", default: 1, min: 0, max: 30 },
      { type: "numeric", name: "PV", default: 10, min: 1, max: 1000 },
      { type: "numeric", name: "CA", default: 10, min: 1, max: 30 },
      { type: "numeric", name: "Deslocamento", default: 30, min: 5, max: 60 },
      { type: "attributes", groupName: "Atributos Criatura", attributes: ["Força","Destreza","Constituição","Inteligência","Sabedoria","Carisma"] },
      { type: "long_text", name: "Habilidades", default: "" },
      { type: "long_text", name: "Resistências", default: "" },
      { type: "long_text", name: "Imunidades", default: "" },
      { type: "long_text", name: "Equipamentos/Poderes", default: "" }
    ]
  },

  // ==== Vampiro: A Máscara ====
  {
    system: "Vampiro: A Máscara",
    sheetType: "Personagem",
    fields: [
      { type: "image", name: "Avatar", default: "", required: false },
      { type: "text", name: "Nome", default: "", required: true },
      { type: "select", name: "Clã", options: ["Brujah","Gangrel","Malkavian","Nosferatu","Toreador","Tremere","Ventrue"], default: "Ventrue" },
      { type: "numeric", name: "Geração", default: 13, min: 1, max: 13 },
      { type: "attributes", groupName: "Físicos", attributes: ["Força","Destreza","Vigor"] },
      { type: "attributes", groupName: "Sociais", attributes: ["Carisma","Manipulação","Aparência"] },
      { type: "attributes", groupName: "Mentais", attributes: ["Percepção","Inteligência","Raciocínio"] },
      { type: "numeric", name: "Humanidade", default: 7, min: 1, max: 10 },
      { type: "long_text", name: "História", default: "" },
      { type: "long_text", name: "Antecedentes", default: "" },
      { type: "long_text", name: "Disciplinas", default: "" },
      { type: "long_text", name: "Vantagens/Vícios", default: "" },
      { type: "long_text", name: "Equipamentos", default: "" }
    ]
  },

  {
    system: "Vampiro: A Máscara",
    sheetType: "NPC",
    fields: [
      { type: "image", name: "Avatar", default: "", required: false },
      { type: "text", name: "Nome do NPC", default: "", required: true },
      { type: "select", name: "Clã", options: ["Brujah","Gangrel","Malkavian","Nosferatu","Toreador","Tremere","Ventrue"], default: "Malkavian" },
      { type: "numeric", name: "Geração", default: 12, min: 1, max: 13 },
      { type: "attributes", groupName: "Atributos", attributes: ["Força","Destreza","Vigor","Carisma","Manipulação","Aparência","Percepção","Inteligência","Raciocínio"] },
      { type: "long_text", name: "História/Sintetizado", default: "" },
      { type: "long_text", name: "Poderes/Disciplinas", default: "" },
      { type: "long_text", name: "Equipamentos", default: "" }
    ]
  },

  {
    system: "Vampiro: A Máscara",
    sheetType: "Criatura",
    fields: [
      { type: "image", name: "Avatar", default: "", required: false },
      { type: "text", name: "Nome da Criatura", default: "", required: true },
      { type: "select", name: "Tipo", options: ["Vampiro","Ghoul","Banido","Gárgula","Demônio"], default: "Vampiro" },
      { type: "numeric", name: "Força de Ancestralidade", default: 1, min: 1, max: 10 },
      { type: "attributes", groupName: "Atributos", attributes: ["Força","Destreza","Vigor","Carisma","Manipulação","Aparência","Percepção","Inteligência","Raciocínio"] },
      { type: "long_text", name: "Poderes/Disciplinas", default: "" },
      { type: "long_text", name: "História/Descrição", default: "" },
      { type: "long_text", name: "Equipamentos", default: "" }
    ]
  }
]

export function getSystemOptions(): string[] {
  const systems = [...new Set(SHEET_PRESETS.map(preset => preset.system))]
  return ["Personalizado", ...systems]
}

export function getPresetsForSystem(system: string): SheetPreset[] {
  if (system === "Personalizado") return []
  return SHEET_PRESETS.filter(preset => preset.system === system)
}

export function convertPresetToTemplateFields(preset: SheetPreset): TemplateField[] {
  return preset.fields.map(field => {
    const templateField: TemplateField = {
      id: nanoid(),
      name: field.name,
      type: field.type === 'numeric' ? 'number' : 
            field.type === 'long_text' ? 'textarea' : 
            field.type as any,
      required: field.required || false,
      defaultValue: field.default,
      options: field.options,
    }

    // Para campos de atributos, converter a lista de strings para AttributeDefinition[]
    if (field.type === 'attributes' && field.attributes) {
      templateField.attributes = field.attributes.map(attr => ({
        id: nanoid(),
        name: attr,
        defaultValue: 0
      }))
    }

    return templateField
  })
}