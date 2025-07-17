import { useState, useEffect } from 'react'

interface MapFreezeState {
  mapFrozen: boolean
  frozenBy: string | null
  frozenByName: string | null
  frozenAt: string | null
  loading: boolean
}

export function useMapFreeze(campaignId: string, isGM: boolean) {
  const [state, setState] = useState<MapFreezeState>({
    mapFrozen: false,
    frozenBy: null,
    frozenByName: null,
    frozenAt: null,
    loading: false
  })

  // Função para alternar estado do congelamento
  const toggleFreeze = async () => {
    if (!isGM) return

    setState(prev => ({ ...prev, loading: true }))

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/freeze-map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          frozen: !state.mapFrozen
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setState(prev => ({
          ...prev,
          mapFrozen: data.mapFrozen,
          frozenBy: data.frozenBy,
          frozenByName: data.frozenByName,
          frozenAt: data.frozenAt,
          loading: false
        }))
      } else {
        console.error('Erro ao alterar estado do mapa:', response.statusText)
        setState(prev => ({ ...prev, loading: false }))
      }
    } catch (error) {
      console.error('Erro ao alterar estado do mapa:', error)
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  // Carregar estado inicial
  useEffect(() => {
    const loadFreezeState = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/freeze-map`)
        if (response.ok) {
          const data = await response.json()
          setState(prev => ({
            ...prev,
            mapFrozen: data.mapFrozen || false,
            frozenBy: data.frozenBy || null,
            frozenByName: data.frozenByName || null,
            frozenAt: data.frozenAt || null
          }))
        }
      } catch (error) {
        console.error('Erro ao carregar estado do mapa:', error)
      }
    }

    if (campaignId) {
      loadFreezeState()
    }
  }, [campaignId])

  return {
    mapFrozen: state.mapFrozen,
    frozenBy: state.frozenBy,
    frozenByName: state.frozenByName,
    frozenAt: state.frozenAt,
    loading: state.loading,
    toggleFreeze
  }
}