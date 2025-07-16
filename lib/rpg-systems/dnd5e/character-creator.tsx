'use client';

import { CharacterCreatorProps } from '../types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createDefaultCharacter } from './default-character';
import { Character as DnDCharacter } from './types';

const D_AND_D_CLASSES = [
  'Artificer', 'Bárbaro', 'Bardo', 'Bruxo', 'Clérigo', 'Druida', 
  'Feiticeiro', 'Guerreiro', 'Ladino', 'Mago', 'Monge', 'Paladino', 'Patrulheiro'
];

const D_AND_D_RACES = [
  'Humano', 'Elfo', 'Anão', 'Halfling', 'Draconato', 'Gnomo', 
  'Meio-Elfo', 'Meio-Orc', 'Tiefling', 'Aarakocra', 'Genasi', 'Goblin', 'Tabaxi'
];

export function DnD5eCharacterCreator({ 
  campaignId, 
  characterType, 
  onSubmit, 
  onCancel 
}: CharacterCreatorProps) {
  const [character, setCharacter] = useState<DnDCharacter>(() => {
    const defaultChar = createDefaultCharacter();
    return {
      ...defaultChar,
      name: '',
      class: 'Guerreiro',
      race: 'Humano',
      level: 1
    };
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!character.name.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Converter para formato MesaRPG
      const mesaData = {
        name: character.name,
        type: characterType,
        campaignId,
        data: {
          ...character,
          level: character.level,
          class: character.class,
          race: character.race,
          maxHp: character.maxHitPoints,
          currentHp: character.currentHitPoints,
          hp: character.maxHitPoints,
          ac: character.armorClass,
          armorClass: character.armorClass,
          speed: character.speed,
          abilities: character.abilities,
          skills: character.skills,
          savingThrows: character.savingThrows,
          inventory: character.inventory,
          spells: character.spells,
          spellSlots: character.spellSlots,
          features: character.features,
          traits: character.traits,
          proficiencies: character.proficiencies
        }
      };
      
      onSubmit(mesaData);
    } catch (error) {
      console.error('Erro ao criar personagem:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const updateCharacter = (updates: Partial<DnDCharacter>) => {
    setCharacter(prev => ({ ...prev, ...updates }));
  };
  
  const updateAbility = (ability: string, value: number) => {
    setCharacter(prev => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [ability]: value
      }
    }));
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar Personagem D&D 5e</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={character.name}
                  onChange={(e) => updateCharacter({ name: e.target.value })}
                  placeholder="Nome do personagem"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="level">Nível</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  max="20"
                  value={character.level}
                  onChange={(e) => updateCharacter({ level: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="class">Classe</Label>
                <Select value={character.class} onValueChange={(value) => updateCharacter({ class: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma classe" />
                  </SelectTrigger>
                  <SelectContent>
                    {D_AND_D_CLASSES.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="race">Raça</Label>
                <Select value={character.race} onValueChange={(value) => updateCharacter({ race: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma raça" />
                  </SelectTrigger>
                  <SelectContent>
                    {D_AND_D_RACES.map((race) => (
                      <SelectItem key={race} value={race}>
                        {race}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Atributos */}
            <div>
              <Label className="text-base font-medium">Atributos</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {Object.entries(character.abilities).map(([ability, value]) => (
                  <div key={ability}>
                    <Label htmlFor={ability} className="text-sm capitalize">
                      {ability.charAt(0).toUpperCase() + ability.slice(1)}
                    </Label>
                    <Input
                      id={ability}
                      type="number"
                      min="1"
                      max="20"
                      value={value}
                      onChange={(e) => updateAbility(ability, parseInt(e.target.value) || 10)}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Pontos de Vida */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxHp">Pontos de Vida Máximos</Label>
                <Input
                  id="maxHp"
                  type="number"
                  min="1"
                  value={character.maxHitPoints}
                  onChange={(e) => {
                    const hp = parseInt(e.target.value) || 1;
                    updateCharacter({ 
                      maxHitPoints: hp,
                      currentHitPoints: hp
                    });
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="ac">Classe de Armadura</Label>
                <Input
                  id="ac"
                  type="number"
                  min="1"
                  value={character.armorClass}
                  onChange={(e) => updateCharacter({ armorClass: parseInt(e.target.value) || 10 })}
                />
              </div>
            </div>
            
            {/* Botões */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !character.name.trim()}>
                {isSubmitting ? 'Criando...' : 'Criar Personagem'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}