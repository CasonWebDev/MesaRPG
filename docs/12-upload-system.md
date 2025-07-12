# Sistema de Upload de Arquivos

## Visão Geral

O sistema de upload do MesaRPG oferece uma solução completa para gerenciamento de arquivos na plataforma, incluindo upload com drag & drop, compressão automática de imagens, categorização de arquivos e integração com todos os componentes do sistema. Prioriza a experiência do usuário e a prevenção de problemas de performance relacionados a arquivos grandes.

## Funcionalidades Principais

### 📁 Gerenciador de Arquivos Completo

#### Interface Principal
- **Visualização em Grid**: Thumbnails com preview visual
- **Visualização em Lista**: Detalhes compactos com informações técnicas
- **Sistema de Busca**: Filtro por nome, tipo ou data
- **Categorização**: Organização automática por tipo de arquivo
- **Seleção Múltipla**: Upload e gerenciamento em lote

#### Características da Interface
```typescript
// components/file-manager/file-manager.tsx
export function FileManager({ 
  campaignId, 
  onFileSelect, 
  allowMultiple = false,
  acceptedTypes = ["image/*", "application/pdf", "text/*"] 
}: FileManagerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [files, setFiles] = useState<FileData[]>([])
  
  // Estados de interface responsiva
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
}
```

### 🖼️ Sistema de Compressão Inteligente

#### Hook de Compressão Universal
```typescript
// hooks/use-image-compression.ts
export function useImageCompression() {
  const compressImage = useCallback(async (
    file: File,
    options: {
      maxWidth?: number
      maxHeight?: number  
      quality?: number
      maxSizeKB?: number
    } = {}
  ): Promise<{
    compressedFile: File
    originalSize: number
    compressedSize: number
    compressionRatio: number
  }> => {
    const {
      maxWidth = 800,
      maxHeight = 600,
      quality = 0.8,
      maxSizeKB = 500
    } = options

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calcular dimensões mantendo aspect ratio
        let { width, height } = img
        const aspectRatio = width / height
        
        if (width > maxWidth) {
          width = maxWidth
          height = width / aspectRatio
        }
        
        if (height > maxHeight) {
          height = maxHeight
          width = height * aspectRatio
        }
        
        canvas.width = width
        canvas.height = height
        
        // Renderizar imagem comprimida
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Falha na compressão'))
              return
            }
            
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            
            const originalSize = file.size
            const compressedSize = compressedFile.size
            const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100)
            
            resolve({
              compressedFile,
              originalSize,
              compressedSize,
              compressionRatio
            })
          },
          file.type,
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Erro ao carregar imagem'))
      img.src = URL.createObjectURL(file)
    })
  }, [])
  
  return { compressImage }
}
```

#### Compressão Automática
- **Detecção Inteligente**: Identifica automaticamente imagens que precisam ser comprimidas
- **Múltiplos Algoritmos**: Canvas-based compression para máxima compatibilidade
- **Qualidade Adaptativa**: Ajusta qualidade baseado no tamanho original
- **Feedback Visual**: Mostra progress e estatísticas de compressão
- **Prevenção de WebSocket Issues**: Evita disconnections por arquivos grandes

### 🎯 Upload com Drag & Drop

#### Interface Intuitiva
```typescript
// components/file-manager/file-upload.tsx
export function FileUpload({ 
  campaignId, 
  onUploadComplete, 
  acceptedTypes,
  maxFileSize = 10 * 1024 * 1024 // 10MB default
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const { compressImage } = useImageCompression()
  
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer?.files || [])
    await processFiles(files)
  }
  
  const processFiles = async (files: File[]) => {
    setUploading(true)
    
    for (const file of files) {
      try {
        let finalFile = file
        
        // Compressão automática para imagens
        if (file.type.startsWith('image/') && file.size > 500 * 1024) {
          const compressed = await compressImage(file, {
            maxWidth: 1200,
            maxHeight: 900,
            quality: 0.8,
            maxSizeKB: 500
          })
          
          finalFile = compressed.compressedFile
          
          toast.success(
            `Imagem comprimida: ${compressed.compressionRatio}% de redução`
          )
        }
        
        await uploadFile(finalFile)
      } catch (error) {
        console.error('Upload failed:', error)
        toast.error(`Erro no upload: ${file.name}`)
      }
    }
    
    setUploading(false)
  }
}
```

