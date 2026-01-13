import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Loader2, 
  MapPin, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { type Product } from '@/hooks/useProducts';
import { useProductStockMovements, useProductStockByLocation } from '@/hooks/useProductStock';
import { cn } from '@/lib/utils';

interface ProductViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

const movementTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  purchase: { label: 'Compra', icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-600' },
  sale: { label: 'Venda', icon: <TrendingDown className="w-4 h-4" />, color: 'text-red-600' },
  adjustment: { label: 'Ajuste', icon: <ArrowRightLeft className="w-4 h-4" />, color: 'text-blue-600' },
  transfer_in: { label: 'Transferência (Entrada)', icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-600' },
  transfer_out: { label: 'Transferência (Saída)', icon: <TrendingDown className="w-4 h-4" />, color: 'text-orange-600' },
  return: { label: 'Devolução', icon: <ArrowRightLeft className="w-4 h-4" />, color: 'text-purple-600' },
  count: { label: 'Contagem', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-blue-600' },
};

export function ProductViewModal({ open, onOpenChange, product }: ProductViewModalProps) {
  const { data: movements = [], isLoading: movementsLoading } = useProductStockMovements(product?.id ?? null);
  const { data: stockByLocation = [], isLoading: stockLoading } = useProductStockByLocation(product?.id ?? null);

  if (!product) return null;

  const totalStock = stockByLocation.reduce((sum, loc) => sum + loc.quantity, 0);
  const totalReserved = stockByLocation.reduce((sum, loc) => sum + loc.reserved_quantity, 0);
  const availableStock = totalStock - totalReserved;
  const isLowStock = totalStock <= Number(product.min_stock);
  const isOutOfStock = totalStock === 0;

  const getMovementInfo = (type: string) => {
    return movementTypeLabels[type] || { 
      label: type, 
      icon: <ArrowRightLeft className="w-4 h-4" />, 
      color: 'text-muted-foreground' 
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Detalhes do Produto
          </DialogTitle>
        </DialogHeader>

        {/* Product Info Header */}
        <div className="grid grid-cols-2 gap-4 pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">{product.sku}</Badge>
              <Badge variant={product.is_active ? 'default' : 'secondary'}>
                {product.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <h2 className="text-xl font-semibold">{product.name}</h2>
            {product.description && (
              <p className="text-sm text-muted-foreground">{product.description}</p>
            )}
            <div className="flex gap-4 text-sm">
              <span>Categoria: <strong>{product.category?.name || '-'}</strong></span>
              <span>Marca: <strong>{product.brand?.name || '-'}</strong></span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Preço de Custo</p>
                <p className="text-lg font-mono font-medium">R$ {Number(product.cost_price).toFixed(2)}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">Preço de Venda</p>
                <p className="text-lg font-mono font-semibold text-primary">R$ {Number(product.sell_price).toFixed(2)}</p>
              </div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Estoque Total</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    isOutOfStock ? "text-destructive" : isLowStock ? "text-warning" : "text-foreground"
                  )}>
                    {totalStock}
                  </p>
                </div>
                {(isOutOfStock || isLowStock) && (
                  <AlertTriangle className={cn(
                    "w-6 h-6",
                    isOutOfStock ? "text-destructive" : "text-warning"
                  )} />
                )}
              </div>
              <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                <span>Disponível: {availableStock}</span>
                <span>Reservado: {totalReserved}</span>
                <span>Mínimo: {product.min_stock}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="stock" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Estoque por Local
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Movimentações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="flex-1 overflow-hidden mt-4">
            {stockLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : stockByLocation.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <MapPin className="w-8 h-8 mb-2" />
                <p>Nenhum registro de estoque encontrado</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Local</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Reservado</TableHead>
                      <TableHead className="text-right">Disponível</TableHead>
                      <TableHead className="text-right">Custo Médio</TableHead>
                      <TableHead>Última Contagem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockByLocation.map((stock) => (
                      <TableRow key={stock.location_id}>
                        <TableCell className="font-medium">{stock.location_name}</TableCell>
                        <TableCell className="text-right font-mono">{stock.quantity}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">{stock.reserved_quantity}</TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {stock.quantity - stock.reserved_quantity}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {stock.avg_cost ? `R$ ${stock.avg_cost.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {stock.last_count_date 
                            ? format(new Date(stock.last_count_date), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="movements" className="flex-1 overflow-hidden mt-4">
            {movementsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : movements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <ArrowRightLeft className="w-8 h-8 mb-2" />
                <p>Nenhuma movimentação registrada</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Custo Unit.</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => {
                      const info = getMovementInfo(movement.type);
                      return (
                        <TableRow key={movement.id}>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {movement.created_at 
                              ? format(new Date(movement.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className={cn("flex items-center gap-2", info.color)}>
                              {info.icon}
                              <span className="text-sm">{info.label}</span>
                            </div>
                          </TableCell>
                          <TableCell>{movement.location?.name || '-'}</TableCell>
                          <TableCell className={cn(
                            "text-right font-mono font-medium",
                            movement.quantity > 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {movement.unit_cost ? `R$ ${movement.unit_cost.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[150px] truncate">
                            {movement.notes || '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
