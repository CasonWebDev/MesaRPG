# Sistema de Gerenciamento de Arquivos

## Visão Geral

O sistema de gerenciamento de arquivos do MesaRPG oferece uma solução completa para upload, organização e compartilhamento de assets digitais. Suporta múltiplos formatos de arquivo, validação de segurança, organização por categorias e interface intuitiva para navegação.

## Funcionalidades Principais

### 1. Upload de Arquivos
- **Drag & Drop**: Interface moderna com arrastar e soltar
- **Multi-seleção**: Upload de múltiplos arquivos simultaneamente
- **Progress Tracking**: Indicador de progresso em tempo real
- **Validação**: Verificação de tipo, tamanho e segurança

### 2. Organização e Categorização
- **Categorias Automáticas**: Classificação por tipo de arquivo
- **Tags Personalizadas**: Sistema de etiquetas customizáveis
- **Busca Avançada**: Filtros por nome, tipo, tamanho e data
- **Estrutura de Pastas**: Organização hierárquica (futuro)

### 3. Visualização e Preview
- **Grid View**: Visualização em grade com thumbnails
- **List View**: Visualização em lista com detalhes
- **Preview Modal**: Visualização de arquivos sem download
- **Metadata**: Informações detalhadas do arquivo

### 4. Integração com Outras Funcionalidades
- **Mapas**: Upload direto para sistema de mapas
- **Tokens**: Criação de tokens a partir de imagens
- **Handouts**: Anexação de arquivos a documentos
- **Avatares**: Sistema de avatares para personagens

## Estrutura de Dados

### File Model (Prisma)
```prisma
model File {
  id           String   @id @default(cuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String
  thumbnailUrl String?
  category     String   // image, document, audio, video, other
  tags         String[] @default([])
  metadata     Json     @default("{}")
  isPublic     Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relacionamentos
  uploadedById String
  uploadedBy   User     @relation(fields: [uploadedById], references: [id], onDelete: Cascade)
  campaignId   String?
  campaign     Campaign? @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  
  @@index([campaignId, category])
  @@index([uploadedById])
}
```

## API de Upload

### 1. Upload de Arquivos
```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const campaignId = formData.get('campaignId') as string
    const category = formData.get('category') as string
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }
    
    const uploadedFiles = []
    
    for (const file of files) {
      // Validações
      const validation = validateFile(file)
      if (!validation.valid) {
        return NextResponse.json({ 
          error: `File ${file.name}: ${validation.error}` 
        }, { status: 400 })
      }
      
      // Gerar nome único
      const fileExtension = file.name.split('.').pop()
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
      
      // Definir diretório de upload
      const uploadDir = join(process.cwd(), 'public', 'uploads', 
        campaignId || 'global', 
        category || 'misc'
      )
      
      // Criar diretório se não existir
      await mkdir(uploadDir, { recursive: true })
      
      // Salvar arquivo
      const filePath = join(uploadDir, uniqueFilename)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      await writeFile(filePath, buffer)
      
      // Gerar thumbnail se for imagem
      let thumbnailUrl = null
      if (file.type.startsWith('image/')) {
        thumbnailUrl = await generateThumbnail(filePath, uploadDir, uniqueFilename)
      }
      
      // URL pública
      const publicUrl = `/uploads/${campaignId || 'global'}/${category || 'misc'}/${uniqueFilename}`
      
      // Salvar no banco de dados
      const fileRecord = await prisma.file.create({
        data: {
          filename: uniqueFilename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: publicUrl,
          thumbnailUrl,
          category: detectCategory(file.type),
          uploadedById: session.user.id,
          campaignId: campaignId || null,
          metadata: {
            uploadedAt: new Date().toISOString(),
            userAgent: request.headers.get('user-agent')
          }
        }
      })
      
      uploadedFiles.push(fileRecord)
    }
    
    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: "Upload failed" 
    }, { status: 500 })
  }
}

// Validação de arquivos
function validateFile(file: File): { valid: boolean, error?: string } {
  // Tamanho máximo: 50MB
  const MAX_SIZE = 50 * 1024 * 1024
  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File too large (max 50MB)" }
  }
  
  // Tipos permitidos
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'video/mp4', 'video/webm',
    'text/plain', 'text/markdown',
    'application/json'
  ]
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type not allowed" }
  }
  
  return { valid: true }
}

// Detectar categoria do arquivo
function detectCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf' || mimeType.startsWith('text/')) return 'document'
  return 'other'
}

// Gerar thumbnail para imagens
async function generateThumbnail(
  filePath: string, 
  uploadDir: string, 
  filename: string
): Promise<string> {
  try {
    const thumbnailFilename = `thumb_${filename}`
    const thumbnailPath = join(uploadDir, thumbnailFilename)
    
    await sharp(filePath)
      .resize(200, 200, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(thumbnailPath)
    
    return thumbnailPath.replace(join(process.cwd(), 'public'), '')
  } catch (error) {
    console.error('Thumbnail generation failed:', error)
    return null
  }
}
```

