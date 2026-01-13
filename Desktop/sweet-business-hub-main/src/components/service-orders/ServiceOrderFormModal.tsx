import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { 
  useCreateServiceOrder, 
  useUpdateServiceOrder, 
  generateServiceOrderNumber,
  type ServiceOrder 
} from '@/hooks/useServiceOrders';
import { useCustomers } from '@/hooks/useCustomers';
import { useActiveTechnicians } from '@/hooks/useTechnicians';
import { useActiveServiceTypes } from '@/hooks/useServiceTypes';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ServiceOrderAttachments } from './ServiceOrderAttachments';

interface ServiceOrderFormModalProps {
  open: boolean;
  onClose: () => void;
  order?: ServiceOrder | null;
}

export function ServiceOrderFormModal({ open, onClose, order }: ServiceOrderFormModalProps) {
  const [orderNumber, setOrderNumber] = useState('');
  const [customerId, setCustomerId] = useState<string>('');
  const [status, setStatus] = useState<ServiceOrder['status']>('open');
  const [priority, setPriority] = useState<ServiceOrder['priority']>('normal');
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentBrand, setEquipmentBrand] = useState('');
  const [equipmentModel, setEquipmentModel] = useState('');
  const [equipmentSerial, setEquipmentSerial] = useState('');
  const [reportedIssue, setReportedIssue] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [solution, setSolution] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [technicianId, setTechnicianId] = useState<string>('');
  const [serviceTypeId, setServiceTypeId] = useState<string>('');
  const [laborCost, setLaborCost] = useState('0');
  const [partsCost, setPartsCost] = useState('0');

  const createOrder = useCreateServiceOrder();
  const updateOrder = useUpdateServiceOrder();
  const { data: customers } = useCustomers();
  const { data: technicians } = useActiveTechnicians();
  const { data: serviceTypes } = useActiveServiceTypes();
  const { toast } = useToast();

  const isEditing = !!order;
  const isLoading = createOrder.isPending || updateOrder.isPending;

  const total = parseFloat(laborCost || '0') + parseFloat(partsCost || '0');

  useEffect(() => {
    const initForm = async () => {
      if (order) {
        setOrderNumber(order.order_number);
        setCustomerId(order.customer_id || '');
        setTechnicianId(order.technician_id || '');
        setServiceTypeId(order.service_type_id || '');
        setStatus(order.status);
        setPriority(order.priority);
        setEquipmentName(order.equipment_name || '');
        setEquipmentBrand(order.equipment_brand || '');
        setEquipmentModel(order.equipment_model || '');
        setEquipmentSerial(order.equipment_serial || '');
        setReportedIssue(order.reported_issue || '');
        setDiagnosis(order.diagnosis || '');
        setSolution(order.solution || '');
        setTechnicianNotes(order.technician_notes || '');
        setLaborCost(order.labor_cost?.toString() || '0');
        setPartsCost(order.parts_cost?.toString() || '0');
      } else {
        const newNumber = await generateServiceOrderNumber();
        setOrderNumber(newNumber);
        setCustomerId('');
        setTechnicianId('');
        setServiceTypeId('');
        setStatus('open');
        setPriority('normal');
        setEquipmentName('');
        setEquipmentBrand('');
        setEquipmentModel('');
        setEquipmentSerial('');
        setReportedIssue('');
        setDiagnosis('');
        setSolution('');
        setTechnicianNotes('');
        setLaborCost('0');
        setPartsCost('0');
      }
    };

    if (open) {
      initForm();
    }
  }, [order, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!equipmentName.trim()) {
      toast({
        title: 'Equipamento obrigatório',
        description: 'Preencha o nome do equipamento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = {
        order_number: orderNumber,
        customer_id: customerId || null,
        technician_id: technicianId || null,
        service_type_id: serviceTypeId || null,
        status,
        priority,
        equipment_name: equipmentName.trim(),
        equipment_brand: equipmentBrand.trim() || null,
        equipment_model: equipmentModel.trim() || null,
        equipment_serial: equipmentSerial.trim() || null,
        reported_issue: reportedIssue.trim() || null,
        diagnosis: diagnosis.trim() || null,
        solution: solution.trim() || null,
        technician_notes: technicianNotes.trim() || null,
        labor_cost: parseFloat(laborCost) || 0,
        parts_cost: parseFloat(partsCost) || 0,
        total,
      };

      if (isEditing) {
        await updateOrder.mutateAsync({ id: order.id, ...data });
        toast({
          title: 'OS atualizada',
          description: 'A ordem de serviço foi atualizada com sucesso.',
        });
      } else {
        await createOrder.mutateAsync(data);
        toast({
          title: 'OS criada',
          description: 'A ordem de serviço foi criada com sucesso.',
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar a OS.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {isEditing ? `Editar OS ${order.order_number}` : 'Nova Ordem de Serviço'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
            {/* Header Info */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="order_number">Nº OS</Label>
                <Input
                  id="order_number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="font-mono"
                  readOnly={isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ServiceOrder['status'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberta</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="invoiced">Faturada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as ServiceOrder['priority'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem cliente</SelectItem>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Technician */}
            <div className="space-y-2">
              <Label htmlFor="technician">Técnico Responsável</Label>
              <Select value={technicianId} onValueChange={setTechnicianId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o técnico (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem técnico</SelectItem>
                  {technicians?.map((technician) => (
                    <SelectItem key={technician.id} value={technician.id}>
                      {technician.name} {technician.specialty && `(${technician.specialty})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="serviceType">Tipo de Serviço</Label>
              <Select value={serviceTypeId} onValueChange={setServiceTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de serviço (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem tipo</SelectItem>
                  {serviceTypes?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Equipment */}
            <div>
              <h3 className="text-sm font-medium mb-3">Dados do Equipamento</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="equipment_name">Nome do Equipamento *</Label>
                  <Input
                    id="equipment_name"
                    value={equipmentName}
                    onChange={(e) => setEquipmentName(e.target.value)}
                    placeholder="Ex: Notebook, Impressora, Celular..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment_brand">Marca</Label>
                  <Input
                    id="equipment_brand"
                    value={equipmentBrand}
                    onChange={(e) => setEquipmentBrand(e.target.value)}
                    placeholder="Ex: Dell, HP, Samsung..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="equipment_model">Modelo</Label>
                  <Input
                    id="equipment_model"
                    value={equipmentModel}
                    onChange={(e) => setEquipmentModel(e.target.value)}
                    placeholder="Ex: Inspiron 15, LaserJet..."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="equipment_serial">Número de Série</Label>
                  <Input
                    id="equipment_serial"
                    value={equipmentSerial}
                    onChange={(e) => setEquipmentSerial(e.target.value)}
                    placeholder="Número de série do equipamento"
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Service Details */}
            <div>
              <h3 className="text-sm font-medium mb-3">Detalhes do Serviço</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reported_issue">Problema Relatado</Label>
                  <Textarea
                    id="reported_issue"
                    value={reportedIssue}
                    onChange={(e) => setReportedIssue(e.target.value)}
                    placeholder="Descreva o problema relatado pelo cliente..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnóstico</Label>
                  <Textarea
                    id="diagnosis"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Diagnóstico técnico do problema..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="solution">Solução Aplicada</Label>
                  <Textarea
                    id="solution"
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="Descreva a solução aplicada..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technician_notes">Observações do Técnico</Label>
                  <Textarea
                    id="technician_notes"
                    value={technicianNotes}
                    onChange={(e) => setTechnicianNotes(e.target.value)}
                    placeholder="Anotações internas..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Costs */}
            <div>
              <h3 className="text-sm font-medium mb-3">Valores</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="labor_cost">Mão de Obra (R$)</Label>
                  <Input
                    id="labor_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parts_cost">Peças (R$)</Label>
                  <Input
                    id="parts_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={partsCost}
                    onChange={(e) => setPartsCost(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total (R$)</Label>
                  <div className="h-10 px-3 py-2 rounded-md border bg-muted font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(total)}
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments - only show when editing */}
            {isEditing && (
              <>
                <Separator />
                <ServiceOrderAttachments serviceOrderId={order.id} />
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Salvar' : 'Criar OS'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
