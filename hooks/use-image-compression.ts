"use client"

import { useState } from "react"
import { toast } from "sonner"

interface CompressionInfo {
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

interface UseImageCompressionReturn {
  isProcessing: boolean
  compressionInfo: CompressionInfo | null
  compressImage: (file: File, options?: CompressionOptions) => Promise<string>
  clearCompressionInfo: () => void
}

interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  showToasts?: boolean
}

export function useImageCompression(): UseImageCompressionReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null)

  // Função para comprimir e otimizar imagem
  const compressImageCanvas = (file: File, maxWidth = 200, maxHeight = 200, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()
      
      img.onload = () => {
        // Calcular dimensões mantendo proporção
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height)
        
        // Converter para base64 com compressão
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  // Função para calcular tamanho do base64
  const getBase64Size = (base64String: string): number => {
    // Remove o prefixo data:image/...;base64,
    const base64Data = base64String.split(',')[1] || base64String
    // Cada caractere base64 representa 6 bits, então dividimos por 4/3 para obter bytes
    return Math.round((base64Data.length * 3) / 4)
  }

  // Função para formatar tamanho em bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const compressImage = async (file: File, options: CompressionOptions = {}): Promise<string> => {
    const {
      maxWidth = 200,
      maxHeight = 200,
      quality = 0.8,
      showToasts = true
    } = options

    try {
      setIsProcessing(true)
      setCompressionInfo(null)
      
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        if (showToasts) {
          toast.error('Por favor, selecione apenas arquivos de imagem')
        }
        throw new Error('Arquivo não é uma imagem')
      }
      
      console.log(`📷 Processando imagem: ${file.name} (${formatBytes(file.size)})`)
      
      // Estimar tamanho do base64 sem compressão
      const originalBase64Size = Math.round(file.size * 1.37) // Aproximação do aumento base64
      
      // Se o arquivo for maior que 100KB, comprimir automaticamente
      if (file.size > 100 * 1024) {
        console.log(`🗜️ Arquivo grande detectado (${formatBytes(file.size)}), aplicando compressão...`)
        
        // Aplicar compressão mais agressiva para arquivos grandes
        const adaptiveQuality = file.size > 500 * 1024 ? 0.6 : 0.7
        const adaptiveMaxSize = file.size > 1024 * 1024 ? 150 : maxWidth
        
        const compressedBase64 = await compressImageCanvas(
          file, 
          adaptiveMaxSize, 
          adaptiveMaxSize, 
          adaptiveQuality
        )
        const compressedSize = getBase64Size(compressedBase64)
        
        setCompressionInfo({
          originalSize: originalBase64Size,
          compressedSize: compressedSize,
          compressionRatio: Math.round(((originalBase64Size - compressedSize) / originalBase64Size) * 100)
        })
        
        console.log(`✅ Compressão aplicada: ${formatBytes(originalBase64Size)} → ${formatBytes(compressedSize)} (${Math.round(((originalBase64Size - compressedSize) / originalBase64Size) * 100)}% redução)`)
        
        if (showToasts) {
          if (compressedSize > 50 * 1024) {
            toast.warning(`Imagem ainda grande após compressão (${formatBytes(compressedSize)}). Pode causar lentidão no sistema.`, {
              description: 'Considere usar uma imagem menor ou com menos detalhes.'
            })
          } else {
            toast.success(`Imagem otimizada: ${formatBytes(originalBase64Size)} → ${formatBytes(compressedSize)}`, {
              description: 'Tamanho ideal para melhor performance do sistema.'
            })
          }
        }
        
        return compressedBase64
      } else {
        // Arquivo pequeno, usar sem compressão mas aplicar redimensionamento leve
        console.log(`📸 Arquivo pequeno (${formatBytes(file.size)}), aplicando otimização leve...`)
        
        const optimizedBase64 = await compressImageCanvas(file, maxWidth * 1.25, maxHeight * 1.25, quality)
        const optimizedSize = getBase64Size(optimizedBase64)
        
        if (optimizedSize < originalBase64Size) {
          setCompressionInfo({
            originalSize: originalBase64Size,
            compressedSize: optimizedSize,
            compressionRatio: Math.round(((originalBase64Size - optimizedSize) / originalBase64Size) * 100)
          })
          
          console.log(`✅ Otimização aplicada: ${formatBytes(originalBase64Size)} → ${formatBytes(optimizedSize)}`)
          if (showToasts) {
            toast.success(`Imagem otimizada para melhor performance`)
          }
        }
        
        return optimizedBase64
      }
      
    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error)
      if (showToasts) {
        toast.error('Erro ao processar imagem. Tente novamente.')
      }
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  const clearCompressionInfo = () => {
    setCompressionInfo(null)
  }

  return {
    isProcessing,
    compressionInfo,
    compressImage,
    clearCompressionInfo
  }
}

// Utilitário para formatar bytes (exportado para uso externo)
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}