### 2. Listagem de Arquivos
```typescript
// GET /api/upload (ou /api/campaigns/[id]/files)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaignId')
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  
  try {
    const whereClause = {
      ...(campaignId && { campaignId }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { originalName: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ]
      }),
      // Verificar acesso
      OR: [
        { uploadedById: session.user.id },
        { isPublic: true },
        ...(campaignId ? [{
          campaign: {
            OR: [
              { ownerId: session.user.id },
              { members: { some: { userId: session.user.id } } }
            ]
          }
        }] : [])
      ]
    }
    
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: whereClause,
        include: {
          uploadedBy: {
            select: { id: true, name: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.file.count({ where: whereClause })
    ])
    
    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    console.error('File listing error:', error)
    return NextResponse.json({ 
      error: "Failed to list files" 
    }, { status: 500 })
  }
}
```

### 3. Exclusão de Arquivos
```typescript
// DELETE /api/upload/[fileId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  try {
    // Verificar se o usuário pode deletar o arquivo
    const file = await prisma.file.findFirst({
      where: {
        id: params.fileId,
        OR: [
          { uploadedById: session.user.id },
          { campaign: { ownerId: session.user.id } }
        ]
      }
    })
    
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
    
    // Deletar arquivo físico
    const filePath = join(process.cwd(), 'public', file.url)
    try {
      await unlink(filePath)
    } catch (error) {
      console.error('Failed to delete physical file:', error)
    }
    
    // Deletar thumbnail se existir
    if (file.thumbnailUrl) {
      const thumbnailPath = join(process.cwd(), 'public', file.thumbnailUrl)
      try {
        await unlink(thumbnailPath)
      } catch (error) {
        console.error('Failed to delete thumbnail:', error)
      }
    }
    
    // Deletar registro do banco
    await prisma.file.delete({
      where: { id: params.fileId }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json({ 
      error: "Failed to delete file" 
    }, { status: 500 })
  }
}
```

## Componentes de Interface

