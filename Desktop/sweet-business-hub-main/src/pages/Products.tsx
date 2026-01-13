import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProducts, useCategories, useDeleteProduct, type Product } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { ProductFormModal } from '@/components/products/ProductFormModal';
import { ProductEditModal } from '@/components/products/ProductEditModal';
import { ProductViewModal } from '@/components/products/ProductViewModal';

export default function Products() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const deleteProduct = useDeleteProduct();

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getTotalStock = (product: typeof products[0]) => {
    return product.stock_items?.reduce((sum, item) => sum + Number(item.quantity), 0) || 0;
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await deleteProduct.mutateAsync(id);
        toast.success('Produto excluído');
      } catch (error) {
        toast.error('Falha ao excluir produto');
      }
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Produtos" subtitle="Gerencie seu catálogo de produtos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Produtos" subtitle="Gerencie seu catálogo de produtos">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-card rounded-lg border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">SKU</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => {
                const totalStock = getTotalStock(product);
                return (
                  <TableRow key={product.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {product.sku}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category?.name || '-'}</TableCell>
                    <TableCell>{product.brand?.name || '-'}</TableCell>
                    <TableCell className="text-right font-mono">
                      R${Number(product.cost_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      R${Number(product.sell_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'font-medium',
                          totalStock === 0
                            ? 'text-destructive'
                            : totalStock < Number(product.min_stock)
                            ? 'text-warning'
                            : 'text-foreground'
                        )}
                      >
                        {totalStock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.is_active ? 'default' : 'secondary'}
                        className={cn(
                          product.is_active
                            ? 'status-badge-success'
                            : 'status-badge-danger'
                        )}
                      >
                        {product.is_active ? 'Ativo' : 'Inativo'}
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
                          <DropdownMenuItem onClick={() => setViewingProduct(product)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination placeholder */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Exibindo {filteredProducts.length} de {products.length} produtos
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

      <ProductFormModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />

      <ProductEditModal
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        product={editingProduct}
      />

      <ProductViewModal
        open={!!viewingProduct}
        onOpenChange={(open) => !open && setViewingProduct(null)}
        product={viewingProduct}
      />
    </MainLayout>
  );
}
