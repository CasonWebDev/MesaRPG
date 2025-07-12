import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload } from "lucide-react"

interface AddNpcModalProps {
  isOpen: boolean
  onClose: () => void
}

// Este template mocado simula o que viria das configurações da campanha
const mockNpcTemplate = [
  { id: "f1", name: "Nome", type: "Texto Curto" },
  { id: "f2", name: "Ocupação", type: "Texto Curto" },
  { id: "f3", name: "Motivação", type: "Texto Longo" },
  { id: "f4", name: "Lealdade", type: "Sim/Não" },
  { id: "f5", name: "Avatar", type: "Imagem" },
]

export function AddNpcModal({ isOpen, onClose }: AddNpcModalProps) {
  const renderField = (field: (typeof mockNpcTemplate)[0]) => {
    switch (field.type) {
      case "Texto Longo":
        return (
          <Textarea
            id={field.id}
            placeholder={`Detalhes sobre ${field.name}...`}
            className="col-span-3 bg-stone-50/50"
          />
        )
      case "Sim/Não":
        return (
          <div className="col-span-3 flex items-center h-full">
            <Checkbox id={field.id} />
          </div>
        )
      case "Imagem":
        return (
          <div className="col-span-3">
            <Button asChild variant="outline" className="w-full cursor-pointer bg-stone-50/50 hover:bg-stone-50/80">
              <label>
                <Upload className="mr-2 h-4 w-4" />
                <span>Carregar Avatar</span>
                <Input id={field.id} type="file" className="sr-only" />
              </label>
            </Button>
          </div>
        )
      case "Texto Curto":
      default:
        return <Input id={field.id} placeholder={field.name} className="col-span-3 bg-stone-50/50" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-parchment text-ink-text">
        <DialogHeader>
          <DialogTitle>Adicionar Novo NPC</DialogTitle>
          <DialogDescription>
            Preencha a ficha do NPC de acordo com o template definido para esta campanha.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {mockNpcTemplate.map((field) => (
            <div key={field.id} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={field.id} className="text-right">
                {field.name}
              </Label>
              {renderField(field)}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="submit" disabled>
            Criar NPC
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
