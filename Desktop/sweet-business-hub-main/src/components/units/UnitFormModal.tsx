import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { 
  useCreateUnit, 
  useUpdateUnit, 
  type Unit 
} from '@/hooks/useUnitsManagement';
import { useToast } from '@/hooks/use-toast';

interface UnitFormModalProps {
  open: boolean;
  onClose: () => void;
  unit?: Unit | null;
}

export function UnitFormModal({ open, onClose, unit }: UnitFormModalProps) {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');

  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const { toast } = useToast();

  const isEditing = !!unit;
  const isLoading = createUnit.isPending || updateUnit.isPending;

  useEffect(() => {
    if (unit) {
      setName(unit.name);
      setAbbreviation(unit.abbreviation);
    } else {
      setName('');
      setAbbreviation('');
    }
  }, [unit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Preencha o nome da unidade.',
        variant: 'destructive',
      });
      return;
    }

    if (!abbreviation.trim()) {
      toast({
        title: 'Abreviação obrigatória',
        description: 'Preencha a abreviação da unidade.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = {
        name: name.trim(),
        abbreviation: abbreviation.trim().toUpperCase(),
      };

      if (isEditing) {
        await updateUnit.mutateAsync({ id: unit.id, ...data });
        toast({
          title: 'Unidade atualizada',
          description: 'A unidade foi atualizada com sucesso.',
        });
      } else {
        await createUnit.mutateAsync(data);
        toast({
          title: 'Unidade criada',
          description: 'A unidade foi criada com sucesso.',
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar a unidade.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Unidade' : 'Nova Unidade'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Unidade, Quilograma, Litro..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abbreviation">Abreviação *</Label>
              <Input
                id="abbreviation"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
                placeholder="Ex: UN, KG, L..."
                className="font-mono uppercase"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Máximo de 10 caracteres
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
