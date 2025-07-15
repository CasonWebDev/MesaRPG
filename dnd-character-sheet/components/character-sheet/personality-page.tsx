"use client"
import { Input } from "@/components/ui/input"
import type React from "react"

import { Textarea } from "@/components/ui/textarea"
import type { Character } from "@/lib/dnd-types"
import { BorderedBox } from "./ui/bordered-box"

const LabeledInput = ({ label, ...props }: { label: string } & React.ComponentProps<typeof Input>) => (
  <div className="flex flex-col">
    <Input {...props} className="border-0 border-b-2 rounded-none px-1 text-center" />
    <label className="text-xs text-center uppercase font-bold mt-1">{label}</label>
  </div>
)

const LabeledTextarea = ({ label, ...props }: { label: string } & React.ComponentProps<typeof Textarea>) => (
  <BorderedBox className="p-2 flex flex-col h-full">
    <Textarea {...props} className="h-full w-full border-0 resize-none focus:ring-0 bg-transparent p-1 flex-grow" />
    <label className="text-xs text-center uppercase font-bold mt-1">{label}</label>
  </BorderedBox>
)

export default function PersonalityPage({
  character,
  onUpdate,
}: {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
}) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg border-2 border-black font-serif space-y-4">
      {/* Top Section: Appearance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <BorderedBox className="p-2 flex-grow flex flex-col">
            <div className="w-full h-48 bg-gray-100 border-2 border-dashed rounded-md flex items-center justify-center mb-2">
              <span className="text-gray-400">Aparência do Personagem</span>
            </div>
          </BorderedBox>
          <LabeledTextarea
            label="Idiomas e Outras Proficiências"
            value={character.otherProficienciesAndLanguages}
            onChange={(e) => onUpdate({ otherProficienciesAndLanguages: e.target.value })}
            placeholder="Comum, Anão..."
            className="min-h-[100px]"
          />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <LabeledInput
              label="Idade"
              value={character.age}
              onChange={(e) => onUpdate({ age: e.target.value })}
              placeholder="--"
            />
            <LabeledInput
              label="Altura"
              value={character.height}
              onChange={(e) => onUpdate({ height: e.target.value })}
              placeholder="--"
            />
            <LabeledInput
              label="Peso"
              value={character.weight}
              onChange={(e) => onUpdate({ weight: e.target.value })}
              placeholder="--"
            />
            <LabeledInput
              label="Olhos"
              value={character.eyes}
              onChange={(e) => onUpdate({ eyes: e.target.value })}
              placeholder="--"
            />
            <LabeledInput
              label="Pele"
              value={character.skin}
              onChange={(e) => onUpdate({ skin: e.target.value })}
              placeholder="--"
            />
            <LabeledInput
              label="Cabelo"
              value={character.hair}
              onChange={(e) => onUpdate({ hair: e.target.value })}
              placeholder="--"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
            <LabeledTextarea
              label="Traços de Personalidade"
              value={character.personalityTraits}
              onChange={(e) => onUpdate({ personalityTraits: e.target.value })}
              className="min-h-[150px]"
            />
            <LabeledTextarea
              label="Ideais"
              value={character.ideals}
              onChange={(e) => onUpdate({ ideals: e.target.value })}
              className="min-h-[150px]"
            />
            <LabeledTextarea
              label="Vínculos"
              value={character.bonds}
              onChange={(e) => onUpdate({ bonds: e.target.value })}
              className="min-h-[150px]"
            />
            <LabeledTextarea
              label="Fraquezas"
              value={character.flaws}
              onChange={(e) => onUpdate({ flaws: e.target.value })}
              className="min-h-[150px]"
            />
          </div>
        </div>
      </div>

      {/* Bottom Section: Backstory */}
      <LabeledTextarea
        label="História do Personagem"
        value={character.characterBackstory}
        onChange={(e) => onUpdate({ characterBackstory: e.target.value })}
        className="min-h-[250px]"
      />
    </div>
  )
}
