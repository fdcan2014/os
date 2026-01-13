import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Award } from 'lucide-react';
import { useAllBrands, useDeleteBrand, type Brand } from '@/hooks/useBrands';
import { BrandFormModal } from '@/components/brands/BrandFormModal';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Brands() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  
  const { data: brands, isLoading } = useAllBrands();
  const deleteBrand = useDeleteBrand();
  const { toast } = useToast();

  const filteredBrands = brands?.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingBrand) return;
    
    try {
      await deleteBrand.mutateAsync(deletingBrand.id);
      toast({
        title: 'Marca excluída',
        description: 'A marca foi excluída com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a marca.',
        variant: 'destructive',
      });
    } finally {
      setDeletingBrand(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingBrand(null);
  };

  return (
    <MainLayout title="Marcas">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marcas</h1>
            <p className="text-muted-foreground">
              Gerencie as marcas de produtos do sistema.
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Marca
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar marcas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredBrands?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Award className="w-8 h-8" />
                      <span>Nenhuma marca encontrada</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBrands?.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {brand.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={brand.is_active ? 'default' : 'secondary'}>
                        {brand.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleEdit(brand)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingBrand(brand)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Form Modal */}
      <BrandFormModal
        open={isFormOpen}
        onClose={handleFormClose}
        brand={editingBrand}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBrand} onOpenChange={() => setDeletingBrand(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a marca "{deletingBrand?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
