import { DnD5eRPGSystem } from './dnd5e';
import { RPGSystem } from './types';

// Registry central de sistemas RPG - apenas D&D 5e
export const RPG_SYSTEMS = {
  'dnd5e': new DnD5eRPGSystem(),
} as const;

export type SystemId = keyof typeof RPG_SYSTEMS;

// Função para obter sistema RPG
export function getRPGSystem(systemId: string): RPGSystem {
  return RPG_SYSTEMS[systemId as SystemId] || RPG_SYSTEMS.dnd5e;
}

// Função para listar todos os sistemas disponíveis
export function getAvailableSystems(): RPGSystem[] {
  return Object.values(RPG_SYSTEMS);
}

// Função para verificar se um sistema existe
export function isValidSystemId(systemId: string): systemId is SystemId {
  return systemId in RPG_SYSTEMS;
}

// Exports de tipos
export type { RPGSystem, CharacterSheetProps, CharacterMiniCardProps, CharacterCreatorProps } from './types';
export { BaseRPGSystem } from './base-system';