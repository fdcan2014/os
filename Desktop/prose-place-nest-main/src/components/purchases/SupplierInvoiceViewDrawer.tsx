import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CreditCard, XCircle, Building2, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useSupplierInvoice, useCancelSupplierInvoice } from '@/hooks/useSupplierInvoices';
import { RegisterPaymentModal } from './RegisterPaymentModal';

const statusStyles: Record<string, string> = {
  unpaid: 'bg-secondary text-secondary-foreground',
  partial: 'status-badge-warning',
  paid: 'status-badge-success',
  cancelled: 'status-badge-danger',
};

const statusLabels: Record<string, string> = {
  unpaid: 'A Pagar',
  partial: 'Parcial',
  paid: 'Pago',
  cancelled: 'Cancelado',
};

interface Props {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierInvoiceViewDrawer({ invoiceId, open, onOpenChange }: Props) {
  const { data: invoice, isLoading } = useSupplierInvoice(invoiceId || '');
  const cancelInvoice = useCancelSupplierInvoice();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleCancel = async () => {
    if (!invoiceId) return;
    try {
      await cancelInvoice.mutateAsync(invoiceId);
      toast.success('Fatura cancelada');
      setShowCancelDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cancelar fatura');
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const canPay = invoice?.status !== 'paid' && invoice?.status !== 'cancelled';
  const canCancel = invoice?.status !== 'cancelled';
  const remainingAmount = (invoice?.total || 0) - (invoice?.paid_amount || 0);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <span className="font-mono">{invoice?.invoice_number || 'Carregando...'}</span>
              {invoice && (
                <Badge className={cn(statusStyles[invoice.status || 'unpaid'])}>
                  {statusLabels[invoice.status || 'unpaid']}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : invoice ? (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6 pb-6">
                {/* Invoice Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Building2 className="w-4 h-4" />
                      Fornecedor
                    </div>
                    <p className="font-medium">{invoice.supplier?.name || '-'}</p>
                  </div>
                  {invoice.purchase_order && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <FileText className="w-4 h-4" />
                        Pedido de Compra
                      </div>
                      <p className="font-mono font-medium">
                        {invoice.purchase_order.order_number}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      Data da Fatura
                    </div>
                    <p className="font-medium">{formatDate(invoice.invoice_date)}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      Vencimento
                    </div>
                    <p className="font-medium">{formatDate(invoice.due_date)}</p>
                  </div>
                </div>

                <Separator />

                {/* Values */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Valores</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    {(invoice.tax_amount || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Impostos</span>
                        <span className="font-mono">+{formatCurrency(invoice.tax_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total</span>
                      <span className="font-mono">{formatCurrency(invoice.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-success">
                      <span>Pago</span>
                      <span className="font-mono">{formatCurrency(invoice.paid_amount)}</span>
                    </div>
                    {remainingAmount > 0 && (
                      <div className="flex justify-between text-sm text-destructive font-medium">
                        <span>Saldo Devedor</span>
                        <span className="font-mono">{formatCurrency(remainingAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Payments */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Pagamentos</h3>
                  {invoice.payments && invoice.payments.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Data</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoice.payments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{formatDate(payment.payment_date)}</TableCell>
                              <TableCell>
                                {payment.payment_method?.name || '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(payment.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum pagamento registrado
                    </p>
                  )}
                </div>

                {invoice.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold">Observações</h3>
                      <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Fatura não encontrada
            </div>
          )}

          {/* Actions */}
          {invoice && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {canPay && (
                <Button variant="default" onClick={() => setShowPaymentModal(true)}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Registrar Pagamento
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelInvoice.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Fatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A fatura será marcada como cancelada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelInvoice.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelInvoice.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cancelar Fatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Modal */}
      {invoiceId && (
        <RegisterPaymentModal
          invoiceId={invoiceId}
          remainingAmount={remainingAmount}
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
        />
      )}
    </>
  );
}
