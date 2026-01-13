import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export interface DashboardMetrics {
  todaySales: number;
  todayOrders: number;
  grossProfit: number;
  lowStockCount: number;
  yesterdaySales: number;
  yesterdayOrders: number;
  yesterdayProfit: number;
}

export interface SalesChartData {
  date: string;
  sales: number;
}

export interface TopProduct {
  name: string;
  sku: string;
  sold: number;
  revenue: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'sale' | 'stock' | 'purchase' | 'alert';
  message: string;
  time: string;
  timestamp: Date;
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async (): Promise<DashboardMetrics> => {
      const today = new Date();
      const yesterday = subDays(today, 1);
      
      // Get today's sales
      const { data: todayInvoices } = await supabase
        .from('sales_invoices')
        .select('total, subtotal')
        .gte('invoice_date', startOfDay(today).toISOString())
        .lte('invoice_date', endOfDay(today).toISOString());

      // Get yesterday's sales for comparison
      const { data: yesterdayInvoices } = await supabase
        .from('sales_invoices')
        .select('total, subtotal')
        .gte('invoice_date', startOfDay(yesterday).toISOString())
        .lte('invoice_date', endOfDay(yesterday).toISOString());

      // Get low stock items (quantity below reorder_point)
      const { data: lowStockItems } = await supabase
        .from('stock_items')
        .select(`
          quantity,
          product:products!inner(reorder_point, min_stock)
        `);

      const lowStockCount = lowStockItems?.filter((item: any) => {
        const threshold = item.product?.reorder_point || item.product?.min_stock || 10;
        return (item.quantity || 0) <= threshold;
      }).length || 0;

      const todaySales = todayInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      const todayOrders = todayInvoices?.length || 0;
      
      // Estimate gross profit as 30% of subtotal (simplified)
      const grossProfit = todayInvoices?.reduce((sum, inv) => sum + ((inv.subtotal || 0) * 0.3), 0) || 0;

      const yesterdaySales = yesterdayInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      const yesterdayOrders = yesterdayInvoices?.length || 0;
      const yesterdayProfit = yesterdayInvoices?.reduce((sum, inv) => sum + ((inv.subtotal || 0) * 0.3), 0) || 0;

      return {
        todaySales,
        todayOrders,
        grossProfit,
        lowStockCount,
        yesterdaySales,
        yesterdayOrders,
        yesterdayProfit,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useWeeklySalesChart() {
  return useQuery({
    queryKey: ['weekly-sales-chart'],
    queryFn: async (): Promise<SalesChartData[]> => {
      const days = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        days.push({
          date,
          label: format(date, 'EEE'),
        });
      }

      const chartData: SalesChartData[] = [];

      for (const day of days) {
        const { data: invoices } = await supabase
          .from('sales_invoices')
          .select('total')
          .gte('invoice_date', startOfDay(day.date).toISOString())
          .lte('invoice_date', endOfDay(day.date).toISOString());

        const sales = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
        chartData.push({ date: day.label, sales });
      }

      return chartData;
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useTopProducts() {
  return useQuery({
    queryKey: ['top-products'],
    queryFn: async (): Promise<TopProduct[]> => {
      // Get sales invoice items with product info
      const { data: salesItems } = await supabase
        .from('sales_invoice_items')
        .select(`
          quantity,
          total,
          product:products!inner(name, sku)
        `);

      if (!salesItems || salesItems.length === 0) {
        // Return products with stock as fallback
        const { data: products } = await supabase
          .from('products')
          .select('name, sku, sell_price')
          .eq('is_active', true)
          .limit(5);

        return products?.map(p => ({
          name: p.name,
          sku: p.sku,
          sold: 0,
          revenue: 0,
        })) || [];
      }

      // Aggregate by product
      const productMap = new Map<string, TopProduct>();

      salesItems.forEach((item: any) => {
        const sku = item.product.sku;
        const existing = productMap.get(sku);
        
        if (existing) {
          existing.sold += item.quantity;
          existing.revenue += item.total;
        } else {
          productMap.set(sku, {
            name: item.product.name,
            sku: sku,
            sold: item.quantity,
            revenue: item.total,
          });
        }
      });

      // Sort by revenue and take top 5
      return Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    },
    refetchInterval: 60000,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async (): Promise<RecentActivityItem[]> => {
      const activities: RecentActivityItem[] = [];

      // Get recent sales
      const { data: recentSales } = await supabase
        .from('sales_invoices')
        .select('id, invoice_number, total, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      recentSales?.forEach(sale => {
        activities.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          message: `New sale #${sale.invoice_number} - $${(sale.total || 0).toFixed(2)}`,
          time: getRelativeTime(new Date(sale.created_at!)),
          timestamp: new Date(sale.created_at!),
        });
      });

      // Get recent purchase orders
      const { data: recentPurchases } = await supabase
        .from('purchase_orders')
        .select('id, order_number, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      recentPurchases?.forEach(po => {
        activities.push({
          id: `purchase-${po.id}`,
          type: 'purchase',
          message: `Purchase order #${po.order_number} created`,
          time: getRelativeTime(new Date(po.created_at!)),
          timestamp: new Date(po.created_at!),
        });
      });

      // Get low stock alerts
      const { data: lowStockItems } = await supabase
        .from('stock_items')
        .select(`
          quantity,
          updated_at,
          product:products!inner(name, reorder_point, min_stock)
        `)
        .limit(10);

      lowStockItems?.forEach((item: any) => {
        const threshold = item.product?.reorder_point || item.product?.min_stock || 10;
        if ((item.quantity || 0) <= threshold) {
          activities.push({
            id: `alert-${item.product.name}`,
            type: 'alert',
            message: `Low stock alert: ${item.product.name}`,
            time: getRelativeTime(new Date(item.updated_at || new Date())),
            timestamp: new Date(item.updated_at || new Date()),
          });
        }
      });

      // Sort by timestamp and take latest 5
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5);
    },
    refetchInterval: 30000,
  });
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}
