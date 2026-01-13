import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  useCreateServiceType, 
  useUpdateServiceType, 
  type ServiceType,
  type ServiceTypeInput 
} from '@/hooks/useServiceTypes';

interface ServiceTypeFormModalProps {
  open: boolean;
  onClose: () => void;
  serviceType?: ServiceType | null;
}

export function ServiceTypeFormModal({ open, onClose, serviceType }: ServiceTypeFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const createMutation = useCreateServiceType();
  const updateMutation = useUpdateServiceType();

  const isEditing = !!serviceType;

  useEffect(() => {
    if (open) {
      if (serviceType) {
        setName(serviceType.name);
        setDescription(serviceType.description || '');
        setIsActive(serviceType.is_active ?? true);
      } else {
        setName('');
        setDescription('');
        setIsActive(true);
      }
    }
  }, [open, serviceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: ServiceTypeInput = {
      name: name.trim(),
      description: description.trim() || null,
      is_active: isActive,
    };

    try {
      if (isEditing && serviceType) {
        await updateMutation.mutateAsync({ id: serviceType.id, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tipo de Serviço' : 'Novo Tipo de Serviço'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Manutenção Preventiva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o tipo de serviço..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Ativo</Label>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
