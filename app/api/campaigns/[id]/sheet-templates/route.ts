import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CharacterType } from '@prisma/client'
import { nanoid } from 'nanoid'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const campaignId = params.id
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') as CharacterType | null

    // Verificar se o usuário pertence à campanha
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedCampaigns: {
          where: { id: campaignId }
        },
        campaignMemberships: {
          where: { campaignId },
          include: { campaign: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário tem acesso à campanha (como GM ou jogador)
    const hasAccess = user.ownedCampaigns.length > 0 || user.campaignMemberships.length > 0

    if (!hasAccess) {
      return NextResponse.json({ error: 'Acesso negado à campanha' }, { status: 403 })
    }

    // Buscar templates de fichas da campanha
    const whereClause: any = { campaignId }
    if (type) {
      whereClause.type = type
    }

    const rawTemplates = await prisma.sheetTemplate.findMany({
      where: whereClause,
      orderBy: [
        { isDefault: 'desc' }, // Templates padrão primeiro
        { createdAt: 'desc' }
      ]
    })

    // Parsear os campos JSON dos templates
    const templates = rawTemplates.map(template => {
      const parsedFields = typeof template.fields === 'string' ? JSON.parse(template.fields) : template.fields
      
      // Garantir que todos os campos tenham IDs únicos
      const fieldsWithIds = parsedFields.map((field: any) => {
        if (!field.id) {
          field.id = nanoid()
        }
        
        // Garantir que atributos tenham IDs únicos
        if (field.type === 'attributes' && field.attributes) {
          field.attributes = field.attributes.map((attr: any) => ({
            ...attr,
            id: attr.id || nanoid()
          }))
        }
        
        return field
      })
      
      return {
        ...template,
        fields: fieldsWithIds
      }
    })

    // Verificar se existe pelo menos um template para personagens jogáveis
    const hasPlayerTemplate = templates.some(template => 
      template.type === 'PC' && template.isDefault
    )

    return NextResponse.json({
      templates,
      hasPlayerTemplate,
      canCreateCharacter: hasPlayerTemplate
    })

  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const campaignId = params.id
    const { type, fields } = await req.json()

    if (!type || !fields) {
      return NextResponse.json({ error: 'Tipo e campos são obrigatórios' }, { status: 400 })
    }

    // Validar se o tipo é válido
    if (!Object.values(CharacterType).includes(type as CharacterType)) {
      return NextResponse.json({ error: 'Tipo de character inválido' }, { status: 400 })
    }

    // Verificar se o usuário é o GM da campanha
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedCampaigns: {
          where: { id: campaignId }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário é o GM da campanha
    if (user.ownedCampaigns.length === 0) {
      return NextResponse.json({ error: 'Apenas o GM pode criar templates' }, { status: 403 })
    }

    // Verificar se já existe um template padrão para este tipo
    const existingTemplate = await prisma.sheetTemplate.findFirst({
      where: {
        campaignId,
        type: type as CharacterType,
        isDefault: true
      }
    })

    // Gerar nome do template baseado no tipo
    const templateName = `Template ${type === 'PC' ? 'Personagem' : type === 'NPC' ? 'NPC' : 'Criatura'}`

    if (existingTemplate) {
      // Atualizar template existente
      const updatedTemplate = await prisma.sheetTemplate.update({
        where: { id: existingTemplate.id },
        data: {
          name: templateName,
          fields: JSON.stringify(fields),
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        ...updatedTemplate,
        fields: JSON.parse(updatedTemplate.fields)
      })
    } else {
      // Criar novo template
      const newTemplate = await prisma.sheetTemplate.create({
        data: {
          campaignId,
          name: templateName,
          type: type as CharacterType,
          fields: JSON.stringify(fields),
          isDefault: true
        }
      })

      return NextResponse.json({
        ...newTemplate,
        fields: JSON.parse(newTemplate.fields)
      })
    }

  } catch (error) {
    console.error('Erro ao criar/atualizar template:', error)
    
    // Log detalhado para debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}