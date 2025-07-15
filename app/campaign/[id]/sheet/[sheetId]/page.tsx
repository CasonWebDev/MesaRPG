"use client"

import { useState, useEffect, useRef, use } from "react"
import Link from "next/link"
import { Printer, Check, Loader2, AlertCircle, ArrowLeft, Download, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRPGSystem } from "@/lib/rpg-systems"
import type { UserRole } from "@/app/campaign/[id]/play/page"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

export default function SheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; sheetId: string }>
  searchParams: Promise<{ role?: UserRole; type?: "player" | "npc" | "creature" }>
}) {
  const [sheetData, setSheetData] = useState<Record<string, any> | null>(null)
  const [character, setCharacter] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [isOnline, setIsOnline] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resolvedParams = use(params)
  const resolvedSearchParams = use(searchParams)
  
  const userRole = resolvedSearchParams.role || "Jogador"
  const type = resolvedSearchParams.type || "player"

  // Obter sistema RPG (sempre D&D 5e)
  const rpgSystem = getRPGSystem('dnd5e')
  
  // Obter sessão do usuário
  const { data: session } = useSession()

  useEffect(() => {
    const loadCharacterData = async () => {
      try {
        setLoading(true)
        
        // Buscar dados do personagem
        const characterResponse = await fetch(`/api/campaigns/${resolvedParams.id}/characters/${resolvedParams.sheetId}`)
        if (!characterResponse.ok) {
          throw new Error('Personagem não encontrado')
        }
        
        const characterData = await characterResponse.json()
        const characterInfo = characterData.character
        
        if (!characterInfo) {
          throw new Error('Personagem não encontrado')
        }
        
        setCharacter(characterInfo)
        
        // Parsear dados do personagem
        let parsedData: Record<string, any> = {}
        if (characterInfo.data) {
          parsedData = typeof characterInfo.data === 'string' 
            ? JSON.parse(characterInfo.data) 
            : characterInfo.data
        }
        
        setSheetData(parsedData)
        
      } catch (error) {
        console.error('Erro ao carregar personagem:', error)
        toast.error('Erro ao carregar dados do personagem')
      } finally {
        setLoading(false)
      }
    }
    
    loadCharacterData()
  }, [resolvedParams.id, resolvedParams.sheetId])

  // Cleanup do timeout ao desmontar o componente
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Listener para status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Se havia erro de salvamento, tentar salvar novamente
      if (saveStatus === 'error' && sheetData) {
        autoSave(sheetData)
      }
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [saveStatus, sheetData])

  // Salvamento automático
  const autoSave = async (data: Record<string, any>) => {
    if (!isOnline) {
      setSaveStatus('error')
      return
    }
    
    try {
      setSaveStatus('saving')
      const response = await fetch(`/api/campaigns/${resolvedParams.id}/characters/${resolvedParams.sheetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: character?.name || 'Personagem',
          data: data
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar personagem')
      }
      
      setSaveStatus('saved')
      // Voltar para idle após 2 segundos
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Erro ao salvar automaticamente:', error)
      setSaveStatus('error')
      // Voltar para idle após 3 segundos
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleDataChange = (fieldName: string, value: any) => {
    let newData: Record<string, any>
    
    // Se o fieldName é 'characterData', substituir todos os dados
    if (fieldName === 'characterData') {
      newData = value
    } else {
      newData = sheetData ? { ...sheetData, [fieldName]: value } : { [fieldName]: value }
    }
    
    setSheetData(newData)
    
    // Limpar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Definir novo timeout para salvar após 1 segundo
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newData)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl">Carregando ficha...</h1>
      </div>
    )
  }

  if (!sheetData || !character) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-2xl">Personagem não encontrado</h1>
        <Link href={`/campaign/${resolvedParams.id}/play?role=${userRole}`}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a campanha
          </Button>
        </Link>
      </div>
    )
  }

  const sheetName = character.name || "Ficha"

  // Usar o componente CharacterSheet do sistema D&D 5e
  const { CharacterSheet } = rpgSystem

  // Função para imprimir a ficha
  const handlePrint = () => {
    window.print()
  }

  // Função para exportar a ficha
  const handleExport = () => {
    const dataStr = JSON.stringify(sheetData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${character?.name || 'personagem'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  // Função para importar a ficha
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target?.result as string);
          setSheetData(importedData);
          
          // Salvar automaticamente
          autoSave(importedData);
          
          toast.success('Ficha importada com sucesso!');
        } catch (error) {
          console.error('Erro ao importar ficha:', error);
          toast.error('Erro ao importar ficha. Verifique se o arquivo é válido.');
        }
      };
      reader.readAsText(file);
    }
  }

  // Componente para mostrar o status do salvamento
  const SaveStatusIndicator = () => {
    if (!isOnline) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4" />
          Desconectado
        </div>
      )
    }
    
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando...
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            Salvo
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            Erro ao salvar
          </div>
        )
      default:
        return (
          <span className="text-sm text-muted-foreground">
            Salvamento automático
          </span>
        )
    }
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Ocultar elementos que não devem ser impressos */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Ajustar margens para impressão */
          body {
            margin: 0;
            padding: 0;
          }
          
          /* Garantir que a ficha ocupe toda a página */
          main {
            margin: 0 !important;
            padding: 1rem !important;
            max-width: none !important;
          }
          
          /* Quebrar páginas apropriadamente */
          .page-break {
            page-break-before: always;
          }
          
          /* Ajustar cores para impressão */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Ajustar tamanhos para impressão */
          .container {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
      
      <div className="min-h-screen bg-background text-foreground">
        <header className="bg-secondary/50 p-4 shadow-md sticky top-0 z-10 print:hidden">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href={`/campaign/${resolvedParams.id}/play?role=${userRole}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-heading text-primary truncate pr-4">{sheetName}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
              <Button variant="outline" onClick={() => document.getElementById('import-file')?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
              <SaveStatusIndicator />
            </div>
          </div>
        </header>
        <main className="container mx-auto py-8">
          <CharacterSheet
            characterData={sheetData}
            isEditing={true}
            onDataChange={handleDataChange}
            characterType={character?.type as 'PC' | 'NPC' | 'CREATURE'}
            campaignId={resolvedParams.id}
            userName={session?.user?.name || 'Usuário'}
          />
        </main>
      </div>
    </>
  )
}