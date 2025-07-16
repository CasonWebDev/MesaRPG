"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  Edit3, 
  Users, 
  User, 
  Skull, 
  Search,
  MousePointer,
  Move,
  Lock,
  Unlock,
  Crown,
  Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TokenData } from "./tactical-grid"

interface TokenToolbarProps {
  tokens: TokenData[]
  selectedTokenIds: string[]
  onTokenSelect: (tokenId: string) => void
  onSelectMultipleTokens: (tokenIds: string[]) => void
  onClearSelection: () => void
  onAddToken: () => void
  onRemoveTokens: (tokenIds: string[]) => void
  onEditToken: (token: TokenData) => void
  onToggleTokenVisibility: (tokenId: string) => void
  onToggleTokenLock: (tokenId: string) => void
  onChangeTokenOwner: (tokenId: string, ownerId: string) => void
  userRole: 'GM' | 'PLAYER'
  isVisible: boolean
  onToggleVisibility: () => void
}

export function TokenToolbar({
  tokens,
  selectedTokenIds,
  onTokenSelect,
  onSelectMultipleTokens,
  onClearSelection,
  onAddToken,
  onRemoveTokens,
  onEditToken,
  onToggleTokenVisibility,
  onToggleTokenLock,
  onChangeTokenOwner,
  userRole,
  isVisible,
  onToggleVisibility
}: TokenToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<'ALL' | 'PC' | 'NPC' | 'CREATURE'>('ALL')
  const [filterOwner, setFilterOwner] = useState<'ALL' | 'MINE' | 'PLAYERS'>('ALL')

  // Filtrar tokens
  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      // Filtro por busca
      if (searchQuery && !token.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      // Filtro por tipo
      if (filterType !== 'ALL' && token.characterType !== filterType) {
        return false
      }
      
      // Filtro por proprietário
      if (filterOwner === 'MINE' && token.ownerId !== 'current-user') { // TODO: usar userId real
        return false
      }
      
      if (filterOwner === 'PLAYERS' && token.characterType !== 'PC') {
        return false
      }
      
      return true
    })
  }, [tokens, searchQuery, filterType, filterOwner])

  // Estatísticas dos tokens
  const tokenStats = useMemo(() => {
    const stats = {
      total: tokens.length,
      selected: selectedTokenIds.length,
      pc: tokens.filter(t => t.characterType === 'PC').length,
      npc: tokens.filter(t => t.characterType === 'NPC').length,
      creature: tokens.filter(t => t.characterType === 'CREATURE').length,
      locked: tokens.filter(t => t.canPlayerMove === false).length,
      hidden: tokens.filter(t => (t as any).hidden === true).length
    }
    return stats
  }, [tokens, selectedTokenIds])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PC': return <User className="h-3 w-3" />
      case 'NPC': return <Users className="h-3 w-3" />
      case 'CREATURE': return <Skull className="h-3 w-3" />
      default: return <User className="h-3 w-3" />
    }
  }

  const getTokenStatusIcon = (token: TokenData) => {
    const isLocked = token.canPlayerMove === false
    const isHidden = (token as any).hidden === true
    
    if (isLocked && isHidden) return <Lock className="h-3 w-3 text-red-500" />
    if (isLocked) return <Lock className="h-3 w-3 text-orange-500" />
    if (isHidden) return <EyeOff className="h-3 w-3 text-muted-foreground" />
    return null
  }

  const handleSelectAll = () => {
    if (selectedTokenIds.length === filteredTokens.length) {
      onClearSelection()
    } else {
      onSelectMultipleTokens(filteredTokens.map(t => t.id))
    }
  }

  const handleRemoveSelected = () => {
    if (selectedTokenIds.length > 0) {
      onRemoveTokens(selectedTokenIds)
    }
  }

  if (!isVisible) {
    return (
      <div className="absolute top-4 left-4 z-30">
        <Button
          size="sm"
          variant="outline"
          onClick={onToggleVisibility}
          className="bg-secondary/80 backdrop-blur-sm"
        >
          <MousePointer className="h-4 w-4 mr-1" />
          Tokens
        </Button>
      </div>
    )
  }

  return (
    <Card className="absolute top-4 left-4 w-80 max-h-[80vh] z-30 bg-secondary/95 backdrop-blur-sm border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MousePointer className="h-5 w-5" />
            Gerenciar Tokens
            {userRole === 'GM' && <Crown className="h-4 w-4 text-primary" />}
          </CardTitle>
          <div className="flex gap-1">
            <Button size="sm" onClick={onToggleVisibility} variant="ghost">
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium">{tokenStats.total}</div>
            <div className="text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-blue-600">{tokenStats.pc}</div>
            <div className="text-muted-foreground">PCs</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-green-600">{tokenStats.npc}</div>
            <div className="text-muted-foreground">NPCs</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-red-600">{tokenStats.creature}</div>
            <div className="text-muted-foreground">Criaturas</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controles Principais */}
        <div className="flex gap-2">
          <Button size="sm" onClick={onAddToken} className="flex-1">
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
          
          {selectedTokenIds.length > 0 && (
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={handleRemoveSelected}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remover ({selectedTokenIds.length})
            </Button>
          )}
        </div>

        {/* Ferramentas de Seleção */}
        {tokens.length > 0 && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleSelectAll}
              className="flex-1"
            >
              {selectedTokenIds.length === filteredTokens.length ? 'Deselecionar Todos' : 'Selecionar Todos'}
            </Button>
            
            {selectedTokenIds.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onClearSelection}
              >
                Limpar ({selectedTokenIds.length})
              </Button>
            )}
          </div>
        )}

        <Separator />

        {/* Filtros */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="PC">PCs</SelectItem>
                  <SelectItem value="NPC">NPCs</SelectItem>
                  <SelectItem value="CREATURE">Criaturas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Proprietário</Label>
              <Select value={filterOwner} onValueChange={(value: any) => setFilterOwner(value)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="MINE">Meus</SelectItem>
                  <SelectItem value="PLAYERS">Jogadores</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lista de Tokens */}
        <div>
          <Label className="text-sm font-medium">Tokens no Mapa ({filteredTokens.length})</Label>
          <ScrollArea className="h-[300px] mt-2">
            {filteredTokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {tokens.length === 0 ? 'Nenhum token no mapa' : 'Nenhum token encontrado'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTokens.map((token) => (
                  <div
                    key={token.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                      selectedTokenIds.includes(token.id)
                        ? "bg-primary/20 border border-primary"
                        : "bg-background/50 hover:bg-background/80 border border-transparent"
                    )}
                    onClick={() => onTokenSelect(token.id)}
                  >
                    {/* Avatar do Token */}
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={token.src} alt={token.name || token.alt} />
                      <AvatarFallback className="text-xs">
                        {String(token.name || token.alt).charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info do Token */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        {getTypeIcon(token.characterType || 'PC')}
                        <span className="font-medium text-sm truncate">
                          {token.name || token.alt}
                        </span>
                        {getTokenStatusIcon(token)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {token.characterType} • Pos: {Math.round(token.position.left)}, {Math.round(token.position.top)}
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="flex gap-1">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                onToggleTokenVisibility(token.id)
                              }}
                            >
                              {(token as any).hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {(token as any).hidden ? 'Mostrar Token' : 'Ocultar Token'}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                onToggleTokenLock(token.id)
                              }}
                            >
                              {token.canPlayerMove === false ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {token.canPlayerMove === false ? 'Desbloquear Movimento' : 'Bloquear Movimento'}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditToken(token)
                              }}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar Token</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Ações em Lote para Selecionados */}
        {selectedTokenIds.length > 1 && userRole === 'GM' && (
          <>
            <Separator />
            <div>
              <Label className="text-sm font-medium">
                Ações em Lote ({selectedTokenIds.length} selecionados)
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    selectedTokenIds.forEach(tokenId => onToggleTokenVisibility(tokenId))
                  }}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Alternar Visibilidade
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    selectedTokenIds.forEach(tokenId => onToggleTokenLock(tokenId))
                  }}
                >
                  <Lock className="h-3 w-3 mr-1" />
                  Alternar Bloqueio
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}