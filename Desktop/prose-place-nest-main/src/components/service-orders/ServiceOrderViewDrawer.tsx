import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  FileText, 
  XCircle,
  User,
  Wrench,
  MessageSquare,
  DollarSign,
  Pencil,
  History,
  Package,
  AlertTriangle,
  Send,
  Loader2,
  PackageMinus,
} from 'lucide-react';
import { 
  type ServiceOrder, 
  type ServiceOrderItem,
  useServiceOrderItems,
  useServiceOrderLogs,
  useChangeServiceOrderStatus,
  useAddServiceOrderLog,
} from '@/hooks/useServiceOrders';
import { ServiceOrderAttachments } from './ServiceOrderAttachments';
import { ConsumeItemsModal } from './ConsumeItemsModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ServiceOrderViewDrawerProps {
  open: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onEdit?: () => void;
}

const statusConfig = {
  open: { label: 'Aberta', variant: 'default' as const, icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  in_progress: { label: 'Em Andamento', variant: 'secondary' as const, icon: PlayCircle, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  completed: { label: 'Concluída', variant: 'outline' as const, icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100' },
  invoiced: { label: 'Faturada', variant: 'default' as const, icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

const logTypeConfig = {
  status_change: { icon: History, color: 'text-blue-600' },
  note: { icon: MessageSquare, color: 'text-gray-600' },
  system: { icon: AlertTriangle, color: 'text-yellow-600' },
  inventory: { icon: Package, color: 'text-green-600' },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function ServiceOrderViewDrawer({ open, onClose, order, onEdit }: ServiceOrderViewDrawerProps) {
  const [activeTab, setActiveTab] = useState('detalhes');
  const [newNote, setNewNote] = useState('');
  const [statusAction, setStatusAction] = useState<{ status: ServiceOrder['status']; label: string } | null>(null);
  const [showConsumeModal, setShowConsumeModal] = useState(false);

  const { data: items, isLoading: loadingItems } = useServiceOrderItems(order?.id || '');
  const { data: logs, isLoading: loadingLogs } = useServiceOrderLogs(order?.id || '');
  
  const changeStatus = useChangeServiceOrderStatus();
  const addLog = useAddServiceOrderLog();

  if (!order) return null;

  const status = statusConfig[order.status];
  const priority = priorityConfig[order.priority];

  const handleStatusChange = async () => {
    if (!statusAction) return;
    
    try {
      await changeStatus.mutateAsync({ 
        id: order.id, 
        status: statusAction.status 
      });
      toast.success(`Status alterado para ${statusAction.label}`);
      setStatusAction(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar status');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      await addLog.mutateAsync({
        serviceOrderId: order.id,
        type: 'note',
        message: newNote.trim(),
      });
      setNewNote('');
      toast.success('Nota adicionada');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar nota');
    }
  };

  const getAvailableActions = () => {
    const actions: Array<{ status: ServiceOrder['status']; label: string; variant?: 'default' | 'outline' | 'destructive' }> = [];
    
    switch (order.status) {
      case 'open':
        actions.push({ status: 'in_progress', label: 'Iniciar Serviço', variant: 'default' });
        actions.push({ status: 'cancelled', label: 'Cancelar', variant: 'destructive' });
        break;
      case 'in_progress':
        actions.push({ status: 'completed', label: 'Concluir', variant: 'default' });
        actions.push({ status: 'open', label: 'Voltar para Aberta', variant: 'outline' });
        break;
      case 'completed':
        actions.push({ status: 'invoiced', label: 'Marcar como Faturada', variant: 'default' });
        actions.push({ status: 'in_progress', label: 'Reabrir', variant: 'outline' });
        break;
    }
    
    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl p-0">
          <SheetHeader className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <SheetTitle className="flex items-center gap-2 text-lg">
                  <span className="font-mono">{order.order_number}</span>
                </SheetTitle>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant={status.variant} className="gap-1">
                    <status.icon className="w-3 h-3" />
                    {status.label}
                  </Badge>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                    {priority.label}
                  </span>
                </div>
              </div>
              {onEdit && order.status !== 'cancelled' && order.status !== 'invoiced' && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            {availableActions.length > 0 && (
              <div className="flex gap-2 mt-4">
                {availableActions.map((action) => (
                  <Button
                    key={action.status}
                    variant={action.variant}
                    size="sm"
                    onClick={() => setStatusAction(action)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <div className="px-6">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="itens">Itens</TabsTrigger>
                <TabsTrigger value="anexos">Anexos</TabsTrigger>
                <TabsTrigger value="historico">Histórico</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[calc(100vh-240px)]">
              <TabsContent value="detalhes" className="px-6 py-4 space-y-6">
                {/* Customer */}
                {order.customer && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{order.customer.name}</p>
                      {order.customer.phone && (
                        <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Equipment */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium">Equipamento</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{order.equipment_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Marca</p>
                      <p className="font-medium">{order.equipment_brand || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Modelo</p>
                      <p className="font-medium">{order.equipment_model || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Número de Série</p>
                      <p className="font-mono">{order.equipment_serial || '-'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Service Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium">Detalhes do Serviço</h3>
                  </div>
                  <div className="space-y-4">
                    {order.reported_issue && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Problema Relatado</p>
                        <p className="p-3 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                          {order.reported_issue}
                        </p>
                      </div>
                    )}
                    {order.diagnosis && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Diagnóstico</p>
                        <p className="p-3 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm">
                          {order.diagnosis}
                        </p>
                      </div>
                    )}
                    {order.solution && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Solução Aplicada</p>
                        <p className="p-3 rounded-lg bg-green-50 whitespace-pre-wrap text-sm">
                          {order.solution}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Values */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium">Valores</h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Mão de Obra</p>
                      <p className="text-lg font-medium">{formatCurrency(order.labor_cost)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Peças</p>
                      <p className="text-lg font-medium">{formatCurrency(order.parts_cost)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/10">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Dates */}
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Criado em: </span>
                    <span className="font-medium">
                      {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Atualizado: </span>
                    <span className="font-medium">
                      {format(new Date(order.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {order.actual_completion && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Concluído em: </span>
                      <span className="font-medium text-green-600">
                        {format(new Date(order.actual_completion), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="itens" className="px-6 py-4 space-y-4">
                {/* Consume Stock Button */}
                {(order.status === 'in_progress' || order.status === 'completed') && items && items.length > 0 && items.some(i => i.product_id) && (
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowConsumeModal(true)}
                    >
                      <PackageMinus className="w-4 h-4 mr-2" />
                      Consumir do Estoque
                    </Button>
                  </div>
                )}
                
                {loadingItems ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : items?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum item adicionado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {item.product ? (
                              <div>
                                <p className="font-medium">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground font-mono">{item.product.sku}</p>
                              </div>
                            ) : (
                              <p>{item.description || 'Item sem descrição'}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="anexos" className="px-6 py-4">
                <ServiceOrderAttachments serviceOrderId={order.id} />
              </TabsContent>

              <TabsContent value="historico" className="px-6 py-4 space-y-4">
                {/* Add Note */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Adicionar nota..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button 
                    size="icon"
                    onClick={handleAddNote}
                    disabled={!newNote.trim() || addLog.isPending}
                  >
                    {addLog.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <Separator />

                {/* Timeline */}
                {loadingLogs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : logs?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum registro no histórico</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs?.map((log) => {
                      const config = logTypeConfig[log.type as keyof typeof logTypeConfig] || logTypeConfig.system;
                      const Icon = config.icon;
                      
                      return (
                        <div key={log.id} className="flex gap-3">
                          <div className={`mt-0.5 ${config.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{log.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Status Change Confirmation */}
      <AlertDialog open={!!statusAction} onOpenChange={() => setStatusAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração de status</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja alterar o status da OS para "{statusAction?.label}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleStatusChange}
              disabled={changeStatus.isPending}
            >
              {changeStatus.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Consume Items Modal */}
      {items && (
        <ConsumeItemsModal
          open={showConsumeModal}
          onClose={() => setShowConsumeModal(false)}
          serviceOrderId={order.id}
          items={items}
        />
      )}
    </>
  );
}
