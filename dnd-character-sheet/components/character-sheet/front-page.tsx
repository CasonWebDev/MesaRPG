"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ArrowUpWideNarrow, Bed, BedDouble } from "lucide-react"
import { SKILLS, ABILITIES_PT, CLASS_DATA } from "@/lib/dnd-utils"
import type { Character, Ability, SkillName, Resource, ConditionName } from "@/lib/dnd-types"
import { BorderedBox } from "./ui/bordered-box"
import { StatBox } from "./ui/stat-box"
import { Checkbox } from "@/components/ui/checkbox"
import { AbilityScore } from "./ui/ability-score"
import { ClassResourceTracker } from "./ui/class-resource-tracker"
import { nanoid } from "nanoid"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { LevelUpModal } from "./ui/level-up-modal"
import { ConditionTracker } from "./ui/condition-tracker"
import { ShortRestModal } from "./ui/short-rest-modal"
import { LongRestModal } from "./ui/long-rest-modal"
import { CharacterNameplateArt } from "./ui/character-nameplate-art"

const SkillInput = ({
  name,
  ability,
  modifier,
  isProficient,
  onProficiencyToggle,
}: {
  name: string
  ability: string
  modifier: number
  isProficient: boolean
  onProficiencyToggle: () => void
}) => (
  <div className="flex items-center gap-1.5">
    <Checkbox
      id={`prof-${name}`}
      checked={isProficient}
      onCheckedChange={onProficiencyToggle}
      className="h-3.5 w-3.5 rounded-full"
    />
    <div className="flex h-6 w-8 items-center justify-center rounded-sm border border-black bg-gray-100 text-sm font-bold shadow-inner">
      {modifier >= 0 ? `+${modifier}` : modifier}
    </div>
    <label htmlFor={`prof-${name}`} className="flex-grow border-b border-gray-400 text-left text-sm">
      <span className="text-xs text-gray-500">({ability.slice(0, 3)})</span> {name}
    </label>
  </div>
)

