'use client';

import { useState, useEffect } from 'react';
import { Character } from '@prisma/client';
import { getRPGSystem } from '@/lib/rpg-systems';
import { Skeleton } from '@/components/ui/skeleton';

interface UniversalCharacterSheetProps {
  character: Character;
  onUpdate: (data: any) => void;
  isEditing: boolean;
  campaignId: string;
  systemId?: string;
}

export function UniversalCharacterSheet({ 
  character, 
  onUpdate, 
  isEditing, 
  campaignId, 
  systemId = 'generic' 
}: UniversalCharacterSheetProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [rpgSystem, setRpgSystem] = useState<any>(null);
  
  useEffect(() => {
    const system = getRPGSystem(systemId);
    setRpgSystem(system);
    setIsLoading(false);
  }, [systemId]);
  
  if (isLoading || !rpgSystem) {
    return (
      <div className="w-full h-full space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  const { CharacterSheet } = rpgSystem;
  
  return (
    <div className="w-full h-full">
      <CharacterSheet
        character={character}
        onUpdate={onUpdate}
        isEditing={isEditing}
        campaignId={campaignId}
      />
    </div>
  );
}