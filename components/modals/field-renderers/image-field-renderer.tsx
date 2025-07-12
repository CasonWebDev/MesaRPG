import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, X, Image as ImageIcon } from "lucide-react"

interface ImageFieldRendererProps {
  field: any
  value: string
  onChange: (value: string) => void
}

export function ImageFieldRenderer({ field, value, onChange }: ImageFieldRendererProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleFileUpload(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileUpload = (file: File) => {
    // Por enquanto, vamos usar URL local para desenvolvimento
    // Em produção, isso seria enviado para um serviço de upload
    const reader = new FileReader()
    reader.onload = (e) => {
      onChange(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUrlChange = (url: string) => {
    onChange(url)
  }

  const clearImage = () => {
    onChange('')
  }

  return (
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor={field.id}>
        {field.name}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          placeholder="Cole uma URL de imagem ou faça upload abaixo"
          value={value.startsWith('data:') ? '' : value}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
        {value && (
          <Button variant="outline" size="icon" onClick={clearImage}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {value ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={value}
                alt="Preview"
                className="max-w-32 max-h-32 object-cover rounded-lg border"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Arraste uma nova imagem ou clique no botão abaixo para alterar
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Arraste uma imagem aqui</p>
              <p className="text-xs text-muted-foreground">ou clique no botão abaixo</p>
            </div>
          </div>
        )}
        
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id={`upload-${field.id}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => document.getElementById(`upload-${field.id}`)?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {value ? 'Alterar Imagem' : 'Escolher Arquivo'}
        </Button>
      </Card>
    </div>
  )
}