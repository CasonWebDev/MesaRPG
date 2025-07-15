"use client"

import type React from "react"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Upload, Download } from "lucide-react"
import type { Character, Ability, Item, Armor, Shield, Resource } from "@/lib/dnd-types"
import {
  initialCharacter,
  calculateAbilityModifier,
  calculateProficiencyBonus,
  calculateInitialHitPoints,
  calculateSpellSaveDC,
  CLASS_DATA,
  SPELL_SLOTS_BY_CLASS_LEVEL,
  calculateSpellAttackBonus,
} from "@/lib/dnd-utils"
import FrontPage from "./front-page"
import PersonalityPage from "./personality-page"
import SpellsPage from "./spells-page"
import CombatEquipmentPage from "./combat-equipment-page"
import FeaturesPage from "./features-page"

function calculateArmorClass(dexMod: number, inventory: Item[], armorId: string | null, shieldId: string | null) {
  let baseAc = 10
  let armorName: string | null = null
  let dexBonusForAc = dexMod

  const equippedArmor = inventory.find((i) => i.id === armorId) as Armor | undefined
  if (equippedArmor) {
    armorName = equippedArmor.name
    // Defensively check for baseAc, default to 10 if it's not a valid number
    baseAc = typeof equippedArmor.baseAc === "number" ? equippedArmor.baseAc : 10
    if (equippedArmor.armorType === "media") {
      dexBonusForAc = Math.min(dexMod, 2)
    } else if (equippedArmor.armorType === "pesada") {
      dexBonusForAc = 0
    }
  }

  let shieldBonus = 0
  let shieldName: string | null = null
  const equippedShield = inventory.find((i) => i.id === shieldId) as Shield | undefined
  if (equippedShield) {
    // Defensively check for acBonus, default to 0 if it's not a valid number
    shieldBonus = typeof equippedShield.acBonus === "number" ? equippedShield.acBonus : 0
    shieldName = equippedShield.name
  }

  // Ensure all parts of the calculation are valid numbers
  const total = (baseAc || 10) + (dexBonusForAc || 0) + (shieldBonus || 0)

  return {
    total,
    base: baseAc || 10,
    dex: dexBonusForAc || 0,
    armorName,
    shield: shieldBonus || 0,
    shieldName,
  }
}

