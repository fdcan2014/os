import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StockMovement {
  id: string;
  product_id: string;
  location_id: string;
  variant_id: string | null;
  type: string;
  quantity: number;
  unit_cost: number | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_at: string | null;
  created_by: string | null;
  location?: { name: string } | null;
}

export function useProductStockMovements(productId: string | null) {
  return useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          location:locations(name)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!productId,
  });
}

export interface StockByLocation {
  location_id: string;
  location_name: string;
  quantity: number;
  reserved_quantity: number;
  avg_cost: number | null;
  last_count_date: string | null;
}

export function useProductStockByLocation(productId: string | null) {
  return useQuery({
    queryKey: ['stock-by-location', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      const { data, error } = await supabase
        .from('stock_items')
        .select(`
          quantity,
          reserved_quantity,
          avg_cost,
          last_count_date,
          location:locations(id, name)
        `)
        .eq('product_id', productId);
      
      if (error) throw error;
      
      return (data || []).map((item: any) => ({
        location_id: item.location?.id,
        location_name: item.location?.name || 'Desconhecido',
        quantity: Number(item.quantity) || 0,
        reserved_quantity: Number(item.reserved_quantity) || 0,
        avg_cost: item.avg_cost ? Number(item.avg_cost) : null,
        last_count_date: item.last_count_date,
      })) as StockByLocation[];
    },
    enabled: !!productId,
  });
}
