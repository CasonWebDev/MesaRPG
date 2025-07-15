"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Gem } from "lucide-react"
import type { Character, Item, Weapon, Armor, Shield, Ability, Attack } from "@/lib/dnd-types"
import { BorderedBox } from "./ui/bordered-box"
import { nanoid } from "nanoid"
import { cn } from "@/lib/utils"
import type React from "react"
import { Checkbox } from "@/components/ui/checkbox"

const LabeledField = ({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) => (
  <div className={cn("flex flex-col space-y-1", className)}>
    <label className="text-xs font-bold uppercase text-gray-600">{label}</label>
    {children}
  </div>
)

const ItemEditor = ({
  item,
  onUpdate,
  onDelete,
}: {
  item: Item
  onUpdate: (item: Item) => void
  onDelete: (itemId: string) => void
}) => {
  const handleFieldChange = (field: keyof Item, value: any) => {
    onUpdate({ ...item, [field]: value })
  }

  const handleTypeChange = (newType: Item["type"]) => {
    // Create a new object with only the base properties to clear out old type-specific fields
    const baseItem: Partial<Item> = {
      id: item.id,
      name: item.name,
      weight: item.weight,
      quantity: item.quantity,
      description: item.description,
      requiresAttunement: item.requiresAttunement,
      type: newType,
    }

    // Add type-specific defaults to prevent NaN errors
    switch (newType) {
      case "weapon":
        ;(baseItem as Weapon).damage = "1d6"
        ;(baseItem as Weapon).ability = "forca"
        ;(baseItem as Weapon).proficient = true
        break
      case "armor":
        ;(baseItem as Armor).baseAc = 10
        ;(baseItem as Armor).armorType = "leve"
        break
      case "shield":
        ;(baseItem as Shield).acBonus = 2
        break
    }

    onUpdate(baseItem as Item)
  }

  return (
    <BorderedBox className="p-4 space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">Editar Item</h3>
        <Button variant="destructive" size="icon" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <LabeledField label="Nome do Item">
        <Input
          placeholder="Ex: Espada Longa"
          value={item.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
        />
      </LabeledField>

      <div className="grid grid-cols-2 gap-4">
        <LabeledField label="Peso">
          <Input
            type="number"
            placeholder="0"
            value={item.weight}
            onChange={(e) => handleFieldChange("weight", Number.parseFloat(e.target.value) || 0)}
          />
        </LabeledField>
        <LabeledField label="Quantidade">
          <Input
            type="number"
            placeholder="1"
            value={item.quantity}
            onChange={(e) => handleFieldChange("quantity", Number.parseInt(e.target.value) || 1)}
          />
        </LabeledField>
      </div>

      <div className="grid grid-cols-2 gap-4 items-end">
        <LabeledField label="Tipo de Item">
          <Select value={item.type} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weapon">Arma</SelectItem>
              <SelectItem value="armor">Armadura</SelectItem>
              <SelectItem value="shield">Escudo</SelectItem>
              <SelectItem value="generic">Genérico</SelectItem>
            </SelectContent>
          </Select>
        </LabeledField>
        <div className="flex items-center gap-2 pb-1">
          <Checkbox
            id="attunement"
            checked={item.requiresAttunement}
            onCheckedChange={(checked) => handleFieldChange("requiresAttunement", !!checked)}
          />
          <label htmlFor="attunement" className="text-sm font-medium">
            Requer Sintonização
          </label>
        </div>
      </div>

      {item.type === "weapon" && (
        <div className="space-y-3 p-3 border rounded-md bg-gray-50">
          <h4 className="font-semibold text-sm text-gray-700">Propriedades da Arma</h4>
          <LabeledField label="Dano">
            <Input
              placeholder="Ex: 1d8 cortante"
              value={(item as Weapon).damage}
              onChange={(e) => handleFieldChange("damage", e.target.value)}
            />
          </LabeledField>
          <LabeledField label="Habilidade de Ataque">
            <Select value={(item as Weapon).ability} onValueChange={(v) => handleFieldChange("ability", v as Ability)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a habilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forca">Força</SelectItem>
                <SelectItem value="destreza">Destreza</SelectItem>
              </SelectContent>
            </Select>
          </LabeledField>
        </div>
      )}

      {item.type === "armor" && (
        <div className="space-y-3 p-3 border rounded-md bg-gray-50">
          <h4 className="font-semibold text-sm text-gray-700">Propriedades da Armadura</h4>
          <LabeledField label="Classe de Armadura (CA) Base">
            <Input
              type="number"
              placeholder="Ex: 14"
              value={(item as Armor).baseAc}
              onChange={(e) => handleFieldChange("baseAc", Number.parseInt(e.target.value) || 10)}
            />
          </LabeledField>
          <LabeledField label="Tipo de Armadura">
            <Select
              value={(item as Armor).armorType}
              onValueChange={(v) => handleFieldChange("armorType", v as "leve" | "media" | "pesada")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leve">Leve</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="pesada">Pesada</SelectItem>
              </SelectContent>
            </Select>
          </LabeledField>
        </div>
      )}

      {item.type === "shield" && (
        <div className="space-y-3 p-3 border rounded-md bg-gray-50">
          <h4 className="font-semibold text-sm text-gray-700">Propriedades do Escudo</h4>
          <LabeledField label="Bônus de CA">
            <Input
              type="number"
              placeholder="Ex: 2"
              value={(item as Shield).acBonus}
              onChange={(e) => handleFieldChange("acBonus", Number.parseInt(e.target.value) || 2)}
            />
          </LabeledField>
        </div>
      )}

      <LabeledField label="Descrição">
        <Textarea
          placeholder="Descreva o item, suas propriedades mágicas, etc."
          value={item.description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          className="flex-grow min-h-[100px]"
        />
      </LabeledField>
    </BorderedBox>
  )
}

const CurrencyInput = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) => (
  <div className="flex flex-col items-center">
    <Input
      type="number"
      value={value || ""}
      onChange={(e) => onChange(Number.parseInt(e.target.value) || 0)}
      className="w-16 text-center"
    />
    <label className="text-xs font-bold mt-1">{label}</label>
  </div>
)

const AcBreakdown = ({ breakdown }: { breakdown: any }) => (
  <BorderedBox className="p-4 text-center">
    <h3 className="font-bold mb-2">Classe de Armadura</h3>
    <div className="text-5xl font-bold mb-2">{breakdown.total}</div>
    <div className="text-xs text-gray-600 flex flex-wrap justify-center items-center gap-x-1">
      <span>{breakdown.base}</span>
      <span className="font-semibold">(Base{breakdown.armorName ? `: ${breakdown.armorName}` : ""})</span>
      <span> + {breakdown.dex}</span>
      <span className="font-semibold">(Destreza)</span>
      {breakdown.shield > 0 && (
        <>
          <span> + {breakdown.shield}</span>
          <span className="font-semibold">(Escudo{breakdown.shieldName ? `: ${breakdown.shieldName}` : ""})</span>
        </>
      )}
    </div>
  </BorderedBox>
)

const AttunementTracker = ({ count }: { count: number }) => (
  <BorderedBox className="p-2 text-center">
    <h3 className="font-bold text-sm uppercase">Sintonização</h3>
    <div className="text-2xl font-bold">{count} / 3</div>
  </BorderedBox>
)

export default function CombatEquipmentPage({
  character,
  onUpdate,
  calculatedStats,
}: {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
  calculatedStats: any
}) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const inventory = character.inventory || []
  const selectedItem = inventory.find((i) => i.id === selectedItemId) || null

  const weapons = inventory.filter((i) => i.type === "weapon") as Weapon[]

  const handleAddItem = () => {
    const newItem: Item = {
      id: nanoid(),
      name: "Novo Item",
      type: "generic",
      weight: 0,
      quantity: 1,
      description: "",
      requiresAttunement: false,
    }
    const newInventory = [...inventory, newItem]
    onUpdate({ inventory: newInventory })
    setSelectedItemId(newItem.id)
  }

  const handleUpdateItem = (updatedItem: Item) => {
    const newInventory = inventory.map((i) => (i.id === updatedItem.id ? updatedItem : i))
    onUpdate({ inventory: newInventory })
  }

  const handleDeleteItem = (itemId: string) => {
    const newInventory = inventory.filter((i) => i.id !== itemId)
    onUpdate({ inventory: newInventory })
    if (selectedItemId === itemId) {
      setSelectedItemId(null)
    }
  }

  const handleAddCustomAttack = () => {
    const newAttack: Attack = { id: nanoid(), name: "Novo Ataque", bonus: "+0", damage: "1d4" }
    onUpdate({ customAttacks: [...character.customAttacks, newAttack] })
  }

  const handleUpdateCustomAttack = (updatedAttack: Attack) => {
    const newAttacks = character.customAttacks.map((a) => (a.id === updatedAttack.id ? updatedAttack : a))
    onUpdate({ customAttacks: newAttacks })
  }

  const handleDeleteCustomAttack = (attackId: string) => {
    const newAttacks = character.customAttacks.filter((a) => a.id !== attackId)
    onUpdate({ customAttacks: newAttacks })
  }

  const handleCurrencyChange = (currency: keyof Character["currency"], value: number) => {
    onUpdate({ currency: { ...character.currency, [currency]: value } })
  }

  const handleEquipItem = (item: Item) => {
    if (item.type === "armor") {
      const isEquipped = character.equippedArmorId === item.id
      onUpdate({ equippedArmorId: isEquipped ? null : item.id })
    } else if (item.type === "shield") {
      const isEquipped = character.equippedShieldId === item.id
      onUpdate({ equippedShieldId: isEquipped ? null : item.id })
    }
  }

  const handleToggleAttunement = (itemId: string) => {
    const isAttuned = character.attunedItemIds.includes(itemId)
    let newAttunedIds = [...character.attunedItemIds]
    const updates: Partial<Character> = {}

    if (isAttuned) {
      newAttunedIds = newAttunedIds.filter((id) => id !== itemId)
      // If unattuning an equipped item, unequip it
      if (character.equippedArmorId === itemId) {
        updates.equippedArmorId = null
      }
      if (character.equippedShieldId === itemId) {
        updates.equippedShieldId = null
      }
    } else {
      if (character.attunedItemIds.length < 3) {
        newAttunedIds.push(itemId)
      }
    }
    updates.attunedItemIds = newAttunedIds
    onUpdate(updates)
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg border-2 border-black space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <AcBreakdown breakdown={calculatedStats.armorClassBreakdown} />
            <AttunementTracker count={character.attunedItemIds.length} />
          </div>
          <BorderedBox className="p-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold">Inventário</h3>
              <Button size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-1" /> Novo Item
              </Button>
            </div>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {inventory.map((item) => {
                const isEquipped = character.equippedArmorId === item.id || character.equippedShieldId === item.id
                const isAttuned = character.attunedItemIds.includes(item.id)
                const canAttune = character.attunedItemIds.length < 3

                return (
                  <div key={item.id} className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedItemId(item.id)}
                      className={cn(
                        "flex-grow text-left p-2 rounded-md hover:bg-gray-100",
                        selectedItemId === item.id && "bg-gray-200",
                      )}
                    >
                      {item.name} ({item.quantity})
                      {isEquipped && <span className="text-xs font-bold text-green-600 ml-2">[E]</span>}
                      {isAttuned && <Gem className="h-3 w-3 text-blue-500 inline-block ml-2" />}
                    </button>
                    {(item.type === "armor" || item.type === "shield") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEquipItem(item)}
                        disabled={item.requiresAttunement && !isAttuned}
                      >
                        {isEquipped ? "Desequipar" : "Equipar"}
                      </Button>
                    )}
                    {item.requiresAttunement && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleAttunement(item.id)}
                        disabled={!isAttuned && !canAttune}
                      >
                        {isAttuned ? "Dessintonizar" : "Sintonizar"}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </BorderedBox>
          <BorderedBox className="p-2">
            <h3 className="font-bold text-center mb-2">Moedas</h3>
            <div className="flex justify-around">
              <CurrencyInput label="PC" value={character.currency.cp} onChange={(v) => handleCurrencyChange("cp", v)} />
              <CurrencyInput label="PP" value={character.currency.sp} onChange={(v) => handleCurrencyChange("sp", v)} />
              <CurrencyInput label="PE" value={character.currency.ep} onChange={(v) => handleCurrencyChange("ep", v)} />
              <CurrencyInput label="PO" value={character.currency.gp} onChange={(v) => handleCurrencyChange("gp", v)} />
              <CurrencyInput label="PL" value={character.currency.pp} onChange={(v) => handleCurrencyChange("pp", v)} />
            </div>
          </BorderedBox>
        </div>

        <div className="lg:col-span-2">
          {selectedItem ? (
            <ItemEditor item={selectedItem} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} />
          ) : (
            <BorderedBox className="p-4 h-full flex items-center justify-center min-h-[300px]">
              <p className="text-gray-500">Selecione um item para editar ou adicione um novo.</p>
            </BorderedBox>
          )}
        </div>
      </div>

      <div className="md:col-span-3">
        <BorderedBox className="p-2">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-center flex-grow">Ataques & Conjuração</h3>
            <Button size="sm" onClick={handleAddCustomAttack}>
              <Plus className="h-4 w-4 mr-1" /> Ataque Custom
            </Button>
          </div>
          <div className="grid grid-cols-12 gap-x-2 gap-y-1 text-xs font-bold px-2">
            <div className="col-span-5">NOME</div>
            <div className="col-span-2 text-center">BÔNUS</div>
            <div className="col-span-5">DANO</div>
          </div>
          <div className="space-y-1 mt-1">
            {weapons.map((weapon) => {
              const modifier = calculatedStats.abilityModifiers[weapon.ability]
              const bonus = modifier + calculatedStats.proficiencyBonus
              return (
                <div
                  key={weapon.id}
                  className="grid grid-cols-12 gap-x-2 gap-y-1 items-center p-2 rounded-md bg-gray-50"
                >
                  <div className="col-span-5 font-semibold">{weapon.name}</div>
                  <div className="col-span-2 text-center font-bold text-lg">{bonus >= 0 ? `+${bonus}` : bonus}</div>
                  <div className="col-span-5">{weapon.damage}</div>
                </div>
              )
            })}
            {character.customAttacks.map((attack) => (
              <div key={attack.id} className="grid grid-cols-12 gap-x-2 gap-y-1 items-center p-1 rounded-md bg-gray-50">
                <div className="col-span-5">
                  <Input
                    value={attack.name}
                    onChange={(e) => handleUpdateCustomAttack({ ...attack, name: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    value={attack.bonus}
                    onChange={(e) => handleUpdateCustomAttack({ ...attack, bonus: e.target.value })}
                    className="h-8 text-center"
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    value={attack.damage}
                    onChange={(e) => handleUpdateCustomAttack({ ...attack, damage: e.target.value })}
                    className="h-8"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDeleteCustomAttack(attack.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {weapons.length === 0 && character.customAttacks.length === 0 && (
              <p className="text-center text-gray-400 p-4">Nenhum ataque ou arma no inventário.</p>
            )}
          </div>
        </BorderedBox>
      </div>
    </div>
  )
}
