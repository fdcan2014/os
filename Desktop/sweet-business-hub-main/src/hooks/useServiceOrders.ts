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