### 1. Gerenciador de Arquivos Principal
```typescript
// components/file-manager/file-manager.tsx
export function FileManager({ 
  campaignId, 
  category,
  onFileSelect,
  allowMultiple = false,
  mode = 'full' // 'full' | 'selector'
}: FileManagerProps) {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    search: '',
    category: category || '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [showUploadModal, setShowUploadModal] = useState(false)
  
  // Carregar arquivos
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (campaignId) params.append('campaignId', campaignId)
      if (filters.category) params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)
      params.append('sortBy', filters.sortBy)
      params.append('sortOrder', filters.sortOrder)
      
      const response = await fetch(`/api/upload?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }, [campaignId, filters])
  
  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])
  
  // Filtros disponíveis
  const categories = [
    { value: '', label: 'Todos' },
    { value: 'image', label: 'Imagens' },
    { value: 'document', label: 'Documentos' },
    { value: 'audio', label: 'Áudio' },
    { value: 'video', label: 'Vídeo' },
    { value: 'other', label: 'Outros' }
  ]
  
  const sortOptions = [
    { value: 'createdAt', label: 'Data de criação' },
    { value: 'originalName', label: 'Nome' },
    { value: 'size', label: 'Tamanho' }
  ]
  
  const handleFileSelect = (file: FileRecord) => {
    if (allowMultiple) {
      setSelectedFiles(prev => {
        const newSet = new Set(prev)
        if (newSet.has(file.id)) {
          newSet.delete(file.id)
        } else {
          newSet.add(file.id)
        }
        return newSet
      })
    } else {
      onFileSelect?.(file)
    }
  }
  
  const handleDelete = async (fileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) return
    
    try {
      const response = await fetch(`/api/upload/${fileId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== fileId))
        toast.success('Arquivo excluído com sucesso')
      } else {
        toast.error('Erro ao excluir arquivo')
      }
    } catch (error) {
      toast.error('Erro ao excluir arquivo')
    }
  }
  
  const selectedFileObjects = files.filter(f => selectedFiles.has(f.id))
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 p-4 border-b">
        {/* Título e ações */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Gerenciador de Arquivos
          </h2>
          
          <div className="flex items-center gap-2">
            {/* Seleção múltipla */}
            {allowMultiple && selectedFiles.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.size} selecionado(s)
                </span>
                <Button
                  size="sm"
                  onClick={() => onFileSelect?.(selectedFileObjects)}
                >
                  Usar Selecionados
                </Button>
              </div>
            )}
            
            {/* Modo de visualização */}
            <div className="flex border rounded">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Upload */}
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
        
        {/* Filtros */}
        <div className="flex gap-2">
          <Input
            placeholder="Buscar arquivos..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              search: e.target.value 
            }))}
            className="flex-1"
          />
          
          <Select
            value={filters.category}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              category: value 
            }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={filters.sortBy}
            onValueChange={(value) => setFilters(prev => ({ 
              ...prev, 
              sortBy: value 
            }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters(prev => ({ 
              ...prev, 
              sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
            }))}
          >
            {filters.sortOrder === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Conteúdo */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <FileManagerSkeleton viewMode={viewMode} />
        ) : files.length === 0 ? (
          <EmptyState onUpload={() => setShowUploadModal(true)} />
        ) : (
          <FileGrid
            files={files}
            viewMode={viewMode}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onFileDelete={handleDelete}
            allowSelection={!!onFileSelect}
          />
        )}
      </div>
      
      {/* Modal de upload */}
      {showUploadModal && (
        <FileUploadModal
          campaignId={campaignId}
          category={filters.category}
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={fetchFiles}
        />
      )}
    </div>
  )
}
```

### 2. Grid de Arquivos
```typescript
// components/file-manager/file-grid.tsx
export function FileGrid({
  files,
  viewMode,
  selectedFiles,
  onFileSelect,
  onFileDelete,
  allowSelection
}: FileGridProps) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {files.map(file => (
          <FileGridItem
            key={file.id}
            file={file}
            isSelected={selectedFiles.has(file.id)}
            onSelect={() => onFileSelect(file)}
            onDelete={() => onFileDelete(file.id)}
            allowSelection={allowSelection}
          />
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {files.map(file => (
        <FileListItem
          key={file.id}
          file={file}
          isSelected={selectedFiles.has(file.id)}
          onSelect={() => onFileSelect(file)}
          onDelete={() => onFileDelete(file.id)}
          allowSelection={allowSelection}
        />
      ))}
    </div>
  )
}

function FileGridItem({ 
  file, 
  isSelected, 
  onSelect, 
  onDelete, 
  allowSelection 
}: FileGridItemProps) {
  const [showPreview, setShowPreview] = useState(false)
  
  return (
    <>
      <div
        className={cn(
          "group relative border rounded-lg p-2 cursor-pointer hover:bg-muted/50 transition-colors",
          isSelected && "ring-2 ring-primary"
        )}
        onClick={allowSelection ? onSelect : () => setShowPreview(true)}
      >
        {/* Thumbnail */}
        <div className="aspect-square mb-2 bg-muted rounded overflow-hidden">
          {file.category === 'image' ? (
            <img
              src={file.thumbnailUrl || file.url}
              alt={file.originalName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileIcon type={file.mimeType} className="h-8 w-8" />
            </div>
          )}
        </div>
        
        {/* Nome */}
        <p className="text-sm font-medium truncate" title={file.originalName}>
          {file.originalName}
        </p>
        
        {/* Metadados */}
        <div className="text-xs text-muted-foreground">
          <p>{formatFileSize(file.size)}</p>
          <p>{formatDate(file.createdAt)}</p>
        </div>
        
        {/* Ações */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(file.url, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Checkbox para seleção */}
        {allowSelection && (
          <div className="absolute top-2 left-2">
            <Checkbox checked={isSelected} onChange={onSelect} />
          </div>
        )}
      </div>
      
      {/* Modal de preview */}
      {showPreview && (
        <FilePreviewModal
          file={file}
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}
```

### 3. Upload Component
```typescript
// components/file-manager/file-upload.tsx
export function FileUploadModal({
  campaignId,
  category,
  isOpen,
  onClose,
  onSuccess
}: FileUploadModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      setSelectedFiles(prev => [...prev, ...files])
    }
  }, [])
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...files])
    }
  }
  
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    
    setUploading(true)
    
    try {
      const formData = new FormData()
      
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })
      
      if (campaignId) formData.append('campaignId', campaignId)
      if (category) formData.append('category', category)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success(`${result.files.length} arquivo(s) enviado(s) com sucesso!`)
        onSuccess?.()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro no upload')
      }
    } catch (error) {
      toast.error('Erro no upload')
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Arquivos</DialogTitle>
          <DialogDescription>
            Faça upload de imagens, documentos e outros arquivos
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Área de drop */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-muted",
              "hover:border-primary hover:bg-primary/5"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </h3>
            <p className="text-sm text-muted-foreground">
              Suporte para imagens, PDFs, áudio e vídeo (máx. 50MB)
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,audio/*,video/*,.txt,.md"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          {/* Lista de arquivos selecionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">
                Arquivos selecionados ({selectedFiles.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileIcon type={file.type} className="h-4 w-4" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
          >
            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Utilitários e Helpers

### 1. File Icons
```typescript
// components/file-manager/file-icon.tsx
export function FileIcon({ 
  type, 
  className 
}: { 
  type: string
  className?: string 
}) {
  if (type.startsWith('image/')) {
    return <ImageIcon className={className} />
  }
  
  if (type === 'application/pdf') {
    return <FileText className={className} />
  }
  
  if (type.startsWith('audio/')) {
    return <Music className={className} />
  }
  
  if (type.startsWith('video/')) {
    return <Video className={className} />
  }
  
  if (type.startsWith('text/')) {
    return <FileText className={className} />
  }
  
  return <File className={className} />
}
```

### 2. File Utilities
```typescript
// lib/file-utils.ts
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

export function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith('audio/')
}

export function isDocumentFile(mimeType: string): boolean {
  return mimeType === 'application/pdf' || 
         mimeType.startsWith('text/') ||
         mimeType.includes('document')
}
```

## Integração com Outras Funcionalidades

### 1. Integração com Mapas
```typescript
// Hook para usar com mapas
export function useMapFileSelector() {
  const [showFileManager, setShowFileManager] = useState(false)
  
  const selectMapImage = (onSelect: (file: FileRecord) => void) => {
    return (
      <FileManager
        category="image"
        mode="selector"
        onFileSelect={(file) => {
          onSelect(file)
          setShowFileManager(false)
        }}
      />
    )
  }
  
  return {
    showFileManager,
    setShowFileManager,
    selectMapImage
  }
}
```

### 2. Integração com Tokens
```typescript
// Seletor de avatar para tokens
export function TokenAvatarSelector({ 
  onSelect 
}: { 
  onSelect: (url: string) => void 
}) {
  return (
    <FileManager
      category="image"
      mode="selector"
      onFileSelect={(file) => onSelect(file.url)}
    />
  )
}
```

## Segurança e Validação

### 1. Validação de Tipos MIME
```typescript
const SAFE_MIME_TYPES = [
  // Imagens
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Documentos
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  
  // Mídia
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/ogg',
  
  // Outros
  'application/json'
]

export function validateMimeType(mimeType: string): boolean {
  return SAFE_MIME_TYPES.includes(mimeType)
}
```

### 2. Sanitização de Nomes
```typescript
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}
```

### 3. Verificação de Vírus (futuro)
```typescript
// Integração com ClamAV ou similar
export async function scanFile(filePath: string): Promise<boolean> {
  // Implementação de scan de vírus
  return true // Safe
}
```

## Próximos Passos

### Melhorias Futuras
- [ ] Sistema de pastas hierárquico
- [ ] Compartilhamento de arquivos por link
- [ ] Compressão automática de imagens
- [ ] Suporte a mais formatos de arquivo
- [ ] Sistema de versioning de arquivos
- [ ] Backup automático para cloud storage
- [ ] CDN integration para performance
- [ ] Watermark automático em imagens

### Funcionalidades Avançadas
- [ ] Editor de imagem integrado
- [ ] Conversão de formatos
- [ ] Galeria de assets públicos
- [ ] Sistema de favoritos
- [ ] Tags automáticas com AI
- [ ] Detecção de conteúdo duplicado
- [ ] Análise de uso de storage
- [ ] Limpeza automática de arquivos órfãos