#### Características do Upload
- **Drag & Drop Visual**: Zona de drop com feedback visual claro
- **Progress Tracking**: Barra de progresso individual por arquivo
- **Validação Client-Side**: Verificação de tipo e tamanho antes do upload
- **Batch Processing**: Upload simultâneo de múltiplos arquivos
- **Error Handling**: Feedback detalhado de erros com retry automático

### 🔧 API de Upload Robusta

#### Endpoint Principal
```typescript
// app/api/upload/route.ts
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const campaignId = formData.get('campaignId') as string
    const category = formData.get('category') as string || 'general'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validação de tamanho e tipo
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Max size is 10MB' }, 
        { status: 400 }
      )
    }

    // Validação de tipos permitidos
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/markdown'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' }, 
        { status: 400 }
      )
    }

    // Verificar acesso à campanha
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found or access denied' }, 
        { status: 403 }
      )
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${extension}`
    
    // Salvar arquivo no sistema de arquivos
    const uploadDir = path.join(process.cwd(), 'public/uploads', campaignId)
    await fs.mkdir(uploadDir, { recursive: true })
    
    const filePath = path.join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    await fs.writeFile(filePath, Buffer.from(bytes))
    
    // Salvar referência no banco de dados
    const fileRecord = await prisma.file.create({
      data: {
        name: file.name,
        fileName: fileName,
        filePath: `/uploads/${campaignId}/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        category: category,
        campaignId: campaignId,
        uploadedById: session.user.id
      }
    })

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        name: fileRecord.name,
        url: fileRecord.filePath,
        size: fileRecord.fileSize,
        type: fileRecord.mimeType,
        category: fileRecord.category,
        uploadedAt: fileRecord.createdAt
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' }, 
      { status: 500 }
    )
  }
}
```

#### Características da API
- **Autenticação Robusta**: Verificação de sessão e acesso à campanha
- **Validação Completa**: Tipo, tamanho e permissões
- **Armazenamento Seguro**: Estrutura organizada por campanha
- **Metadados Completos**: Tracking de upload, categoria e usuário
- **Error Handling**: Respostas padronizadas com códigos HTTP apropriados

### 📊 Categorização e Organização

#### Sistema de Categorias
```typescript
// Categorias automáticas baseadas no tipo MIME
const getCategoryFromMimeType = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'images'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf') return 'documents'
  if (mimeType.startsWith('text/')) return 'documents'
  return 'general'
}

// Interface de filtros
const CategoryFilter = ({ 
  selectedCategory, 
  onCategoryChange, 
  fileCounts 
}: CategoryFilterProps) => {
  const categories = [
    { id: 'all', name: 'Todos', count: fileCounts.total },
    { id: 'images', name: 'Imagens', count: fileCounts.images },
    { id: 'documents', name: 'Documentos', count: fileCounts.documents },
    { id: 'audio', name: 'Áudio', count: fileCounts.audio },
    { id: 'video', name: 'Vídeo', count: fileCounts.video },
    { id: 'general', name: 'Outros', count: fileCounts.general }
  ]
  
  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      {categories.map(category => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selectedCategory === category.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {category.name} ({category.count})
        </button>
      ))}
    </div>
  )
}
```

#### Organização Visual
- **Filtros Dinâmicos**: Contadores em tempo real por categoria
- **Tags Visuais**: Indicadores coloridos por tipo de arquivo
- **Busca Inteligente**: Pesquisa por nome, tipo ou metadados
- **Ordenação Flexível**: Por data, nome, tamanho ou tipo

### 🎨 Integração com Componentes

#### Avatares de Personagens
```typescript
// Integração com compressão em character creation
const handleAvatarUpload = async (file: File) => {
  try {
    setIsCompressing(true)
    
    const { compressedFile, compressionRatio } = await compressImage(file, {
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.8,
      maxSizeKB: 200
    })
    
    // Converter para base64 para armazenamento no character data
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      updateCharacterData(fieldName, base64String)
      
      if (compressionRatio > 10) {
        toast.success(`Avatar otimizado: ${compressionRatio}% menor`)
      }
    }
    reader.readAsDataURL(compressedFile)
    
  } catch (error) {
    console.error('Compression failed:', error)
    toast.error('Erro ao otimizar imagem')
  } finally {
    setIsCompressing(false)
  }
}
```

#### Handouts e Documentos
```typescript
// Upload de anexos para handouts
const handleAttachmentUpload = async (files: File[]) => {
  const attachments = []
  
  for (const file of files) {
    try {
      let processedFile = file
      
      // Compressão para imagens anexadas
      if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
        const compressed = await compressImage(file)
        processedFile = compressed.compressedFile
      }
      
      const formData = new FormData()
      formData.append('file', processedFile)
      formData.append('campaignId', campaignId)
      formData.append('category', 'handout-attachments')
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        attachments.push(result.file)
      }
      
    } catch (error) {
      console.error('Attachment upload failed:', error)
      toast.error(`Erro no upload: ${file.name}`)
    }
  }
  
  return attachments
}
```

#### Mapas de Campanha
```typescript
// Upload otimizado para mapas
const handleMapUpload = async (file: File) => {
  try {
    setUploading(true)
    
    let mapFile = file
    
    // Compressão específica para mapas (maior qualidade)
    if (file.type.startsWith('image/')) {
      const compressed = await compressImage(file, {
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.9,
        maxSizeKB: 2048 // 2MB para mapas
      })
      
      mapFile = compressed.compressedFile
      
      if (compressed.compressionRatio > 5) {
        toast.success(`Mapa otimizado: ${compressed.compressionRatio}% de redução`)
      }
    }
    
    const formData = new FormData()
    formData.append('file', mapFile)
    formData.append('campaignId', campaignId)
    formData.append('category', 'maps')
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (response.ok) {
      const result = await response.json()
      await createMap({
        name: file.name.replace(/\.[^/.]+$/, ''),
        imageUrl: result.file.url,
        campaignId
      })
    }
    
  } catch (error) {
    console.error('Map upload failed:', error)
    toast.error('Erro no upload do mapa')
  } finally {
    setUploading(false)
  }
}
```

## Estrutura de Dados

### Schema do Banco
```prisma
model File {
  id            String   @id @default(cuid())
  name          String   // Nome original do arquivo
  fileName      String   // Nome único no sistema
  filePath      String   // Caminho relativo ao arquivo
  fileSize      Int      // Tamanho em bytes
  mimeType      String   // Tipo MIME
  category      String   // Categoria (images, documents, etc.)
  
  campaign      Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  campaignId    String
  
  uploadedBy    User     @relation(fields: [uploadedById], references: [id])
  uploadedById  String
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("files")
}
```

### Interface TypeScript
```typescript
interface FileData {
  id: string
  name: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  category: string
  campaignId: string
  uploadedById: string
  createdAt: Date
  updatedAt: Date
  
  // Computed properties
  url: string
  sizeFormatted: string
  typeIcon: string
  isImage: boolean
  isDocument: boolean
  canPreview: boolean
}

interface UploadProgress {
  fileId: string
  fileName: string
  progress: number
  status: 'uploading' | 'compressing' | 'completed' | 'error'
  error?: string
}

interface CompressionResult {
  compressedFile: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  metadata: {
    originalDimensions?: { width: number; height: number }
    compressedDimensions?: { width: number; height: number }
    quality: number
  }
}
```

## Performance e Otimizações

### ⚡ Otimizações Implementadas

#### Compressão Inteligente
- **Detecção Automática**: Apenas imagens > 500KB são comprimidas
- **Qualidade Adaptativa**: Ajuste baseado no tamanho original
- **Preservação de Metadados**: Manutenção de EXIF quando necessário
- **Feedback em Tempo Real**: Progress e estatísticas durante o processo

#### Upload Eficiente
- **Chunk Upload**: Para arquivos grandes (futuro)
- **Retry Logic**: Tentativas automáticas em caso de falha
- **Validation Client-Side**: Reduz requests desnecessários
- **Progress Tracking**: Feedback detalhado para o usuário

#### Cache e Storage
```typescript
// Estratégia de cache para thumbnails
const generateThumbnail = async (file: FileData): Promise<string> => {
  const cacheKey = `thumb_${file.id}_${file.updatedAt.getTime()}`
  
  // Verificar cache local
  const cached = localStorage.getItem(cacheKey)
  if (cached) return cached
  
  if (file.isImage) {
    // Gerar thumbnail via canvas
    const thumbnail = await createImageThumbnail(file.url, {
      width: 150,
      height: 150,
      quality: 0.7
    })
    
    // Armazenar no cache
    localStorage.setItem(cacheKey, thumbnail)
    return thumbnail
  }
  
  return getDefaultIcon(file.mimeType)
}

// Limpeza de cache automática
const cleanOldCache = () => {
  const keys = Object.keys(localStorage)
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  
  keys.forEach(key => {
    if (key.startsWith('thumb_')) {
      const timestamp = parseInt(key.split('_')[2])
      if (timestamp < oneWeekAgo) {
        localStorage.removeItem(key)
      }
    }
  })
}
```

### 🔧 Configurações de Performance

#### Limites e Validações
```typescript
const UPLOAD_LIMITS = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerBatch: 10,
  allowedMimeTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'text/plain', 'text/markdown', 'text/csv',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  compressionThreshold: 500 * 1024, // 500KB
  compressionSettings: {
    avatar: { maxWidth: 400, maxHeight: 400, quality: 0.8, maxSizeKB: 200 },
    map: { maxWidth: 2048, maxHeight: 2048, quality: 0.9, maxSizeKB: 2048 },
    general: { maxWidth: 1200, maxHeight: 900, quality: 0.8, maxSizeKB: 500 }
  }
}
```

## Casos de Uso Avançados

### 🎮 Fluxos de Trabalho Típicos

#### 1. Upload de Avatar de Personagem
1. **Seleção**: Usuário seleciona imagem via file picker ou drag & drop
2. **Validação**: Verificação de tipo (image/*) e tamanho
3. **Compressão**: Otimização automática para 400x400px, qualidade 0.8
4. **Conversão**: Transform para base64 para armazenamento no character data
5. **Feedback**: Toast notification com estatísticas de compressão
6. **Persistência**: Salvo diretamente no campo da ficha

#### 2. Upload de Mapa de Campanha
1. **Interface**: Acesso via modal de criação de mapas
2. **Compressão**: Otimização específica para mapas (2048x2048px, qualidade 0.9)
3. **Upload**: Envio para servidor com categoria 'maps'
4. **Registro**: Criação de entry no banco com metadados
5. **Integração**: Disponibilidade imediata na lista de mapas

#### 3. Anexos de Handouts
1. **Seleção Múltipla**: Usuário pode anexar vários arquivos
2. **Processamento**: Compressão automática para imagens
3. **Upload Batch**: Processamento paralelo de múltiplos arquivos
4. **Vinculação**: Associação automática ao handout
5. **Preview**: Thumbnails e links de download disponíveis

### 🔄 Integração com Outros Sistemas

#### WebSocket Notifications
```typescript
// Notificações de upload via WebSocket
socket.on('file:uploaded', (data: {
  fileId: string
  fileName: string
  category: string
  uploadedBy: string
  campaignId: string
}) => {
  // Atualizar lista de arquivos em tempo real
  setFiles(prev => [...prev, data])
  
  // Toast notification para outros usuários
  if (data.uploadedBy !== currentUserId) {
    toast.info(`${data.fileName} foi adicionado por ${data.uploadedBy}`)
  }
})

// Progress sharing para uploads colaborativos
socket.on('upload:progress', (data: {
  fileId: string
  progress: number
  userId: string
}) => {
  setSharedProgress(prev => ({
    ...prev,
    [data.fileId]: data.progress
  }))
})
```

#### Chat Integration
```typescript
// Comando de upload via chat
const handleChatFileUpload = async (files: File[]) => {
  for (const file of files) {
    // Upload do arquivo
    const uploadResult = await uploadFile(file)
    
    // Enviar mensagem no chat com link
    const chatMessage = {
      type: 'file',
      content: `📎 ${file.name}`,
      attachment: {
        id: uploadResult.id,
        url: uploadResult.url,
        name: uploadResult.name,
        size: uploadResult.size
      }
    }
    
    socket.emit('chat:send', {
      campaignId,
      message: chatMessage
    })
  }
}
```

## Troubleshooting

### 🐛 Problemas Comuns

#### Upload Failures
```typescript
// Sistema de retry automático
const uploadWithRetry = async (file: File, maxRetries = 3): Promise<UploadResult> => {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFile(file)
    } catch (error) {
      lastError = error as Error
      console.warn(`Upload attempt ${attempt} failed:`, error)
      
      if (attempt < maxRetries) {
        // Backoff exponencial
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}
```

#### Compression Issues
```typescript
// Fallback para compressão
const safeCompression = async (file: File): Promise<File> => {
  try {
    const compressed = await compressImage(file)
    return compressed.compressedFile
  } catch (error) {
    console.warn('Compression failed, using original file:', error)
    
    // Se compressão falhar, usar arquivo original
    if (file.size > UPLOAD_LIMITS.maxFileSize) {
      throw new Error('File too large and compression failed')
    }
    
    return file
  }
}
```

#### Memory Management
```typescript
// Limpeza de objetos URL para prevenir memory leaks
const cleanupFileReferences = (fileList: File[]) => {
  fileList.forEach(file => {
    if (file instanceof File && file.stream) {
      // Cleanup de streams se necessário
      URL.revokeObjectURL(URL.createObjectURL(file))
    }
  })
}

// Monitoring de uso de memória
const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memInfo = (performance as any).memory
    console.log('Memory usage:', {
      used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
      limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    })
  }
}
```

### 🔧 Debug Tools

#### Console Logging
```typescript
// Debug detalhado para desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.group('🔧 File Upload Debug')
  console.log('Original file:', {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: new Date(file.lastModified)
  })
  
  if (compressed) {
    console.log('Compression result:', {
      originalSize: compressed.originalSize,
      compressedSize: compressed.compressedSize,
      ratio: compressed.compressionRatio,
      dimensions: compressed.metadata
    })
  }
  
  console.log('Upload result:', uploadResult)
  console.groupEnd()
}
```

#### Performance Monitoring
```typescript
// Tracking de performance de upload
const trackUploadPerformance = (file: File, startTime: number) => {
  const duration = Date.now() - startTime
  const speed = file.size / duration * 1000 // bytes per second
  
  console.log('📊 Upload Performance:', {
    file: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    duration: `${duration}ms`,
    speed: `${(speed / 1024 / 1024).toFixed(2)}MB/s`
  })
}
```

O sistema de upload do MesaRPG oferece uma experiência completa e otimizada para gerenciamento de arquivos, combinando facilidade de uso com performance e funcionalidades avançadas de compressão e organização.