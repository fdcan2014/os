import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CustomerSchema, type CustomerInput } from '@/lib/validations';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface Customer {
  id: string;
  code: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  credit_limit: number;
  current_balance: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Customer[];
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Customer | null;
    },
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (customer: CustomerInput) => {
      // Validate input before database operation
      const validated = CustomerSchema.parse(customer);
      
      const { data, error } = await supabase
        .from('customers')
        .insert(validated as TablesInsert<'customers'>)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...customer }: Partial<CustomerInput> & { id: string }) => {
      // Validate partial input before database operation
      const validated = CustomerSchema.partial().parse(customer);
      
      const { data, error } = await supabase
        .from('customers')
        .update(validated as TablesUpdate<'customers'>)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
