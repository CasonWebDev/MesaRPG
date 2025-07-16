'use client';

import { CharacterSheetProps } from '../types';
import { CharacterSheetView } from '@/components/character-sheet-view';

export function TemplateBasedCharacterSheet({ 
  character, 
  onUpdate, 
  isEditing,
  campaignId 
}: CharacterSheetProps) {
  // Usa o componente existente do sistema de templates
  // Mantém 100% da funcionalidade atual
  return (
    <div className="w-full h-full">
      <CharacterSheetView
        character={character}
        onUpdate={onUpdate}
        isEditing={isEditing}
        campaignId={campaignId}
      />
    </div>
  );
}