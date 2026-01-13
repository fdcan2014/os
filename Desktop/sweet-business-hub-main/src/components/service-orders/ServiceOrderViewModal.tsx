import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Camera
} from 'lucide-react';
import { type ServiceOrder } from '@/hooks/useServiceOrders';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceOrderAttachments } from './ServiceOrderAttachments';

interface ServiceOrderViewModalProps {
  open: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
}

const statusConfig = {
  open: { label: 'Aberta', variant: 'default' as const, icon: Clock, color: 'text-blue-600' },
  in_progress: { label: 'Em Andamento', variant: 'secondary' as const, icon: PlayCircle, color: 'text-orange-600' },
  completed: { label: 'Concluída', variant: 'outline' as const, icon: CheckCircle2, color: 'text-green-600' },
  invoiced: { label: 'Faturada', variant: 'default' as const, icon: FileText, color: 'text-purple-600' },
  cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

export function ServiceOrderViewModal({ open, onClose, order }: ServiceOrderViewModalProps) {
  if (!order) return null;

  const status = statusConfig[order.status];
  const priority = priorityConfig[order.priority];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <span className="font-mono">{order.order_number}</span>
              <Badge variant={status.variant} className="gap-1">
                <status.icon className="w-3 h-3" />
                {status.label}
              </Badge>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                {priority.label}
              </span>
            </DialogTitle>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 pb-6 space-y-6">
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
                    <p className="p-3 rounded-lg bg-muted/50 whitespace-pre-wrap">
                      {order.reported_issue}
                    </p>
                  </div>
                )}
                {order.diagnosis && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Diagnóstico</p>
                    <p className="p-3 rounded-lg bg-muted/50 whitespace-pre-wrap">
                      {order.diagnosis}
                    </p>
                  </div>
                )}
                {order.solution && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Solução Aplicada</p>
                    <p className="p-3 rounded-lg bg-muted/50 whitespace-pre-wrap">
                      {order.solution}
                    </p>
                  </div>
                )}
                {order.technician_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Observações do Técnico</p>
                    <p className="p-3 rounded-lg bg-muted/50 whitespace-pre-wrap">
                      {order.technician_notes}
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
                  <p className="text-lg font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(order.labor_cost)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Peças</p>
                  <p className="text-lg font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(order.parts_cost)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-primary">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(order.total)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Attachments */}
            <ServiceOrderAttachments serviceOrderId={order.id} readOnly />

            <Separator />

            {/* Dates */}
            <div className="flex gap-6 text-sm text-muted-foreground">
              <div>
                <span>Criado em: </span>
                <span className="font-medium text-foreground">
                  {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div>
                <span>Atualizado em: </span>
                <span className="font-medium text-foreground">
                  {format(new Date(order.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
