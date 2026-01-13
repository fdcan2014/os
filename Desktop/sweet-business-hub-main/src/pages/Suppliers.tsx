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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Download, MoreVertical, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuppliers, useDeleteSupplier } from '@/hooks/useSuppliers';
import { toast } from 'sonner';

export default function Suppliers() {
  const [search, setSearch] = useState('');
  
  const { data: suppliers = [], isLoading } = useSuppliers();
  const deleteSupplier = useDeleteSupplier();

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code?.toLowerCase().includes(search.toLowerCase())) ||
      (s.email?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await deleteSupplier.mutateAsync(id);
        toast.success('Fornecedor excluído');
      } catch (error) {
        toast.error('Falha ao excluir fornecedor');
      }
    }
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
            placeholder="Buscar fornecedores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button>
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
                  Nenhum fornecedor encontrado
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
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(supplier.id)}
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled>
            Próximo
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
