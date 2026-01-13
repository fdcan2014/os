import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  code: string | null;
  parent_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  parent?: { name: string } | null;
  _count?: { products: number };
}

export interface CategoryInput {
  name: string;
  code?: string | null;
  parent_id?: string | null;
  is_active?: boolean;
}

export function useAllCategories() {
  return useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          parent:categories!parent_id(name)
        `)
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useActiveCategories() {
  return useQuery({
    queryKey: ['categories-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: CategoryInput) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-all'] });
      queryClient.invalidateQueries({ queryKey: ['categories-active'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<CategoryInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-all'] });
      queryClient.invalidateQueries({ queryKey: ['categories-active'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories-all'] });
      queryClient.invalidateQueries({ queryKey: ['categories-active'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export async function generateCategoryCode(name: string): Promise<string> {
  // Create code from first 3 letters of name
  const baseCode = name
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();
  
  // Check if code exists
  const { data } = await supabase
    .from('categories')
    .select('code')
    .like('code', `${baseCode}%`);
  
  if (!data || data.length === 0) {
    return baseCode;
  }
  
  // Find next available number
  let counter = 1;
  let newCode = baseCode;
  
  while (data.some(cat => cat.code === newCode)) {
    counter++;
    newCode = `${baseCode}${counter}`;
  }
  
  return newCode;
}
