import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, differenceInHours } from 'date-fns';

export interface ServiceOrderMetrics {
  totalOrders: number;
  openOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  avgCompletionDays: number;
  totalRevenue: number;
}

export interface TechnicianMetric {
  id: string;
  name: string;
  totalOrders: number;
  completedOrders: number;
  avgCompletionHours: number;
  totalRevenue: number;
}

export interface ServiceTypeMetric {
  id: string;
  name: string;
  totalOrders: number;
  percentage: number;
  totalRevenue: number;
}

export function useServiceOrderMetrics() {
  return useQuery({
    queryKey: ['service-order-metrics'],
    queryFn: async (): Promise<ServiceOrderMetrics> => {
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select('status, total, created_at, actual_completion');
      
      if (error) throw error;
      
      const totalOrders = orders?.length || 0;
      const openOrders = orders?.filter(o => o.status === 'open').length || 0;
      const inProgressOrders = orders?.filter(o => o.status === 'in_progress').length || 0;
      const completedOrders = orders?.filter(o => o.status === 'completed' || o.status === 'invoiced').length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      
      // Calculate average completion time
      const completedWithDates = orders?.filter(o => 
        (o.status === 'completed' || o.status === 'invoiced') && o.actual_completion
      ) || [];
      
      let avgCompletionDays = 0;
      if (completedWithDates.length > 0) {
        const totalDays = completedWithDates.reduce((sum, o) => {
          const days = differenceInDays(
            new Date(o.actual_completion!),
            new Date(o.created_at)
          );
          return sum + Math.max(0, days);
        }, 0);
        avgCompletionDays = Math.round((totalDays / completedWithDates.length) * 10) / 10;
      }
      
      return {
        totalOrders,
        openOrders,
        inProgressOrders,
        completedOrders,
        avgCompletionDays,
        totalRevenue,
      };
    },
    refetchInterval: 60000,
  });
}

export function useTechnicianMetrics() {
  return useQuery({
    queryKey: ['technician-metrics'],
    queryFn: async (): Promise<TechnicianMetric[]> => {
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select(`
          status,
          total,
          created_at,
          actual_completion,
          technician_id,
          technician:technicians(id, name)
        `)
        .not('technician_id', 'is', null);
      
      if (error) throw error;
      
      // Group by technician
      const technicianMap = new Map<string, {
        id: string;
        name: string;
        orders: typeof orders;
      }>();
      
      orders?.forEach((order: any) => {
        if (!order.technician) return;
        
        const techId = order.technician.id;
        if (!technicianMap.has(techId)) {
          technicianMap.set(techId, {
            id: techId,
            name: order.technician.name,
            orders: [],
          });
        }
        technicianMap.get(techId)!.orders.push(order);
      });
      
      const metrics: TechnicianMetric[] = [];
      
      technicianMap.forEach((tech) => {
        const completedOrders = tech.orders.filter((o: any) => 
          o.status === 'completed' || o.status === 'invoiced'
        );
        
        const completedWithDates = completedOrders.filter((o: any) => o.actual_completion);
        
        let avgCompletionHours = 0;
        if (completedWithDates.length > 0) {
          const totalHours = completedWithDates.reduce((sum: number, o: any) => {
            const hours = differenceInHours(
              new Date(o.actual_completion),
              new Date(o.created_at)
            );
            return sum + Math.max(0, hours);
          }, 0);
          avgCompletionHours = Math.round(totalHours / completedWithDates.length);
        }
        
        metrics.push({
          id: tech.id,
          name: tech.name,
          totalOrders: tech.orders.length,
          completedOrders: completedOrders.length,
          avgCompletionHours,
          totalRevenue: tech.orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        });
      });
      
      return metrics.sort((a, b) => b.totalOrders - a.totalOrders);
    },
    refetchInterval: 60000,
  });
}

export function useServiceTypeMetrics() {
  return useQuery({
    queryKey: ['service-type-metrics'],
    queryFn: async (): Promise<ServiceTypeMetric[]> => {
      const { data: orders, error } = await supabase
        .from('service_orders')
        .select(`
          total,
          service_type_id,
          service_type:service_types(id, name)
        `);
      
      if (error) throw error;
      
      const totalOrders = orders?.length || 0;
      
      // Group by service type
      const typeMap = new Map<string, {
        id: string;
        name: string;
        count: number;
        revenue: number;
      }>();
      
      orders?.forEach((order: any) => {
        const typeId = order.service_type?.id || 'sem-tipo';
        const typeName = order.service_type?.name || 'Sem Tipo';
        
        if (!typeMap.has(typeId)) {
          typeMap.set(typeId, {
            id: typeId,
            name: typeName,
            count: 0,
            revenue: 0,
          });
        }
        
        const entry = typeMap.get(typeId)!;
        entry.count++;
        entry.revenue += order.total || 0;
      });
      
      const metrics: ServiceTypeMetric[] = [];
      
      typeMap.forEach((type) => {
        metrics.push({
          id: type.id,
          name: type.name,
          totalOrders: type.count,
          percentage: totalOrders > 0 ? Math.round((type.count / totalOrders) * 100) : 0,
          totalRevenue: type.revenue,
        });
      });
      
      return metrics.sort((a, b) => b.totalOrders - a.totalOrders);
    },
    refetchInterval: 60000,
  });
}
