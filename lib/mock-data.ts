// Centralized mock data store

export const PLAYER_TEMPLATE = [
  { id: "f1", name: "Nome", type: "Texto Curto" },
  { id: "f2", name: "Classe & Nível", type: "Texto Curto" },
  { id: "f3", name: "Força", type: "Número" },
  { id: "f4", name: "Destreza", type: "Número" },
  { id: "f5", name: "Constituição", type: "Número" },
  { id: "f6", name: "Avatar", type: "Imagem" },
  { id: "f7", name: "História", type: "Texto Longo" },
]

export const NPC_TEMPLATE = [
  { id: "n1", name: "Nome", type: "Texto Curto" },
  { id: "n2", name: "Ocupação", type: "Texto Curto" },
  { id: "n3", name: "Motivação", type: "Texto Longo" },
  { id: "n4", name: "Lealdade", type: "Sim/Não" },
  { id: "n5", name: "Avatar", type: "Imagem" },
]

export const CREATURE_TEMPLATE = [
  { id: "c1", name: "Nome da Criatura", type: "Texto Curto" },
  { id: "c2", name: "Pontos de Vida", type: "Número" },
  { id: "c3", name: "Classe de Armadura", type: "Número" },
  { id: "c4", name: "Ações", type: "Texto Longo" },
  { id: "c5", name: "Tesouro", type: "Texto Longo" },
  { id: "c6", name: "Token", type: "Imagem" },
]

export const ALL_DATA: { [key: string]: Record<string, any> } = {
  pc1: {
    Nome: "Aragorn",
    "Classe & Nível": "Guerreiro, Nível 7",
    Força: 18,
    Destreza: 15,
    Constituição: 16,
    Avatar: "/placeholder.svg?width=128&height=128",
    História:
      "Criado nas terras selvagens do norte, Aragorn é um ranger habilidoso e um guerreiro formidável. Ele carrega o peso de uma linhagem esquecida e busca redenção protegendo os inocentes das sombras que se espalham pela terra.",
  },
  pc2: {
    Nome: "Gandalf",
    "Classe & Nível": "Mago, Nível 7",
    Força: 10,
    Destreza: 14,
    Constituição: 13,
    Avatar: "/placeholder.svg?width=128&height=128",
    História: "Um ser de grande poder e sabedoria.",
  },
  pc3: {
    Nome: "Legolas",
    "Classe & Nível": "Arqueiro, Nível 7",
    Força: 12,
    Destreza: 20,
    Constituição: 12,
    Avatar: "/placeholder.svg?width=128&height=128",
    História: "Príncipe da Floresta das Trevas.",
  },
  npc1: {
    Nome: "Thoric, o Ferreiro",
    Ocupação: "Ferreiro",
    Motivação: "Forjar a arma perfeita.",
    Lealdade: true,
    Avatar: "/placeholder.svg?width=128&height=128",
  },
  npc2: {
    Nome: "Elara, a Alquimista",
    Ocupação: "Alquimista",
    Motivação: "Descobrir a cura para uma praga.",
    Lealdade: false,
    Avatar: "/placeholder.svg?width=128&height=128",
  },
  c1: {
    "Nome da Criatura": "Goblin Batedor",
    "Pontos de Vida": 7,
    "Classe de Armadura": 15,
    Ações: "Ataque com Adaga: +4 para acertar, 1d4+2 de dano perfurante.",
    Tesouro: "3 moedas de cobre.",
    Token: "/placeholder.svg?width=128&height=128",
  },
  c2: {
    "Nome da Criatura": "Orc Guerreiro",
    "Pontos de Vida": 15,
    "Classe de Armadura": 13,
    Ações: "Ataque com Machado Grande: +5 para acertar, 1d12+3 de dano cortante.",
    Tesouro: "Um dente de animal.",
    Token: "/placeholder.svg?width=128&height=128",
  },
}

export const getSheetData = (type: string, id: string) => {
  const data = ALL_DATA[id]
  if (!data) return null

  switch (type) {
    case "player":
      return { template: PLAYER_TEMPLATE, data }
    case "npc":
      return { template: NPC_TEMPLATE, data }
    case "creature":
      return { template: CREATURE_TEMPLATE, data }
    default:
      return null
  }
}
