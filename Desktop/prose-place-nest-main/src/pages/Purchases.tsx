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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Filter, MoreVertical, Eye, Package, XCircle, CheckCircle, FileText, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePurchaseOrders, usePurchaseOrder, useApprovePurchaseOrder, useCancelPurchaseOrder, type PurchaseOrder } from '@/hooks/usePurchaseOrders';
import { useSupplierInvoices, useCancelSupplierInvoice } from '@/hooks/useSupplierInvoices';
import { PurchaseOrderFormModal } from '@/components/purchases/PurchaseOrderFormModal';
import { PurchaseOrderViewDrawer } from '@/components/purchases/PurchaseOrderViewDrawer';
import { ReceivePurchaseOrderModal } from '@/components/purchases/ReceivePurchaseOrderModal';
import { CreateInvoiceModal } from '@/components/purchases/CreateInvoiceModal';
import { SupplierInvoiceFormModal } from '@/components/purchases/SupplierInvoiceFormModal';
import { SupplierInvoiceViewDrawer } from '@/components/purchases/SupplierInvoiceViewDrawer';
import { RegisterPaymentModal } from '@/components/purchases/RegisterPaymentModal';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const orderStatusStyles: Record<string, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  received: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const orderStatusLabels: Record<string, string> = {
  draft: 'Rascunho',
  approved: 'Aprovado',
  partial: 'Parcial',
  received: 'Recebido',
  cancelled: 'Cancelado',
};

const invoiceStatusStyles: Record<string, string> = {
  unpaid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  partial: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const invoiceStatusLabels: Record<string, string> = {
  unpaid: 'A Pagar',
  partial: 'Parcial',
  paid: 'Pago',
  cancelled: 'Cancelado',
};

function formatCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateString;
  }
}

