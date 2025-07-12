import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, X, Image as ImageIcon, AlertTriangle } from "lucide-react"
import { useImageCompression, formatBytes } from "@/hooks/use-image-compression"

interface ImageFieldRendererProps {
  field: any
  value: string
  onChange: (value: string) => void
}

export function ImageFieldRenderer({ field, value, onChange }: ImageFieldRendererProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { isProcessing, compressionInfo, compressImage, clearCompressionInfo } = useImageCompression()

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

  const handleFileUpload = async (file: File) => {
    try {
      const compressedBase64 = await compressImage(file, {
        maxWidth: 200,
        maxHeight: 200,
        quality: 0.8,
        showToasts: true
      })
      
      onChange(compressedBase64)
    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error)
    }
  }

  const handleUrlChange = (url: string) => {
    onChange(url)
  }

  const clearImage = () => {
    onChange('')
    clearCompressionInfo()
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
      
      {/* Info sobre otimização */}
      <div className="text-xs text-muted-foreground">
        💡 <strong>Dica:</strong> Imagens são automaticamente otimizadas para melhor performance. 
        Recomendado: arquivos até 100KB para melhor sincronização.
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
          disabled={isProcessing}
          onClick={() => document.getElementById(`upload-${field.id}`)?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isProcessing ? 'Processando...' : (value ? 'Alterar Imagem' : 'Escolher Arquivo')}
        </Button>
        
        {/* Compression Info */}
        {compressionInfo && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center gap-2 text-green-700 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium">Imagem otimizada:</span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              {formatBytes(compressionInfo.originalSize)} → {formatBytes(compressionInfo.compressedSize)} 
              <span className="font-medium"> ({compressionInfo.compressionRatio}% menor)</span>
            </div>
          </div>
        )}
        
        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-blue-700 text-xs">
              <div className="animate-spin h-3 w-3 border border-blue-600 border-t-transparent rounded-full"></div>
              <span>Comprimindo e otimizando imagem...</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}