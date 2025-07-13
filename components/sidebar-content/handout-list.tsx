"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PlusCircle, Share2, Pencil, Trash2, CheckCircle, Loader2, Eye } from "lucide-react"
import { ContentListItem } from "./content-list-item"
import { EditContentModal } from "../modals/edit-content-modal"
import { DeleteContentModal } from "../modals/delete-content-modal"
import { AddContentModal } from "../modals/add-content-modal"
import { ViewHandoutModal } from "../modals/view-handout-modal"
import { ShareHandoutModal } from "../modals/share-handout-modal"
import { HandoutSearch, type HandoutFilters } from "@/components/ui/handout-search"
import { HandoutStats } from "@/components/ui/handout-stats"
import { useHandouts, type Handout } from "@/hooks/use-handouts"
import { useToast } from "@/components/ui/use-toast"

interface HandoutListProps {
  campaignId: string
  sharedIds: string[]
  onShare: (id: string) => void
}

export function HandoutList({ campaignId, sharedIds, onShare }: HandoutListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingItem, setEditingItem] = useState<Handout | null>(null)
  const [deletingItem, setDeletingItem] = useState<Handout | null>(null)
  const [viewingItem, setViewingItem] = useState<Handout | null>(null)
  const [sharingItem, setSharingItem] = useState<Handout | null>(null)
  const [filters, setFilters] = useState<HandoutFilters>({
    search: '',
    showShared: true,
    showPrivate: true,
    hasAttachments: null
  })
  
  const { handouts, isLoading, error, createHandout, updateHandout, deleteHandout, shareHandout } = useHandouts(campaignId)
  const { toast } = useToast()

  // Filtrar handouts baseado nos critérios
  const filteredHandouts = handouts.filter((handout) => {
    // Filtro de busca
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const matchesName = handout.name.toLowerCase().includes(searchTerm)
      const matchesContent = handout.content.toLowerCase().includes(searchTerm)
      if (!matchesName && !matchesContent) return false
    }

    // Filtro de compartilhamento (apenas para GM)
    const isShared = handout.sharedWith.length > 0
    if (!filters.showShared && isShared) return false
    if (!filters.showPrivate && !isShared) return false

    // Filtro de anexos
    if (filters.hasAttachments !== null) {
      const hasAttachments = handout.attachments && handout.attachments.length > 0
      if (filters.hasAttachments && !hasAttachments) return false
      if (!filters.hasAttachments && hasAttachments) return false
    }

    return true
  })

  const handleShareClick = (handout: Handout) => {
    setSharingItem(handout)
  }

  const handleShare = async (handoutId: string, sharedWith: string[]) => {
    try {
      await shareHandout(handoutId, sharedWith)
      onShare(handoutId)
      
      toast({
        title: "Utilitário compartilhado",
        description: `Utilitário foi atualizado com sucesso.`
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao compartilhar utilitário.",
        variant: "destructive"
      })
      throw error
    }
  }

  const handleCreate = async (data: { name: string; content: string; attachments?: string[] }) => {
    try {
      await createHandout(data)
      setIsAdding(false)
      toast({
        title: "Utilitário criado",
        description: `${data.name} foi criado com sucesso.`
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar utilitário.",
        variant: "destructive"
      })
    }
  }

  const handleEdit = async (data: { name: string; content: string; attachments?: string[] }) => {
    if (!editingItem) return
    
    try {
      await updateHandout(editingItem.id, data)
      setEditingItem(null)
      toast({
        title: "Utilitário atualizado",
        description: `${data.name} foi atualizado com sucesso.`
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar utilitário.",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    
    try {
      await deleteHandout(deletingItem.id)
      setDeletingItem(null)
      toast({
        title: "Utilitário excluído",
        description: `${deletingItem.name} foi excluído com sucesso.`
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir utilitário.",
        variant: "destructive"
      })
    }
  }

  if (error) {
    return (
      <div className="space-y-2 p-1">
        <div className="text-sm text-destructive">
          Erro ao carregar utilitários: {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 p-1">
      <Button size="sm" className="w-full" onClick={() => setIsAdding(true)} disabled={isLoading}>
        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Utilitário
      </Button>
      
      <HandoutSearch
        filters={filters}
        onFiltersChange={setFilters}
        isGM={true}
      />
      
      <HandoutStats handouts={handouts} isGM={true} />
      
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredHandouts.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            {handouts.length === 0 
              ? "Nenhum utilitário criado ainda."
              : "Nenhum utilitário encontrado com os filtros aplicados."
            }
          </div>
        ) : (
          <TooltipProvider delayDuration={0}>
            {filteredHandouts.map((handout) => {
              const isShared = handout.sharedWith.length > 0
              
              return (
                <ContentListItem 
                  key={handout.id} 
                  title={handout.name} 
                  description={handout.content.substring(0, 100) + (handout.content.length > 100 ? '...' : '')}
                  showImage={false}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewingItem(handout)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Visualizar</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleShareClick(handout)}
                      >
                        {isShared ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isShared ? "Gerenciar compartilhamento" : "Compartilhar"}</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingItem(handout)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Editar</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeletingItem(handout)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Excluir</TooltipContent>
                  </Tooltip>
                </ContentListItem>
              )
            })}
          </TooltipProvider>
        )}
      </div>

      <AddContentModal 
        itemType="Utilitário" 
        isOpen={isAdding} 
        onClose={() => setIsAdding(false)}
        onSubmit={handleCreate}
      />

      {editingItem && (
        <EditContentModal
          item={{
            id: editingItem.id,
            name: editingItem.name,
            description: editingItem.content,
            imageUrl: undefined,
            attachments: editingItem.attachments
          }}
          itemType="Utilitário"
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSubmit={handleEdit}
        />
      )}

      {deletingItem && (
        <DeleteContentModal
          item={{
            id: deletingItem.id,
            name: deletingItem.name,
            description: deletingItem.content
          }}
          itemType="Utilitário"
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDelete}
        />
      )}
      
      <ViewHandoutModal
        handout={viewingItem}
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
      />
      
      <ShareHandoutModal
        handout={sharingItem}
        isOpen={!!sharingItem}
        onClose={() => setSharingItem(null)}
        onShare={handleShare}
        campaignId={campaignId}
      />
    </div>
  )
}
