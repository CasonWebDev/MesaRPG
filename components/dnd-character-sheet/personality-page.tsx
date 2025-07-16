"use client"

import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Character } from "@/lib/dnd-types"
import { BorderedBox } from "./ui/bordered-box"
import { Upload, User } from "lucide-react"
import { useState } from "react"

const PersonalityPage = ({
  character,
  onUpdate,
}: {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
}) => {
  const [dragOver, setDragOver] = useState(false)

  const compressImage = (file: File, maxWidth: number = 400, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        const { width, height } = img
        const aspectRatio = width / height
        
        let newWidth = maxWidth
        let newHeight = maxWidth / aspectRatio
        
        if (newHeight > maxWidth) {
          newHeight = maxWidth
          newWidth = maxWidth * aspectRatio
        }
        
        canvas.width = newWidth
        canvas.height = newHeight
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, newWidth, newHeight)
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileUpload = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      try {
        const compressedImage = await compressImage(file, 400, 0.7)
        onUpdate({ avatar: compressedImage })
      } catch (error) {
        console.error('Erro ao comprimir imagem:', error)
        // Fallback para método sem compressão
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          onUpdate({ avatar: result })
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  return (
    <div className="p-4 bg-game-sheet space-y-4">
      {/* Top Layout with Avatar and Physical Details */}
      <div className="grid grid-cols-4 gap-4">
        {/* Avatar Section */}
        <div className="col-span-1">
          <BorderedBox className="p-3">
            <h3 className="font-bold text-sm mb-2 text-center border-b border-border pb-1">APARÊNCIA</h3>
            <div 
              className={`relative w-full h-48 border-2 border-dashed ${dragOver ? 'border-primary bg-primary/10' : 'border-border'} rounded-lg flex items-center justify-center cursor-pointer transition-colors`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              {character.avatar ? (
                <img 
                  src={character.avatar} 
                  alt="Avatar do personagem" 
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <User className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Clique ou arraste uma imagem</p>
                </div>
              )}
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {character.avatar && (
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={() => onUpdate({ avatar: '' })}
              >
                Remover
              </Button>
            )}
          </BorderedBox>
        </div>

        {/* Physical Details - Right Side */}
        <div className="col-span-3">
          <div className="grid grid-cols-3 gap-2 mb-4">
            <BorderedBox className="p-2">
              <h3 className="font-bold text-xs mb-1 text-center border-b border-border pb-1">IDADE</h3>
              <Input
                placeholder="23 anos"
                value={character.age || ''}
                onChange={(e) => onUpdate({ age: e.target.value })}
                className="text-sm border-0 p-1 h-8 focus-visible:ring-0 text-center"
              />
            </BorderedBox>
            
            <BorderedBox className="p-2">
              <h3 className="font-bold text-xs mb-1 text-center border-b border-border pb-1">ALTURA</h3>
              <Input
                placeholder="1,85m"
                value={character.height || ''}
                onChange={(e) => onUpdate({ height: e.target.value })}
                className="text-sm border-0 p-1 h-8 focus-visible:ring-0 text-center"
              />
            </BorderedBox>

            <BorderedBox className="p-2">
              <h3 className="font-bold text-xs mb-1 text-center border-b border-border pb-1">PESO</h3>
              <Input
                placeholder="85kg"
                value={character.weight || ''}
                onChange={(e) => onUpdate({ weight: e.target.value })}
                className="text-sm border-0 p-1 h-8 focus-visible:ring-0 text-center"
              />
            </BorderedBox>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <BorderedBox className="p-2">
              <h3 className="font-bold text-xs mb-1 text-center border-b border-border pb-1">OLHOS</h3>
              <Input
                placeholder="Azuis brilhantes"
                value={character.eyes || ''}
                onChange={(e) => onUpdate({ eyes: e.target.value })}
                className="text-sm border-0 p-1 h-8 focus-visible:ring-0 text-center"
              />
            </BorderedBox>
            
            <BorderedBox className="p-2">
              <h3 className="font-bold text-xs mb-1 text-center border-b border-border pb-1">PELE</h3>
              <Input
                placeholder="Bronzeada pelo sol"
                value={character.skin || ''}
                onChange={(e) => onUpdate({ skin: e.target.value })}
                className="text-sm border-0 p-1 h-8 focus-visible:ring-0 text-center"
              />
            </BorderedBox>

            <BorderedBox className="p-2">
              <h3 className="font-bold text-xs mb-1 text-center border-b border-border pb-1">CABELO</h3>
              <Input
                placeholder="Loiros desgrenhados"
                value={character.hair || ''}
                onChange={(e) => onUpdate({ hair: e.target.value })}
                className="text-sm border-0 p-1 h-8 focus-visible:ring-0 text-center"
              />
            </BorderedBox>
          </div>
        </div>
      </div>

      {/* Personality Traits Section */}
      <div className="grid grid-cols-2 gap-4">
        <BorderedBox className="p-3">
          <h3 className="font-bold text-sm mb-2 text-center border-b border-border pb-1">TRAÇOS DE PERSONALIDADE</h3>
          <Textarea
            placeholder="Sempre exagerado e teatral, Hélios transforma qualquer conversa em um espetáculo..."
            value={character.personalityTraits || ''}
            onChange={(e) => onUpdate({ personalityTraits: e.target.value })}
            className="min-h-[120px] resize-none text-sm border-0 p-1 focus-visible:ring-0"
          />
        </BorderedBox>

        <BorderedBox className="p-3">
          <h3 className="font-bold text-sm mb-2 text-center border-b border-border pb-1">CARACTERÍSTICAS E TRAÇOS</h3>
          <Textarea
            placeholder="Fala com entonação dramática, mesmo em situações mundanas..."
            value={character.featuresAndTraits || ''}
            onChange={(e) => onUpdate({ featuresAndTraits: e.target.value })}
            className="min-h-[120px] resize-none text-sm border-0 p-1 focus-visible:ring-0"
          />
        </BorderedBox>
      </div>

      {/* Ideals and Bonds */}
      <div className="grid grid-cols-2 gap-4">
        <BorderedBox className="p-3">
          <h3 className="font-bold text-sm mb-2 text-center border-b border-border pb-1">IDEAIS</h3>
          <Textarea
            placeholder="A glória e a redenção são conquistadas através de atos heroicos e grandiosos..."
            value={character.ideals || ''}
            onChange={(e) => onUpdate({ ideals: e.target.value })}
            className="min-h-[100px] resize-none text-sm border-0 p-1 focus-visible:ring-0"
          />
        </BorderedBox>

        <BorderedBox className="p-3">
          <h3 className="font-bold text-sm mb-2 text-center border-b border-border pb-1">VÍNCULOS</h3>
          <Textarea
            placeholder="Leal à sua ordem, ele acredita que sua missão é espalhar a luz da justiça..."
            value={character.bonds || ''}
            onChange={(e) => onUpdate({ bonds: e.target.value })}
            className="min-h-[100px] resize-none text-sm border-0 p-1 focus-visible:ring-0"
          />
        </BorderedBox>
      </div>

      {/* Flaws */}
      <BorderedBox className="p-3">
        <h3 className="font-bold text-sm mb-2 text-center border-b border-border pb-1">FRAQUEZAS</h3>
        <Textarea
          placeholder="Sua necessidade de ser o centro das atenções pode colocá-lo em perigo..."
          value={character.flaws || ''}
          onChange={(e) => onUpdate({ flaws: e.target.value })}
          className="min-h-[80px] resize-none text-sm border-0 p-1 focus-visible:ring-0"
        />
      </BorderedBox>

      {/* Other Proficiencies & Languages */}
      <BorderedBox className="p-3">
        <h3 className="font-bold text-sm mb-2 text-center border-b border-border pb-1">IDIOMAS</h3>
        <Textarea
          placeholder="Comum, Élfico, Dracônico (porque achou que soava épico aprender a língua dos dragões)..."
          value={character.otherProficienciesAndLanguages || ''}
          onChange={(e) => onUpdate({ otherProficienciesAndLanguages: e.target.value })}
          className="min-h-[60px] resize-vertical text-sm border-0 p-1 focus-visible:ring-0"
        />
      </BorderedBox>

      {/* Character Backstory */}
      <BorderedBox className="p-3">
        <h3 className="font-bold text-sm mb-2 text-center border-b border-border pb-1">HISTÓRIA DO PERSONAGEM</h3>
        <Textarea
          placeholder="Sir Hélios, o Iluminado, nasceu para a grandeza — mas não sabia qual seria a forma certa disso..."
          value={character.characterBackstory || ''}
          onChange={(e) => onUpdate({ characterBackstory: e.target.value })}
          className="min-h-[120px] resize-vertical text-sm border-0 p-1 focus-visible:ring-0"
        />
      </BorderedBox>

    </div>
  )
}

export default PersonalityPage