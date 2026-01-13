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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { 
  useCreateBrand, 
  useUpdateBrand, 
  type Brand 
} from '@/hooks/useBrands';
import { useToast } from '@/hooks/use-toast';

interface BrandFormModalProps {
  open: boolean;
  onClose: () => void;
  brand?: Brand | null;
}

export function BrandFormModal({ open, onClose, brand }: BrandFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const { toast } = useToast();

  const isEditing = !!brand;
  const isLoading = createBrand.isPending || updateBrand.isPending;

  useEffect(() => {
    if (brand) {
      setName(brand.name);
      setDescription(brand.description || '');
      setLogoUrl(brand.logo_url || '');
      setIsActive(brand.is_active ?? true);
    } else {
      setName('');
      setDescription('');
      setLogoUrl('');
      setIsActive(true);
    }
  }, [brand, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Preencha o nome da marca.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = {
        name: name.trim(),
        description: description.trim() || null,
        logo_url: logoUrl.trim() || null,
        is_active: isActive,
      };

      if (isEditing) {
        await updateBrand.mutateAsync({ id: brand.id, ...data });
        toast({
          title: 'Marca atualizada',
          description: 'A marca foi atualizada com sucesso.',
        });
      } else {
        await createBrand.mutateAsync(data);
        toast({
          title: 'Marca criada',
          description: 'A marca foi criada com sucesso.',
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar a marca.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Marca' : 'Nova Marca'}
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
                placeholder="Nome da marca"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da marca (opcional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://exemplo.com/logo.png"
                type="url"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Marca ativa</Label>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
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
