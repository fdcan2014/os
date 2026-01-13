import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye, 
  Wrench,
  Clock,
  PlayCircle,
  CheckCircle2,
  FileText,
  XCircle
} from 'lucide-react';
import { useServiceOrders, useDeleteServiceOrder, type ServiceOrder } from '@/hooks/useServiceOrders';
import { ServiceOrderFormModal } from '@/components/service-orders/ServiceOrderFormModal';
import { ServiceOrderViewModal } from '@/components/service-orders/ServiceOrderViewModal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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

export default function ServiceOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ServiceOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<ServiceOrder | null>(null);
  
  const { data: orders, isLoading } = useServiceOrders();

  // Read URL params on mount and when they change
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const urlTechnician = searchParams.get('technician');
    
    if (urlStatus) {
      setStatusFilter(urlStatus);
    }
    if (urlTechnician) {
      setTechnicianFilter(urlTechnician);
    }
  }, [searchParams]);

  // Update URL when filters change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', value);
    }
    setSearchParams(newParams);
  };

  const handleTechnicianFilterChange = (value: string) => {
    setTechnicianFilter(value);
    const newParams = new URLSearchParams(searchParams);
    if (value === 'all') {
      newParams.delete('technician');
    } else {
      newParams.set('technician', value);
    }
    setSearchParams(newParams);
  };

  // Get unique technicians for filter
  const technicians = orders
    ?.filter(o => o.technician)
    ?.reduce((acc, order) => {
      if (order.technician && !acc.find(t => t.id === order.technician_id)) {
        acc.push({ id: order.technician_id!, name: order.technician.name });
      }
      return acc;
    }, [] as { id: string; name: string }[]) || [];
  const deleteOrder = useDeleteServiceOrder();
  const { toast } = useToast();

  const filteredOrders = orders?.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.technician?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesTechnician = technicianFilter === 'all' || order.technician_id === technicianFilter;
    
    return matchesSearch && matchesStatus && matchesTechnician;
  });

  const statusCounts = {
    open: orders?.filter(o => o.status === 'open').length || 0,
    in_progress: orders?.filter(o => o.status === 'in_progress').length || 0,
    completed: orders?.filter(o => o.status === 'completed').length || 0,
    invoiced: orders?.filter(o => o.status === 'invoiced').length || 0,
  };

  const handleEdit = (order: ServiceOrder) => {
    setEditingOrder(order);
    setIsFormOpen(true);
  };

  const handleView = (order: ServiceOrder) => {
    setViewingOrder(order);
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    
    try {
      await deleteOrder.mutateAsync(deletingOrder.id);
      toast({
        title: 'OS excluída',
        description: 'A ordem de serviço foi excluída com sucesso.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Não foi possível excluir a OS.',
        variant: 'destructive',
      });
    } finally {
      setDeletingOrder(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingOrder(null);
  };

  return (
    <MainLayout title="Ordens de Serviço">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ordens de Serviço</h1>
            <p className="text-muted-foreground">
              Gerencie manutenções e reparos de equipamentos.
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova OS
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStatusFilterChange('open')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Abertas</p>
                  <p className="text-2xl font-bold text-blue-600">{statusCounts.open}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStatusFilterChange('in_progress')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                  <p className="text-2xl font-bold text-orange-600">{statusCounts.in_progress}</p>
                </div>
                <PlayCircle className="w-8 h-8 text-orange-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStatusFilterChange('completed')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                  <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStatusFilterChange('invoiced')}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Faturadas</p>
                  <p className="text-2xl font-bold text-purple-600">{statusCounts.invoiced}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-600 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar OS, cliente, equipamento ou técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="open">Abertas</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
              <SelectItem value="invoiced">Faturadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={technicianFilter} onValueChange={handleTechnicianFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Técnico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Técnicos</SelectItem>
              {technicians.map((tech) => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº OS</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Equipamento</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOrders?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Wrench className="w-8 h-8" />
                      <span>Nenhuma ordem de serviço encontrada</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders?.map((order) => {
                  const status = statusConfig[order.status];
                  const priority = priorityConfig[order.priority];
                  
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>{order.customer?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{order.equipment_name || '-'}</span>
                          {order.equipment_brand && (
                            <span className="text-xs text-muted-foreground">
                              {order.equipment_brand} {order.equipment_model && `- ${order.equipment_model}`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.technician ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{order.technician.name}</span>
                            {order.technician.specialty && (
                              <span className="text-xs text-muted-foreground">
                                {order.technician.specialty}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <status.icon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(order.total)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(order.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleView(order)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(order)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletingOrder(order)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
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
      </div>

      {/* Form Modal */}
      <ServiceOrderFormModal
        open={isFormOpen}
        onClose={handleFormClose}
        order={editingOrder}
      />

      {/* View Modal */}
      <ServiceOrderViewModal
        open={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        order={viewingOrder}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingOrder} onOpenChange={() => setDeletingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a OS "{deletingOrder?.order_number}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
