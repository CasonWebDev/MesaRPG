import { useState, useEffect } from 'react'

interface MapFreezeState {
  isFrozen: boolean
  freezeMessage: string
}

export function useMapFreeze(campaignId: string) {
  const [freezeState, setFreezeState] = useState<MapFreezeState>({
    isFrozen: false,
    freezeMessage: ''
  })

  // Função para congelar o mapa
  const freezeMap = async (message: string = 'Mapa congelado pelo mestre') => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/freeze-map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          frozen: true, 
          message 
        }),
      })

      if (response.ok) {
        setFreezeState({
          isFrozen: true,
          freezeMessage: message
        })
      }
    } catch (error) {
      console.error('Erro ao congelar mapa:', error)
    }
  }

  // Função para descongelar o mapa
  const unfreezeMap = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/freeze-map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          frozen: false, 
          message: '' 
        }),
      })

      if (response.ok) {
        setFreezeState({
          isFrozen: false,
          freezeMessage: ''
        })
      }
    } catch (error) {
      console.error('Erro ao descongelar mapa:', error)
    }
  }

  // Alternar estado do congelamento
  const toggleFreeze = async (message?: string) => {
    if (freezeState.isFrozen) {
      await unfreezeMap()
    } else {
      await freezeMap(message)
    }
  }

  // Carregar estado inicial
  useEffect(() => {
    const loadFreezeState = async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/game-state`)
        if (response.ok) {
          const data = await response.json()
          if (data.gameState?.mapFrozen) {
            setFreezeState({
              isFrozen: true,
              freezeMessage: data.gameState.freezeMessage || 'Mapa congelado'
            })
          }
        }
      } catch (error) {
        console.error('Erro ao carregar estado do mapa:', error)
      }
    }

    loadFreezeState()
  }, [campaignId])

  return {
    isFrozen: freezeState.isFrozen,
    freezeMessage: freezeState.freezeMessage,
    freezeMap,
    unfreezeMap,
    toggleFreeze
  }
}