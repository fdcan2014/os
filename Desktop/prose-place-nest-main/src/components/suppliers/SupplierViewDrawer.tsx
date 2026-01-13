import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShoppingCart,
  FileText,
  CreditCard,
  Pencil,
  Loader2,
} from 'lucide-react';
import { type Supplier } from '@/hooks/useSuppliers';
import { useSupplierPurchaseOrders, useSupplierInvoicesForSupplier, useSupplierPaymentsForSupplier, useSupplierStats } from '@/hooks/useSupplierDetails';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SupplierViewDrawerProps {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onEdit?: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-';
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
};

export function SupplierViewDrawer({ open, onClose, supplier, onEdit }: SupplierViewDrawerProps) {
  const [activeTab, setActiveTab] = useState('dados');

  const { data: purchaseOrders, isLoading: loadingOrders } = useSupplierPurchaseOrders(supplier?.id || '');
  const { data: invoices, isLoading: loadingInvoices } = useSupplierInvoicesForSupplier(supplier?.id || '');
  const { data: payments, isLoading: loadingPayments } = useSupplierPaymentsForSupplier(supplier?.id || '');
  const { data: stats, isLoading: loadingStats } = useSupplierStats(supplier?.id || '');

  if (!supplier) return null;

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    approved: 'bg-blue-100 text-blue-800',
    partial: 'bg-yellow-100 text-yellow-800',
    received: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    unpaid: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    approved: 'Aprovado',
    partial: 'Parcial',
    received: 'Recebido',
    cancelled: 'Cancelado',
    unpaid: 'Não Pago',
    paid: 'Pago',
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                {supplier.name}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                {supplier.code && (
                  <Badge variant="outline" className="font-mono">
                    {supplier.code}
                  </Badge>
                )}
                <Badge className={supplier.is_active ? 'status-badge-success' : 'status-badge-danger'}>
                  {supplier.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="dados">Dados</TabsTrigger>
              <TabsTrigger value="compras">Compras</TabsTrigger>
              <TabsTrigger value="faturas">Faturas</TabsTrigger>
              <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <TabsContent value="dados" className="px-6 py-4 space-y-6">
              {/* Stats Cards */}
              {loadingStats ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : stats && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total em Aberto
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(stats.totalOutstanding)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Pago
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(stats.totalPaid)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Pedidos no Mês
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary">
                        {stats.ordersThisMonth}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Separator />

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-medium mb-3">Informações de Contato</h3>
                <div className="space-y-3">
                  {supplier.contact_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span>{supplier.contact_name}</span>
                    </div>
                  )}
                  {supplier.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{supplier.email}</span>
                    </div>
                  )}
                  {(supplier.address || supplier.city) && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span>
                        {[supplier.address, supplier.city, supplier.state, supplier.postal_code]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Prazo de pagamento: {supplier.payment_terms} dias</span>
                  </div>
                </div>
              </div>

              {supplier.tax_id && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">CNPJ/CPF</h3>
                    <p className="font-mono">{supplier.tax_id}</p>
                  </div>
                </>
              )}

              {supplier.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Observações</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {supplier.notes}
                    </p>
                  </div>
                </>
              )}

              <Separator />
              <div className="text-xs text-muted-foreground">
                Cadastrado em: {formatDate(supplier.created_at)}
              </div>
            </TabsContent>

            <TabsContent value="compras" className="px-6 py-4">
              {loadingOrders ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : purchaseOrders?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum pedido de compra encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Pedido</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders?.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.order_number}</TableCell>
                        <TableCell>{formatDate(order.order_date)}</TableCell>
                        <TableCell>{formatCurrency(order.total || 0)}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[order.status || 'draft']}>
                            {statusLabels[order.status || 'draft']}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="faturas" className="px-6 py-4">
              {loadingInvoices ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : invoices?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma fatura encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Fatura</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices?.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                        <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                        <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        <TableCell>{formatCurrency(invoice.total || 0)}</TableCell>
                        <TableCell>{formatCurrency(invoice.paid_amount || 0)}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[invoice.status || 'unpaid']}>
                            {statusLabels[invoice.status || 'unpaid']}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="pagamentos" className="px-6 py-4">
              {loadingPayments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : payments?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum pagamento encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Fatura</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Referência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments?.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.payment_date)}</TableCell>
                        <TableCell className="font-mono">{payment.invoice_number}</TableCell>
                        <TableCell>{payment.payment_method_name || '-'}</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.reference || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
