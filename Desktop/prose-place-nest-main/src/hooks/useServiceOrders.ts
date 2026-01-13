import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceOrder {
  id: string;
  order_number: string;
  customer_id: string | null;
  technician_id: string | null;
  service_type_id: string | null;
  status: 'open' | 'in_progress' | 'completed' | 'invoiced' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  equipment_name: string | null;
  equipment_brand: string | null;
  equipment_model: string | null;
  equipment_serial: string | null;
  reported_issue: string | null;
  diagnosis: string | null;
  solution: string | null;
  technician_notes: string | null;
  estimated_completion: string | null;
  actual_completion: string | null;
  labor_cost: number;
  parts_cost: number;
  total: number;
  created_at: string;
  updated_at: string;
  customer?: { name: string; phone: string | null } | null;
  technician?: { name: string; specialty: string | null } | null;
  service_type?: { name: string } | null;
}

export interface ServiceOrderItem {
  id: string;
  service_order_id: string;
  product_id: string | null;
  description: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
  product?: { name: string; sku: string } | null;
}

export interface ServiceOrderLog {
  id: string;
  service_order_id: string;
  type: 'status_change' | 'note' | 'system' | 'inventory';
  message: string;
  created_at: string;
  created_by: string | null;
}

export interface ServiceOrderInput {
  order_number: string;
  customer_id?: string | null;
  technician_id?: string | null;
  service_type_id?: string | null;
  status?: 'open' | 'in_progress' | 'completed' | 'invoiced' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  equipment_name?: string | null;
  equipment_brand?: string | null;
  equipment_model?: string | null;
  equipment_serial?: string | null;
  reported_issue?: string | null;
  diagnosis?: string | null;
  solution?: string | null;
  technician_notes?: string | null;
  estimated_completion?: string | null;
  actual_completion?: string | null;
  labor_cost?: number;
  parts_cost?: number;
  total?: number;
}

export interface ServiceOrderItemInput {
  service_order_id: string;
  product_id?: string | null;
  description?: string | null;
  quantity: number;
  unit_price: number;
  total: number;
}

