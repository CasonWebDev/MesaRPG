'use client';

import { CharacterMiniCardProps } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Character as DnDCharacter } from './types';

export function DnD5eMiniCard({ 
  character, 
  onClick,
  campaignId 
}: CharacterMiniCardProps) {
  const data = character.data as DnDCharacter;
  
  // Calcular modificador de um atributo
  const getModifier = (score: number): string => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };
  
  // Calcular nível de proficiência
  const getProficiencyBonus = (level: number): string => {
    const bonus = Math.ceil(level / 4) + 1;
    return `+${bonus}`;
  };
  
  return (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={data.avatar} alt={character.name} />
            <AvatarFallback>
              {character.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">{character.name}</h4>
              <Badge variant="secondary" className="text-xs">
                {character.type}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <span>{data.class || 'Guerreiro'}</span>
              <span>Nível {data.level || 1}</span>
              <span>• {data.race || 'Humano'}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">HP:</span>
                <span className={`font-medium ${
                  (data.currentHitPoints || 1) < (data.maxHitPoints || 1) * 0.5 
                    ? 'text-red-500' 
                    : 'text-green-600'
                }`}>
                  {data.currentHitPoints || 1}/{data.maxHitPoints || 1}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">CA:</span>
                <span className="font-medium">{data.armorClass || 10}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Prof:</span>
                <span className="font-medium">{getProficiencyBonus(data.level || 1)}</span>
              </div>
            </div>
            
            {data.abilities && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">Atributos:</span>
                <span className="font-medium">
                  FOR {getModifier(data.abilities.forca)}
                </span>
                <span className="font-medium">
                  DES {getModifier(data.abilities.destreza)}
                </span>
                <span className="font-medium">
                  CON {getModifier(data.abilities.constituicao)}
                </span>
              </div>
            )}
            
            {data.spellSlots && Object.keys(data.spellSlots).length > 0 && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">Magias:</span>
                {Object.entries(data.spellSlots).map(([level, slots]) => (
                  <span key={level} className="font-medium">
                    {level}º: {slots.current}/{slots.max}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}