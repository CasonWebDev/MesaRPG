'use client';

import { CharacterMiniCardProps } from '../types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function TemplateBasedMiniCard({ 
  character, 
  onClick,
  campaignId 
}: CharacterMiniCardProps) {
  const data = character.data as any;
  
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
              {data.class && (
                <span>{data.class}</span>
              )}
              {data.level && (
                <span>Nível {data.level}</span>
              )}
              {data.race && (
                <span>• {data.race}</span>
              )}
            </div>
            
            {(data.hp || data.currentHp) && (
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-muted-foreground">HP:</span>
                <span className={`font-medium ${
                  (data.currentHp || data.hp) < (data.maxHp || data.hp) * 0.5 
                    ? 'text-red-500' 
                    : 'text-green-600'
                }`}>
                  {data.currentHp || data.hp}/{data.maxHp || data.hp}
                </span>
                {data.ac && (
                  <>
                    <span className="text-muted-foreground">• AC:</span>
                    <span className="font-medium">{data.ac}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}