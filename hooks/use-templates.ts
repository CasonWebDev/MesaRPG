import { useState, useEffect } from "react"
import { SheetTemplate, CharacterType, CreateTemplateData } from "@/types/sheet-template"
import { toast } from "sonner"

interface UseTemplatesProps {
  campaignId: string
  type?: CharacterType
}

export function useTemplates({ campaignId, type }: UseTemplatesProps) {
  const [templates, setTemplates] = useState<SheetTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (type) params.append('type', type)
      
      const response = await fetch(`/api/campaigns/${campaignId}/sheet-templates?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar templates')
      }
      
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (data: CreateTemplateData) => {
    const response = await fetch(`/api/campaigns/${campaignId}/sheet-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao criar template')
    }

    const result = await response.json()
    setTemplates(prev => [...prev, result.template])
    return result.template
  }

  const updateTemplate = async (templateId: string, data: Partial<CreateTemplateData>) => {
    const response = await fetch(`/api/campaigns/${campaignId}/sheet-templates/${templateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao atualizar template')
    }

    const result = await response.json()
    setTemplates(prev => prev.map(t => t.id === templateId ? result.template : t))
    return result.template
  }

  const deleteTemplate = async (templateId: string) => {
    const response = await fetch(`/api/campaigns/${campaignId}/templates/${templateId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Erro ao deletar template')
    }

    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  useEffect(() => {
    fetchTemplates()
  }, [campaignId, type])

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates
  }
}