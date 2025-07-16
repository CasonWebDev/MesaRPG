'use client';

import { useState, useEffect } from 'react';
import { Character } from '@prisma/client';
import { getRPGSystem } from '@/lib/rpg-systems';
import { Skeleton } from '@/components/ui/skeleton';

interface UniversalMiniCardProps {
  character: Character;
  onClick?: () => void;
  campaignId: string;
  systemId?: string;
}

export function UniversalMiniCard({ 
  character, 
  onClick, 
  campaignId, 
  systemId = 'generic' 
}: UniversalMiniCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [rpgSystem, setRpgSystem] = useState<any>(null);
  
  useEffect(() => {
    const system = getRPGSystem(systemId);
    setRpgSystem(system);
    setIsLoading(false);
  }, [systemId]);
  
  if (isLoading || !rpgSystem) {
    return (
      <div className="p-3">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    );
  }
  
  const { CharacterMiniCard } = rpgSystem;
  
  return (
    <CharacterMiniCard
      character={character}
      onClick={onClick}
      campaignId={campaignId}
    />
  );
}