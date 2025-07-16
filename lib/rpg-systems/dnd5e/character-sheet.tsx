'use client';

import { CharacterSheetProps } from '../types';
import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import { Character as DnDCharacter } from '@/lib/dnd-types';
import { initialCharacter, applySpellSlotsToCharacter, applyClassResourcesToCharacter, applyClassProficienciesToCharacter, applyHitDiceToCharacter, CLASS_DATA } from '@/lib/dnd-utils';

// Import the D&D 5e components directly
import { FrontPage } from '@/components/dnd-character-sheet';
import EquipmentPage from '@/components/dnd-character-sheet/equipment-page';
import SpellsPage from '@/components/dnd-character-sheet/spells-page';
import PersonalityPage from '@/components/dnd-character-sheet/personality-page';
import FeaturesPage from '@/components/dnd-character-sheet/features-page';
import NotesPage from '@/components/dnd-character-sheet/notes-page';

export function DnD5eCharacterSheet({ 
  characterData, 
  onDataChange, 
  isEditing,
  characterType,
  campaignId,
  userName
}: CharacterSheetProps) {
  const [dndCharacter, setDnDCharacter] = useState<DnDCharacter>(() => {
    return convertMesaRPGToDnD(characterData);
  });
  
  useEffect(() => {
    // Converter dados do MesaRPG para formato D&D 5e
    const convertedCharacter = convertMesaRPGToDnD(characterData);
    setDnDCharacter(convertedCharacter);
  }, [characterData]);
  
  const handleDnDUpdate = (updates: Partial<DnDCharacter>) => {
    let updatedChar = { ...dndCharacter, ...updates };
    
    // Apply spell slots automatically if class or level changed
    if (updates.class !== undefined || updates.level !== undefined) {
      updatedChar = applySpellSlotsToCharacter(updatedChar);
    }
    
    // Apply class proficiencies automatically if class changed
    if (updates.class !== undefined) {
      updatedChar = applyClassProficienciesToCharacter(updatedChar);
    }
    
    // Apply hit dice automatically if class or level changed
    if (updates.class !== undefined || updates.level !== undefined) {
      updatedChar = applyHitDiceToCharacter(updatedChar);
    }
    
    setDnDCharacter(updatedChar);
    
    // Converter de volta para formato MesaRPG e atualizar
    const mesaData = convertDnDToMesaRPG(updatedChar);
    if (onDataChange) {
      // Atualizar com o objeto completo
      onDataChange('characterData', mesaData);
    }
  };

  // Dummy stats for basic functionality
  const calculatedStats = useMemo(() => {
    const proficiencyBonus = Math.ceil((dndCharacter.level || 1) / 4) + 1;
    const abilityModifiers = {
      forca: Math.floor(((dndCharacter.abilities?.forca || 10) - 10) / 2),
      destreza: Math.floor(((dndCharacter.abilities?.destreza || 10) - 10) / 2),
      constituicao: Math.floor(((dndCharacter.abilities?.constituicao || 10) - 10) / 2),
      inteligencia: Math.floor(((dndCharacter.abilities?.inteligencia || 10) - 10) / 2),
      sabedoria: Math.floor(((dndCharacter.abilities?.sabedoria || 10) - 10) / 2),
      carisma: Math.floor(((dndCharacter.abilities?.carisma || 10) - 10) / 2)
    };

    // Calculate AC based on equipped armor and shield
    const equippedArmor = dndCharacter.inventory?.find(item => item.type === 'armor' && item.isEquipped);
    const equippedShield = dndCharacter.inventory?.find(item => item.type === 'shield' && item.isEquipped);
    
    let armorClass = 10; // Base AC
    let dexModifier = abilityModifiers.destreza;
    
    if (equippedArmor) {
      armorClass = equippedArmor.acBase || 10;
      // Apply dex modifier limits based on armor type
      if (equippedArmor.armorType === 'heavy') {
        dexModifier = 0;
      } else if (equippedArmor.armorType === 'medium') {
        dexModifier = Math.min(dexModifier, 2);
      }
    }
    
    armorClass += dexModifier;
    
    if (equippedShield) {
      armorClass += equippedShield.acBonus || 0;
    }

    return {
      proficiencyBonus,
      abilityModifiers,
      passivePerception: 10 + abilityModifiers.sabedoria + (dndCharacter.skillProficiencies.includes("Percepção") ? proficiencyBonus : 0),
      initiative: abilityModifiers.destreza,
      spellSaveDC: 8 + proficiencyBonus + abilityModifiers.sabedoria,
      spellAttackBonus: proficiencyBonus + abilityModifiers.sabedoria,
      armorClass,
      armorClassBreakdown: {
        total: armorClass,
        base: equippedArmor?.acBase || 10,
        dex: dexModifier,
        armorName: equippedArmor?.name || null,
        shield: equippedShield?.acBonus || 0,
        shieldName: equippedShield?.name || null
      },
      spellSlots: [0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
  }, [dndCharacter]);

  // Apply class resources automatically when stats change
  useEffect(() => {
    if (dndCharacter.class && dndCharacter.level) {
      const updatedChar = applyClassResourcesToCharacter(dndCharacter, calculatedStats);
      if (JSON.stringify(updatedChar.classResources) !== JSON.stringify(dndCharacter.classResources)) {
        setDnDCharacter(updatedChar);
      }
    }
  }, [dndCharacter.class, dndCharacter.level, calculatedStats.proficiencyBonus, calculatedStats.abilityModifiers]);


  return (
    <div className="w-full min-h-screen bg-game-sheet text-foreground">
      <Tabs defaultValue="main" className="w-full">
        <TabsList className="w-full h-auto p-1 bg-secondary flex flex-wrap gap-1 justify-start">
          <TabsTrigger value="main" className="flex-1 min-w-[100px] text-center">Frente</TabsTrigger>
          <TabsTrigger value="equipment" className="flex-1 min-w-[100px] text-center">Combate & Equip.</TabsTrigger>
          <TabsTrigger value="personality" className="flex-1 min-w-[100px] text-center">Personalidade</TabsTrigger>
          <TabsTrigger value="spells" className="flex-1 min-w-[100px] text-center">Magias</TabsTrigger>
          <TabsTrigger value="features" className="flex-1 min-w-[100px] text-center">Talentos</TabsTrigger>
          <TabsTrigger value="notes" className="flex-1 min-w-[100px] text-center">Anotações</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="main" className="mt-0">
            <FrontPage
              character={dndCharacter}
              onUpdate={handleDnDUpdate}
              onNestedChange={(path: string, value: any) => {
                // Handle nested changes
                const keys = path.split('.');
                const updates = { ...dndCharacter };
                let current = updates;
                
                for (let i = 0; i < keys.length - 1; i++) {
                  current = current[keys[i] as keyof typeof current] as any;
                }
                
                current[keys[keys.length - 1] as keyof typeof current] = value;
                handleDnDUpdate(updates);
              }}
              calculatedStats={calculatedStats}
              campaignId={campaignId}
              userName={userName}
              onLevelUp={(hpGained: number) => {
                const newLevel = dndCharacter.level + 1;
                handleDnDUpdate({
                  level: newLevel,
                  maxHitPoints: dndCharacter.maxHitPoints + hpGained,
                  currentHitPoints: dndCharacter.currentHitPoints + hpGained
                });
              }}
              onShortRest={(diceToSpend: number) => {
                // Calculate healing from hit dice
                const classData = CLASS_DATA[dndCharacter.class as keyof typeof CLASS_DATA];
                const hitDie = classData?.hitDie || 6;
                
                let totalHealing = 0;
                for (let i = 0; i < diceToSpend; i++) {
                  const roll = Math.floor(Math.random() * hitDie) + 1;
                  totalHealing += roll + calculatedStats.abilityModifiers.constituicao;
                }
                
                const newHp = Math.min(dndCharacter.maxHitPoints, dndCharacter.currentHitPoints + totalHealing);
                handleDnDUpdate({
                  currentHitPoints: newHp,
                  usedHitDice: dndCharacter.usedHitDice + diceToSpend
                });
              }}
              onLongRest={() => {
                // Restore all spell slots
                const restoredSpells = { ...dndCharacter.spells };
                Object.keys(restoredSpells).forEach(level => {
                  restoredSpells[parseInt(level)].slotsExpended = 0;
                });

                handleDnDUpdate({
                  currentHitPoints: dndCharacter.maxHitPoints,
                  temporaryHitPoints: 0,
                  usedHitDice: Math.max(0, dndCharacter.usedHitDice - Math.floor(dndCharacter.level / 2)),
                  spells: restoredSpells,
                  exhaustionLevel: Math.max(0, dndCharacter.exhaustionLevel - 1)
                });
              }}
            />
          </TabsContent>
          <TabsContent value="equipment" className="mt-0">
            <EquipmentPage
              character={dndCharacter}
              onUpdate={handleDnDUpdate}
              calculatedStats={calculatedStats}
              campaignId={campaignId}
              userName={userName}
            />
          </TabsContent>
          <TabsContent value="personality" className="mt-0">
            <PersonalityPage
              character={dndCharacter}
              onUpdate={handleDnDUpdate}
            />
          </TabsContent>
          <TabsContent value="spells" className="mt-0">
            <SpellsPage
              character={dndCharacter}
              onUpdate={handleDnDUpdate}
              calculatedStats={calculatedStats}
              campaignId={campaignId}
              userName={userName}
            />
          </TabsContent>
          <TabsContent value="features" className="mt-0">
            <FeaturesPage
              character={dndCharacter}
              onUpdate={handleDnDUpdate}
            />
          </TabsContent>
          <TabsContent value="notes" className="mt-0">
            <NotesPage
              character={dndCharacter}
              onUpdate={handleDnDUpdate}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Função para converter dados do MesaRPG para D&D 5e
function convertMesaRPGToDnD(characterData: any): DnDCharacter {
  const data = characterData || {};
  
  let character: DnDCharacter;
  
  // Construir o character de forma mais controlada
  character = {
    ...initialCharacter,
    // Aplicar todos os dados vindos do input, preservando valores existentes
    ...data,
    // Garantir que campos críticos não sejam undefined
    name: data.name || initialCharacter.name || 'Novo Personagem',
    level: data.level !== undefined ? data.level : initialCharacter.level,
    class: data.class || initialCharacter.class || 'Guerreiro',
    race: data.race || initialCharacter.race || 'Humano',
    maxHitPoints: data.maxHitPoints || data.maxHp || data.hp || initialCharacter.maxHitPoints,
    currentHitPoints: data.currentHitPoints || data.currentHp || data.hp || initialCharacter.currentHitPoints,
    armorClass: data.armorClass || data.ac || initialCharacter.armorClass,
    abilities: data.abilities || initialCharacter.abilities,
  };
  
  // Apply spell slots automatically based on class and level
  if (character.class && character.level) {
    character = applySpellSlotsToCharacter(character);
  }
  
  // Apply class proficiencies automatically based on class
  if (character.class) {
    character = applyClassProficienciesToCharacter(character);
  }
  
  // Apply hit dice automatically based on class and level
  if (character.class && character.level) {
    character = applyHitDiceToCharacter(character);
  }
  
  return character;
}

// Função para converter dados D&D 5e para MesaRPG
function convertDnDToMesaRPG(dndCharacter: DnDCharacter): any {
  return {
    name: dndCharacter.name,
    level: dndCharacter.level,
    class: dndCharacter.class,
    race: dndCharacter.race,
    maxHp: dndCharacter.maxHitPoints,
    currentHp: dndCharacter.currentHitPoints,
    hp: dndCharacter.maxHitPoints,
    ac: dndCharacter.armorClass,
    armorClass: dndCharacter.armorClass,
    speed: dndCharacter.speed,
    abilities: dndCharacter.abilities,
    skills: dndCharacter.skills,
    savingThrows: dndCharacter.savingThrows,
    inventory: dndCharacter.inventory,
    spells: dndCharacter.spells,
    spellSlots: dndCharacter.spellSlots,
    features: dndCharacter.features,
    traits: dndCharacter.traits,
    proficiencies: dndCharacter.proficiencies,
    notes: dndCharacter.notes,
    avatar: dndCharacter.avatar,
    // Manter todos os dados D&D 5e para preservar funcionalidade
    ...dndCharacter
  };
}