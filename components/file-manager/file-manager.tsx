"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  Search, 
  Filter, 
  Image, 
  FileText, 
  Download, 
  Trash2,
  Eye,
  Grid,
  List,
  FolderOpen,
  File
} from "lucide-react"
import { useDropzone } from 'react-dropzone'

interface FileItem {
  id: string
  name: string
  originalName: string
  url: string
  type: string
  size: number
  category: 'map' | 'token' | 'avatar' | 'handout' | 'misc'
  uploadedAt: string
  uploadedBy: string
}

interface FileManagerProps {
  campaignId?: string
  onFileSelect?: (file: FileItem) => void
  allowedTypes?: string[]
  maxFileSize?: number
  multiple?: boolean
  category?: 'map' | 'token' | 'avatar' | 'handout' | 'misc'
}

export function FileManager({ 
  campaignId, 
  onFileSelect, 
  allowedTypes = ['image/*', 'application/pdf', 'text/*'],
  maxFileSize = 10 * 1024 * 1024, // 10MB
  multiple = false,
  category = 'misc'
}: FileManagerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [campaignId])

  useEffect(() => {
    let filtered = files

    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(file => file.category === selectedCategory)
    }

    setFilteredFiles(filtered)
  }, [files, searchTerm, selectedCategory])

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      // Mock data - in a real app, this would load from API
      const mockFiles: FileItem[] = [
        {
          id: '1',
          name: 'dungeon-map.jpg',
          originalName: 'Mapa da Masmorra.jpg',
          url: '/placeholder.svg?width=800&height=600',
          type: 'image/jpeg',
          size: 2048000,
          category: 'map',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Mestre'
        },
        {
          id: '2',
          name: 'orc-token.png',
          originalName: 'Token Orc.png',
          url: '/placeholder.svg?width=200&height=200',
          type: 'image/png',
          size: 512000,
          category: 'token',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Mestre'
        },
        {
          id: '3',
          name: 'rules-reference.pdf',
          originalName: 'Referência de Regras.pdf',
          url: '/placeholder.pdf',
          type: 'application/pdf',
          size: 1024000,
          category: 'handout',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Mestre'
        }
      ]
      
      setFiles(mockFiles)
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true)
    setUploadProgress(0)

    try {
      for (const file of acceptedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', category)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const uploadedFile = await response.json()
          
          const newFile: FileItem = {
            id: Date.now().toString(),
            name: file.name,
            originalName: file.name,
            url: uploadedFile.url,
            type: file.type,
            size: file.size,
            category: category,
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'Usuário Atual'
          }
          
          setFiles(prev => [newFile, ...prev])
          setUploadProgress(100)
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setIsUploadDialogOpen(false)
    }
  }, [category])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    multiple
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'map': return <FolderOpen className="h-4 w-4" />
      case 'token': return <Image className="h-4 w-4" />
      case 'avatar': return <Image className="h-4 w-4" />
      case 'handout': return <FileText className="h-4 w-4" />
      default: return <File className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'map': return 'Mapas'
      case 'token': return 'Tokens'
      case 'avatar': return 'Avatares'
      case 'handout': return 'Documentos'
      default: return 'Outros'
    }
  }

  const handleFileSelect = (file: FileItem) => {
    if (onFileSelect) {
      onFileSelect(file)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) {
      return
    }

    try {
      // In a real app, this would call a delete API
      setFiles(prev => prev.filter(f => f.id !== fileId))
    } catch (error) {
      console.error('Error deleting file:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando arquivos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciador de Arquivos</h2>
          <p className="text-muted-foreground">
            Faça upload e gerencie seus arquivos de campanha
          </p>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload de Arquivos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p>Solte os arquivos aqui...</p>
                ) : (
                  <div>
                    <p className="mb-2">Arraste arquivos aqui ou clique para selecionar</p>
                    <p className="text-sm text-muted-foreground">
                      Máximo {formatFileSize(maxFileSize)}
                    </p>
                  </div>
                )}
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fazendo upload...</span>
                    <span className="text-sm">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar arquivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48 bg-stone-50/50">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="map">Mapas</SelectItem>
            <SelectItem value="token">Tokens</SelectItem>
            <SelectItem value="avatar">Avatares</SelectItem>
            <SelectItem value="handout">Documentos</SelectItem>
            <SelectItem value="misc">Outros</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum arquivo encontrado' : 'Nenhum arquivo ainda'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
            : 'space-y-2'
        }>
          {filteredFiles.map(file => (
            <Card 
              key={file.id} 
              className={`hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'cursor-pointer' : ''
              }`}
              onClick={() => viewMode === 'list' && handleFileSelect(file)}
            >
              {viewMode === 'grid' ? (
                <div>
                  <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <img 
                        src={file.url} 
                        alt={file.originalName}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="text-center">
                        {getFileIcon(file.type)}
                        <p className="text-xs mt-2 text-muted-foreground">
                          {file.type.split('/')[1]?.toUpperCase()}
                        </p>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(file.category)}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleFileSelect(file)
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFile(file.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </div>
              ) : (
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div>
                        <p className="font-medium">{file.originalName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(file.size)} • {getCategoryLabel(file.category)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFile(file.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}