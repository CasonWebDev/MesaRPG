"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Edit3 } from "lucide-react"
import type { Character } from "@/lib/dnd-types"
import { BorderedBox } from "./ui/bordered-box"
import { nanoid } from "nanoid"

interface Feature {
  id: string
  name: string
  description: string
  source: string // racial, class, feat, other
  level?: number
}

const FeaturesPage = ({
  character,
  onUpdate,
}: {
  character: Character
  onUpdate: (updates: Partial<Character>) => void
}) => {
  const [newFeature, setNewFeature] = useState({ name: '', description: '', source: 'other' })
  const [editingFeature, setEditingFeature] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  // Common D&D 5e features templates
  const featureTemplates = {
    racial: [
      { name: "Visão no Escuro", description: "Você pode ver no escuro até 18 metros como se fosse luz fraca." },
      { name: "Resistência Élfica", description: "Vantagem em testes de resistência contra encantamentos e imunidade a sono mágico." },
      { name: "Pés Ágeis", description: "Sua velocidade base de caminhada é 10,5 metros." },
      { name: "Sortudo", description: "Quando você rola um 1 natural em um d20, você pode rolar novamente e usar o novo resultado." },
      { name: "Bravura", description: "Vantagem em testes de resistência contra ser amedrontado." },
      { name: "Versatilidade Humana", description: "Você ganha proficiência em uma perícia à sua escolha." }
    ],
    class: [
      { name: "Fúria", description: "Você pode entrar em fúria como ação bônus. Enquanto em fúria, você ganha vantagem em testes de Força e +2 de dano em ataques corpo a corpo." },
      { name: "Defesa sem Armadura", description: "Quando não estiver vestindo armadura, sua CA é 10 + mod. Destreza + mod. Constituição." },
      { name: "Ataque Furtivo", description: "Uma vez por turno, você pode causar dano extra em um ataque com arma sutil quando tiver vantagem." },
      { name: "Conjuração", description: "Você pode conjurar magias. Usa sua habilidade de conjuração para determinar CD e bônus de ataque." },
      { name: "Cura Divina", description: "Você pode curar ferimentos tocando alguém e canalizando energia divina." },
      { name: "Inspiração Bárdica", description: "Você pode inspirar aliados concedendo dados de inspiração bárdica." }
    ],
    feat: [
      { name: "Alerta", description: "+5 de bônus na iniciativa. Você não pode ser surpreendido enquanto estiver consciente." },
      { name: "Atirador Perito", description: "Você pode atacar a longa distância sem desvantagem. +1 de bônus em jogadas de ataque à distância." },
      { name: "Duro de Matar", description: "Seu máximo de pontos de vida aumenta em 2 para cada nível que você possui." },
      { name: "Mago de Guerra", description: "Você pode conjurar uma magia como ação bônus quando usar uma ação para conjurar um truque." },
      { name: "Mestre em Armas", description: "Você ganha proficiência com quatro armas à sua escolha." },
      { name: "Sortudo", description: "Você tem 3 pontos de sorte. Pode gastar para rolar novamente um d20." }
    ]
  }

  // Parse features from character data
  const features: Feature[] = character.features || []

  const handleAddFeature = () => {
    if (!newFeature.name.trim()) return

    const feature: Feature = {
      id: nanoid(),
      name: newFeature.name,
      description: newFeature.description,
      source: newFeature.source
    }

    const updatedFeatures = [...features, feature]
    onUpdate({ features: updatedFeatures })
    setNewFeature({ name: '', description: '', source: 'other' })
  }

  const handleAddTemplate = (template: { name: string; description: string }, source: string) => {
    const feature: Feature = {
      id: nanoid(),
      name: template.name,
      description: template.description,
      source: source
    }

    const updatedFeatures = [...features, feature]
    onUpdate({ features: updatedFeatures })
    setShowTemplates(false)
  }

  const handleDeleteFeature = (featureId: string) => {
    const updatedFeatures = features.filter(f => f.id !== featureId)
    onUpdate({ features: updatedFeatures })
  }

  const handleEditFeature = (featureId: string, updates: Partial<Feature>) => {
    const updatedFeatures = features.map(f => 
      f.id === featureId ? { ...f, ...updates } : f
    )
    onUpdate({ features: updatedFeatures })
    setEditingFeature(null)
  }

  const getFeaturesBySource = (source: string) => {
    return features.filter(f => f.source === source)
  }

  const FeatureCard = ({ feature }: { feature: Feature }) => {
    const isEditing = editingFeature === feature.id
    const [editName, setEditName] = useState(feature.name)
    const [editDescription, setEditDescription] = useState(feature.description)

    return (
      <div className="border rounded p-3 space-y-2">
        {isEditing ? (
          <>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="font-semibold"
            />
            <Textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleEditFeature(feature.id, { name: editName, description: editDescription })}
              >
                Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingFeature(null)}
              >
                Cancelar
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">{feature.name}</h4>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingFeature(feature.id)}
                  className="h-6 w-6 p-0"
                >
                  <Edit3 className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteFeature(feature.id)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            {feature.description && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{feature.description}</p>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 bg-white space-y-4">
      {/* Add New Feature */}
      <BorderedBox className="p-3">
        <h3 className="font-bold text-sm mb-2 text-center border-b border-gray-300 pb-1">ADICIONAR NOVA CARACTERÍSTICA</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Nome da característica"
              value={newFeature.name}
              onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
              className="text-sm"
            />
            <select
              value={newFeature.source}
              onChange={(e) => setNewFeature({ ...newFeature, source: e.target.value })}
              className="px-3 py-2 border rounded text-sm"
            >
              <option value="racial">Racial</option>
              <option value="class">Classe</option>
              <option value="feat">Talento</option>
              <option value="other">Outro</option>
            </select>
            <Button size="sm" onClick={handleAddFeature}>
              <Plus className="w-3 h-3 mr-1" />
              Adicionar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowTemplates(!showTemplates)}
            >
              Templates
            </Button>
          </div>
          <Textarea
            placeholder="Descrição da característica (opcional)"
            value={newFeature.description}
            onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
            className="min-h-[60px] text-sm"
          />
        </div>
      </BorderedBox>

      {/* Templates Section */}
      {showTemplates && (
        <BorderedBox className="p-3">
          <h3 className="font-bold text-sm mb-2 text-center border-b border-gray-300 pb-1">TEMPLATES DE CARACTERÍSTICAS</h3>
          <div className="space-y-3">
            {/* Racial Templates */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Características Raciais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {featureTemplates.racial.map((template, index) => (
                  <div key={index} className="border rounded p-2 cursor-pointer hover:bg-gray-50" onClick={() => handleAddTemplate(template, 'racial')}>
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Class Templates */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Características de Classe</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {featureTemplates.class.map((template, index) => (
                  <div key={index} className="border rounded p-2 cursor-pointer hover:bg-gray-50" onClick={() => handleAddTemplate(template, 'class')}>
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feat Templates */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Talentos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {featureTemplates.feat.map((template, index) => (
                  <div key={index} className="border rounded p-2 cursor-pointer hover:bg-gray-50" onClick={() => handleAddTemplate(template, 'feat')}>
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowTemplates(false)}
              >
                Fechar Templates
              </Button>
            </div>
          </div>
        </BorderedBox>
      )}

      {/* Racial Features */}
      <BorderedBox className="p-3">
        <h3 className="font-bold text-sm mb-2 text-center border-b border-gray-300 pb-1">CARACTERÍSTICAS RACIAIS</h3>
        <div className="space-y-2">
          {getFeaturesBySource('racial').map(feature => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
          {getFeaturesBySource('racial').length === 0 && (
            <p className="text-center text-gray-500 py-4">Nenhuma característica racial adicionada</p>
          )}
        </div>
      </BorderedBox>

      {/* Class Features */}
      <BorderedBox className="p-3">
        <h3 className="font-bold text-sm mb-2 text-center border-b border-gray-300 pb-1">CARACTERÍSTICAS DE CLASSE</h3>
        <div className="space-y-2">
          {getFeaturesBySource('class').map(feature => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
          {getFeaturesBySource('class').length === 0 && (
            <p className="text-center text-gray-500 py-4">Nenhuma característica de classe adicionada</p>
          )}
        </div>
      </BorderedBox>

      {/* Feats */}
      <BorderedBox className="p-3">
        <h3 className="font-bold text-sm mb-2 text-center border-b border-gray-300 pb-1">TALENTOS</h3>
        <div className="space-y-2">
          {getFeaturesBySource('feat').map(feature => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
          {getFeaturesBySource('feat').length === 0 && (
            <p className="text-center text-gray-500 py-4">Nenhum talento adicionado</p>
          )}
        </div>
      </BorderedBox>

      {/* Other Features */}
      <BorderedBox className="p-3">
        <h3 className="font-bold text-sm mb-2 text-center border-b border-gray-300 pb-1">OUTRAS CARACTERÍSTICAS</h3>
        <div className="space-y-2">
          {getFeaturesBySource('other').map(feature => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
          {getFeaturesBySource('other').length === 0 && (
            <p className="text-center text-gray-500 py-4">Nenhuma outra característica adicionada</p>
          )}
        </div>
      </BorderedBox>

      {/* Legacy Features & Traits Field */}
      <BorderedBox className="p-3">
        <h3 className="font-bold text-sm mb-2 text-center border-b border-gray-300 pb-1">CARACTERÍSTICAS E TRAÇOS ADICIONAIS</h3>
        <Textarea
          placeholder="Espaço para características adicionais, anotações, habilidades especiais..."
          value={character.featuresAndTraits || ''}
          onChange={(e) => onUpdate({ featuresAndTraits: e.target.value })}
          className="min-h-[120px] resize-vertical text-sm border-0 p-1 focus-visible:ring-0"
        />
      </BorderedBox>
    </div>
  )
}

export default FeaturesPage