"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GeneralSettings } from "@/components/settings/general-settings"
import { PlayerManagement } from "@/components/settings/player-management"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Campaign {
  id: string
  name: string
  description: string | null
  system: string
  rpgSystem?: string
  owner: {
    id: string
    name: string | null
    email: string
  }
  members: {
    id: string
    role: string
    joinedAt: string
    user: {
      id: string
      name: string | null
      email: string
    }
  }[]
}

interface SettingsClientProps {
  campaign: Campaign
}

export function SettingsClient({ campaign }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("general")

  return (
    <div className="space-y-6">
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href={`/campaign/${campaign.id}/play`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Jogo
          </Link>
        </Button>
      </div>

      {/* Tabs de configurações */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="players">Jogadores</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as informações básicas da campanha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeneralSettings campaign={campaign} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="players">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Jogadores</CardTitle>
              <CardDescription>
                Gerencie os jogadores da campanha e crie convites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlayerManagement 
                campaignId={campaign.id} 
                members={campaign.members}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}