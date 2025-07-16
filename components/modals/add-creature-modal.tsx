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
import { Upload } from "lucide-react"

interface AddCreatureModalProps {
  isOpen: boolean
  onClose: () => void
}

// Este template mocado simula o que viria das configurações da campanha
const mockCreatureTemplate = [
  { id: "cf1", name: "Nome da Criatura", type: "Texto Curto" },
  { id: "cf2", name: "Pontos de Vida", type: "Número" },
  { id: "cf3", name: "Classe de Armadura", type: "Número" },
  { id: "cf4", name: "Ações", type: "Texto Longo" },
  { id: "cf5", name: "Tesouro", type: "Texto Longo" },
  { id: "cf6", name: "Token", type: "Imagem" },
]

export function AddCreatureModal({ isOpen, onClose }: AddCreatureModalProps) {
  const renderField = (field: (typeof mockCreatureTemplate)[0]) => {
    switch (field.type) {
      case "Texto Longo":
        return (
          <Textarea
            id={field.id}
            placeholder={`Detalhes sobre ${field.name}...`}
            className="col-span-3 bg-background/50"
          />
        )
      case "Imagem":
        return (
          <div className="col-span-3">
            <Button asChild variant="outline" className="w-full cursor-pointer bg-background/50 hover:bg-background/80">
              <label>
                <Upload className="mr-2 h-4 w-4" />
                <span>Carregar Imagem do Token</span>
                <Input id={field.id} type="file" className="sr-only" />
              </label>
            </Button>
          </div>
        )
      case "Número":
      case "Texto Curto":
      default:
        return (
          <Input
            id={field.id}
            placeholder={field.name}
            type={field.type === "Número" ? "number" : "text"}
            className="col-span-3 bg-background/50"
          />
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-parchment text-ink-text">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Criatura</DialogTitle>
          <DialogDescription>
            Preencha a ficha da criatura de acordo com o template definido para esta campanha.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {mockCreatureTemplate.map((field) => (
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
            Criar Criatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
