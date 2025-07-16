'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserPlus, User } from 'lucide-react';

interface TransferCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (characterId: string, newUserId: string) => void;
  character: any;
  campaignId: string;
}

export function TransferCharacterModal({
  isOpen,
  onClose,
  onConfirm,
  character,
  campaignId
}: TransferCharacterModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [campaignMembers, setCampaignMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCampaignMembers();
    }
  }, [isOpen, campaignId]);

  const fetchCampaignMembers = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/players`);
      if (response.ok) {
        const data = await response.json();
        setCampaignMembers(data.players || []);
      }
    } catch (error) {
      console.error('Erro ao buscar membros da campanha:', error);
    }
  };

  const handleTransfer = async () => {
    if (!selectedUserId) return;
    
    setIsLoading(true);
    try {
      await onConfirm(character.id, selectedUserId);
      onClose();
    } catch (error) {
      console.error('Erro ao transferir personagem:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Transferir Personagem
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Personagem</Label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded">
              <User className="h-4 w-4" />
              <span>{character.name}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="player-select">Transferir para</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="player-select">
                <SelectValue placeholder="Selecione um jogador" />
              </SelectTrigger>
              <SelectContent>
                {campaignMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{member.name || member.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Este personagem será transferido para o jogador selecionado. 
            O jogador atual perderá acesso ao personagem.
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={!selectedUserId || isLoading}
          >
            {isLoading ? 'Transferindo...' : 'Transferir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}