export default function Purchases() {
  const [activeTab, setActiveTab] = useState('orders');
  
  // Orders state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [receivingOrderId, setReceivingOrderId] = useState<string | null>(null);
  const [creatingInvoiceForOrderId, setCreatingInvoiceForOrderId] = useState<string | null>(null);
  const [approvingOrder, setApprovingOrder] = useState<{ id: string; order_number: string } | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<{ id: string; order_number: string } | null>(null);
  
  // Invoices state
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('all');
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [registeringPaymentForInvoice, setRegisteringPaymentForInvoice] = useState<{ id: string; remainingAmount: number } | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<{ id: string; invoice_number: string } | null>(null);

  // Queries
  const { data: orders, isLoading: ordersLoading } = usePurchaseOrders();
  const { data: invoices, isLoading: invoicesLoading } = useSupplierInvoices();
  
  // Mutations
  const approveMutation = useApprovePurchaseOrder();
  const cancelOrderMutation = useCancelPurchaseOrder();
  const cancelInvoiceMutation = useCancelSupplierInvoice();

  // Filter orders
  const filteredOrders = (orders || []).filter((order) => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.supplier?.name?.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter invoices
  const filteredInvoices = (invoices || []).filter((invoice) => {
    const matchesSearch = 
      invoice.invoice_number?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      invoice.supplier?.name?.toLowerCase().includes(invoiceSearch.toLowerCase());
    const matchesStatus = invoiceStatusFilter === 'all' || invoice.status === invoiceStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApproveOrder = async () => {
    if (!approvingOrder) return;
    await approveMutation.mutateAsync(approvingOrder.id);
    setApprovingOrder(null);
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    await cancelOrderMutation.mutateAsync(cancellingOrder.id);
    setCancellingOrder(null);
  };

  const handleCancelInvoice = async () => {
    if (!cancellingInvoice) return;
    await cancelInvoiceMutation.mutateAsync(cancellingInvoice.id);
    setCancellingInvoice(null);
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setIsOrderFormOpen(true);
  };

  return (
    <MainLayout title="Compras" subtitle="Gerenciar pedidos de compra e faturas de fornecedores">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="orders">Pedidos de Compra</TabsTrigger>
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedidos de compra..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="received">Recebido</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => { setEditingOrder(null); setIsOrderFormOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Compra
              </Button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-card rounded-lg border shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nº Pedido</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data Pedido</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum pedido encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>{order.supplier?.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.order_date)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.expected_date)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(orderStatusStyles[order.status || 'draft'])}>
                          {orderStatusLabels[order.status || 'draft'] || order.status}
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
                            <DropdownMenuItem onClick={() => setViewingOrderId(order.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            {order.status === 'draft' && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setApprovingOrder({ id: order.id, order_number: order.order_number })}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Aprovar
                                </DropdownMenuItem>
                              </>
                            )}
                            {(order.status === 'approved' || order.status === 'partial') && (
                              <DropdownMenuItem onClick={() => setReceivingOrderId(order.id)}>
                                <Package className="w-4 h-4 mr-2" />
                                Receber
                              </DropdownMenuItem>
                            )}
                            {order.status === 'received' && (
                              <DropdownMenuItem onClick={() => setCreatingInvoiceForOrderId(order.id)}>
                                <FileText className="w-4 h-4 mr-2" />
                                Gerar Fatura
                              </DropdownMenuItem>
                            )}
                            {order.status !== 'received' && order.status !== 'cancelled' && (
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setCancellingOrder({ id: order.id, order_number: order.order_number })}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            )}
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Exibindo {filteredOrders.length} de {orders?.length || 0} pedidos
            </p>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar faturas..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={invoiceStatusFilter} onValueChange={setInvoiceStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="unpaid">A Pagar</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsInvoiceFormOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Fatura
              </Button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-card rounded-lg border shadow-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nº Fatura</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pago</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma fatura encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const remainingAmount = (invoice.total || 0) - (invoice.paid_amount || 0);
                    return (
                      <TableRow key={invoice.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono font-medium">
                          {invoice.invoice_number}
                        </TableCell>
                        <TableCell>{invoice.supplier?.name || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(invoice.invoice_date)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(invoice.due_date)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(invoice.total)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatCurrency(invoice.paid_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(invoiceStatusStyles[invoice.status || 'unpaid'])}>
                            {invoiceStatusLabels[invoice.status || 'unpaid'] || invoice.status}
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
                              <DropdownMenuItem onClick={() => setViewingInvoiceId(invoice.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                <DropdownMenuItem onClick={() => setRegisteringPaymentForInvoice({ id: invoice.id, remainingAmount })}>
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Registrar Pagamento
                                </DropdownMenuItem>
                              )}
                              {invoice.status !== 'cancelled' && (
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setCancellingInvoice({ id: invoice.id, invoice_number: invoice.invoice_number })}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
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

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Exibindo {filteredInvoices.length} de {invoices?.length || 0} faturas
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals and Drawers */}
      <PurchaseOrderFormModal
        open={isOrderFormOpen}
        onOpenChange={(open) => {
          setIsOrderFormOpen(open);
          if (!open) setEditingOrder(null);
        }}
        order={editingOrder}
      />

      <PurchaseOrderViewDrawer
        orderId={viewingOrderId}
        open={!!viewingOrderId}
        onOpenChange={(open) => !open && setViewingOrderId(null)}
      />

      {receivingOrderId && (
        <ReceivePurchaseOrderModal
          orderId={receivingOrderId}
          open={!!receivingOrderId}
          onOpenChange={(open) => !open && setReceivingOrderId(null)}
        />
      )}

      {creatingInvoiceForOrderId && (
        <CreateInvoiceModal
          orderId={creatingInvoiceForOrderId}
          open={!!creatingInvoiceForOrderId}
          onOpenChange={(open) => !open && setCreatingInvoiceForOrderId(null)}
        />
      )}

      <SupplierInvoiceFormModal
        open={isInvoiceFormOpen}
        onOpenChange={setIsInvoiceFormOpen}
      />

      <SupplierInvoiceViewDrawer
        invoiceId={viewingInvoiceId}
        open={!!viewingInvoiceId}
        onOpenChange={(open) => !open && setViewingInvoiceId(null)}
      />

      {registeringPaymentForInvoice && (
        <RegisterPaymentModal
          invoiceId={registeringPaymentForInvoice.id}
          remainingAmount={registeringPaymentForInvoice.remainingAmount}
          open={!!registeringPaymentForInvoice}
          onOpenChange={(open) => !open && setRegisteringPaymentForInvoice(null)}
        />
      )}

      {/* Approve Order Confirmation */}
      <AlertDialog open={!!approvingOrder} onOpenChange={(open) => !open && setApprovingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja aprovar o pedido {approvingOrder?.order_number}?
              Após aprovado, o pedido poderá ser recebido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveOrder}>
              Aprovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Order Confirmation */}
      <AlertDialog open={!!cancellingOrder} onOpenChange={(open) => !open && setCancellingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar o pedido {cancellingOrder?.order_number}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelOrder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invoice Confirmation */}
      <AlertDialog open={!!cancellingInvoice} onOpenChange={(open) => !open && setCancellingInvoice(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Fatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a fatura {cancellingInvoice?.invoice_number}?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Fatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
