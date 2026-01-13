import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Fetch purchase orders for a specific supplier
export function useSupplierPurchaseOrders(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-purchase-orders', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, order_number, order_date, total, status')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });
}

// Fetch invoices for a specific supplier
export function useSupplierInvoicesForSupplier(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-invoices-for-supplier', supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_invoices')
        .select('id, invoice_number, invoice_date, due_date, total, paid_amount, status')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });
}

// Fetch payments for a specific supplier (via invoices)
export function useSupplierPaymentsForSupplier(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-payments-for-supplier', supplierId],
    queryFn: async () => {
      // First get all invoice IDs for this supplier
      const { data: invoices, error: invoicesError } = await supabase
        .from('supplier_invoices')
        .select('id, invoice_number')
        .eq('supplier_id', supplierId);

      if (invoicesError) throw invoicesError;
      if (!invoices || invoices.length === 0) return [];

      const invoiceIds = invoices.map(i => i.id);
      const invoiceMap = new Map(invoices.map(i => [i.id, i.invoice_number]));

      // Then get all payments for those invoices
      const { data: payments, error: paymentsError } = await supabase
        .from('supplier_payments')
        .select(`
          id, 
          invoice_id, 
          amount, 
          payment_date, 
          reference,
          payment_method:payment_methods(name)
        `)
        .in('invoice_id', invoiceIds)
        .order('payment_date', { ascending: false })
        .limit(50);

      if (paymentsError) throw paymentsError;

      return payments.map(p => ({
        ...p,
        invoice_number: invoiceMap.get(p.invoice_id) || '',
        payment_method_name: (p.payment_method as any)?.name || null,
      }));
    },
    enabled: !!supplierId,
  });
}

// Fetch supplier stats (KPIs)
export function useSupplierStats(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-stats', supplierId],
    queryFn: async () => {
      // Get invoices for calculating outstanding and paid amounts
      const { data: invoices, error: invoicesError } = await supabase
        .from('supplier_invoices')
        .select('total, paid_amount, status')
        .eq('supplier_id', supplierId);

      if (invoicesError) throw invoicesError;

      let totalOutstanding = 0;
      let totalPaid = 0;

      invoices?.forEach(invoice => {
        const total = invoice.total || 0;
        const paid = invoice.paid_amount || 0;
        
        if (invoice.status !== 'cancelled') {
          totalOutstanding += Math.max(0, total - paid);
          totalPaid += paid;
        }
      });

      // Get orders this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: ordersThisMonth, error: ordersError } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId)
        .gte('created_at', startOfMonth.toISOString());

      if (ordersError) throw ordersError;

      return {
        totalOutstanding,
        totalPaid,
        ordersThisMonth: ordersThisMonth || 0,
      };
    },
    enabled: !!supplierId,
  });
}

// Check if supplier has any dependencies (for safe delete)
export function useSupplierHasDependencies(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-dependencies', supplierId],
    queryFn: async () => {
      // Check purchase orders
      const { count: ordersCount, error: ordersError } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId);

      if (ordersError) throw ordersError;

      // Check invoices
      const { count: invoicesCount, error: invoicesError } = await supabase
        .from('supplier_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('supplier_id', supplierId);

      if (invoicesError) throw invoicesError;

      return {
        hasDependencies: (ordersCount || 0) > 0 || (invoicesCount || 0) > 0,
        ordersCount: ordersCount || 0,
        invoicesCount: invoicesCount || 0,
      };
    },
    enabled: !!supplierId,
  });
}
