"use client"

import { useState, useRef, useEffect } from "react"
import type { LucideIcon } from "lucide-react"
import { 
  GripVertical, 
  MousePointer, 
  Ruler, 
  MapPin, 
  Pen, 
  Grid3x3, 
  UserCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Edit3,
  Users,
  User,
  Skull,
  Search,
  Lock,
  Unlock,
  Crown,
  Settings
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { TokenData } from "./tactical-grid"
import { useCharacterTokens } from "@/hooks/use-character-tokens"
import type { MeasurementSettings } from "./measurement-tool"

export interface Tool {
  id: string
  label: string
  icon: LucideIcon
  cursor: string
}

interface UnifiedToolbarProps {
  tools: Tool[]
  activeTool: Tool
  onToolSelect: (tool: Tool) => void
  gridSize: number
  onGridSizeChange: (size: number) => void
  
  // Campaign props
  campaignId: string
  userRole: 'GM' | 'PLAYER'
  userId?: string
  
  // Measurement settings
  measurementSettings?: MeasurementSettings
  onMeasurementSettingsChange?: (updates: Partial<MeasurementSettings>) => void
  
  // Legacy token props (kept for backward compatibility)
  tokens?: TokenData[]
  selectedTokenIds?: string[]
  onTokenSelect?: (tokenId: string) => void
  onSelectMultipleTokens?: (tokenIds: string[]) => void
  onClearSelection?: () => void
  onAddToken?: () => void
  onRemoveTokens?: (tokenIds: string[]) => void
  onEditToken?: (token: TokenData) => void
  onToggleTokenVisibility?: (tokenId: string) => void
  onToggleTokenLock?: (tokenId: string) => void
  onChangeTokenOwner?: (tokenId: string, ownerId: string) => void
  
  isExpanded?: boolean
  onToggleExpanded?: () => void
}

export function UnifiedToolbar({
  tools,
  activeTool,
  onToolSelect,
  gridSize,
  onGridSizeChange,
  campaignId,
  userRole,
  userId,
  measurementSettings,
  onMeasurementSettingsChange,
  // Legacy props (fallback)
  tokens: legacyTokens,
  selectedTokenIds: legacySelectedTokenIds,
  onTokenSelect: legacyOnTokenSelect,
  onSelectMultipleTokens: legacyOnSelectMultipleTokens,
  onClearSelection: legacyOnClearSelection,
  onAddToken,
  onRemoveTokens: legacyOnRemoveTokens,
  onEditToken,
  onToggleTokenVisibility: legacyOnToggleTokenVisibility,
  onToggleTokenLock: legacyOnToggleTokenLock,
  onChangeTokenOwner: legacyOnChangeTokenOwner,
  isExpanded = false,
  onToggleExpanded
}: UnifiedToolbarProps) {
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<'ALL' | 'PC' | 'NPC' | 'CREATURE'>('ALL')
  const toolbarRef = useRef<HTMLDivElement>(null)
  
  // Default measurement settings if not provided
  const defaultMeasurementSettings = {
    unit: 'feet' as const,
    snapToGrid: true,
    snapToCenter: false,
    feetPerSquare: 5,
    metersPerSquare: 1.5,
    showGrid: true,
    showCoordinates: false,
    showRulers: false
  }
  
  const activeMeasurementSettings = measurementSettings || defaultMeasurementSettings

  // Use character tokens hook
  const {
    tokens: characterTokens,
    selectedTokenIds: characterSelectedTokenIds,
    isLoading: tokensLoading,
    error: tokensError,
    selectToken: characterSelectToken,
    selectMultipleTokens: characterSelectMultipleTokens,
    clearSelection: characterClearSelection,
    moveToken,
    toggleTokenVisibility,
    toggleTokenLock,
    changeTokenOwner,
    refreshTokens
  } = useCharacterTokens({ campaignId, userRole, userId })

  // Use character tokens or fallback to legacy tokens
  const tokens = characterTokens.length > 0 ? characterTokens : (legacyTokens || [])
  const selectedTokenIds = characterTokens.length > 0 ? characterSelectedTokenIds : (legacySelectedTokenIds || [])
  const onTokenSelect = characterTokens.length > 0 ? characterSelectToken : legacyOnTokenSelect
  const onSelectMultipleTokens = characterTokens.length > 0 ? characterSelectMultipleTokens : legacyOnSelectMultipleTokens
  const onClearSelection = characterTokens.length > 0 ? characterClearSelection : legacyOnClearSelection
  const onToggleTokenVisibility = characterTokens.length > 0 ? toggleTokenVisibility : legacyOnToggleTokenVisibility
  const onToggleTokenLock = characterTokens.length > 0 ? toggleTokenLock : legacyOnToggleTokenLock
  const onChangeTokenOwner = characterTokens.length > 0 ? changeTokenOwner : legacyOnChangeTokenOwner

  // Filtrar tokens baseado no role do usuário
  const filteredTokens = tokens.filter(token => {
    // Para jogadores, mostrar apenas seus próprios tokens
    if (userRole === 'PLAYER' && token.ownerId !== userId) {
      return false
    }
    
    if (searchQuery && !token.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filterType !== 'ALL' && token.characterType !== filterType) {
      return false
    }
    return true
  })

  // Estatísticas dos tokens (baseado nos tokens visíveis para o usuário)
  const relevantTokens = userRole === 'PLAYER' ? filteredTokens : tokens
  const tokenStats = {
    total: relevantTokens.length,
    selected: selectedTokenIds.length,
    pc: relevantTokens.filter(t => t.characterType === 'PC').length,
    npc: relevantTokens.filter(t => t.characterType === 'NPC').length,
    creature: relevantTokens.filter(t => t.characterType === 'CREATURE').length,
    locked: relevantTokens.filter(t => t.canPlayerMove === false).length,
    hidden: relevantTokens.filter(t => (t as any).hidden === true).length
  }

  // Drag and drop logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as Element).closest('.drag-handle')) {
      e.preventDefault()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, window.innerWidth - 400))
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, window.innerHeight - 100))
    
    setPosition({ x: newX, y: newY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // Render tools
  const renderTool = (tool: Tool) => {
    if (tool.id === "grid-settings") {
      return (
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <tool.icon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tool.label}</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent className="w-64" align="start">
            <DropdownMenuLabel>Configurações do Grid</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex flex-col space-y-2 w-full">
                <Label htmlFor="grid-size-input">Tamanho (px)</Label>
                <Input
                  id="grid-size-input"
                  type="number"
                  value={gridSize}
                  onChange={(e) => onGridSizeChange(Number(e.target.value))}
                  min={10}
                  max={200}
                />
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Configurações do Grid</DropdownMenuLabel>
            
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex flex-col space-y-2 w-full">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-grid"
                    checked={activeMeasurementSettings.showGrid}
                    onChange={(e) => onMeasurementSettingsChange?.({ showGrid: e.target.checked })}
                  />
                  <Label htmlFor="show-grid">Mostrar Grid</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-coordinates"
                    checked={activeMeasurementSettings.showCoordinates}
                    onChange={(e) => onMeasurementSettingsChange?.({ showCoordinates: e.target.checked })}
                  />
                  <Label htmlFor="show-coordinates">Coordenadas (A1, B2)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show-rulers"
                    checked={activeMeasurementSettings.showRulers}
                    onChange={(e) => onMeasurementSettingsChange?.({ showRulers: e.target.checked })}
                  />
                  <Label htmlFor="show-rulers">Réguas nas Bordas</Label>
                </div>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Configurações de Medição</DropdownMenuLabel>
            
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex flex-col space-y-2 w-full">
                <Label htmlFor="measurement-unit">Unidade</Label>
                <Select 
                  value={activeMeasurementSettings.unit} 
                  onValueChange={(value: 'feet' | 'meters' | 'squares') => 
                    onMeasurementSettingsChange?.({ unit: value })
                  }
                >
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feet">Pés</SelectItem>
                    <SelectItem value="meters">Metros</SelectItem>
                    <SelectItem value="squares">Quadrados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <div className="flex flex-col space-y-2 w-full">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="snap-to-grid"
                    checked={activeMeasurementSettings.snapToGrid}
                    onChange={(e) => onMeasurementSettingsChange?.({ snapToGrid: e.target.checked })}
                  />
                  <Label htmlFor="snap-to-grid">Snap ao Grid</Label>
                </div>
                
                {activeMeasurementSettings.snapToGrid && (
                  <div className="flex items-center space-x-2 ml-4">
                    <input
                      type="checkbox"
                      id="snap-to-center"
                      checked={activeMeasurementSettings.snapToCenter}
                      onChange={(e) => onMeasurementSettingsChange?.({ snapToCenter: e.target.checked })}
                    />
                    <Label htmlFor="snap-to-center">Snap ao Centro</Label>
                  </div>
                )}
              </div>
            </DropdownMenuItem>
            
            {activeMeasurementSettings.unit === 'feet' && (
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <div className="flex flex-col space-y-2 w-full">
                  <Label htmlFor="feet-per-square">Pés por Quadrado</Label>
                  <Input
                    id="feet-per-square"
                    type="number"
                    value={activeMeasurementSettings.feetPerSquare}
                    onChange={(e) => onMeasurementSettingsChange?.({ feetPerSquare: Number(e.target.value) })}
                    min={1}
                    max={50}
                  />
                </div>
              </DropdownMenuItem>
            )}
            
            {activeMeasurementSettings.unit === 'meters' && (
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <div className="flex flex-col space-y-2 w-full">
                  <Label htmlFor="meters-per-square">Metros por Quadrado</Label>
                  <Input
                    id="meters-per-square"
                    type="number"
                    value={activeMeasurementSettings.metersPerSquare}
                    onChange={(e) => onMeasurementSettingsChange?.({ metersPerSquare: Number(e.target.value) })}
                    min={0.5}
                    max={10}
                    step={0.5}
                  />
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={activeTool.id === tool.id ? "default" : "ghost"}
            size="icon"
            onClick={() => onToolSelect(tool)}
            className={cn(
              "cursor-pointer",
              activeTool.id === tool.id && "bg-primary text-primary-foreground",
            )}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tool.label}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

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
      if (legacyOnRemoveTokens) {
        legacyOnRemoveTokens(selectedTokenIds)
      } else {
        // Handle removal for character tokens (not implemented yet)
        console.log('Character token removal not implemented yet')
      }
    }
  }

  if (!isExpanded) {
    return (
      <TooltipProvider delayDuration={0}>
        <div
          ref={toolbarRef}
          style={{ left: position.x, top: position.y }}
          className={cn(
            "absolute z-30 flex items-center bg-secondary/90 backdrop-blur-sm rounded-lg border shadow-lg",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onMouseDown={handleMouseDown}
        >
          <div className="p-2 drag-handle">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex p-1">
            {tools.map((tool) => (
              <div key={tool.id}>{renderTool(tool)}</div>
            ))}
          </div>
          {(userRole === 'GM' || userRole === 'PLAYER') && (
            <>
              <Separator orientation="vertical" className="h-8" />
              <div className="p-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onToggleExpanded}
                      className="cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Gerenciar Tokens</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </>
          )}
        </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Card
        ref={toolbarRef}
        style={{ left: position.x, top: position.y }}
        className={cn(
          "absolute z-30 w-96 max-h-[80vh] bg-secondary/95 backdrop-blur-sm border shadow-lg",
          isDragging ? "cursor-grabbing" : ""
        )}
      >
      <CardHeader className="pb-3">
        <div 
          className={cn(
            "flex items-center justify-between drag-handle",
            isDragging ? "cursor-grabbing" : "cursor-grab"
          )}
          onMouseDown={handleMouseDown}
        >
          <CardTitle className="text-lg flex items-center gap-2">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            Ferramentas
            {userRole === 'GM' && <Crown className="h-4 w-4 text-primary" />}
          </CardTitle>
          <Button size="sm" onClick={onToggleExpanded} variant="ghost">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tools">Ferramentas</TabsTrigger>
            <TabsTrigger value="tokens">Tokens ({tokenStats.total})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="space-y-4">
            <div className="flex flex-wrap gap-1">
              {tools.map((tool) => (
                <div key={tool.id}>{renderTool(tool)}</div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            {/* Controles Principais */}
            <div className="flex gap-2">
              <Button size="sm" onClick={onAddToken || (() => console.log('Add token not implemented'))} className="flex-1">
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

            {/* Estatísticas */}
            {userRole === 'GM' ? (
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
            ) : (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium">{tokenStats.total}</div>
                  <div className="text-muted-foreground">Meus Tokens</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600">{tokenStats.pc}</div>
                  <div className="text-muted-foreground">Personagens</div>
                </div>
              </div>
            )}

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

              <div>
                <Label className="text-xs">Filtrar por Tipo</Label>
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
            </div>

            {/* Lista de Tokens */}
            <div>
              <Label className="text-sm font-medium">
                {userRole === 'PLAYER' ? 'Meus Tokens' : 'Tokens no Mapa'} ({filteredTokens.length})
                {tokensLoading && ' (Carregando...)'}
              </Label>
              <ScrollArea className="h-[200px] mt-2">
                {tokensLoading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    Carregando tokens...
                  </div>
                ) : tokensError ? (
                  <div className="text-center py-8 text-red-500 text-sm">
                    <p className="mb-2">Erro ao carregar tokens</p>
                    <Button size="sm" variant="outline" onClick={refreshTokens}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : filteredTokens.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {userRole === 'PLAYER' 
                      ? 'Você ainda não tem personagens com tokens no mapa' 
                      : tokens.length === 0 
                        ? 'Nenhum token no mapa' 
                        : 'Nenhum token encontrado'
                    }
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
                        {userRole === 'GM' && (
                          <div className="flex gap-1">
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
                          </div>
                        )}
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </TooltipProvider>
  )
}