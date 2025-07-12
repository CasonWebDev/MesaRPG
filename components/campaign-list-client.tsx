"use client"

import { useRouter } from "next/navigation"
import { CampaignCard, type Campaign } from "./campaign-card"

interface CampaignListClientProps {
  campaigns: Campaign[]
}

export function CampaignListClient({ campaigns }: CampaignListClientProps) {
  const router = useRouter()

  const handleCampaignUpdated = () => {
    router.refresh()
  }

  const handleCampaignDeleted = () => {
    router.refresh()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <CampaignCard 
          key={campaign.id} 
          campaign={campaign}
          onCampaignUpdated={handleCampaignUpdated}
          onCampaignDeleted={handleCampaignDeleted}
        />
      ))}
    </div>
  )
}