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

import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Wand2 } from 'lucide-react';
import { 
  useCreateCategory, 
  useUpdateCategory, 
  useAllCategories,
  generateCategoryCode,
  type Category 
} from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

export function CategoryFormModal({ open, onClose, category }: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const { data: categories } = useAllCategories();
  const { toast } = useToast();

  const isEditing = !!category;
  const isLoading = createCategory.isPending || updateCategory.isPending;

  // Filter out current category and its children for parent selection
  const availableParents = categories?.filter(c => c.id !== category?.id);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setCode(category.code || '');
      setParentId(category.parent_id || '');
      setIsActive(category.is_active ?? true);
    } else {
      setName('');
      setCode('');
      setParentId('');
      setIsActive(true);
    }
  }, [category, open]);

  const handleGenerateCode = async () => {
    if (!name.trim()) {
      toast({
        title: 'Nome necessário',
        description: 'Preencha o nome da categoria para gerar o código.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingCode(true);
    try {
      const generatedCode = await generateCategoryCode(name);
      setCode(generatedCode);
    } catch (error) {
      toast({
        title: 'Erro ao gerar código',
        description: 'Não foi possível gerar o código automaticamente.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Preencha o nome da categoria.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = {
        name: name.trim(),
        code: code.trim() || null,
        parent_id: parentId || null,
        is_active: isActive,
      };

      if (isEditing) {
        await updateCategory.mutateAsync({ id: category.id, ...data });
        toast({
          title: 'Categoria atualizada',
          description: 'A categoria foi atualizada com sucesso.',
        });
      } else {
        await createCategory.mutateAsync(data);
        toast({
          title: 'Categoria criada',
          description: 'A categoria foi criada com sucesso.',
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar a categoria.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
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
                placeholder="Nome da categoria"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ELE, ACC, AUD..."
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode}
                >
                  {isGeneratingCode ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent">Categoria Pai</Label>
              <Select value={parentId || "none"} onValueChange={(val) => setParentId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                  {availableParents?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Categoria ativa</Label>
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
