import { TemplateField } from "@/types/sheet-template"

export interface FieldValidationResult {
  isValid: boolean
  error?: string
}

export function validateField(field: TemplateField, value: any): FieldValidationResult {
  // Verificar se o campo é obrigatório
  if (field.required && (value === undefined || value === null || value === '')) {
    return {
      isValid: false,
      error: `${field.name} é obrigatório`
    }
  }

  // Se o valor está vazio e não é obrigatório, é válido
  if (value === undefined || value === null || value === '') {
    return { isValid: true }
  }

  // Validações específicas por tipo
  switch (field.type) {
    case 'text':
      return validateTextField(field, value)
    
    case 'textarea':
      return validateTextareaField(field, value)
    
    case 'number':
      return validateNumberField(field, value)
    
    case 'boolean':
      return validateBooleanField(field, value)
    
    case 'image':
      return validateImageField(field, value)
    
    case 'select':
      return validateSelectField(field, value)
    
    case 'attributes':
      return validateAttributesField(field, value)
    
    default:
      return { isValid: true }
  }
}

function validateTextField(field: TemplateField, value: string): FieldValidationResult {
  if (typeof value !== 'string') {
    return {
      isValid: false,
      error: `${field.name} deve ser um texto`
    }
  }

  if (value.length > 255) {
    return {
      isValid: false,
      error: `${field.name} não pode ter mais de 255 caracteres`
    }
  }

  return { isValid: true }
}

function validateTextareaField(field: TemplateField, value: string): FieldValidationResult {
  if (typeof value !== 'string') {
    return {
      isValid: false,
      error: `${field.name} deve ser um texto`
    }
  }

  if (value.length > 10000) {
    return {
      isValid: false,
      error: `${field.name} não pode ter mais de 10.000 caracteres`
    }
  }

  return { isValid: true }
}

function validateNumberField(field: TemplateField, value: number): FieldValidationResult {
  const numValue = Number(value)
  
  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: `${field.name} deve ser um número válido`
    }
  }

  // Verificar valor mínimo
  if (field.options?.[0] && numValue < Number(field.options[0])) {
    return {
      isValid: false,
      error: `${field.name} deve ser maior ou igual a ${field.options[0]}`
    }
  }

  // Verificar valor máximo
  if (field.options?.[1] && numValue > Number(field.options[1])) {
    return {
      isValid: false,
      error: `${field.name} deve ser menor ou igual a ${field.options[1]}`
    }
  }

  return { isValid: true }
}

function validateBooleanField(field: TemplateField, value: boolean): FieldValidationResult {
  if (typeof value !== 'boolean') {
    return {
      isValid: false,
      error: `${field.name} deve ser verdadeiro ou falso`
    }
  }

  return { isValid: true }
}

function validateImageField(field: TemplateField, value: string): FieldValidationResult {
  if (typeof value !== 'string') {
    return {
      isValid: false,
      error: `${field.name} deve ser uma URL válida`
    }
  }

  // Verificar se é uma URL válida
  try {
    new URL(value)
  } catch {
    return {
      isValid: false,
      error: `${field.name} deve ser uma URL válida`
    }
  }

  // Verificar se é uma imagem
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const hasValidExtension = imageExtensions.some(ext => 
    value.toLowerCase().includes(ext)
  )

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `${field.name} deve ser uma imagem válida (.jpg, .png, .gif, .webp, .svg)`
    }
  }

  return { isValid: true }
}

function validateSelectField(field: TemplateField, value: string): FieldValidationResult {
  if (typeof value !== 'string') {
    return {
      isValid: false,
      error: `${field.name} deve ser uma opção válida`
    }
  }

  const validOptions = field.options?.filter(opt => opt.trim()) || []
  
  if (validOptions.length === 0) {
    return {
      isValid: false,
      error: `${field.name} não possui opções configuradas`
    }
  }

  if (!validOptions.includes(value)) {
    return {
      isValid: false,
      error: `${field.name} deve ser uma das opções: ${validOptions.join(', ')}`
    }
  }

  return { isValid: true }
}

export function validateAllFields(fields: TemplateField[], data: Record<string, any>): {
  isValid: boolean
  errors: Record<string, string>
} {
  const errors: Record<string, string> = {}
  let isValid = true

  for (const field of fields) {
    const value = data[field.id]
    const result = validateField(field, value)
    
    if (!result.isValid) {
      errors[field.id] = result.error!
      isValid = false
    }
  }

  return { isValid, errors }
}

function validateAttributesField(field: TemplateField, value: Record<string, number>): FieldValidationResult {
  if (!field.attributes || field.attributes.length === 0) {
    return {
      isValid: false,
      error: `${field.name} deve ter pelo menos um atributo configurado`
    }
  }

  if (typeof value !== 'object' || value === null) {
    return {
      isValid: false,
      error: `${field.name} deve ser um objeto com valores dos atributos`
    }
  }

  // Validar cada atributo
  for (const attribute of field.attributes) {
    const attributeValue = value[attribute.id]
    
    if (attributeValue !== undefined && attributeValue !== null) {
      const numValue = Number(attributeValue)
      
      if (isNaN(numValue)) {
        return {
          isValid: false,
          error: `${attribute.name} deve ser um número válido`
        }
      }
    }
  }

  return { isValid: true }
}