import Image from "next/image"
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
import { useState, useEffect } from "react"
import { FileUpload } from "@/components/file-manager/file-upload"

interface EditContentModalProps {
  item: { id: string; name: string; description: string; imageUrl?: string; attachments?: string[] }
  itemType: "Mapa" | "NPC" | "Utilitário" | "Criatura"
  isOpen: boolean
  onClose: () => void
  onSave?: (data: any) => Promise<void>
  onSubmit?: (data: any) => Promise<void>
}

export function EditContentModal({ item, itemType, isOpen, onClose, onSave, onSubmit }: EditContentModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<string[]>([])
  
  const showImageUpload = itemType === "Mapa"
  const showFileUpload = itemType === "Utilitário"
  
  const handleFileUpload = (fileUrl: string) => {
    if (itemType === "Mapa") {
      setUploadedImageUrl(fileUrl)
    } else {
      setAttachments(prev => [...prev, fileUrl])
    }
  }
  
  const handleUploadError = (error: string) => {
    console.error('Erro no upload:', error)
  }
  
  const removeAttachment = (urlToRemove: string) => {
    setAttachments(prev => prev.filter(url => url !== urlToRemove))
  }
  
  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setName(item.name)
      setDescription(item.description || "")
      setUploadedImageUrl(null)
      setAttachments(item.attachments || [])
    }
  }, [item])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return
    
    const saveFunction = onSubmit || onSave
    if (!saveFunction) return
    
    setIsLoading(true)
    
    try {
      let data: any = {
        name: name.trim(),
        content: description.trim() // Use 'content' for utilities, 'description' for maps
      }
      
      if (itemType === "Mapa") {
        data.description = description.trim()
        data.imageUrl = uploadedImageUrl || item.imageUrl || null
        data.gridSize = 20 // Default grid size for maps
      } else {
        data.attachments = attachments
      }
      
      await saveFunction(data)
    } catch (error) {
      console.error('Error saving content:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  // O modal de edição genérico não edita a ficha inteira, apenas nome e descrição.
  // A edição da ficha completa seria em um modal separado.
  if (itemType === "Criatura" || itemType === "NPC") {
    // Por enquanto, vamos simplificar e editar apenas os campos básicos.
    // No futuro, isso abriria um modal de edição de ficha completo.
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-parchment text-ink-text">
        <DialogHeader>
          <DialogTitle>Editar {itemType}</DialogTitle>
          <DialogDescription>
            Faça alterações no seu {itemType.toLowerCase()} aqui. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                className="col-span-3 bg-stone-50/50" 
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                {itemType === "Mapa" ? "Descrição" : "Conteúdo"}
              </Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3 bg-stone-50/50" 
                disabled={isLoading}
                rows={itemType === "Utilitário" ? 4 : 3}
              />
            </div>
            {showImageUpload && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">Imagem</Label>
                <div className="col-span-3 space-y-3">
                  {item.imageUrl && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Imagem Atual</Label>
                      <div className="w-full h-24 relative rounded-md overflow-hidden border border-input bg-stone-50/30">
                        <Image
                          src={item.imageUrl || `/placeholder.svg?width=150&height=96&query=${item.name}`}
                          alt={`Imagem atual de ${item.name}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nova Imagem</Label>
                    <FileUpload
                      onUploadComplete={handleFileUpload}
                      onUploadError={handleUploadError}
                      category="map"
                      acceptedTypes={["image/*"]}
                      maxFileSize={5 * 1024 * 1024} // 5MB
                      multiple={false}
                      disabled={isLoading}
                      placeholder="Arraste a nova imagem do mapa aqui"
                    />
                    {uploadedImageUrl && (
                      <div className="w-full h-32 relative rounded-md overflow-hidden border border-input bg-stone-50/30">
                        <Image
                          src={uploadedImageUrl}
                          alt="Nova imagem enviada"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {showFileUpload && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Anexos
                </Label>
                <div className="col-span-3 space-y-2">
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Anexos atuais:</Label>
                      {attachments.map((url, index) => {
                        const fileName = url.split('/').pop() || `Arquivo ${index + 1}`
                        return (
                          <div key={index} className="flex items-center justify-between p-2 bg-stone-50/50 rounded border">
                            <span className="text-sm truncate">{fileName}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(url)}
                              disabled={isLoading}
                            >
                              Remover
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Adicionar novos anexos:</Label>
                    <FileUpload
                      onUploadComplete={handleFileUpload}
                      onUploadError={handleUploadError}
                      category="handout"
                      acceptedTypes={["image/*", "application/pdf", "text/*"]}
                      maxFileSize={10 * 1024 * 1024} // 10MB
                      multiple={true}
                      disabled={isLoading}
                      placeholder="Arraste arquivos para anexar ao utilitário"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button 
            type="submit" 
            disabled={isLoading || !name.trim()}
            onClick={handleSubmit}
          >
            {isLoading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
