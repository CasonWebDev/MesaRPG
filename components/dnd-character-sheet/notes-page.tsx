"use client"

import { Textarea } from "@/components/ui/textarea"
import type { Character } from "@/lib/dnd-types"

const NotesPage = ({
  character,
  onUpdate,
}: {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
}) => {
  return (
    <div className="p-4 bg-white w-full h-full">
      <Textarea
        placeholder="Espaço livre para anotações do personagem..."
        value={character.notes || ''}
        onChange={(e) => onUpdate({ notes: e.target.value })}
        className="w-full h-[800px] resize-none text-sm border border-gray-300 rounded p-4 focus-visible:ring-1 focus-visible:ring-blue-500"
      />
    </div>
  )
}

export default NotesPage