"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Character } from "@/lib/dnd-types"
import { CLASS_DATA } from "@/lib/dnd-utils"

export const LevelUpModal = ({
  character,
  isOpen,
  onClose,
  onLevelUp,
  conMod,
}: {
  character: Character
  isOpen: boolean
  onClose: () => void
  onLevelUp: (hpGained: number) => void
  conMod: number
}) => {
  const classInfo = CLASS_DATA[character.class as keyof typeof CLASS_DATA]
  const hitDie = classInfo?.hitDie || 6
  const [rolledHp, setRolledHp] = useState<number | string>("")
  const [manualHp, setManualHp] = useState<number | string>("")
  const [newLevel, setNewLevel] = useState<number>(character.level + 1)

  if (!isOpen) return null

  const handleTakeAverage = () => {
    setRolledHp(Math.floor(hitDie / 2) + 1)
  }

  const handleApplyLevelUp = () => {
    const hpToAdd = (Number(rolledHp) || 0) + conMod
    onLevelUp(hpToAdd)
    setRolledHp("")
    onClose()
  }

  const handleApplyHpOnly = () => {
    const hpToAdd = Number(manualHp) || 0
    onLevelUp(hpToAdd)
    setManualHp("")
    onClose()
  }

  const handleApplyLevelChange = () => {
    // Aqui podemos implementar uma lógica mais complexa para mudança de nível
    // Por enquanto, vamos apenas aplicar o HP
    const hpToAdd = (Number(rolledHp) || 0) + conMod
    onLevelUp(hpToAdd)
    setRolledHp("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Nível e HP</DialogTitle>
          <DialogDescription>
            Escolha como deseja modificar seu personagem
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="levelup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="levelup">Subir Nível</TabsTrigger>
            <TabsTrigger value="hp">Rolar HP</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          
          <TabsContent value="levelup" className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Subir para o Nível {character.level + 1}</h3>
              <p className="text-sm text-muted-foreground">
                Role seu dado de vida (d{hitDie}) + modificador de CON ({conMod >= 0 ? `+${conMod}` : conMod})
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Input
                type="number"
                value={rolledHp}
                onChange={(e) => setRolledHp(e.target.value)}
                placeholder={`Role 1d${hitDie}`}
                className="w-32 text-center text-lg"
                min={1}
                max={hitDie}
              />
              <Button onClick={handleTakeAverage}>
                Média ({Math.floor(hitDie / 2) + 1})
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              HP ganho: {rolledHp ? `${Number(rolledHp)} + ${conMod} = ${Number(rolledHp) + conMod}` : "0"}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleApplyLevelUp} disabled={!rolledHp}>
                Subir de Nível
              </Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="hp" className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Rolar HP (sem subir nível)</h3>
              <p className="text-sm text-muted-foreground">
                Role dados de vida adicionais ou ajuste HP
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Input
                type="number"
                value={rolledHp}
                onChange={(e) => setRolledHp(e.target.value)}
                placeholder={`Role 1d${hitDie}`}
                className="w-32 text-center text-lg"
                min={1}
                max={hitDie}
              />
              <Button onClick={handleTakeAverage}>
                Média ({Math.floor(hitDie / 2) + 1})
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              HP ganho: {rolledHp ? `${Number(rolledHp)} + ${conMod} = ${Number(rolledHp) + conMod}` : "0"}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleApplyHpOnly} disabled={!rolledHp}>
                Adicionar HP
              </Button>
            </DialogFooter>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Ajuste Manual</h3>
              <p className="text-sm text-muted-foreground">
                Adicione ou remova HP manualmente
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Label htmlFor="manual-hp">HP a adicionar:</Label>
                <Input
                  id="manual-hp"
                  type="number"
                  value={manualHp}
                  onChange={(e) => setManualHp(e.target.value)}
                  placeholder="0"
                  className="w-32 text-center text-lg"
                />
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                Use valores negativos para remover HP
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleApplyHpOnly} disabled={!manualHp}>
                Aplicar ({manualHp > 0 ? `+${manualHp}` : manualHp} HP)
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}