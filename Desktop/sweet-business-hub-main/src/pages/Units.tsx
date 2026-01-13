import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Ruler } from 'lucide-react';
import { useAllUnits, useDeleteUnit, type Unit } from '@/hooks/useUnitsManagement';
import { UnitFormModal } from '@/components/units/UnitFormModal';
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

export default function Units() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  
  const { data: units, isLoading } = useAllUnits();
  const deleteUnit = useDeleteUnit();
  const { toast } = useToast();

  const filteredUnits = units?.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingUnit) return;
    
    try {
      await deleteUnit.mutateAsync(deletingUnit.id);
      toast({
        title: 'Unidade excluída',
        description: 'A unidade foi excluída com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a unidade. Verifique se não há produtos vinculados.',
        variant: 'destructive',
      });
    } finally {
      setDeletingUnit(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingUnit(null);
  };

  return (
    <MainLayout title="Unidades">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Unidades de Medida</h1>
            <p className="text-muted-foreground">
              Gerencie as unidades de medida dos produtos.
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Unidade
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar unidades..."
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
                <TableHead>Abreviação</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUnits?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Ruler className="w-8 h-8" />
                      <span>Nenhuma unidade encontrada</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUnits?.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-muted font-mono text-sm">
                        {unit.abbreviation}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleEdit(unit)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingUnit(unit)}
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
      <UnitFormModal
        open={isFormOpen}
        onClose={handleFormClose}
        unit={editingUnit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingUnit} onOpenChange={() => setDeletingUnit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a unidade "{deletingUnit?.name} ({deletingUnit?.abbreviation})"?
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
