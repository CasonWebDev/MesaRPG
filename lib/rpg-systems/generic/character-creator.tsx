'use client';

import { CharacterCreatorProps } from '../types';
import { CreateCharacterDialog } from '@/components/create-character-dialog';

export function TemplateBasedCreator({ 
  campaignId, 
  characterType, 
  onSubmit, 
  onCancel 
}: CharacterCreatorProps) {
  // Usa o componente existente de criação de personagem
  // Mantém 100% da funcionalidade atual
  return (
    <CreateCharacterDialog
      campaignId={campaignId}
      characterType={characterType}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}