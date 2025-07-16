"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, X } from "lucide-react"

export interface HandoutFilters {
  search: string
  showShared: boolean
  showPrivate: boolean
  hasAttachments: boolean | null
}

interface HandoutSearchProps {
  filters: HandoutFilters
  onFiltersChange: (filters: HandoutFilters) => void
  isGM?: boolean
}

export function HandoutSearch({ filters, onFiltersChange, isGM = false }: HandoutSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const handleFilterChange = (key: keyof Omit<HandoutFilters, 'search'>, value: boolean | null) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      showShared: true,
      showPrivate: true,
      hasAttachments: null
    })
  }

  const activeFiltersCount = [
    !filters.showShared || !filters.showPrivate,
    filters.hasAttachments !== null
  ].filter(Boolean).length

  const hasActiveFilters = filters.search.length > 0 || activeFiltersCount > 0

  return (
    <div className="space-y-2">
      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar utilitários..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-16 bg-background/50"
        />
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Botão de filtro */}
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filtros</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {isGM && (
                <>
                  <DropdownMenuCheckboxItem
                    checked={filters.showShared}
                    onCheckedChange={(checked) => handleFilterChange('showShared', !!checked)}
                  >
                    Compartilhados
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.showPrivate}
                    onCheckedChange={(checked) => handleFilterChange('showPrivate', !!checked)}
                  >
                    Privados
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuCheckboxItem
                checked={filters.hasAttachments === true}
                onCheckedChange={(checked) => 
                  handleFilterChange('hasAttachments', checked ? true : null)
                }
              >
                Com anexos
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.hasAttachments === false}
                onCheckedChange={(checked) => 
                  handleFilterChange('hasAttachments', checked ? false : null)
                }
              >
                Sem anexos
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botão limpar */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={clearFilters}
              title="Limpar filtros"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Badges de filtros ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1">
          {filters.search && (
            <Badge variant="secondary" className="text-xs text-foreground">
              Busca: "{filters.search}"
            </Badge>
          )}
          {isGM && !filters.showShared && (
            <Badge variant="secondary" className="text-xs text-foreground">
              Ocultando compartilhados
            </Badge>
          )}
          {isGM && !filters.showPrivate && (
            <Badge variant="secondary" className="text-xs text-foreground">
              Ocultando privados
            </Badge>
          )}
          {filters.hasAttachments === true && (
            <Badge variant="secondary" className="text-xs text-foreground">
              Com anexos
            </Badge>
          )}
          {filters.hasAttachments === false && (
            <Badge variant="secondary" className="text-xs text-foreground">
              Sem anexos
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}