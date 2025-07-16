'use client';

import { useState, useEffect } from 'react';
import { getRPGSystem } from '@/lib/rpg-systems';
import { Skeleton } from '@/components/ui/skeleton';

interface UniversalCharacterCreatorProps {
  campaignId: string;
  characterType: 'PC' | 'NPC' | 'CREATURE';
  onSubmit: (data: any) => void;
  onCancel: () => void;
  systemId?: string;
}

export function UniversalCharacterCreator({ 
  campaignId, 
  characterType, 
  onSubmit, 
  onCancel, 
  systemId = 'dnd5e' 
}: UniversalCharacterCreatorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [rpgSystem, setRpgSystem] = useState<any>(null);
  
  useEffect(() => {
    const system = getRPGSystem(systemId);
    setRpgSystem(system);
    setIsLoading(false);
  }, [systemId]);
  
  if (isLoading || !rpgSystem) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }
  
  const { CharacterCreator } = rpgSystem;
  
  return (
    <CharacterCreator
      campaignId={campaignId}
      characterType={characterType}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}