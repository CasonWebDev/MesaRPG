"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GeneralSettings } from "@/components/settings/general-settings"
import { PlayerManagement } from "@/components/settings/player-management"
import { SheetTemplates } from "@/components/settings/sheet-templates"

interface CampaignData {
  id: string
  name: string
  description: string | null
  system: string
  ownerId: string
  isActive: boolean
  playerLimit: number | null
  settings: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name: string | null
    email: string
  }
  members: Array<{
    id: string
    campaignId: string
    userId: string
    role: string
    joinedAt: string
    user: {
      id: string
      name: string | null
      email: string
    }
  }>
  invites: Array<{
    id: string
    campaignId: string
    token: string
    createdById: string
    usedById: string | null
    expiresAt: string | null
    usedAt: string | null
    createdAt: string
    createdBy: {
      name: string | null
    }
  }>
}

interface CampaignSettingsClientProps {
  campaign: CampaignData
}

export function CampaignSettingsClient({ campaign }: CampaignSettingsClientProps) {
  const [currentTab, setCurrentTab] = useState("general")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-secondary/50 p-4 shadow-md mb-8">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading text-primary">Configurações da Campanha</h1>
            <p className="text-muted-foreground mt-1">{campaign.name}</p>
          </div>
          <Link href={`/campaign/${campaign.id}/play`}>
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o Jogo
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="container mx-auto">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="players">Jogadores</TabsTrigger>
            <TabsTrigger value="templates">Templates de Ficha</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Gerencie as configurações básicas da sua campanha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GeneralSettings campaign={campaign} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="players" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Jogadores</CardTitle>
                <CardDescription>
                  Adicione, remova e gerencie jogadores da campanha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PlayerManagement campaign={campaign} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Templates de Ficha</CardTitle>
                <CardDescription>
                  Configure templates de fichas para personagens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SheetTemplates campaign={campaign} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}