export function useServiceOrders() {
  return useQuery({
    queryKey: ['service-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(name, phone),
          technician:technicians(name, specialty),
          service_type:service_types(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ServiceOrder[];
    },
  });
}

export function useServiceOrder(id: string) {
  return useQuery({
    queryKey: ['service-orders', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_orders')
        .select(`
          *,
          customer:customers(name, phone),
          technician:technicians(name, specialty),
          service_type:service_types(name)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as ServiceOrder | null;
    },
    enabled: !!id,
  });
}

export function useServiceOrderItems(serviceOrderId: string) {
  return useQuery({
    queryKey: ['service-order-items', serviceOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_order_items')
        .select(`
          *,
          product:products(name, sku)
        `)
        .eq('service_order_id', serviceOrderId)
        .order('created_at');
      
      if (error) throw error;
      return data as ServiceOrderItem[];
    },
    enabled: !!serviceOrderId,
  });
}

// Service order logs - returns empty for now as table doesn't exist yet
export function useServiceOrderLogs(serviceOrderId: string) {
  return useQuery({
    queryKey: ['service-order-logs', serviceOrderId],
    queryFn: async (): Promise<ServiceOrderLog[]> => {
      // Table doesn't exist in current schema - return empty
      return [];
    },
    enabled: !!serviceOrderId,
  });
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (order: ServiceOrderInput) => {
      const { data, error } = await supabase
        .from('service_orders')
        .insert(order)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
}

export function useUpdateServiceOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...order }: Partial<ServiceOrderInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('service_orders')
        .update(order)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
}

export function useChangeServiceOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes 
    }: { 
      id: string; 
      status: ServiceOrder['status']; 
      notes?: string;
    }) => {
      // Update status
      const updateData: Partial<ServiceOrderInput> = { status };
      
      // Set completion date when completing
      if (status === 'completed') {
        updateData.actual_completion = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('service_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['service-order-logs', variables.id] });
    },
  });
}

export function useDeleteServiceOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
}

export function useCreateServiceOrderItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (item: ServiceOrderItemInput) => {
      const { data, error } = await supabase
        .from('service_order_items')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-order-items', variables.service_order_id] });
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
}

export function useUpdateServiceOrderItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      serviceOrderId, 
      ...item 
    }: Partial<ServiceOrderItemInput> & { id: string; serviceOrderId: string }) => {
      const { data, error } = await supabase
        .from('service_order_items')
        .update(item)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { ...data, serviceOrderId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['service-order-items', result.serviceOrderId] });
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
}

export function useDeleteServiceOrderItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, serviceOrderId }: { id: string; serviceOrderId: string }) => {
      const { error } = await supabase
        .from('service_order_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return serviceOrderId;
    },
    onSuccess: (serviceOrderId) => {
      queryClient.invalidateQueries({ queryKey: ['service-order-items', serviceOrderId] });
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
}

export function useAddServiceOrderLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      serviceOrderId, 
      type, 
      message 
    }: { 
      serviceOrderId: string; 
      type: ServiceOrderLog['type']; 
      message: string;
    }): Promise<ServiceOrderLog> => {
      // Table doesn't exist yet - return mock
      return {
        id: crypto.randomUUID(),
        service_order_id: serviceOrderId,
        type,
        message,
        created_at: new Date().toISOString(),
        created_by: null,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-order-logs', variables.serviceOrderId] });
    },
  });
}

// Consume items from service order and update stock
export function useConsumeServiceOrderItems() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      serviceOrderId, 
      items, 
      notes 
    }: { 
      serviceOrderId: string;
      items: Array<{ itemId: string; quantity: number }>;
      notes?: string;
    }) => {
      // Get the service order items with product info
      const { data: orderItems, error: itemsError } = await supabase
        .from('service_order_items')
        .select(`
          id,
          product_id,
          quantity,
          unit_price,
          product:products(name, cost_price)
        `)
        .in('id', items.map(i => i.itemId));

      if (itemsError) throw itemsError;
      if (!orderItems || orderItems.length === 0) {
        throw new Error('Nenhum item encontrado');
      }

      // Get the default location for stock operations
      const { data: defaultLocation, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .eq('is_default', true)
        .maybeSingle();

      if (locationError) throw locationError;
      
      const locationId = defaultLocation?.id;
      if (!locationId) {
        throw new Error('Nenhum local padrão configurado');
      }

      // Process each item
      for (const consumeItem of items) {
        const orderItem = orderItems.find(oi => oi.id === consumeItem.itemId);
        if (!orderItem || !orderItem.product_id) continue;

        const productId = orderItem.product_id;
        const quantityToConsume = consumeItem.quantity;
        const productName = (orderItem.product as any)?.name || 'Produto';
        const unitCost = (orderItem.product as any)?.cost_price || orderItem.unit_price;

        // Check stock availability
        const { data: stockItem, error: stockCheckError } = await supabase
          .from('stock_items')
          .select('id, quantity')
          .eq('product_id', productId)
          .eq('location_id', locationId)
          .is('variant_id', null)
          .maybeSingle();

        if (stockCheckError) throw stockCheckError;

        const currentStock = stockItem?.quantity || 0;
        if (currentStock < quantityToConsume) {
          throw new Error(`Estoque insuficiente para ${productName}. Disponível: ${currentStock}, Necessário: ${quantityToConsume}`);
        }

        // Update stock quantity
        if (stockItem) {
          const { error: updateError } = await supabase
            .from('stock_items')
            .update({ quantity: currentStock - quantityToConsume })
            .eq('id', stockItem.id);

          if (updateError) throw updateError;
        }

        // Create stock movement
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: productId,
            location_id: locationId,
            type: 'issue',
            quantity: -quantityToConsume,
            unit_cost: unitCost,
            reference_type: 'service_order',
            reference_id: serviceOrderId,
            notes: notes || `Consumo em OS`,
          });

        if (movementError) throw movementError;
      }

      // Log entry would go here if service_order_logs table existed
      // For now, we just log to console
      const itemNames = orderItems.map(oi => (oi.product as any)?.name || 'Item').join(', ');
      console.log(`[Service Order ${serviceOrderId}] Peças consumidas: ${itemNames}`);

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-order-items', variables.serviceOrderId] });
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
    },
  });
}

// Recalculate service order totals
export function useRecalculateServiceOrderTotals() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (serviceOrderId: string) => {
      // Get all items for the service order
      const { data: items, error: itemsError } = await supabase
        .from('service_order_items')
        .select('total')
        .eq('service_order_id', serviceOrderId);

      if (itemsError) throw itemsError;

      const partsCost = items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

      // Get current labor cost
      const { data: order, error: orderError } = await supabase
        .from('service_orders')
        .select('labor_cost')
        .eq('id', serviceOrderId)
        .single();

      if (orderError) throw orderError;

      const laborCost = order?.labor_cost || 0;
      const total = laborCost + partsCost;

      // Update the service order
      const { data, error } = await supabase
        .from('service_orders')
        .update({ parts_cost: partsCost, total })
        .eq('id', serviceOrderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, serviceOrderId) => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] });
      queryClient.invalidateQueries({ queryKey: ['service-orders', serviceOrderId] });
    },
  });
}

export async function generateServiceOrderNumber(): Promise<string> {
  const { data } = await supabase
    .from('service_orders')
    .select('order_number')
    .order('created_at', { ascending: false })
    .limit(1);
  
  let nextNumber = 1;
  
  if (data && data.length > 0) {
    const lastNumber = data[0].order_number;
    const match = lastNumber.match(/OS-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }
  
  return `OS-${String(nextNumber).padStart(4, '0')}`;
}