const DeathSaveCheckbox = ({
  checked,
  onCheckedChange,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) => <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="h-5 w-5" />

const FrontPage = ({
  character,
  onUpdate,
  onNestedChange,
  calculatedStats,
  onLevelUp,
  onShortRest,
  onLongRest,
}: {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
  onNestedChange: (path: string, value: any) => void
  calculatedStats: any
  onLevelUp: (hpGained: number) => void
  onShortRest: (diceToSpend: number) => void
  onLongRest: () => void
}) => {
  const [isCustomClass, setIsCustomClass] = useState(
    () => character.class && !CLASS_DATA[character.class as keyof typeof CLASS_DATA],
  )
  const [isLevelUpModalOpen, setIsLevelUpModalOpen] = useState(false)
  const [isShortRestModalOpen, setIsShortRestModalOpen] = useState(false)
  const [isLongRestModalOpen, setIsLongRestModalOpen] = useState(false)

  const handleProficiencyToggle = (type: "skill" | "savingThrow", name: string) => {
    const key = type === "skill" ? "skillProficiencies" : "savingThrowProficiencies"
    const proficiencies = new Set(character[key] as string[])
    if (proficiencies.has(name)) {
      proficiencies.delete(name)
    } else {
      proficiencies.add(name)
    }
    onUpdate({ [key]: Array.from(proficiencies) })
  }

  const handleDeathSaveChange = (type: "successes" | "failures", index: number) => {
    const currentCount = character.deathSaves[type]
    const newCount = index + 1 === currentCount ? currentCount - 1 : index + 1
    onNestedChange(`deathSaves.${type}`, newCount)
  }

  const handleAddCustomResource = () => {
    const newResource: Resource = {
      id: `custom_${nanoid()}`,
      name: "Novo Recurso",
      current: 0,
      max: 0,
    }
    onUpdate({ classResources: [...character.classResources, newResource] })
  }

  const handleUpdateResource = (updatedResource: Resource) => {
    const newResources = character.classResources.map((r) => (r.id === updatedResource.id ? updatedResource : r))
    onUpdate({ classResources: newResources })
  }

  const handleDeleteResource = (resourceId: string) => {
    const newResources = character.classResources.filter((r) => r.id !== resourceId)
    onUpdate({ classResources: newResources })
  }

  const handleConditionToggle = (condition: ConditionName, isChecked: boolean) => {
    const newConditions = new Set(character.activeConditions)
    if (isChecked) {
      newConditions.add(condition)
    } else {
      newConditions.delete(condition)
    }
    onUpdate({ activeConditions: Array.from(newConditions) })
  }

  const hitDieType = CLASS_DATA[character.class as keyof typeof CLASS_DATA]?.hitDie

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg border-2 border-black space-y-4">
      <LevelUpModal
        character={character}
        isOpen={isLevelUpModalOpen}
        onClose={() => setIsLevelUpModalOpen(false)}
        onLevelUp={onLevelUp}
        conMod={calculatedStats.abilityModifiers.constituicao}
      />
      <ShortRestModal
        character={character}
        isOpen={isShortRestModalOpen}
        onClose={() => setIsShortRestModalOpen(false)}
        onConfirm={onShortRest}
        conMod={calculatedStats.abilityModifiers.constituicao}
      />
      <LongRestModal
        isOpen={isLongRestModalOpen}
        onClose={() => setIsLongRestModalOpen(false)}
        onConfirm={onLongRest}
      />
      {/* Header */}
      <div className="flex items-stretch gap-4 -mx-4 -mt-4 border-b-2 border-black">
        <div className="relative flex-grow-[2] basis-0 flex items-center justify-center">
          <div className="absolute inset-4">
            <CharacterNameplateArt className="w-full h-full opacity-80" />
          </div>
          <div className="relative z-10 w-full px-24 py-4 mt-8">
            <Input
              placeholder="Nome do Personagem"
              value={character.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full border-0 bg-transparent text-center text-3xl font-bold tracking-wide"
            />
          </div>
        </div>

        <div className="flex-grow-[1] basis-0 p-4 border-l-2 border-black">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 col-span-2">
              <div className="flex-grow">
                {isCustomClass ? (
                  <div className="relative flex items-center">
                    <Input
                      placeholder="Classe Customizada"
                      value={character.class}
                      onChange={(e) => onUpdate({ class: e.target.value })}
                      className="pr-8 h-8"
                    />
                    <button
                      onClick={() => {
                        setIsCustomClass(false)
                        onUpdate({ class: "" })
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Limpar classe customizada e voltar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Select
                    value={character.class}
                    onValueChange={(value) => {
                      if (value === "custom") {
                        setIsCustomClass(true)
                        onUpdate({ class: "", savingThrowProficiencies: [], hitDice: "", spellcastingAbility: null })
                      } else {
                        const classData = CLASS_DATA[value as keyof typeof CLASS_DATA]
                        const updates: Partial<Character> = { class: value }
                        if (classData) {
                          updates.spellcastingAbility = classData.spellcastingAbility
                          updates.savingThrowProficiencies = classData.savingThrows
                          updates.hitDice = `${character.level}d${classData.hitDie}`
                        }
                        onUpdate(updates)
                      }
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CLASS_DATA).map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Outro...</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <Input
                type="number"
                readOnly
                placeholder="Nível"
                className="w-12 h-8"
                value={character.level}
                min={1}
                max={20}
              />
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-transparent"
                onClick={() => setIsLevelUpModalOpen(true)}
                disabled={character.level >= 20 || !character.class}
              >
                <ArrowUpWideNarrow className="h-4 w-4" />
                <span className="sr-only">Subir de Nível</span>
              </Button>
            </div>
            <Input
              placeholder="Antecedente"
              value={character.background}
              onChange={(e) => onUpdate({ background: e.target.value })}
              className="h-8"
            />
            <Input
              placeholder="Nome do Jogador"
              value={character.playerName}
              onChange={(e) => onUpdate({ playerName: e.target.value })}
              className="h-8"
            />
            <Input
              placeholder="Raça"
              value={character.race}
              onChange={(e) => onUpdate({ race: e.target.value })}
              className="h-8"
            />
            <Input
              placeholder="Alinhamento"
              value={character.alignment}
              onChange={(e) => onUpdate({ alignment: e.target.value })}
              className="h-8"
            />
            <Input
              placeholder="Pontos de Experiência"
              type="number"
              value={character.experiencePoints}
              onChange={(e) => onUpdate({ experiencePoints: Number.parseInt(e.target.value) || 0 })}
              className="h-8 col-span-2"
            />
          </div>
        </div>
      </div>

      <div>
        <Input
          placeholder="Subclasse (Ex: Mestre de Batalha, Círculo da Lua)"
          value={character.subclass}
          onChange={(e) => onUpdate({ subclass: e.target.value })}
          className="text-xs"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Abilities */}
        <div className="space-y-4">
          {(Object.keys(character.abilities) as Ability[]).map((ability) => (
            <AbilityScore
              key={ability}
              ability={ABILITIES_PT[ability]}
              score={character.abilities[ability]}
              modifier={calculatedStats.abilityModifiers[ability]}
              onUpdate={(newScore) => onNestedChange(`abilities.${ability}`, newScore)}
            />
          ))}
        </div>

        {/* Center Column: Combat & Skills */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <StatBox label="Classe de Armadura" value={calculatedStats.armorClass} />
            <StatBox label="Iniciativa" value={calculatedStats.initiative} sign />
            <StatBox label="Velocidade" value={character.speed} unit="m" />
          </div>
          <BorderedBox className="p-2">
            <div className="text-center">
              <label className="text-xs font-bold">Pontos de Vida</label>
              <div className="flex items-center justify-center gap-2">
                <Input
                  className="w-20 text-center"
                  placeholder="Atuais"
                  value={character.currentHitPoints || ""}
                  onChange={(e) => onUpdate({ currentHitPoints: Number.parseInt(e.target.value) || 0 })}
                />
                / <span className="font-bold">{character.maxHitPoints}</span>
              </div>
            </div>
          </BorderedBox>
          <BorderedBox className="p-2">
            <div className="text-center">
              <label className="text-xs font-bold">Pontos de Vida Temporários</label>
              <Input
                className="w-full text-center"
                value={character.temporaryHitPoints || ""}
                onChange={(e) => onUpdate({ temporaryHitPoints: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
          </BorderedBox>
          <BorderedBox className="p-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <label className="text-xs font-bold">Dados de Vida</label>
                <div className="font-bold text-lg">
                  {character.level - character.usedHitDice} / {character.level}
                  {hitDieType && <span className="text-sm"> (d{hitDieType})</span>}
                </div>
              </div>
              <div className="text-center">
                <label className="text-xs font-bold text-center block">Testes Contra a Morte</label>
                <div className="flex justify-around text-sm mt-1">
                  <div className="flex items-center gap-1.5">
                    <span>Sucessos</span>
                    {[...Array(3)].map((_, i) => (
                      <DeathSaveCheckbox
                        key={i}
                        checked={i < character.deathSaves.successes}
                        onCheckedChange={() => handleDeathSaveChange("successes", i)}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-around text-sm mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="mr-4">Falhas</span>
                    {[...Array(3)].map((_, i) => (
                      <DeathSaveCheckbox
                        key={i}
                        checked={i < character.deathSaves.failures}
                        onCheckedChange={() => handleDeathSaveChange("failures", i)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2 border-t pt-2">
              <Button className="w-full" onClick={() => setIsShortRestModalOpen(true)}>
                <Bed className="h-4 w-4 mr-2" /> Descanso Curto
              </Button>
              <Button className="w-full" onClick={() => setIsLongRestModalOpen(true)}>
                <BedDouble className="h-4 w-4 mr-2" /> Descanso Longo
              </Button>
            </div>
          </BorderedBox>
          <ConditionTracker
            activeConditions={character.activeConditions}
            exhaustionLevel={character.exhaustionLevel}
            onConditionToggle={handleConditionToggle}
            onExhaustionChange={(level) => onUpdate({ exhaustionLevel: level })}
          />
          <BorderedBox className="p-2">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-center font-bold text-sm flex-grow">Recursos de Classe</h3>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleAddCustomResource}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {character.classResources.map((resource) => (
                <ClassResourceTracker
                  key={resource.id}
                  resource={resource}
                  onUpdate={handleUpdateResource}
                  onDelete={handleDeleteResource}
                />
              ))}
            </div>
            {character.classResources.length === 0 && (
              <p className="text-xs text-center text-gray-400 py-2">Nenhum recurso de classe específico.</p>
            )}
          </BorderedBox>
        </div>

        {/* Right Column: Saves & Skills */}
        <div className="space-y-2">
          <BorderedBox className="p-2">
            <h3 className="text-center font-bold text-sm mb-2">Testes de Resistência</h3>
            <div className="space-y-1">
              {(Object.keys(character.abilities) as Ability[]).map((ability) => {
                const modifier =
                  calculatedStats.abilityModifiers[ability] +
                  (character.savingThrowProficiencies.includes(ability) ? calculatedStats.proficiencyBonus : 0)
                return (
                  <SkillInput
                    key={ability}
                    name={ABILITIES_PT[ability]}
                    ability={ABILITIES_PT[ability]}
                    modifier={modifier}
                    isProficient={character.savingThrowProficiencies.includes(ability)}
                    onProficiencyToggle={() => handleProficiencyToggle("savingThrow", ability)}
                  />
                )
              })}
            </div>
          </BorderedBox>
          <BorderedBox className="p-2">
            <h3 className="text-center font-bold text-sm mb-2">Perícias</h3>
            <div className="space-y-1">
              {(Object.keys(SKILLS) as SkillName[]).map((skillName) => {
                const skill = SKILLS[skillName]
                const modifier =
                  calculatedStats.abilityModifiers[skill.ability] +
                  (character.skillProficiencies.includes(skillName) ? calculatedStats.proficiencyBonus : 0)
                return (
                  <SkillInput
                    key={skillName}
                    name={skillName}
                    ability={ABILITIES_PT[skill.ability]}
                    modifier={modifier}
                    isProficient={character.skillProficiencies.includes(skillName)}
                    onProficiencyToggle={() => handleProficiencyToggle("skill", skillName)}
                  />
                )
              })}
            </div>
          </BorderedBox>
        </div>
      </div>
    </div>
  )
}

export default FrontPage
