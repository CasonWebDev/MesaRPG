"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, X, File, Image, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { useDropzone } from 'react-dropzone'

interface FileUploadProps {
  onUploadComplete: (fileUrl: string) => void
  onUploadError?: (error: string) => void
  category?: 'map' | 'token' | 'avatar' | 'handout' | 'misc'
  acceptedTypes?: string[]
  maxFileSize?: number
  multiple?: boolean
  disabled?: boolean
  placeholder?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
  url?: string
  error?: string
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  category = 'misc',
  acceptedTypes = ['image/*', 'application/pdf', 'text/*'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  disabled = false,
  placeholder = "Arraste arquivos aqui ou clique para selecionar"
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return

    setIsUploading(true)
    
    const initialFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }))
    
    setUploadingFiles(initialFiles)

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', category)

        try {
          // Simulate progress
          const progressInterval = setInterval(() => {
            setUploadingFiles(prev => prev.map((uf, index) => 
              index === i ? { ...uf, progress: Math.min(uf.progress + 10, 90) } : uf
            ))
          }, 100)

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          clearInterval(progressInterval)

          if (response.ok) {
            const uploadedFile = await response.json()
            
            setUploadingFiles(prev => prev.map((uf, index) => 
              index === i ? { 
                ...uf, 
                progress: 100, 
                status: 'success',
                url: uploadedFile.url 
              } : uf
            ))
            
            onUploadComplete(uploadedFile.url)
          } else {
            const error = await response.json()
            throw new Error(error.error || 'Upload failed')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed'
          
          setUploadingFiles(prev => prev.map((uf, index) => 
            index === i ? { 
              ...uf, 
              progress: 0, 
              status: 'error',
              error: errorMessage 
            } : uf
          ))
          
          if (onUploadError) {
            onUploadError(errorMessage)
          }
        }
      }
    } finally {
      setIsUploading(false)
      
      // Clear completed/error files after delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(uf => uf.status === 'uploading'))
      }, 3000)
    }
  }, [category, disabled, onUploadComplete, onUploadError])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    multiple,
    disabled
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (type === 'application/pdf') return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/10' 
            : disabled
            ? 'border-muted-foreground/25 bg-muted/50 cursor-not-allowed'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`h-12 w-12 mx-auto mb-4 ${disabled ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
        {isDragActive ? (
          <p>Solte os arquivos aqui...</p>
        ) : (
          <div>
            <p className="mb-2">{placeholder}</p>
            <p className="text-sm text-muted-foreground">
              Máximo {formatFileSize(maxFileSize)}
            </p>
            {acceptedTypes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1 justify-center">
                {acceptedTypes.map(type => (
                  <Badge key={type} variant="secondary" className="text-xs">
                    {type.replace('/*', '')}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <Card key={file.name} className="border-destructive">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-destructive">
                      {errors.map(e => e.message).join(', ')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile, index) => (
            <Card key={index} className={
              uploadingFile.status === 'error' 
                ? 'border-destructive' 
                : uploadingFile.status === 'success'
                ? 'border-green-500'
                : ''
            }>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {getFileIcon(uploadingFile.file.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{uploadingFile.file.name}</p>
                      <div className="flex items-center gap-2">
                        {uploadingFile.status === 'success' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {uploadingFile.status === 'error' && (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadingFile.file.size)}
                      </p>
                      {uploadingFile.status === 'uploading' && (
                        <span className="text-xs text-muted-foreground">
                          {uploadingFile.progress}%
                        </span>
                      )}
                    </div>
                    {uploadingFile.status === 'uploading' && (
                      <Progress value={uploadingFile.progress} className="mt-2" />
                    )}
                    {uploadingFile.status === 'error' && (
                      <p className="text-xs text-destructive mt-1">
                        {uploadingFile.error}
                      </p>
                    )}
                    {uploadingFile.status === 'success' && (
                      <p className="text-xs text-green-600 mt-1">
                        Upload concluído!
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}