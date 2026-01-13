import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface UnitInput {
  name: string;
  abbreviation: string;
}

export function useAllUnits() {
  return useQuery({
    queryKey: ['units-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Unit[];
    },
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (unit: UnitInput) => {
      const { data, error } = await supabase
        .from('units')
        .insert(unit)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-all'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...unit }: Partial<UnitInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('units')
        .update(unit)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-all'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units-all'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}
