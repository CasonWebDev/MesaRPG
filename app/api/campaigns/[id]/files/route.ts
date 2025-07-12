import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, unlink } from 'fs/promises'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const UPLOAD_DIR = join(process.cwd(), 'public/uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.txt', '.md']

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id

    // Check if user has access to this campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: { where: { userId: session.user.id } }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const isGM = campaign.ownerId === session.user.id
    const isPlayer = campaign.members.length > 0

    if (!isGM && !isPlayer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get files for this campaign
    const files = await prisma.file.findMany({
      where: { campaignId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedFiles = files.map(file => ({
      id: file.id,
      name: file.name,
      originalName: file.originalName,
      url: file.url,
      type: file.type,
      size: file.size,
      category: file.category,
      uploadedAt: file.createdAt.toISOString(),
      uploadedBy: file.uploadedBy.name || 'Usuário'
    }))

    return NextResponse.json({ files: formattedFiles })

  } catch (error) {
    console.error('Error loading files:', error)
    return NextResponse.json(
      { error: 'Failed to load files' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id

    // Check if user has access to this campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        members: { where: { userId: session.user.id } }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const isGM = campaign.ownerId === session.user.id
    const isPlayer = campaign.members.length > 0

    if (!isGM && !isPlayer) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'misc'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large (maximum ${Math.floor(MAX_FILE_SIZE / 1024 / 1024)}MB)` 
      }, { status: 400 })
    }

    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ 
        error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}` 
      }, { status: 400 })
    }

    // Create directory if it doesn't exist
    const typeDir = join(UPLOAD_DIR, category)
    if (!existsSync(typeDir)) {
      mkdirSync(typeDir, { recursive: true })
    }

    // Generate unique filename
    const uniqueName = `${uuidv4()}${extension}`
    const filePath = join(typeDir, uniqueName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create public URL
    const publicUrl = `/uploads/${category}/${uniqueName}`

    // Save file metadata to database
    const fileRecord = await prisma.file.create({
      data: {
        name: uniqueName,
        originalName: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        category: category as any,
        campaignId,
        uploadedById: session.user.id
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      file: {
        id: fileRecord.id,
        name: fileRecord.name,
        originalName: fileRecord.originalName,
        url: fileRecord.url,
        type: fileRecord.type,
        size: fileRecord.size,
        category: fileRecord.category,
        uploadedAt: fileRecord.createdAt.toISOString(),
        uploadedBy: fileRecord.uploadedBy.name || 'Usuário'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const campaignId = params.id
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Check if user has access to this campaign
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const isGM = campaign.ownerId === session.user.id

    // Get file record
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check permissions: GM can delete any file, users can only delete their own files
    if (!isGM && file.uploadedById !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete physical file
    try {
      const filePath = join(process.cwd(), 'public', file.url)
      await unlink(filePath)
    } catch (error) {
      console.warn('Could not delete physical file:', error)
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}