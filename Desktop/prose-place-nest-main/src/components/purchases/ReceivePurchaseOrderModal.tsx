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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { usePurchaseOrder, useReceivePurchaseOrder } from '@/hooks/usePurchaseOrders';

interface ReceiveItem {
  purchaseOrderItemId: string;
  productName: string;
  productSku: string;
  ordered: number;
  alreadyReceived: number;
  remaining: number;
  toReceive: number;
  unitCost: number;
}

interface Props {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceivePurchaseOrderModal({ orderId, open, onOpenChange }: Props) {
  const { data: order, isLoading } = usePurchaseOrder(orderId);
  const receiveMutation = useReceivePurchaseOrder();

  const [items, setItems] = useState<ReceiveItem[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (order?.items) {
      setItems(
        order.items.map((item) => ({
          purchaseOrderItemId: item.id,
          productName: item.product?.name || '-',
          productSku: item.product?.sku || '-',
          ordered: item.quantity,
          alreadyReceived: item.received_quantity || 0,
          remaining: item.quantity - (item.received_quantity || 0),
          toReceive: item.quantity - (item.received_quantity || 0),
          unitCost: item.unit_cost,
        }))
      );
      setNotes('');
    }
  }, [order]);

  const handleToReceiveChange = (index: number, value: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, toReceive: Math.min(Math.max(0, value), item.remaining) }
          : item
      )
    );
  };

  const handleUnitCostChange = (index: number, value: number) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, unitCost: Math.max(0, value) } : item
      )
    );
  };

  const handleReceiveAll = () => {
    setItems((prev) => prev.map((item) => ({ ...item, toReceive: item.remaining })));
  };

  const handleSubmit = async () => {
    const itemsToReceive = items.filter((item) => item.toReceive > 0);

    if (itemsToReceive.length === 0) {
      toast.error('Selecione pelo menos um item para receber');
      return;
    }

    try {
      await receiveMutation.mutateAsync({
        orderId,
        receivedItems: itemsToReceive.map((item) => ({
          purchaseOrderItemId: item.purchaseOrderItemId,
          quantity: item.toReceive,
          unitCost: item.unitCost,
        })),
        notes: notes || undefined,
      });

      toast.success('Itens recebidos com sucesso! Estoque atualizado.');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao receber itens');
    }
  };

  const totalToReceive = items.reduce((sum, item) => sum + item.toReceive, 0);
  const hasItemsToReceive = totalToReceive > 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Receber Itens - {order?.order_number || '...'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReceiveAll}
              >
                Receber Tudo
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center w-[80px]">Pedido</TableHead>
                      <TableHead className="text-center w-[80px]">Recebido</TableHead>
                      <TableHead className="text-center w-[80px]">Saldo</TableHead>
                      <TableHead className="w-[100px]">Receber</TableHead>
                      <TableHead className="w-[130px]">Custo Unit.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={item.purchaseOrderItemId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {item.productSku}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {item.ordered}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {item.alreadyReceived}
                        </TableCell>
                        <TableCell className="text-center font-mono font-semibold">
                          {item.remaining}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={item.remaining}
                            value={item.toReceive}
                            onChange={(e) =>
                              handleToReceiveChange(index, parseInt(e.target.value) || 0)
                            }
                            className="h-9 w-24"
                            disabled={item.remaining === 0}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) =>
                              handleUnitCostChange(index, parseFloat(e.target.value) || 0)
                            }
                            className="h-9 w-32"
                            disabled={item.remaining === 0}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>

            <div className="space-y-3 pt-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Observações do Recebimento</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre o recebimento..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                <span className="text-sm text-muted-foreground">
                  Total de itens a receber:
                </span>
                <span className="font-mono font-semibold text-lg">{totalToReceive}</span>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={receiveMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!hasItemsToReceive || receiveMutation.isPending}
              >
                {receiveMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Confirmar Recebimento
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
