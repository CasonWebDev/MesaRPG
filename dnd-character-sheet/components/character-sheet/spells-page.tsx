"use client"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Character, Ability, SpellLevel, Spell } from "@/lib/dnd-types"
import { ABILITIES_PT, CLASS_DATA } from "@/lib/dnd-utils"
import { BorderedBox } from "./ui/bordered-box"
import { StatBox } from "./ui/stat-box"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { nanoid } from "nanoid"

const SpellRow = ({
  spell,
  onUpdate,
  onDelete,
}: {
  spell: Spell
  onUpdate: (spell: Spell) => void
  onDelete: (spellId: string) => void
}) => (
  <div className="flex items-center gap-2 p-1 bg-gray-50 rounded">
    <Checkbox
      checked={spell.prepared}
      onCheckedChange={(checked) => onUpdate({ ...spell, prepared: !!checked })}
      className="h-5 w-5"
    />
    <Input
      value={spell.name}
      onChange={(e) => onUpdate({ ...spell, name: e.target.value })}
      className="flex-grow h-8"
      placeholder="Nome da Magia"
    />
    <Button variant="ghost" size="icon" onClick={() => onDelete(spell.id)} className="h-8 w-8">
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </div>
)

const SpellLevelSection = ({
  level,
  spellData,
  isCustomClass,
  calculatedSlots,
  onUpdate,
}: {
  level: number
  spellData: SpellLevel
  isCustomClass: boolean
  calculatedSlots: number
  onUpdate: (path: string, value: any) => void
}) => {
  const handleAddSpell = () => {
    const newSpell: Spell = { id: nanoid(), name: "", prepared: false }
    onUpdate(`spells.${level}.spells`, [...spellData.spells, newSpell])
  }

  const handleUpdateSpell = (updatedSpell: Spell) => {
    const newSpells = spellData.spells.map((s) => (s.id === updatedSpell.id ? updatedSpell : s))
    onUpdate(`spells.${level}.spells`, newSpells)
  }

  const handleDeleteSpell = (spellId: string) => {
    const newSpells = spellData.spells.filter((s) => s.id !== spellId)
    onUpdate(`spells.${level}.spells`, newSpells)
  }

  return (
    <BorderedBox className="p-2">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold text-center border-2 border-black rounded-full h-10 w-10 flex items-center justify-center">
            {level === 0 ? "T" : level}
          </div>
          {level > 0 && (
            <div className="flex-grow">
              <label className="text-xs">Espaços de Magia</label>
              <div className="flex items-center gap-1">
                {isCustomClass ? (
                  <Input
                    type="number"
                    placeholder="Total"
                    className="w-16 h-8"
                    value={spellData.slotsTotal || ""}
                    onChange={(e) => onUpdate(`spells.${level}.slotsTotal`, Number.parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <div className="w-16 text-center font-bold text-lg">{calculatedSlots}</div>
                )}
                <span>/</span>
                <Input
                  placeholder="Usados"
                  type="number"
                  className="w-16 h-8"
                  value={spellData?.slotsExpended || ""}
                  onChange={(e) => onUpdate(`spells.${level}.slotsExpended`, Number.parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          )}
        </div>
        <Button size="sm" onClick={handleAddSpell}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {spellData.spells.map((spell) => (
          <SpellRow key={spell.id} spell={spell} onUpdate={handleUpdateSpell} onDelete={handleDeleteSpell} />
        ))}
      </div>
    </BorderedBox>
  )
}

const EditableStatBox = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
}) => (
  <BorderedBox className="p-2 text-center w-full">
    <Input
      type="number"
      className="text-2xl font-bold text-center border-0 border-b-2 rounded-none h-9"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number.parseInt(e.target.value))}
    />
    <label className="text-xs font-bold uppercase">{label}</label>
  </BorderedBox>
)

const SpellsPage = ({
  character,
  calculatedStats,
  onUpdate,
  onNestedChange,
}: {
  character: Character
  calculatedStats: any
  onUpdate: (updates: Partial<Character>) => void
  onNestedChange: (path: string, value: any) => void
}) => {
  const isCustomClass = !CLASS_DATA[character.class as keyof typeof CLASS_DATA]

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg border-2 border-black">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
          <Input
            placeholder="Classe de Conjuração"
            value={character.spellcastingClass}
            onChange={(e) => onUpdate({ spellcastingClass: e.target.value })}
            className="w-full"
          />
          <div className="flex flex-col items-center w-full">
            <label className="text-xs font-bold uppercase whitespace-nowrap">Habilidade de Conjuração</label>
            <Select
              value={character.spellcastingAbility || ""}
              onValueChange={(value) => onUpdate({ spellcastingAbility: value as Ability })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ABILITIES_PT).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isCustomClass ? (
            <>
              <EditableStatBox
                label="CD para Magias"
                value={character.customSpellSaveDC}
                onChange={(val) => onUpdate({ customSpellSaveDC: val })}
              />
              <EditableStatBox
                label="Bônus de Ataque com Magia"
                value={character.customSpellAttackBonus}
                onChange={(val) => onUpdate({ customSpellAttackBonus: val })}
              />
            </>
          ) : (
            <>
              <StatBox label="CD para Magias" value={calculatedStats.spellSaveDC || "-"} />
              <StatBox
                label="Bônus de Ataque com Magia"
                value={calculatedStats.spellAttackBonus || "-"}
                sign={calculatedStats.spellAttackBonus !== null}
              />
            </>
          )}
        </div>

        {/* Spell Levels */}
        <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((level) => (
            <SpellLevelSection
              key={level}
              level={level}
              spellData={character.spells[level]}
              isCustomClass={isCustomClass}
              calculatedSlots={calculatedStats.spellSlots?.[level] ?? 0}
              onUpdate={onNestedChange}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default SpellsPage
