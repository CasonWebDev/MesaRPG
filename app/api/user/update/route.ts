import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres").optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Buscar usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true, password: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    // Verificar se email já existe (se foi alterado)
    if (validatedData.email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Email já está em uso" },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      name: validatedData.name,
      email: validatedData.email,
    }

    // Validar e atualizar senha se fornecida
    if (validatedData.newPassword) {
      if (!validatedData.currentPassword) {
        return NextResponse.json(
          { error: "Senha atual é obrigatória para alterar a senha" },
          { status: 400 }
        )
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(
        validatedData.currentPassword,
        currentUser.password
      )

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Senha atual incorreta" },
          { status: 400 }
        )
      }

      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, 12)
      updateData.password = hashedNewPassword
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    return NextResponse.json({
      message: "Perfil atualizado com sucesso",
      user: updatedUser
    })

  } catch (error) {
    console.error("Erro ao atualizar perfil:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}