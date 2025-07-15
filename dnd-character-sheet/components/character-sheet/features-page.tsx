"use client"
import { Textarea } from "@/components/ui/textarea"
import type { Character } from "@/lib/dnd-types"
import { BorderedBox } from "./ui/bordered-box"

export default function FeaturesPage({
  character,
  onUpdate,
}: {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
}) {
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg border-2 border-black font-serif">
      <BorderedBox className="p-2 flex flex-col h-full min-h-[70vh]">
        <Textarea
          value={character.featuresAndTraits}
          onChange={(e) => onUpdate({ featuresAndTraits: e.target.value })}
          className="h-full w-full border-0 resize-none focus:ring-0 bg-transparent p-1 flex-grow"
          placeholder="Descreva aqui todos os talentos e características da sua classe, raça, etc..."
        />
        <label className="text-xs text-center uppercase font-bold mt-1">Talentos & Características</label>
      </BorderedBox>
    </div>
  )
}
