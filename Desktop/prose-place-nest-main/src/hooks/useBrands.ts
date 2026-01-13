import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BrandInput {
  name: string;
  description?: string | null;
  logo_url?: string | null;
  is_active?: boolean;
}

export function useAllBrands() {
  return useQuery({
    queryKey: ['brands-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Brand[];
    },
  });
}

export function useActiveBrands() {
  return useQuery({
    queryKey: ['brands-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (brand: BrandInput) => {
      const { data, error } = await supabase
        .from('brands')
        .insert(brand)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands-all'] });
      queryClient.invalidateQueries({ queryKey: ['brands-active'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...brand }: Partial<BrandInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('brands')
        .update(brand)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands-all'] });
      queryClient.invalidateQueries({ queryKey: ['brands-active'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands-all'] });
      queryClient.invalidateQueries({ queryKey: ['brands-active'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}
