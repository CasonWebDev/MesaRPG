"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MoreVertical, Edit, Trash2, Settings, Archive } from "lucide-react"
import { EditCampaignDialog } from "./edit-campaign-dialog"
import { DeleteCampaignDialog } from "./delete-campaign-dialog"
import { cn } from "@/lib/utils"

export interface Campaign {
  id: string
  name: string
  description: string
  system: string
  userRole: "Mestre" | "Jogador"
  isArchived: boolean
}

interface CampaignCardProps {
  campaign: Campaign
  onCampaignUpdated?: () => void
  onCampaignDeleted?: () => void
}

export function CampaignCard({ campaign, onCampaignUpdated, onCampaignDeleted }: CampaignCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const cardContent = (
    <Card className={cn("bg-parchment text-ink-text flex flex-col transition-opacity", {
      "opacity-50": campaign.isArchived,
    })}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-2xl font-heading flex items-center gap-2">
              {campaign.isArchived && <Archive className="h-5 w-5 text-muted-foreground" />}
              {campaign.name}
            </CardTitle>
            <CardDescription className="text-ink-text/80 pt-1">{campaign.system}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={campaign.userRole === "Mestre" ? "default" : "secondary"} className="whitespace-nowrap">
              {campaign.userRole}
            </Badge>
            {campaign.userRole === "Mestre" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" disabled={campaign.isArchived}>
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Menu de opções</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/campaign/${campaign.id}/settings`} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Configurações
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsEditDialogOpen(true)}
                    className="cursor-pointer"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p>{campaign.description}</p>
      </CardContent>
      <CardFooter>
        <Link href={`/campaign/${campaign.id}/play?role=${campaign.userRole}`} className={cn("w-full", { "pointer-events-none": campaign.isArchived })}>
          <Button className="w-full" disabled={campaign.isArchived}>Entrar na Campanha</Button>
        </Link>
      </CardFooter>

      <EditCampaignDialog
        campaign={campaign}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onCampaignUpdated={onCampaignUpdated}
      />

      <DeleteCampaignDialog
        campaign={campaign}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onCampaignDeleted={onCampaignDeleted}
      />
    </Card>
  );

  if (campaign.isArchived) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{cardContent}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Esta campanha está desativada. Para reativá-la, mude para um plano pago.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
}
