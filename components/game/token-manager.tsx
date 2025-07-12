"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Plus, Users, User, Skull } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCharacters } from "@/hooks/use-characters"
import { toast } from "sonner"
import type { TokenData } from "./tactical-grid"

interface Character {
  id: string
  name: string
  type: 'PC' | 'NPC' | 'CREATURE'
  data: Record<string, any>
  user?: {
    id: string
    name: string
    email: string
  }
}

interface TokenManagerProps {
  isOpen: boolean
  onClose: () => void
  onCreateToken: (tokenData: Omit<TokenData, 'id'>) => Promise<void>
  campaignId: string
  userRole: 'GM' | 'PLAYER'
  userId?: string
}

export function TokenManager({
  isOpen,
  onClose,
  onCreateToken,
  campaignId,
  userRole,
  userId
}: TokenManagerProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [tokenName, setTokenName] = useState("")
  const [borderColor, setBorderColor] = useState("border-blue-500")
  const [canPlayerMove, setCanPlayerMove] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PC' | 'NPC' | 'CREATURE'>('ALL')

  const { 
    characters, 
    loading, 
    error 
  } = useCharacters({ 
    campaignId, 
    type: filter === 'ALL' ? undefined : filter,
    createdBy: userRole === 'PLAYER' ? 'player' : undefined // Player só vê seus personagens
  })

  // Reset form quando abrir
  useEffect(() => {
    if (isOpen) {
      setSelectedCharacter(null)
      setTokenName("")
      setBorderColor("border-blue-500")
      setCanPlayerMove(true)
      setFilter(userRole === 'PLAYER' ? 'PC' : 'ALL')
    }
  }, [isOpen, userRole])

  // Atualizar nome quando selecionar personagem
  useEffect(() => {
    if (selectedCharacter) {
      setTokenName(selectedCharacter.name)
    }
  }, [selectedCharacter])

  const getCharacterImage = (character: Character) => {
    // Tentar pegar imagem do personagem
    const data = character.data || {}
    const imageFields = ['Avatar', 'Imagem', 'Foto', 'Retrato', 'Image']
    
    for (const field of imageFields) {
      if (data[field] && typeof data[field] === 'string') {
        return data[field]
      }
    }
    
    return "/placeholder.svg"
  }

  const getBorderColorForType = (type: string) => {
    switch (type) {
      case 'PC': return 'border-green-500'
      case 'NPC': return 'border-blue-500'
      case 'CREATURE': return 'border-red-500'
      default: return 'border-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PC': return <User className="h-4 w-4" />
      case 'NPC': return <Users className="h-4 w-4" />
      case 'CREATURE': return <Skull className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const handleCreateToken = async () => {
    if (!selectedCharacter) {
      toast.error("Selecione um personagem primeiro")
      return
    }

    if (!tokenName.trim()) {
      toast.error("Digite um nome para o token")
      return
    }

    setIsCreating(true)
    
    try {
      const tokenData: Omit<TokenData, 'id'> = {
        src: getCharacterImage(selectedCharacter),
        alt: tokenName,
        name: tokenName,
        position: { top: 100, left: 100 }, // Posição inicial
        borderColor,
        canPlayerMove: userRole === 'GM' ? canPlayerMove : true,
        ownerId: selectedCharacter.user?.id || userId,
        characterId: selectedCharacter.id,
        characterType: selectedCharacter.type
      }

      await onCreateToken(tokenData)
      
      toast.success(`Token "${tokenName}" criado com sucesso!`)
      onClose()
    } catch (error) {
      console.error('Erro ao criar token:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao criar token')
    } finally {
      setIsCreating(false)
    }
  }

  const filteredCharacters = characters.filter(char => {
    if (userRole === 'PLAYER') {
      // Player só vê seus próprios PCs
      return char.type === 'PC' && char.user?.id === userId
    }
    
    // GM vê baseado no filtro
    if (filter === 'ALL') return true
    return char.type === filter
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] bg-parchment text-ink-text">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Token ao Mapa
          </DialogTitle>
          <DialogDescription>
            Selecione um personagem para criar um token no mapa tático.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filtros (apenas para GM) */}
          {userRole === 'GM' && (
            <div>
              <Label className="text-sm font-medium">Tipo de Personagem</Label>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="bg-stone-50/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PC">Personagens (PC)</SelectItem>
                  <SelectItem value="NPC">NPCs</SelectItem>
                  <SelectItem value="CREATURE">Criaturas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Lista de Personagens */}
          <div>
            <Label className="text-sm font-medium">Selecionar Personagem</Label>
            <ScrollArea className="h-[200px] mt-2 border rounded-md bg-stone-50/30">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando personagens...</span>
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-600">
                  Erro ao carregar personagens: {error}
                </div>
              ) : filteredCharacters.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {userRole === 'PLAYER' 
                    ? "Você não possui personagens para criar tokens"
                    : "Nenhum personagem encontrado"
                  }
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredCharacters.map((character) => (
                    <div
                      key={character.id}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                        selectedCharacter?.id === character.id
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'bg-white/50 hover:bg-white/80 border border-stone-200'
                      }`}
                      onClick={() => setSelectedCharacter(character)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={getCharacterImage(character)} 
                          alt={character.name} 
                        />
                        <AvatarFallback>
                          {String(character.name).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(character.type)}
                          <span className="font-medium">{character.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {character.type} 
                          {character.user && ` • ${character.user.name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Configurações do Token */}
          {selectedCharacter && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <Label htmlFor="token-name">Nome do Token</Label>
                <Input
                  id="token-name"
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="Nome que aparecerá no token"
                  className="bg-stone-50/50"
                />
              </div>

              <div>
                <Label htmlFor="border-color">Cor da Borda</Label>
                <Select value={borderColor} onValueChange={setBorderColor}>
                  <SelectTrigger className="bg-stone-50/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="border-blue-500">Azul</SelectItem>
                    <SelectItem value="border-green-500">Verde</SelectItem>
                    <SelectItem value="border-red-500">Vermelho</SelectItem>
                    <SelectItem value="border-yellow-500">Amarelo</SelectItem>
                    <SelectItem value="border-purple-500">Roxo</SelectItem>
                    <SelectItem value="border-orange-500">Laranja</SelectItem>
                    <SelectItem value="border-gray-500">Cinza</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Opções apenas para GM */}
              {userRole === 'GM' && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="player-move" 
                    checked={canPlayerMove}
                    onCheckedChange={setCanPlayerMove}
                  />
                  <Label htmlFor="player-move" className="text-sm">
                    Permitir que jogadores movam este token
                  </Label>
                </div>
              )}

              {/* Preview do Token */}
              <div className="bg-stone-100 p-4 rounded-md">
                <Label className="text-sm font-medium">Preview</Label>
                <div className="flex items-center gap-3 mt-2">
                  <div className={`w-10 h-10 rounded-full border-2 ${borderColor} overflow-hidden`}>
                    <img 
                      src={getCharacterImage(selectedCharacter)} 
                      alt={tokenName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{tokenName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCharacter.type} • {borderColor.replace('border-', '').replace('-500', '')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateToken} 
            disabled={!selectedCharacter || !tokenName.trim() || isCreating}
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Token
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}