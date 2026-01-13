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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Package, 
  AlertTriangle, 
  Loader2,
  CheckCircle2,
  MinusCircle,
} from 'lucide-react';
import { type ServiceOrderItem, useConsumeServiceOrderItems } from '@/hooks/useServiceOrders';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ConsumeItemsModalProps {
  open: boolean;
  onClose: () => void;
  serviceOrderId: string;
  items: ServiceOrderItem[];
}

interface ItemConsumption {
  itemId: string;
  productId: string;
  productName: string;
  requestedQty: number;
  availableStock: number;
  consumeQty: number;
  selected: boolean;
  hasStock: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function ConsumeItemsModal({ open, onClose, serviceOrderId, items }: ConsumeItemsModalProps) {
  const [itemsToConsume, setItemsToConsume] = useState<ItemConsumption[]>([]);
  const [notes, setNotes] = useState('');
  
  const consumeItems = useConsumeServiceOrderItems();
  
  // Fetch stock for items with products
  const productItems = items.filter(item => item.product_id);
  const productIds = productItems.map(item => item.product_id!);
  
  const { data: stockData, isLoading: loadingStock } = useQuery({
    queryKey: ['stock-for-consumption', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      
      // Get default location
      const { data: defaultLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('is_default', true)
        .maybeSingle();
      
      if (!defaultLocation) return [];
      
      const { data: stockItems, error } = await supabase
        .from('stock_items')
        .select('product_id, quantity')
        .in('product_id', productIds)
        .eq('location_id', defaultLocation.id)
        .is('variant_id', null);
      
      if (error) throw error;
      return stockItems || [];
    },
    enabled: open && productIds.length > 0,
  });

  // Initialize items to consume when modal opens
  useEffect(() => {
    if (open && stockData) {
      const consumptionItems: ItemConsumption[] = productItems.map(item => {
        const stock = stockData.find(s => s.product_id === item.product_id);
        const availableStock = stock?.quantity || 0;
        const hasStock = availableStock >= item.quantity;
        
        return {
          itemId: item.id,
          productId: item.product_id!,
          productName: item.product?.name || 'Produto',
          requestedQty: item.quantity,
          availableStock,
          consumeQty: Math.min(item.quantity, availableStock),
          selected: hasStock,
          hasStock,
        };
      });
      
      setItemsToConsume(consumptionItems);
      setNotes('');
    }
  }, [open, stockData, items]);

  const handleToggleItem = (itemId: string) => {
    setItemsToConsume(prev => 
      prev.map(item => 
        item.itemId === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleQuantityChange = (itemId: string, qty: number) => {
    setItemsToConsume(prev => 
      prev.map(item => {
        if (item.itemId !== itemId) return item;
        const newQty = Math.min(Math.max(0, qty), item.availableStock);
        return { ...item, consumeQty: newQty, selected: newQty > 0 };
      })
    );
  };

  const handleConsume = async () => {
    const selectedItems = itemsToConsume.filter(item => item.selected && item.consumeQty > 0);
    
    if (selectedItems.length === 0) {
      toast.error('Selecione ao menos um item para consumir');
      return;
    }
    
    try {
      await consumeItems.mutateAsync({
        serviceOrderId,
        items: selectedItems.map(item => ({
          itemId: item.itemId,
          quantity: item.consumeQty,
        })),
        notes: notes.trim() || undefined,
      });
      
      toast.success('Peças consumidas com sucesso', {
        description: `${selectedItems.length} item(ns) baixado(s) do estoque`,
      });
      
      onClose();
    } catch (error: any) {
      toast.error('Erro ao consumir peças', {
        description: error.message,
      });
    }
  };

  const selectedCount = itemsToConsume.filter(item => item.selected && item.consumeQty > 0).length;
  const hasItemsWithoutStock = itemsToConsume.some(item => !item.hasStock);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Consumir Peças do Estoque
          </DialogTitle>
        </DialogHeader>

        {loadingStock ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Verificando estoque...</span>
          </div>
        ) : productItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum produto para consumir nesta OS</p>
            <p className="text-sm">Apenas itens vinculados a produtos podem ser consumidos do estoque.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {hasItemsWithoutStock && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Alguns itens possuem estoque insuficiente. Você pode consumir parcialmente ou aguardar reposição.
                </AlertDescription>
              </Alert>
            )}
            
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Necessário</TableHead>
                    <TableHead className="text-right">Disponível</TableHead>
                    <TableHead className="text-right w-[100px]">Consumir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsToConsume.map((item) => (
                    <TableRow 
                      key={item.itemId}
                      className={!item.hasStock ? 'bg-destructive/5' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={() => handleToggleItem(item.itemId)}
                          disabled={item.availableStock === 0}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.productName}</span>
                          {!item.hasStock && (
                            <Badge variant="destructive" className="text-xs">
                              Estoque baixo
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.requestedQty}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono ${item.availableStock < item.requestedQty ? 'text-destructive' : 'text-green-600'}`}>
                          {item.availableStock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={item.availableStock}
                          value={item.consumeQty}
                          onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value) || 0)}
                          className="w-[80px] text-right"
                          disabled={item.availableStock === 0}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o consumo..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                {selectedCount > 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm">
                      {selectedCount} item(ns) selecionado(s) para consumo
                    </span>
                  </>
                ) : (
                  <>
                    <MinusCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Nenhum item selecionado
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConsume}
            disabled={selectedCount === 0 || consumeItems.isPending}
          >
            {consumeItems.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Consumir do Estoque
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
