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
import { Upload, Check } from "lucide-react"
import { useState } from "react"
import { FileUpload } from "@/components/file-manager/file-upload"
import Image from "next/image"

interface AddContentModalProps {
  itemType: "Mapa" | "Utilitário"
  isOpen: boolean
  onClose: () => void
  onSave?: (data: any) => Promise<void>
  onSubmit?: (data: any) => Promise<void>
}

// Templates de mapa disponíveis
const MAP_TEMPLATES = [
  {
    id: 'arenoso',
    name: 'Deserto/Arena',
    imageUrl: '/placeholder-arenoso.png',
    description: 'Ambiente árido, perfeito para combates no deserto ou arenas'
  },
  {
    id: 'masmorra',
    name: 'Masmorra/Caverna',
    imageUrl: '/placeholder-masmorra.png',
    description: 'Ambiente subterrâneo, ideal para masmorras e cavernas'
  },
  {
    id: 'floresta',
    name: 'Floresta/Natural',
    imageUrl: '/placeholder-floresta.png',
    description: 'Ambiente natural, ótimo para aventuras na floresta'
  }
]

export function AddContentModal({ itemType, isOpen, onClose, onSave, onSubmit }: AddContentModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<string[]>([])
  
  const showImageUpload = itemType === "Mapa"
  const showFileUpload = itemType === "Utilitário"
  
  const handleTemplateSelect = (templateId: string) => {
    const template = MAP_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setUploadedImageUrl(template.imageUrl)
      if (!name) {
        setName(template.name)
      }
      if (!description) {
        setDescription(template.description)
      }
    }
  }

  const handleFileUpload = (fileUrl: string) => {
    if (itemType === "Mapa") {
      setUploadedImageUrl(fileUrl)
      setSelectedTemplate(null) // Limpar template selecionado ao fazer upload
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
        data.imageUrl = uploadedImageUrl || null
        data.gridSize = 20 // Default grid size for maps
      } else {
        data.attachments = attachments
      }
      
      await saveFunction(data)
      
      // Reset form
      setName("")
      setDescription("")
      setUploadedImageUrl(null)
      setSelectedTemplate(null)
      setAttachments([])
    } catch (error) {
      console.error('Error saving content:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleClose = () => {
    if (!isLoading) {
      setName("")
      setDescription("")
      setUploadedImageUrl(null)
      setSelectedTemplate(null)
      setAttachments([])
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-parchment text-ink-text max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo {itemType}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para criar um novo {itemType.toLowerCase()}.
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
                placeholder={`Nome do ${itemType}`} 
                className="col-span-3 bg-stone-50/50" 
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                placeholder={itemType === "Mapa" ? "Uma breve descrição..." : "Conteúdo do utilitário..."} 
                className="col-span-3 bg-stone-50/50" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={itemType === "Utilitário" ? 4 : 3}
              />
            </div>
            {showImageUpload && (
              <>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">
                    Templates
                  </Label>
                  <div className="col-span-3 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Escolha um template rápido ou faça upload da sua própria imagem
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {MAP_TEMPLATES.map((template) => (
                        <div
                          key={template.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedTemplate === template.id
                              ? 'border-primary bg-primary/5'
                              : 'border-input hover:border-primary/50'
                          }`}
                          onClick={() => handleTemplateSelect(template.id)}
                        >
                          <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={template.imageUrl}
                              alt={template.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium truncate">{template.name}</p>
                              {selectedTemplate === template.id && (
                                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">
                    Imagem Customizada
                  </Label>
                  <div className="col-span-3 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Ou faça upload da sua própria imagem (substitui o template)
                    </p>
                    <FileUpload
                      onUploadComplete={handleFileUpload}
                      onUploadError={handleUploadError}
                      category="map"
                      acceptedTypes={["image/*"]}
                      maxFileSize={5 * 1024 * 1024} // 5MB
                      multiple={false}
                      disabled={isLoading}
                      placeholder="Arraste sua imagem personalizada aqui"
                    />
                    {uploadedImageUrl && !selectedTemplate && (
                      <div className="w-full h-32 relative rounded-md overflow-hidden border border-input bg-stone-50/30">
                        <Image
                          src={uploadedImageUrl}
                          alt="Imagem personalizada"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            {showFileUpload && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Anexos
                </Label>
                <div className="col-span-3 space-y-2">
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
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Arquivos anexados:</Label>
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
            {isLoading ? "Criando..." : `Criar ${itemType}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
