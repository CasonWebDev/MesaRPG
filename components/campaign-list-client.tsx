"use client"

import { useState, useEffect } from "react"
import { CampaignCard, type Campaign } from "./campaign-card"

interface CampaignListClientProps {
  campaigns: Campaign[]
  userPlan: string
  userCredits: number
}

export function CampaignListClient({ campaigns: initialCampaigns, userPlan, userCredits }: CampaignListClientProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)

  useEffect(() => {
    setCampaigns(initialCampaigns);
  }, [initialCampaigns]);

  const handleCampaignReactivated = (campaignId: string) => {
    setCampaigns(currentCampaigns =>
      currentCampaigns.map(c =>
        c.id === campaignId ? { ...c, isArchived: false, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } : c
      )
    );
  };

  const handleCampaignUpdated = () => {
    // A atualização completa pode ser feita com router.refresh() ou uma lógica mais complexa
  }

  const handleCampaignDeleted = (campaignId: string) => {
    setCampaigns(campaigns.filter(c => c.id !== campaignId))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <CampaignCard 
          key={campaign.id}
          campaign={campaign} 
          userPlan={userPlan} 
          userCredits={userCredits} 
          onCampaignReactivated={handleCampaignReactivated}
          onCampaignUpdated={handleCampaignUpdated}
          onCampaignDeleted={() => handleCampaignDeleted(campaign.id)}
        />
      ))}
    </div>
  )
}