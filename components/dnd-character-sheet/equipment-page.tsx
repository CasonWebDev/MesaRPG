"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit } from "lucide-react"
import type { Character, Equipment } from "@/lib/dnd-types"
import { BorderedBox } from "./ui/bordered-box"
import { nanoid } from "nanoid"
import { Checkbox } from "@/components/ui/checkbox"
import { DiceRoller } from "./ui/dice-roller"
import { DamageRoller } from "./ui/damage-roller"
import { CurrencyTracker } from "./ui/currency-tracker"
import { WeaponAttack } from "./ui/weapon-attack"
import { useChatIntegration } from "@/hooks/use-chat-integration"

const EquipmentPage = ({
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
  const [newItem, setNewItem] = useState({
    name: '',
    type: 'item' as Equipment['type'],
    damage: '',
    damageType: '',
    attackAbility: 'forca' as 'forca' | 'destreza',
    acBase: 10,
    armorType: 'light' as 'light' | 'medium' | 'heavy',
    acBonus: 0,
    quantity: 1,
    weight: 0,
    description: '',
    requiresAttunement: false
  })

  const [newAttack, setNewAttack] = useState({
    name: '',
    bonus: '',
    damage: ''
  })

  const [editingAttack, setEditingAttack] = useState<any>(null)
  
  // Integração com chat
  const chatIntegration = campaignId && userName ? 
    useChatIntegration(campaignId, userName) : null

  const handleAddItem = () => {
    if (!newItem.name.trim()) return

    const equipment: Equipment = {
      id: nanoid(),
      name: newItem.name,
      type: newItem.type,
      quantity: newItem.quantity,
      weight: newItem.weight,
      description: newItem.description,
      requiresAttunement: newItem.requiresAttunement,
      isEquipped: false,
      isAttuned: false
    }

    if (newItem.type === 'weapon') {
      equipment.damage = newItem.damage
      equipment.damageType = newItem.damageType
      equipment.attackAbility = newItem.attackAbility
    } else if (newItem.type === 'armor') {
      equipment.acBase = newItem.acBase
      equipment.armorType = newItem.armorType
    } else if (newItem.type === 'shield') {
      equipment.acBonus = newItem.acBonus
    }

    onUpdate({
      inventory: [...(character.inventory || []), equipment]
    })

    setNewItem({
      name: '',
      type: 'item',
      damage: '',
      damageType: '',
      attackAbility: 'forca',
      acBase: 10,
      armorType: 'light',
      acBonus: 0,
      quantity: 1,
      weight: 0,
      description: '',
      requiresAttunement: false
    })
  }

  const handleEquipItem = (itemId: string) => {
    const updatedInventory = character.inventory?.map(item => {
      if (item.id === itemId) {
        // If it's armor, unequip other armor first
        if (item.type === 'armor') {
          character.inventory?.forEach(otherItem => {
            if (otherItem.type === 'armor' && otherItem.id !== itemId) {
              otherItem.isEquipped = false
            }
          })
        }
        // If it's a shield, unequip other shields first
        if (item.type === 'shield') {
          character.inventory?.forEach(otherItem => {
            if (otherItem.type === 'shield' && otherItem.id !== itemId) {
              otherItem.isEquipped = false
            }
          })
        }
        return { ...item, isEquipped: !item.isEquipped }
      }
      return item
    }) || []

    onUpdate({ inventory: updatedInventory })
  }

  const handleAttuneItem = (itemId: string) => {
    const attunedCount = character.inventory?.filter(item => item.isAttuned).length || 0
    
    const updatedInventory = character.inventory?.map(item => {
      if (item.id === itemId) {
        const newAttuned = !item.isAttuned
        // Check attunement limit
        if (newAttuned && attunedCount >= 3) {
          return item // Don't attune if limit reached
        }
        return { ...item, isAttuned: newAttuned }
      }
      return item
    }) || []

    onUpdate({ inventory: updatedInventory })
  }

  const handleDeleteItem = (itemId: string) => {
    onUpdate({
      inventory: character.inventory?.filter(item => item.id !== itemId) || []
    })
  }

  const handleAddAttack = () => {
    if (!newAttack.name.trim()) return

    const attack = {
      id: nanoid(),
      name: newAttack.name,
      bonus: newAttack.bonus,
      damage: newAttack.damage
    }

    const updatedAttacks = [...(character.customAttacks || []), attack]
    onUpdate({ customAttacks: updatedAttacks })
    setNewAttack({ name: '', bonus: '', damage: '' })
  }

  const handleDeleteAttack = (attackId: string) => {
    const updatedAttacks = (character.customAttacks || []).filter(attack => attack.id !== attackId)
    onUpdate({ customAttacks: updatedAttacks })
  }

  const attunedCount = character.inventory?.filter(item => item.isAttuned).length || 0
  const equippedArmor = character.inventory?.find(item => item.type === 'armor' && item.isEquipped)
  const equippedShield = character.inventory?.find(item => item.type === 'shield' && item.isEquipped)
  const weapons = character.inventory?.filter(item => item.type === 'weapon') || []

  return (
    <div className="p-4 bg-game-sheet space-y-4">
      {/* Layout em 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Cálculo de Armadura, Ataques */}
        <div className="space-y-4">
          {/* AC Calculation Display - Primeiro na coluna esquerda */}
          <BorderedBox className="p-4">
            <h3 className="font-bold text-lg mb-3">Cálculo de Classe de Armadura</h3>
            <div className="space-y-2">
              <p>CA Base: {equippedArmor ? equippedArmor.acBase : 10}</p>
              <p>Modificador de Destreza: {equippedArmor?.armorType === 'heavy' ? 0 : 
                equippedArmor?.armorType === 'medium' ? 
                  Math.min(calculatedStats.abilityModifiers.destreza, 2) : 
                  calculatedStats.abilityModifiers.destreza}</p>
              <p>Bônus do Escudo: {equippedShield ? equippedShield.acBonus : 0}</p>
              <hr />
              <p className="font-bold text-2xl text-center">{calculatedStats.armorClass}</p>
            </div>
          </BorderedBox>

          {/* Attunement Counter */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Itens Sintonizados: {attunedCount} / 3
            </p>
          </div>

          {/* Attacks Section */}
          <BorderedBox className="p-4">
            <h3 className="font-bold text-lg mb-3">Ataques</h3>
            <div className="space-y-4">
              {weapons.length > 0 ? (
                weapons.map((weapon) => {
                  const abilityMod = calculatedStats.abilityModifiers[weapon.attackAbility || 'forca'];
                  const attackBonus = abilityMod + calculatedStats.proficiencyBonus;
                  return (
                    <WeaponAttack
                      key={weapon.id}
                      attackName={weapon.name}
                      attackBonus={attackBonus}
                      damage={weapon.damage || "1d4"}
                      characterName={character.name || 'Personagem'}
                      isCustomAttack={false}
                      onAttackRoll={(result) => {
                        console.log(`Attack roll for ${weapon.name}:`, result)
                        
                        // Enviar rolagem para o chat
                        if (chatIntegration) {
                          chatIntegration.sendRollToChat({
                            type: 'attack',
                            characterName: character.name || 'Personagem',
                            label: `ataque com ${weapon.name}`,
                            total: result.total,
                            breakdown: result.breakdown,
                            isCritical: result.isCritical,
                            advantage: result.advantage
                          })
                        }
                      }}
                      onDamageRoll={(result) => {
                        console.log(`Damage roll for ${weapon.name}:`, result)
                        
                        // Enviar rolagem para o chat
                        if (chatIntegration) {
                          chatIntegration.sendRollToChat({
                            type: 'damage',
                            characterName: character.name || 'Personagem',
                            label: `dano com ${weapon.name}`,
                            total: result.total,
                            breakdown: result.breakdown,
                            isCritical: result.isCritical
                          })
                        }
                      }}
                    />
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhuma arma no inventário</p>
              )}
            </div>
          </BorderedBox>

          {/* Custom Attacks Section */}
          <BorderedBox className="p-4">
            <h3 className="font-bold text-lg mb-3">Ataques Customizados</h3>
            
            {/* Add Attack Form */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              <Input
                placeholder="Nome do ataque"
                value={newAttack.name}
                onChange={(e) => setNewAttack({...newAttack, name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Bônus (ex: +5)"
                  value={newAttack.bonus}
                  onChange={(e) => setNewAttack({...newAttack, bonus: e.target.value})}
                />
                <Input
                  placeholder="Dano (ex: 1d8+3)"
                  value={newAttack.damage}
                  onChange={(e) => setNewAttack({...newAttack, damage: e.target.value})}
                />
              </div>
              <Button onClick={handleAddAttack}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {/* Attacks List */}
            <div className="space-y-4">
              {character.customAttacks?.map((attack) => (
                <WeaponAttack
                  key={attack.id}
                  attackName={attack.name}
                  attackBonus={attack.bonus}
                  damage={attack.damage}
                  characterName={character.name || 'Personagem'}
                  isCustomAttack={true}
                  onAttackRoll={(result) => {
                    console.log(`Custom attack roll for ${attack.name}:`, result)
                    
                    // Enviar rolagem para o chat
                    if (chatIntegration) {
                      chatIntegration.sendRollToChat({
                        type: 'attack',
                        characterName: character.name || 'Personagem',
                        label: `ataque customizado: ${attack.name}`,
                        total: result.total,
                        breakdown: result.breakdown,
                        isCritical: result.isCritical,
                        advantage: result.advantage
                      })
                    }
                  }}
                  onDamageRoll={(result) => {
                    console.log(`Custom damage roll for ${attack.name}:`, result)
                    
                    // Enviar rolagem para o chat
                    if (chatIntegration) {
                      chatIntegration.sendRollToChat({
                        type: 'damage',
                        characterName: character.name || 'Personagem',
                        label: `dano customizado: ${attack.name}`,
                        total: result.total,
                        breakdown: result.breakdown,
                        isCritical: result.isCritical
                      })
                    }
                  }}
                  onEdit={() => setEditingAttack(attack)}
                  onDelete={() => handleDeleteAttack(attack.id)}
                />
              ))}
              {(!character.customAttacks || character.customAttacks.length === 0) && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum ataque customizado adicionado
                </p>
              )}
            </div>
          </BorderedBox>
        </div>

        {/* Coluna Direita - Adicionar Item, Inventário, Moedas */}
        <div className="space-y-4">
          {/* Add New Item */}
          <BorderedBox className="p-4">
            <h3 className="font-bold text-lg mb-3">Adicionar Item</h3>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Nome do item"
            value={newItem.name}
            onChange={(e) => setNewItem({...newItem, name: e.target.value})}
          />
          <Select value={newItem.type} onValueChange={(value) => setNewItem({...newItem, type: value as Equipment['type']})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="item">Item</SelectItem>
              <SelectItem value="weapon">Arma</SelectItem>
              <SelectItem value="armor">Armadura</SelectItem>
              <SelectItem value="shield">Escudo</SelectItem>
            </SelectContent>
          </Select>

          {newItem.type === 'weapon' && (
            <>
              <Input
                placeholder="Dano (ex: 1d8)"
                value={newItem.damage}
                onChange={(e) => setNewItem({...newItem, damage: e.target.value})}
              />
              <Select value={newItem.attackAbility} onValueChange={(value) => setNewItem({...newItem, attackAbility: value as 'forca' | 'destreza'})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forca">Força</SelectItem>
                  <SelectItem value="destreza">Destreza</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {newItem.type === 'armor' && (
            <>
              <Input
                type="number"
                placeholder="CA Base"
                value={newItem.acBase}
                onChange={(e) => setNewItem({...newItem, acBase: Number(e.target.value) || 10})}
              />
              <Select value={newItem.armorType} onValueChange={(value) => setNewItem({...newItem, armorType: value as 'light' | 'medium' | 'heavy'})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Leve</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="heavy">Pesada</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {newItem.type === 'shield' && (
            <Input
              type="number"
              placeholder="Bônus CA"
              value={newItem.acBonus}
              onChange={(e) => setNewItem({...newItem, acBonus: Number(e.target.value) || 0})}
            />
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="requires-attunement"
              checked={newItem.requiresAttunement}
              onCheckedChange={(checked) => setNewItem({...newItem, requiresAttunement: !!checked})}
            />
            <label htmlFor="requires-attunement" className="text-sm">Requer Sintonização</label>
          </div>
        </div>
            <Button onClick={handleAddItem} className="mt-3">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </BorderedBox>

          {/* Inventory */}
          <BorderedBox className="p-4">
            <h3 className="font-bold text-lg mb-3">Inventário</h3>
            <div className="space-y-2">
              {character.inventory?.map((item) => (
                <div key={item.id} className="border rounded p-3 flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-sm text-muted-foreground">({item.type})</span>
                      {item.isEquipped && <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Equipado</span>}
                      {item.isAttuned && <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-1 rounded">Sintonizado</span>}
                    </div>
                    {item.damage && <p className="text-sm text-muted-foreground">Dano: {item.damage}</p>}
                    {item.acBase && <p className="text-sm text-muted-foreground">CA: {item.acBase}</p>}
                    {item.acBonus && <p className="text-sm text-muted-foreground">Bônus CA: +{item.acBonus}</p>}
                  </div>
                  <div className="flex gap-2">
                    {(item.type === 'armor' || item.type === 'shield') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEquipItem(item.id)}
                        disabled={item.requiresAttunement && !item.isAttuned}
                      >
                        {item.isEquipped ? 'Desequipar' : 'Equipar'}
                      </Button>
                    )}
                    {item.requiresAttunement && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAttuneItem(item.id)}
                        disabled={!item.isAttuned && attunedCount >= 3}
                      >
                        {item.isAttuned ? 'Dessintonizar' : 'Sintonizar'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!character.inventory || character.inventory.length === 0) && (
                <p className="text-center text-muted-foreground py-4">Nenhum item no inventário</p>
              )}
            </div>
          </BorderedBox>

          {/* Moedas */}
          <CurrencyTracker
            currencies={{
              copper: character.currency?.cp || 0,
              silver: character.currency?.sp || 0,
              electrum: character.currency?.ep || 0,
              gold: character.currency?.gp || 0,
              platinum: character.currency?.pp || 0
            }}
            onUpdate={(currency, value) => {
              const currencyMap = {
                copper: 'cp',
                silver: 'sp',
                electrum: 'ep',
                gold: 'gp',
                platinum: 'pp'
              }
              const key = currencyMap[currency as keyof typeof currencyMap] as keyof Character['currency']
              onUpdate({ currency: { ...character.currency, [key]: value } })
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default EquipmentPage