export default function CharacterSheetWrapper() {
  const [character, setCharacter] = useState<Character>(initialCharacter)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const calculatedStats = useMemo(() => {
    const proficiencyBonus = calculateProficiencyBonus(character.level)
    const abilityModifiers: { [key in Ability]: number } = {} as any
    for (const ability in character.abilities) {
      abilityModifiers[ability as Ability] = calculateAbilityModifier(character.abilities[ability as Ability])
    }

    const isCustomClass = !CLASS_DATA[character.class as keyof typeof CLASS_DATA]

    const spellcastingAbility = character.spellcastingAbility
    const spellSaveDC = isCustomClass
      ? character.customSpellSaveDC
      : spellcastingAbility
        ? calculateSpellSaveDC(proficiencyBonus, abilityModifiers[spellcastingAbility])
        : null

    const spellAttackBonus = isCustomClass
      ? character.customSpellAttackBonus
      : spellcastingAbility
        ? calculateSpellAttackBonus(proficiencyBonus, abilityModifiers[spellcastingAbility])
        : null

    const armorClassBreakdown = calculateArmorClass(
      abilityModifiers.destreza,
      character.inventory,
      character.equippedArmorId,
      character.equippedShieldId,
    )

    const spellSlots = isCustomClass
      ? null
      : SPELL_SLOTS_BY_CLASS_LEVEL[character.class as keyof typeof SPELL_SLOTS_BY_CLASS_LEVEL]?.[
          character.level - 1
        ] || [0, 0, 0, 0, 0, 0, 0, 0, 0]

    return {
      proficiencyBonus,
      abilityModifiers,
      passivePerception: 10 + abilityModifiers.sabedoria,
      initiative: abilityModifiers.destreza,
      spellSaveDC,
      spellAttackBonus,
      armorClass: armorClassBreakdown.total,
      armorClassBreakdown,
      spellSlots,
    }
  }, [character])

  // Effect to set initial HP when class is chosen at level 1
  useEffect(() => {
    if (character.level === 1 && character.class && character.maxHitPoints === 0) {
      const conMod = calculatedStats.abilityModifiers.constituicao
      const initialHp = calculateInitialHitPoints(conMod, character.class as keyof typeof CLASS_DATA)
      setCharacter((prev) => ({
        ...prev,
        maxHitPoints: initialHp,
        currentHitPoints: initialHp,
      }))
    }
  }, [character.class, character.level, character.maxHitPoints])

  // Effect to manage class resources automatically
  useEffect(() => {
    const getBarbarianRages = (level: number): number => {
      if (level >= 20) return 99 // Unlimited
      if (level >= 17) return 6
      if (level >= 12) return 5
      if (level >= 6) return 4
      if (level >= 3) return 3
      return 2
    }

    const getFighterActionSurges = (level: number): number => {
      if (level >= 17) return 2
      return 1
    }

    const getChannelDivinityUses = (level: number): number => {
      if (level >= 18) return 3
      if (level >= 6) return 2
      return 1
    }

    const classSpecificResources: Omit<Resource, "current">[] = []
    const { level, class: className } = character
    const chaMod = calculatedStats.abilityModifiers.carisma

    switch (className) {
      case "Bárbaro":
        classSpecificResources.push({ id: "rage", name: "Fúrias", max: getBarbarianRages(level) })
        break
      case "Monge":
        if (level > 0) {
          classSpecificResources.push({ id: "ki", name: "Pontos de Ki", max: level })
        }
        break
      case "Guerreiro":
        classSpecificResources.push({ id: "second_wind", name: "Retomar o Fôlego", max: 1 })
        if (level >= 2) {
          classSpecificResources.push({ id: "action_surge", name: "Surto de Ação", max: getFighterActionSurges(level) })
        }
        break
      case "Feiticeiro":
        if (level > 0) {
          classSpecificResources.push({ id: "sorcery_points", name: "Pontos de Feitiçaria", max: level })
        }
        break
      case "Clérigo":
      case "Paladino":
        if (level >= 2) {
          classSpecificResources.push({
            id: "channel_divinity",
            name: "Canalizar Divindade",
            max: getChannelDivinityUses(level),
          })
        }
        break
      case "Bardo":
        if (level > 0) {
          classSpecificResources.push({
            id: "bardic_inspiration",
            name: "Inspiração de Bardo",
            max: Math.max(1, chaMod),
          })
        }
        break
    }

    setCharacter((prev) => {
      const existingResources = prev.classResources || []
      const customResources = existingResources.filter((r) => r.id.startsWith("custom_"))

      const newAutomatedResources = classSpecificResources.map((newRes) => {
        const existing = existingResources.find((er) => er.id === newRes.id)
        return {
          ...newRes,
          current: existing ? Math.min(existing.current, newRes.max) : newRes.max,
        }
      })

      const finalResources = [...newAutomatedResources, ...customResources]
      const oldAutomated = existingResources.filter((r) => !r.id.startsWith("custom_"))

      if (JSON.stringify(oldAutomated) !== JSON.stringify(newAutomatedResources)) {
        return { ...prev, classResources: finalResources }
      }

      return prev
    })
  }, [character.class, character.level])

  const handleCharacterUpdate = useCallback((updates: Partial<Character>) => {
    setCharacter((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleNestedChange = useCallback((path: string, value: any) => {
    setCharacter((prev) => {
      const keys = path.split(".")
      const newChar = JSON.parse(JSON.stringify(prev))
      let current = newChar
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newChar
    })
  }, [])

  const handleLevelUp = useCallback((hpGained: number) => {
    setCharacter((prev) => {
      const newLevel = prev.level + 1
      const classData = CLASS_DATA[prev.class as keyof typeof CLASS_DATA]
      const newHitDice = classData ? `${newLevel}d${classData.hitDie}` : prev.hitDice

      return {
        ...prev,
        level: newLevel,
        maxHitPoints: prev.maxHitPoints + hpGained,
        currentHitPoints: prev.currentHitPoints + hpGained,
        hitDice: newHitDice,
      }
    })
  }, [])

  const handleShortRest = useCallback(
    (diceToSpend: number) => {
      const classInfo = CLASS_DATA[character.class as keyof typeof CLASS_DATA]
      if (!classInfo) return

      const conMod = calculatedStats.abilityModifiers.constituicao
      let totalHealed = 0
      for (let i = 0; i < diceToSpend; i++) {
        const roll = Math.floor(Math.random() * classInfo.hitDie) + 1
        totalHealed += roll + conMod
      }

      setCharacter((prev) => ({
        ...prev,
        currentHitPoints: Math.min(prev.maxHitPoints, prev.currentHitPoints + totalHealed),
        usedHitDice: prev.usedHitDice + diceToSpend,
      }))
    },
    [character.class, calculatedStats.abilityModifiers.constituicao],
  )

  const handleLongRest = useCallback(() => {
    setCharacter((prev) => {
      const recoveredDice = Math.floor(prev.level / 2) || 1
      const newUsedHitDice = Math.max(0, prev.usedHitDice - recoveredDice)

      const newSpells = { ...prev.spells }
      for (const level in newSpells) {
        newSpells[level].slotsExpended = 0
      }

      const newClassResources = prev.classResources.map((res) => ({
        ...res,
        current: res.max,
      }))

      return {
        ...prev,
        currentHitPoints: prev.maxHitPoints,
        temporaryHitPoints: 0,
        usedHitDice: newUsedHitDice,
        spells: newSpells,
        classResources: newClassResources,
        exhaustionLevel: Math.max(0, prev.exhaustionLevel - 1),
      }
    })
  }, [])

  const handleExport = () => {
    if (!character.name) {
      alert("Por favor, dê um nome ao seu personagem antes de exportar.")
      return
    }
    const jsonString = JSON.stringify(character, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${character.name.replace(/\s+/g, "_").toLowerCase()}_character.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result
        if (typeof text !== "string") {
          throw new Error("Falha ao ler o arquivo.")
        }
        const importedCharacter = JSON.parse(text)

        if (!importedCharacter.name || !importedCharacter.abilities) {
          throw new Error("Arquivo JSON inválido ou não é uma ficha de personagem.")
        }

        setCharacter(importedCharacter)
        alert(`Ficha "${importedCharacter.name}" importada com sucesso!`)
      } catch (error) {
        console.error("Erro ao importar ficha:", error)
        alert(`Erro ao importar ficha: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerImport = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div className="w-full flex justify-end gap-2 mb-4">
        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        <Button variant="outline" onClick={triggerImport}>
          <Upload className="h-4 w-4 mr-2" />
          Importar Ficha
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Ficha
        </Button>
      </div>
      <Tabs defaultValue="main" className="w-full font-serif">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <TabsTrigger value="main">Frente</TabsTrigger>
          <TabsTrigger value="equipment">Combate & Equip.</TabsTrigger>
          <TabsTrigger value="personality">Personalidade</TabsTrigger>
          <TabsTrigger value="spells">Magias</TabsTrigger>
          <TabsTrigger value="features">Talentos</TabsTrigger>
        </TabsList>
        <TabsContent value="main">
          <FrontPage
            character={character}
            onUpdate={handleCharacterUpdate}
            onNestedChange={handleNestedChange}
            calculatedStats={calculatedStats}
            onLevelUp={handleLevelUp}
            onShortRest={handleShortRest}
            onLongRest={handleLongRest}
          />
        </TabsContent>
        <TabsContent value="equipment">
          <CombatEquipmentPage
            character={character}
            onUpdate={handleCharacterUpdate}
            calculatedStats={calculatedStats}
          />
        </TabsContent>
        <TabsContent value="personality">
          <PersonalityPage character={character} onUpdate={handleCharacterUpdate} />
        </TabsContent>
        <TabsContent value="spells">
          <SpellsPage
            character={character}
            onUpdate={handleCharacterUpdate}
            calculatedStats={calculatedStats}
            onNestedChange={handleNestedChange}
          />
        </TabsContent>
        <TabsContent value="features">
          <FeaturesPage character={character} onUpdate={handleCharacterUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
