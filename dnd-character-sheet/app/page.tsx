import CharacterSheet from "@/components/character-sheet/character-sheet-wrapper"

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-4 sm:p-8">
      <div className="w-full max-w-5xl">
        <CharacterSheet />
      </div>
    </main>
  )
}
