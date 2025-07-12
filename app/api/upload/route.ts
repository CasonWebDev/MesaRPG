import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = join(process.cwd(), 'public/uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.txt', '.md']

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'map', 'token', 'avatar', 'handout'

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Arquivo muito grande (máximo 10MB)' }, { status: 400 })
    }

    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não permitido. Permitidos: ' + ALLOWED_EXTENSIONS.join(', ') 
      }, { status: 400 })
    }

    // Criar diretório se não existir
    const typeDir = join(UPLOAD_DIR, type || 'misc')
    if (!existsSync(typeDir)) {
      mkdirSync(typeDir, { recursive: true })
    }

    // Gerar nome único para o arquivo
    const uniqueName = `${uuidv4()}${extension}`
    const filePath = join(typeDir, uniqueName)

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Retornar URL pública
    const publicUrl = `/uploads/${type || 'misc'}/${uniqueName}`

    return NextResponse.json({ 
      url: publicUrl,
      name: file.name,
      size: file.size,
      type: file.type
    }, { status: 201 })

  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Upload API funcionando',
    maxSize: MAX_FILE_SIZE,
    allowedExtensions: ALLOWED_EXTENSIONS
  })
}