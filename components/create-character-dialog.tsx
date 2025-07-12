"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, Loader2, X, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { TemplateField, SheetTemplate } from "@/types/sheet-template"
import { useImageCompression, formatBytes } from "@/hooks/use-image-compression"

interface CreateCharacterDialogProps {
  isOpen: boolean
  onClose: () => void
  campaignId: string
  template: SheetTemplate
}

export function CreateCharacterDialog({ isOpen, onClose, campaignId, template }: CreateCharacterDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<Record<string, string>>({})
  const { isProcessing, compressionInfo, compressImage, clearCompressionInfo } = useImageCompression()
  const router = useRouter()

  // Inicializar dados do formulário com valores padrão
  useEffect(() => {
    if (template && isOpen) {
      const initialData: Record<string, any> = {}
      
      // Garantir que template.fields seja sempre um array
      const fields = Array.isArray(template.fields) ? template.fields : []
      
      fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          initialData[field.name] = field.defaultValue
        } else {
          switch (field.type) {
            case 'text':
            case 'textarea':
            case 'select':
              initialData[field.name] = ''
              break
            case 'number':
              initialData[field.name] = 0
              break
            case 'boolean':
              initialData[field.name] = false
              break
            case 'attributes':
              const attributesData: Record<string, number> = {}
              field.attributes?.forEach(attr => {
                attributesData[attr.name] = attr.defaultValue || 0
              })
              initialData[field.name] = attributesData
              break
            case 'image':
              initialData[field.name] = ''
              break
            default:
              initialData[field.name] = ''
          }
        }
      })
      
      setFormData(initialData)
    } else if (!isOpen) {
      // Limpar dados quando o dialog é fechado
      setFormData({})
      setImagePreview({})
    }
  }, [template, isOpen])

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleImageChange = async (fieldName: string, file: File | null) => {
    if (file) {
      try {
        console.log(`📷 Comprimindo imagem para campo: ${fieldName}`)
        const compressedBase64 = await compressImage(file, {
          maxWidth: 200,
          maxHeight: 200,
          quality: 0.8,
          showToasts: true
        })
        
        setImagePreview(prev => ({
          ...prev,
          [fieldName]: compressedBase64
        }))
        handleFieldChange(fieldName, compressedBase64)
        
        console.log(`✅ Imagem comprimida salva para campo: ${fieldName}`)
      } catch (error) {
        console.error(`❌ Erro ao comprimir imagem para campo ${fieldName}:`, error)
        toast.error('Erro ao processar imagem. Tente novamente.')
      }
    } else {
      setImagePreview(prev => {
        const newPrev = { ...prev }
        delete newPrev[fieldName]
        return newPrev
      })
      handleFieldChange(fieldName, '')
      clearCompressionInfo()
    }
  }

  const removeImage = (fieldName: string) => {
    handleImageChange(fieldName, null)
  }

  const validateForm = () => {
    const fields = Array.isArray(template.fields) ? template.fields : []
    const requiredFields = fields.filter(field => field.required)
    
    for (const field of requiredFields) {
      const value = formData[field.name]
      
      if (value === undefined || value === null || value === '') {
        toast.error(`O campo "${field.name}" é obrigatório`)
        return false
      }
      
      // Validação específica para atributos
      if (field.type === 'attributes' && field.attributes) {
        for (const attr of field.attributes) {
          if (value[attr.name] === undefined || value[attr.name] === null) {
            toast.error(`O atributo "${attr.name}" é obrigatório`)
            return false
          }
        }
      }
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Extrair nome do personagem do primeiro campo ou campo "nome"
      const fields = Array.isArray(template.fields) ? template.fields : []
      const nameField = fields.find(f => f.name && String(f.name).toLowerCase() === 'nome') || fields[0]
      const characterName = formData[nameField.name] || 'Personagem'
      
      const response = await fetch(`/api/campaigns/${campaignId}/characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: characterName,
          type: template.type,
          data: formData,
          templateId: template.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Server error:', errorData)
        throw new Error(errorData.error || 'Dados inválidos')
      }

      const result = await response.json()
      
      toast.success('Personagem criado com sucesso!')
      onClose()
      
      // Redirect para a ficha completa
      router.push(`/campaign/${campaignId}/sheet/${result.character.id}?role=Jogador`)
      
    } catch (error) {
      console.error('Erro ao criar personagem:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar personagem')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderField = (field: TemplateField) => {
    const value = formData[field.name]

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Digite ${String(field.name).toLowerCase()}`}
            className="bg-white text-black w-4/5"
          />
        )
      
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={`Digite ${String(field.name).toLowerCase()}`}
            className="bg-white text-black min-h-[100px] w-4/5"
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || 0}
            onChange={(e) => handleFieldChange(field.name, e.target.valueAsNumber || 0)}
            className="bg-white text-black w-4/5"
          />
        )
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label htmlFor={field.id} className="text-sm">Sim</Label>
          </div>
        )
      
      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(selectedValue) => handleFieldChange(field.name, selectedValue)}
          >
            <SelectTrigger className="bg-white text-black w-4/5">
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'attributes':
        return (
          <div className="space-y-3 w-4/5">
            {field.attributes?.map((attr) => (
              <div key={attr.id} className="flex items-center gap-3">
                <Label className="min-w-[120px] text-sm font-medium">{attr.name}:</Label>
                <Input
                  type="number"
                  value={value?.[attr.name] || attr.defaultValue || 0}
                  onChange={(e) => {
                    const newValue = { ...value }
                    newValue[attr.name] = e.target.valueAsNumber || 0
                    handleFieldChange(field.name, newValue)
                  }}
                  className="bg-white text-black w-24 text-center"
                />
              </div>
            ))}
          </div>
        )
      
      case 'image':
        const hasPreview = imagePreview[field.name]
        return (
          <div className="w-4/5 space-y-3">
            {/* Info sobre otimização */}
            <div className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> Imagens são automaticamente otimizadas para melhor performance.
            </div>
            
            {hasPreview ? (
              <div className="relative">
                <img 
                  src={imagePreview[field.name]} 
                  alt="Preview" 
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={() => removeImage(field.name)}
                  disabled={isProcessing}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="w-32 h-32 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-100">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin h-6 w-6 border border-gray-600 border-t-transparent rounded-full"></div>
                    <span className="text-xs text-gray-600">Processando...</span>
                  </div>
                ) : (
                  <Upload className="h-8 w-8 text-gray-600" />
                )}
              </div>
            )}
            
            <Button 
              asChild 
              variant="outline" 
              className="w-full cursor-pointer bg-white hover:bg-gray-50"
              disabled={isProcessing}
            >
              <label>
                <Upload className="mr-2 h-4 w-4" />
                <span>
                  {isProcessing 
                    ? 'Processando...' 
                    : hasPreview 
                      ? 'Alterar Imagem' 
                      : 'Selecionar Imagem'
                  }
                </span>
                <Input 
                  type="file" 
                  className="sr-only" 
                  accept="image/*"
                  disabled={isProcessing}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageChange(field.name, file)
                    }
                  }}
                />
              </label>
            </Button>
            
            {/* Compression Info */}
            {compressionInfo && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-md">
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
          </div>
        )
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="bg-white text-black w-4/5"
          />
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[80vw] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-bold">
            Criar Personagem - {template.name}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="px-6 max-h-[60vh]">
          <div className="space-y-6">
            {(Array.isArray(template.fields) ? template.fields : []).map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {field.name}
                  {field.required && <span className="text-red-500 text-xs">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="p-6 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Personagem'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}