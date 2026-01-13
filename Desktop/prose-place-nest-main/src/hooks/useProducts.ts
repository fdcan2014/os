import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductSchema, type ProductInput } from '@/lib/validations';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  unit_id: string | null;
  cost_price: number;
  sell_price: number;
  tax_rate_id: string | null;
  min_stock: number;
  max_stock: number | null;
  reorder_point: number;
  has_variants: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: { name: string } | null;
  brand?: { name: string } | null;
  unit?: { name: string; abbreviation: string } | null;
  stock_items?: { quantity: number; location_id: string }[];
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          brand:brands(name),
          unit:units(name, abbreviation),
          stock_items(quantity, location_id)
        `)
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name),
          brand:brands(name),
          unit:units(name, abbreviation),
          stock_items(quantity, location_id)
        `)
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: ProductInput) => {
      // Validate input before database operation
      const validated = ProductSchema.parse(product);
      
      // Additional business logic validation
      if (validated.sell_price < validated.cost_price) {
        console.warn('Warning: Sell price is lower than cost price');
      }
      
      const { data, error } = await supabase
        .from('products')
        .insert(validated as TablesInsert<'products'>)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...product }: Partial<ProductInput> & { id: string }) => {
      // Validate partial input before database operation
      const validated = ProductSchema.partial().parse(product);
      
      const { data, error } = await supabase
        .from('products')
        .update(validated as TablesUpdate<'products'>)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export interface Category {
  id: string;
  name: string;
  code: string | null;
  parent_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, code, parent_id, is_active, created_at')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });
}
