import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { TemplateSection } from "./template-section"
import { CharacterType } from "@/types/sheet-template"
import { useParams } from "next/navigation"
import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSystemOptions, getPresetsForSystem, convertPresetToTemplateFields } from "@/lib/sheet-presets"
import { toast } from "sonner"

interface CampaignData {
  id: string
  name: string
  description: string | null
  system: string
  ownerId: string
  isActive: boolean
  playerLimit: number | null
  settings: string
  createdAt: string
  updatedAt: string
}

interface SheetTemplatesProps {
  campaign?: CampaignData
}

export function SheetTemplates({ campaign }: SheetTemplatesProps) {
  const params = useParams()
  const campaignId = campaign?.id || (params.id as string)
  const [selectedSystem, setSelectedSystem] = useState<string>("Personalizado")
  const [isLoading, setIsLoading] = useState(false)

  const templateSections = [
    {
      value: 'character',
      title: 'Personagem',
      type: 'PC' as CharacterType,
      description: 'Configure os campos que os jogadores verão em suas fichas de personagem.'
    },
    {
      value: 'npc',
      title: 'NPC',
      type: 'NPC' as CharacterType,
      description: 'Configure os campos para personagens não-jogáveis (NPCs) que você controla.'
    },
    {
      value: 'creature',
      title: 'Criatura',
      type: 'CREATURE' as CharacterType,
      description: 'Configure os campos para monstros e outras criaturas da sua campanha.'
    }
  ]

  const systemOptions = getSystemOptions()

  const handleLoadPreset = async () => {
    if (selectedSystem === "Personalizado") {
      toast.error("Selecione um sistema de jogo para carregar o preset.")
      return
    }

    setIsLoading(true)
    try {
      const presets = getPresetsForSystem(selectedSystem)
      
      if (presets.length === 0) {
        toast.error("Nenhum preset encontrado para este sistema.")
        setIsLoading(false)
        return
      }

      // Mapear os tipos de preset para os tipos de template
      const typeMapping = {
        'Personagem': 'PC',
        'NPC': 'NPC',
        'Criatura': 'CREATURE'
      } as const

      // Processar cada preset
      for (const preset of presets) {
        const templateType = typeMapping[preset.sheetType as keyof typeof typeMapping]
        if (!templateType) continue

        // Converter preset para o formato correto com IDs únicos
        const templateFields = convertPresetToTemplateFields(preset)

        // Fazer a requisição para salvar o template
        const response = await fetch(`/api/campaigns/${campaignId}/sheet-templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: templateType,
            fields: templateFields
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error(`Erro na API para ${preset.sheetType}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
          throw new Error(`Erro ao salvar template de ${preset.sheetType}: ${errorData.error || response.statusText}`)
        }
      }

      toast.success(`Presets de ${selectedSystem} carregados com sucesso!`)
      
      // Recarregar a página para mostrar os novos templates
      window.location.reload()
      
    } catch (error) {
      console.error('Erro ao carregar presets:', error)
      toast.error("Erro ao carregar presets. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Seletor de Preset de Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Presets de Sistema de Jogo</CardTitle>
          <CardDescription>
            Selecione um sistema de jogo para carregar campos prontos nos templates de ficha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um sistema de jogo" />
                </SelectTrigger>
                <SelectContent>
                  {systemOptions.map((system) => (
                    <SelectItem key={system} value={system}>
                      {system}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleLoadPreset} 
              disabled={selectedSystem === "Personalizado" || isLoading}
              className="whitespace-nowrap"
            >
              {isLoading ? "Carregando..." : "Carregar Preset"}
            </Button>
          </div>
          {selectedSystem !== "Personalizado" && (
            <p className="text-sm text-muted-foreground mt-2">
              Este preset irá substituir os campos atuais de todos os templates (Personagem, NPC e Criatura).
            </p>
          )}
        </CardContent>
      </Card>

      {/* Accordions dos Templates */}
      <Accordion type="single" collapsible defaultValue="character" className="w-full">
        {templateSections.map((section) => (
          <AccordionItem key={section.value} value={section.value}>
            <AccordionTrigger className="text-xl font-heading hover:no-underline">
              Template de Ficha de {section.title}
            </AccordionTrigger>
            <AccordionContent>
              <TemplateSection
                campaignId={campaignId}
                type={section.type}
                title={section.title}
                description={section.description}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}