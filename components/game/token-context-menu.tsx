"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger
} from "@/components/ui/context-menu"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { 
  Edit3, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Crown, 
  User, 
  Users, 
  Skull,
  Palette,
  Move,
  RotateCcw,
  Settings,
  UserCheck,
  UserX
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { TokenData } from "./tactical-grid"
import { toast } from "sonner"

interface TokenContextMenuProps {
  children: React.ReactNode
  token: TokenData
  userRole: 'GM' | 'PLAYER'
  userId?: string
  onEditToken: (token: TokenData) => void
  onRemoveToken: (tokenId: string) => void
  onDuplicateToken: (token: TokenData) => void
  onToggleVisibility: (tokenId: string) => void
  onToggleLock: (tokenId: string) => void
  onChangeOwnership: (tokenId: string, newOwnerId: string) => void
  onResetPosition: (tokenId: string) => void
  onChangeBorderColor: (tokenId: string, color: string) => void
  availableUsers?: Array<{ id: string; name: string; email: string }>
}

export function TokenContextMenu({
  children,
  token,
  userRole,
  userId,
  onEditToken,
  onRemoveToken,
  onDuplicateToken,
  onToggleVisibility,
  onToggleLock,
  onChangeOwnership,
  onResetPosition,
  onChangeBorderColor,
  availableUsers = []
}: TokenContextMenuProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editedToken, setEditedToken] = useState<Partial<TokenData>>({})

  // Verificar permissões
  const canEdit = userRole === 'GM' || token.ownerId === userId
  const canDelete = userRole === 'GM' || token.ownerId === userId
  const canChangeOwnership = userRole === 'GM'
  const canToggleVisibility = userRole === 'GM'
  const canToggleLock = userRole === 'GM'

  const isHidden = (token as any).hidden === true
  const isLocked = token.canPlayerMove === false
  const isOwner = token.ownerId === userId

  useEffect(() => {
    if (isEditDialogOpen) {
      setEditedToken({
        name: token.name,
        borderColor: token.borderColor,
        canPlayerMove: token.canPlayerMove
      })
    }
  }, [isEditDialogOpen, token])

  const handleEditSave = () => {
    if (!editedToken.name?.trim()) {
      toast.error("Nome do token não pode estar vazio")
      return
    }

    onEditToken({
      ...token,
      ...editedToken,
      name: editedToken.name?.trim()
    })
    
    setIsEditDialogOpen(false)
    toast.success("Token atualizado com sucesso!")
  }

  const getTokenTypeInfo = () => {
    switch (token.characterType) {
      case 'PC':
        return { icon: <User className="h-4 w-4" />, label: 'Personagem', color: 'bg-blue-500' }
      case 'NPC':
        return { icon: <Users className="h-4 w-4" />, label: 'NPC', color: 'bg-green-500' }
      case 'CREATURE':
        return { icon: <Skull className="h-4 w-4" />, label: 'Criatura', color: 'bg-red-500' }
      default:
        return { icon: <User className="h-4 w-4" />, label: 'Token', color: 'bg-gray-500' }
    }
  }

  const typeInfo = getTokenTypeInfo()

  const borderColorOptions = [
    { value: 'border-blue-500', label: 'Azul', color: 'bg-blue-500' },
    { value: 'border-green-500', label: 'Verde', color: 'bg-green-500' },
    { value: 'border-red-500', label: 'Vermelho', color: 'bg-red-500' },
    { value: 'border-yellow-500', label: 'Amarelo', color: 'bg-yellow-500' },
    { value: 'border-purple-500', label: 'Roxo', color: 'bg-purple-500' },
    { value: 'border-orange-500', label: 'Laranja', color: 'bg-orange-500' },
    { value: 'border-pink-500', label: 'Rosa', color: 'bg-pink-500' },
    { value: 'border-gray-500', label: 'Cinza', color: 'bg-gray-500' }
  ]

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        
        <ContextMenuContent className="w-64 bg-background/95 backdrop-blur-sm border-border">
          {/* Cabeçalho do Token */}
          <div className="px-2 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={token.src} alt={token.name || token.alt} />
                <AvatarFallback>
                  {String(token.name || token.alt).charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{token.name || token.alt}</span>
                  {isOwner && <Crown className="h-4 w-4 text-yellow-500" />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {typeInfo.icon}
                  <span>{typeInfo.label}</span>
                  {isLocked && <Lock className="h-3 w-3" />}
                  {isHidden && <EyeOff className="h-3 w-3" />}
                </div>
              </div>
            </div>
          </div>

          {/* Ações Principais */}
          {canEdit && (
            <ContextMenuItem onClick={() => setIsEditDialogOpen(true)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Editar Token
            </ContextMenuItem>
          )}

          <ContextMenuItem onClick={() => onDuplicateToken(token)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicar Token
          </ContextMenuItem>

          <ContextMenuItem onClick={() => onResetPosition(token.id)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Resetar Posição
          </ContextMenuItem>

          {/* Submenu de Cores */}
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Palette className="mr-2 h-4 w-4" />
              Alterar Cor da Borda
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {borderColorOptions.map((option) => (
                <ContextMenuItem
                  key={option.value}
                  onClick={() => onChangeBorderColor(token.id, option.value)}
                >
                  <div className={cn("mr-2 h-4 w-4 rounded-full border", option.color)} />
                  {option.label}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          {/* Controles de Visibilidade e Bloqueio (apenas GM) */}
          {canToggleVisibility && (
            <ContextMenuItem onClick={() => onToggleVisibility(token.id)}>
              {isHidden ? (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Mostrar Token
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Ocultar Token
                </>
              )}
            </ContextMenuItem>
          )}

          {canToggleLock && (
            <ContextMenuItem onClick={() => onToggleLock(token.id)}>
              {isLocked ? (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  Permitir Movimento
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Bloquear Movimento
                </>
              )}
            </ContextMenuItem>
          )}

          {/* Submenu de Propriedade (apenas GM) */}
          {canChangeOwnership && availableUsers.length > 0 && (
            <>
              <ContextMenuSeparator />
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Alterar Proprietário
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-48">
                  <ContextMenuItem onClick={() => onChangeOwnership(token.id, 'gm')}>
                    <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                    Mestre (GM)
                  </ContextMenuItem>
                  {availableUsers.map((user) => (
                    <ContextMenuItem
                      key={user.id}
                      onClick={() => onChangeOwnership(token.id, user.id)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      {user.name}
                    </ContextMenuItem>
                  ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            </>
          )}

          {/* Remover Token */}
          {canDelete && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem 
                onClick={() => onRemoveToken(token.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remover Token
              </ContextMenuItem>
            </>
          )}

          {/* Info para jogadores sem permissões */}
          {!canEdit && !canDelete && userRole === 'PLAYER' && (
            <>
              <ContextMenuSeparator />
              <div className="px-2 py-2 text-xs text-muted-foreground">
                <UserX className="inline mr-1 h-3 w-3" />
                Você não possui permissões para editar este token
              </div>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Editar Token
            </DialogTitle>
            <DialogDescription>
              Altere as propriedades do token "{token.name || token.alt}".
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nome do Token */}
            <div>
              <Label htmlFor="token-name">Nome do Token</Label>
              <Input
                id="token-name"
                value={editedToken.name || ''}
                onChange={(e) => setEditedToken(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome que aparecerá no token"
                className="bg-background"
              />
            </div>

            {/* Cor da Borda */}
            <div>
              <Label htmlFor="border-color">Cor da Borda</Label>
              <Select 
                value={editedToken.borderColor || token.borderColor} 
                onValueChange={(value) => setEditedToken(prev => ({ ...prev, borderColor: value }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {borderColorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-4 w-4 rounded-full border", option.color)} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Permissões (apenas GM) */}
            {userRole === 'GM' && (
              <div>
                <Label>Permissões de Movimento</Label>
                <div className="mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editedToken.canPlayerMove !== false}
                      onChange={(e) => setEditedToken(prev => ({ 
                        ...prev, 
                        canPlayerMove: e.target.checked 
                      }))}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Permitir que jogadores movam este token</span>
                  </label>
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="border rounded-md p-3 bg-muted/30">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="flex items-center gap-3 mt-2">
                <div className={cn(
                  "w-10 h-10 rounded-full border-2 overflow-hidden",
                  editedToken.borderColor || token.borderColor
                )}>
                  <img 
                    src={token.src} 
                    alt={editedToken.name || token.name || token.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-medium">{editedToken.name || token.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {token.characterType} • 
                    {editedToken.canPlayerMove === false ? ' Bloqueado' : ' Movível'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSave}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}