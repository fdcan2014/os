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
import {
  Check,
  XCircle,
  Package,
  FileText,
  Loader2,
  Calendar,
  MapPin,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  usePurchaseOrder,
  useApprovePurchaseOrder,
  useCancelPurchaseOrder,
} from '@/hooks/usePurchaseOrders';
import { useCreateInvoiceFromOrder } from '@/hooks/useSupplierInvoices';
import { ReceivePurchaseOrderModal } from './ReceivePurchaseOrderModal';
import { CreateInvoiceModal } from './CreateInvoiceModal';

const statusStyles: Record<string, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  approved: 'status-badge-warning',
  partial: 'status-badge-warning',
  received: 'status-badge-success',
  cancelled: 'status-badge-danger',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  approved: 'Aprovado',
  partial: 'Parcial',
  received: 'Recebido',
  cancelled: 'Cancelado',
};

interface Props {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}

export function PurchaseOrderViewDrawer({ orderId, open, onOpenChange, onEdit }: Props) {
  const { data: order, isLoading } = usePurchaseOrder(orderId || '');
  const approveOrder = useApprovePurchaseOrder();
  const cancelOrder = useCancelPurchaseOrder();

  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const handleApprove = async () => {
    if (!orderId) return;
    try {
      await approveOrder.mutateAsync(orderId);
      toast.success('Pedido aprovado com sucesso!');
      setShowApproveDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar pedido');
    }
  };

  const handleCancel = async () => {
    if (!orderId) return;
    try {
      await cancelOrder.mutateAsync(orderId);
      toast.success('Pedido cancelado');
      setShowCancelDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cancelar pedido');
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

  const canApprove = order?.status === 'draft';
  const canCancel = order?.status === 'draft' || order?.status === 'approved';
  const canReceive = order?.status === 'approved' || order?.status === 'partial';
  const canEdit = order?.status === 'draft';
  const canGenerateInvoice = order?.status === 'received' || order?.status === 'partial';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <span className="font-mono">{order?.order_number || 'Carregando...'}</span>
              {order && (
                <Badge className={cn(statusStyles[order.status || 'draft'])}>
                  {statusLabels[order.status || 'draft']}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : order ? (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6 pb-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Building2 className="w-4 h-4" />
                      Fornecedor
                    </div>
                    <p className="font-medium">{order.supplier?.name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4" />
                      Local de Entrega
                    </div>
                    <p className="font-medium">{order.location?.name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      Data do Pedido
                    </div>
                    <p className="font-medium">{formatDate(order.order_date)}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      Previsão de Entrega
                    </div>
                    <p className="font-medium">{formatDate(order.expected_date)}</p>
                  </div>
                </div>

                <Separator />

                {/* Items */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Itens do Pedido</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Produto</TableHead>
                          <TableHead className="text-center w-[80px]">Qtd</TableHead>
                          <TableHead className="text-center w-[80px]">Receb.</TableHead>
                          <TableHead className="text-right w-[100px]">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.items?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item.product?.name || '-'}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {item.product?.sku || '-'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-center">
                              <span
                                className={cn(
                                  'font-mono',
                                  item.received_quantity >= item.quantity
                                    ? 'text-success'
                                    : item.received_quantity > 0
                                    ? 'text-warning'
                                    : ''
                                )}
                              >
                                {item.received_quantity || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(item.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {(order.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm text-destructive">
                      <span>Desconto</span>
                      <span className="font-mono">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  {(order.tax_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impostos</span>
                      <span className="font-mono">+{formatCurrency(order.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total</span>
                    <span className="font-mono">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {order.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h3 className="font-semibold">Observações</h3>
                      <p className="text-sm text-muted-foreground">{order.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Pedido não encontrado
            </div>
          )}

          {/* Actions */}
          {order && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {canEdit && (
                <Button variant="outline" onClick={onEdit}>
                  Editar
                </Button>
              )}
              {canApprove && (
                <Button
                  variant="default"
                  onClick={() => setShowApproveDialog(true)}
                  disabled={approveOrder.isPending}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
              )}
              {canReceive && (
                <Button variant="default" onClick={() => setShowReceiveModal(true)}>
                  <Package className="w-4 h-4 mr-2" />
                  Receber
                </Button>
              )}
              {canGenerateInvoice && (
                <Button variant="outline" onClick={() => setShowInvoiceModal(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Fatura
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelOrder.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Após a aprovação, o pedido estará disponível para recebimento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={approveOrder.isPending}>
              {approveOrder.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Aprovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O pedido será marcado como cancelado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelOrder.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelOrder.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Cancelar Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receive Modal */}
      {orderId && (
        <ReceivePurchaseOrderModal
          orderId={orderId}
          open={showReceiveModal}
          onOpenChange={setShowReceiveModal}
        />
      )}

      {/* Invoice Modal */}
      {orderId && (
        <CreateInvoiceModal
          orderId={orderId}
          open={showInvoiceModal}
          onOpenChange={setShowInvoiceModal}
        />
      )}
    </>
  );
}
