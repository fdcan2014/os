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
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { 
  Plus, 
  Search, 
  Download, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Loader2,
  ToggleLeft,
  ToggleRight,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuppliers, useDeleteSupplier, useUpdateSupplier, type Supplier } from '@/hooks/useSuppliers';
import { useSupplierHasDependencies } from '@/hooks/useSupplierDetails';
import { SupplierFormModal } from '@/components/suppliers/SupplierFormModal';
import { SupplierViewDrawer } from '@/components/suppliers/SupplierViewDrawer';
import { toast } from 'sonner';

export default function Suppliers() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  
  const { data: suppliers = [], isLoading } = useSuppliers();
  const deleteSupplier = useDeleteSupplier();
  const updateSupplier = useUpdateSupplier();

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code?.toLowerCase().includes(search.toLowerCase())) ||
      (s.email?.toLowerCase().includes(search.toLowerCase())) ||
      (s.tax_id?.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && s.is_active) ||
      (statusFilter === 'inactive' && !s.is_active);
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleView = (supplier: Supplier) => {
    setViewingSupplier(supplier);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSupplier(null);
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      await updateSupplier.mutateAsync({
        id: supplier.id,
        is_active: !supplier.is_active,
      });
      toast.success(
        supplier.is_active 
          ? 'Fornecedor desativado' 
          : 'Fornecedor ativado'
      );
    } catch (error: any) {
      toast.error('Erro ao alterar status do fornecedor');
    }
  };

  const handleDelete = async () => {
    if (!deletingSupplier) return;

    try {
      await deleteSupplier.mutateAsync(deletingSupplier.id);
      toast.success('Fornecedor excluído com sucesso');
    } catch (error: any) {
      if (error.message?.includes('violates foreign key constraint')) {
        toast.error('Não é possível excluir este fornecedor pois existem pedidos ou faturas vinculados');
      } else {
        toast.error('Erro ao excluir fornecedor');
      }
    } finally {
      setDeletingSupplier(null);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Código', 'Nome', 'CNPJ/CPF', 'Contato', 'Email', 'Telefone', 'Prazo Pgto', 'Status'].join(','),
      ...filteredSuppliers.map(s => [
        s.code || '',
        `"${s.name}"`,
        s.tax_id || '',
        s.contact_name || '',
        s.email || '',
        s.phone || '',
        s.payment_terms,
        s.is_active ? 'Ativo' : 'Inativo',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fornecedores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Arquivo exportado com sucesso');
  };

  if (isLoading) {
    return (
      <MainLayout title="Fornecedores" subtitle="Gerencie seu diretório de fornecedores">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Fornecedores" subtitle="Gerencie seu diretório de fornecedores">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, código, CNPJ ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Prazo Pgto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum fornecedor encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-muted-foreground">
                    {supplier.code || '-'}
                  </TableCell>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.contact_name || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.email || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {supplier.phone || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{supplier.payment_terms} dias</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        supplier.is_active
                          ? 'status-badge-success'
                          : 'status-badge-danger'
                      )}
                    >
                      {supplier.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(supplier)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(supplier)}>
                          {supplier.is_active ? (
                            <>
                              <ToggleLeft className="w-4 h-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-4 h-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => setDeletingSupplier(supplier)}
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

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Exibindo {filteredSuppliers.length} de {suppliers.length} fornecedores
        </p>
      </div>

      {/* Form Modal */}
      <SupplierFormModal
        open={isFormOpen}
        onClose={handleFormClose}
        supplier={editingSupplier}
      />

      {/* View Drawer */}
      <SupplierViewDrawer
        open={!!viewingSupplier}
        onClose={() => setViewingSupplier(null)}
        supplier={viewingSupplier}
        onEdit={() => {
          if (viewingSupplier) {
            setEditingSupplier(viewingSupplier);
            setViewingSupplier(null);
            setIsFormOpen(true);
          }
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSupplier} onOpenChange={() => setDeletingSupplier(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fornecedor "{deletingSupplier?.name}"?
              Esta ação não pode ser desfeita.
              <br /><br />
              <strong>Nota:</strong> Fornecedores com pedidos ou faturas vinculados não podem ser excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
