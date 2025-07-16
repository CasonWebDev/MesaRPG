"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Minus } from "lucide-react"
import type { Character, Ability } from "@/lib/dnd-types"
import { BorderedBox } from "./ui/bordered-box"
import { nanoid } from "nanoid"
import { Checkbox } from "@/components/ui/checkbox"
import { ABILITIES_PT } from "@/lib/dnd-utils"
import { SpellRoller } from "./ui/spell-roller"
import { useChatIntegration } from "@/hooks/use-chat-integration"

const SpellsPage = ({
  character,
  onUpdate,
  calculatedStats,
  campaignId,
  userName,
}: {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
  calculatedStats: any
  campaignId?: string
  userName?: string
}) => {
  // Estado separado para cada nível de magia
  const [newSpells, setNewSpells] = useState<{[key: number]: { name: string, prepared: boolean }}>({
    0: { name: '', prepared: false }, // Truques
    1: { name: '', prepared: false },
    2: { name: '', prepared: false },
    3: { name: '', prepared: false },
    4: { name: '', prepared: false },
    5: { name: '', prepared: false },
    6: { name: '', prepared: false },
    7: { name: '', prepared: false },
    8: { name: '', prepared: false },
    9: { name: '', prepared: false }
  })
  
  // Integração com chat
  const chatIntegration = campaignId && userName ? 
    useChatIntegration(campaignId, userName) : null

  const handleAddSpell = (level: number) => {
    const newSpellForLevel = newSpells[level]
    if (!newSpellForLevel.name.trim()) return

    const spell = {
      id: nanoid(),
      name: newSpellForLevel.name,
      prepared: newSpellForLevel.prepared
    }

    const currentSpells = character.spells || {};
    const currentLevel = currentSpells[level] || { slotsExpended: 0, slotsTotal: 0, spells: [] };

    const updatedSpells = {
      ...currentSpells,
      [level]: {
        ...currentLevel,
        spells: [...currentLevel.spells, spell]
      }
    }

    onUpdate({ spells: updatedSpells })
    
    // Limpar apenas o estado do nível específico
    setNewSpells(prev => ({
      ...prev,
      [level]: { name: '', prepared: false }
    }))
  }

  const handleDeleteSpell = (level: number, spellId: string) => {
    const currentSpells = character.spells || {};
    const currentLevel = currentSpells[level] || { slotsExpended: 0, slotsTotal: 0, spells: [] };

    const updatedSpells = {
      ...currentSpells,
      [level]: {
        ...currentLevel,
        spells: currentLevel.spells.filter(spell => spell.id !== spellId)
      }
    }

    onUpdate({ spells: updatedSpells })
  }

  const handleTogglePrepared = (level: number, spellId: string) => {
    const currentSpells = character.spells || {};
    const currentLevel = currentSpells[level] || { slotsExpended: 0, slotsTotal: 0, spells: [] };

    const updatedSpells = {
      ...currentSpells,
      [level]: {
        ...currentLevel,
        spells: currentLevel.spells.map(spell => 
          spell.id === spellId ? { ...spell, prepared: !spell.prepared } : spell
        )
      }
    }

    onUpdate({ spells: updatedSpells })
  }

  const handleSlotChange = (level: number, field: 'slotsTotal' | 'slotsExpended', value: number) => {
    const currentSpells = character.spells || {};
    const currentLevel = currentSpells[level] || { slotsExpended: 0, slotsTotal: 0, spells: [] };
    
    const updatedSpells = {
      ...currentSpells,
      [level]: {
        ...currentLevel,
        [field]: Math.max(0, value)
      }
    }

    onUpdate({ spells: updatedSpells })
  }

  const handleSpellcastingAbilityChange = (ability: string) => {
    onUpdate({ spellcastingAbility: ability as Ability })
  }

  const spellSaveDC = character.spellcastingAbility ? 
    8 + calculatedStats.proficiencyBonus + calculatedStats.abilityModifiers[character.spellcastingAbility] : 
    8 + calculatedStats.proficiencyBonus

  const spellAttackBonus = character.spellcastingAbility ?
    calculatedStats.proficiencyBonus + calculatedStats.abilityModifiers[character.spellcastingAbility] :
    calculatedStats.proficiencyBonus

  return (
    <div className="p-4 bg-game-sheet space-y-4">
      {/* Top Section - Spellcasting Info */}
      <div className="grid grid-cols-3 gap-4">
        {/* Spellcasting Class */}
        <BorderedBox className="p-3">
          <h3 className="font-bold text-xs mb-2 text-center border-b border-border pb-1">CLASSE DE CONJURAÇÃO</h3>
          <Input
            placeholder="Mago, Clérigo..."
            value={character.spellcastingClass}
            onChange={(e) => onUpdate({ spellcastingClass: e.target.value })}
            className="text-sm border-0 p-1 h-8 focus-visible:ring-0 text-center"
          />
        </BorderedBox>

        {/* Spellcasting Ability */}
        <BorderedBox className="p-3">
          <h3 className="font-bold text-xs mb-2 text-center border-b border-border pb-1">HABILIDADE DE CONJURAÇÃO</h3>
          <Select 
            value={character.spellcastingAbility || ''} 
            onValueChange={handleSpellcastingAbilityChange}
          >
            <SelectTrigger className="text-sm border-0 h-8 focus-visible:ring-0">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ABILITIES_PT).map(([key, name]) => (
                <SelectItem key={key} value={key}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </BorderedBox>

        {/* Spell Save DC & Attack Bonus */}
        <BorderedBox className="p-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <h3 className="font-bold text-xs mb-1 border-b border-border pb-1">CD SALVAGUARDA</h3>
              <div className="text-lg font-bold">{spellSaveDC}</div>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-xs mb-1 border-b border-border pb-1">BÔNUS ATAQUE</h3>
              <div className="text-lg font-bold">{spellAttackBonus >= 0 ? '+' : ''}{spellAttackBonus}</div>
            </div>
          </div>
        </BorderedBox>
      </div>

      {/* Spell Slots */}
      <BorderedBox className="p-3">
        <h3 className="font-bold text-sm mb-2 text-center border-b border-border pb-1">ESPAÇOS DE MAGIA</h3>
        <div className="grid grid-cols-9 gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
            const spellLevel = character.spells?.[level] || { slotsExpended: 0, slotsTotal: 0, spells: [] };
            return (
              <div key={level} className="border rounded p-1">
                <div className="text-center font-bold text-xs mb-1">{level}°</div>
                <div className="flex items-center justify-center gap-1">
                  <Input
                    type="number"
                    className="w-8 h-6 text-center text-xs border-0 p-0"
                    value={spellLevel.slotsExpended}
                    onChange={(e) => handleSlotChange(level, 'slotsExpended', parseInt(e.target.value) || 0)}
                    min={0}
                    max={spellLevel.slotsTotal}
                  />
                  <span className="text-xs">/</span>
                  <Input
                    type="number"
                    className="w-8 h-6 text-center text-xs border-0 p-0"
                    value={spellLevel.slotsTotal}
                    onChange={(e) => handleSlotChange(level, 'slotsTotal', parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
                <div className="flex justify-center gap-1 mt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-5 w-5 p-0"
                    onClick={() => handleSlotChange(level, 'slotsExpended', spellLevel.slotsExpended - 1)}
                    disabled={spellLevel.slotsExpended <= 0}
                  >
                    <Minus className="w-2 h-2" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-5 w-5 p-0"
                    onClick={() => handleSlotChange(level, 'slotsExpended', spellLevel.slotsExpended + 1)}
                    disabled={spellLevel.slotsExpended >= spellLevel.slotsTotal}
                  >
                    <Plus className="w-2 h-2" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 text-xs text-center text-muted-foreground">
          <span>Gastos / Total</span>
        </div>
      </BorderedBox>

      {/* Cantrips (Truques) */}
      <BorderedBox className="p-3">
        <h3 className="font-bold text-sm mb-2 text-center border-b border-border pb-1">TRUQUES</h3>
        
        {/* Add Spell Form */}
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Nome do truque"
            value={newSpells[0].name}
            onChange={(e) => setNewSpells(prev => ({
              ...prev,
              0: { ...prev[0], name: e.target.value }
            }))}
            className="text-sm"
          />
          <Button size="sm" onClick={() => handleAddSpell(0)}>
            <Plus className="w-3 h-3 mr-1" />
            Adicionar
          </Button>
        </div>

        {/* Spell List */}
        <div className="grid grid-cols-2 gap-2">
          {(character.spells?.[0]?.spells || []).map((spell) => (
            <div key={spell.id} className="flex items-center justify-between border rounded p-2">
              <span className="text-sm flex-1">{spell.name}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteSpell(0, spell.id)}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
          {(!character.spells?.[0]?.spells || character.spells[0].spells.length === 0) && (
            <p className="text-center text-muted-foreground py-4 col-span-2">
              Nenhum truque adicionado
            </p>
          )}
        </div>
      </BorderedBox>

      {/* Spells by Level - 3 Column Layout */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(level => {
          const spellLevel = character.spells?.[level] || { slotsExpended: 0, slotsTotal: 0, spells: [] };
          return (
            <BorderedBox key={level} className="p-3">
              <h3 className="font-bold text-sm mb-2 text-center border-b border-border pb-1">
                NÍVEL {level}
              </h3>
              
              {/* Add Spell Form - Compact */}
              <div className="space-y-2 mb-3">
                <Input
                  placeholder="Nome da magia"
                  value={newSpells[level].name}
                  onChange={(e) => setNewSpells(prev => ({
                    ...prev,
                    [level]: { ...prev[level], name: e.target.value }
                  }))}
                  className="text-xs"
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`prepared-${level}`}
                    checked={newSpells[level].prepared}
                    onCheckedChange={(checked) => setNewSpells(prev => ({
                      ...prev,
                      [level]: { ...prev[level], prepared: !!checked }
                    }))}
                    className="h-3 w-3"
                  />
                  <label htmlFor={`prepared-${level}`} className="text-xs">Preparada</label>
                  <Button size="sm" onClick={() => handleAddSpell(level)} className="ml-auto">
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="text-xs">Add</span>
                  </Button>
                </div>
              </div>

              {/* Spell List - Compact */}
              <div className="space-y-1">
                {spellLevel.spells.map((spell) => (
                  <div key={spell.id} className="border rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1">
                        <Checkbox
                          id={`spell-${spell.id}`}
                          checked={spell.prepared}
                          onCheckedChange={() => handleTogglePrepared(level, spell.id)}
                          className="h-3 w-3"
                        />
                        <span className={`text-xs ${spell.prepared ? 'font-semibold' : 'text-muted-foreground'}`}>
                          {spell.name}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSpell(level, spell.id)}
                        className="h-4 w-4 p-0"
                      >
                        <Trash2 className="w-2 h-2" />
                      </Button>
                    </div>
                    {spell.prepared && (
                      <div className="mt-1">
                        <SpellRoller
                          spellName={spell.name}
                          spellLevel={level}
                          onRoll={(result) => {
                            console.log(`Spell roll for ${spell.name}:`, result)
                            
                            // Enviar rolagem para o chat
                            if (chatIntegration) {
                              chatIntegration.sendRollToChat({
                                type: result.type as 'damage' | 'save' | 'heal',
                                characterName: character.name || 'Personagem',
                                label: `${spell.name} (nível ${level})`,
                                total: result.total,
                                breakdown: result.breakdown,
                                isCritical: result.type === 'damage' ? false : undefined // Magias normalmente não críticam
                              })
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {spellLevel.spells.length === 0 && (
                  <p className="text-center text-muted-foreground py-2 text-xs">
                    Nenhuma magia
                  </p>
                )}
              </div>
            </BorderedBox>
          );
        })}
      </div>
    </div>
  )
}

export default SpellsPage