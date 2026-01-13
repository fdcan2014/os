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
import { Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { usePurchaseOrder } from '@/hooks/usePurchaseOrders';
import { useCreateInvoiceFromOrder } from '@/hooks/useSupplierInvoices';

interface Props {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateInvoiceModal({ orderId, open, onOpenChange }: Props) {
  const { data: order, isLoading } = usePurchaseOrder(orderId);
  const createInvoice = useCreateInvoiceFromOrder();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (open && order?.supplier?.payment_terms) {
      const invoiceDateObj = new Date(invoiceDate);
      invoiceDateObj.setDate(invoiceDateObj.getDate() + order.supplier.payment_terms);
      setDueDate(invoiceDateObj.toISOString().split('T')[0]);
    }
  }, [open, order, invoiceDate]);

  const handleSubmit = async () => {
    try {
      await createInvoice.mutateAsync({
        orderId,
        invoiceNumber: invoiceNumber || undefined,
        invoiceDate,
        dueDate: dueDate || undefined,
      });

      toast.success('Fatura criada com sucesso!');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar fatura');
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerar Fatura do Fornecedor
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pedido:</span>
                <span className="font-mono font-medium">{order?.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fornecedor:</span>
                <span className="font-medium">{order?.supplier?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Total:</span>
                <span className="font-mono font-semibold">
                  {formatCurrency(order?.total)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Número da Fatura</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Deixe em branco para gerar automaticamente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Data da Fatura *</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data de Vencimento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {order?.supplier?.payment_terms && (
                <p className="text-xs text-muted-foreground">
                  Prazo de pagamento do fornecedor: {order.supplier.payment_terms} dias
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createInvoice.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || createInvoice.isPending || !invoiceDate}
          >
            {createInvoice.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Criar Fatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
