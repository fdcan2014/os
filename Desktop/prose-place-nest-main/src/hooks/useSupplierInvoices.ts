import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { SupplierInvoiceSchema, SupplierPaymentSchema, type SupplierInvoiceInput, type SupplierPaymentInput } from '@/lib/validations';

export type SupplierInvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled';

export interface SupplierInvoice {
  id: string;
  invoice_number: string;
  supplier_id: string;
  purchase_order_id: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  paid_amount: number;
  status: SupplierInvoiceStatus;
  notes: string | null;
  created_at: string;
  supplier?: {
    id: string;
    name: string;
  };
  purchase_order?: {
    id: string;
    order_number: string;
  } | null;
  payments?: SupplierPayment[];
}

export interface SupplierPayment {
  id: string;
  invoice_id: string;
  payment_method_id: string | null;
  amount: number;
  payment_date: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
  payment_method?: {
    id: string;
    name: string;
  } | null;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string | null;
  is_active: boolean | null;
}

// Fetch all supplier invoices
export function useSupplierInvoices() {
  return useQuery({
    queryKey: ['supplier-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_invoices')
        .select(`
          *,
          supplier:suppliers(id, name),
          purchase_order:purchase_orders(id, order_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SupplierInvoice[];
    },
  });
}

// Fetch single supplier invoice with payments
export function useSupplierInvoice(id: string) {
  return useQuery({
    queryKey: ['supplier-invoice', id],
    queryFn: async () => {
      const { data: invoice, error: invoiceError } = await supabase
        .from('supplier_invoices')
        .select(`
          *,
          supplier:suppliers(id, name),
          purchase_order:purchase_orders(id, order_number)
        `)
        .eq('id', id)
        .maybeSingle();

      if (invoiceError) throw invoiceError;
      if (!invoice) return null;

      const { data: payments, error: paymentsError } = await supabase
        .from('supplier_payments')
        .select(`
          *,
          payment_method:payment_methods(id, name)
        `)
        .eq('invoice_id', id)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      return { ...invoice, payments: payments || [] } as SupplierInvoice;
    },
    enabled: !!id,
  });
}

// Fetch payment methods
export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as PaymentMethod[];
    },
  });
}

// Generate next invoice number
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { data, error } = await supabase
    .from('supplier_invoices')
    .select('invoice_number')
    .ilike('invoice_number', `NF-FOR-${year}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error) throw error;

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].invoice_number;
    const match = lastNumber.match(/NF-FOR-\d{4}-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `NF-FOR-${year}-${String(nextNumber).padStart(4, '0')}`;
}

// Create supplier invoice
export function useCreateSupplierInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoice: SupplierInvoiceInput) => {
      const validated = SupplierInvoiceSchema.parse(invoice);
      
      let invoiceNumber = validated.invoice_number;
      if (!invoiceNumber || invoiceNumber.trim() === '') {
        invoiceNumber = await generateInvoiceNumber();
      }

      const { data, error } = await supabase
        .from('supplier_invoices')
        .insert({
          ...validated,
          invoice_number: invoiceNumber,
          paid_amount: 0,
          status: 'unpaid',
        } as TablesInsert<'supplier_invoices'>)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
    },
  });
}

// Create invoice from purchase order
export function useCreateInvoiceFromOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      invoiceNumber,
      invoiceDate,
      dueDate,
    }: {
      orderId: string;
      invoiceNumber?: string;
      invoiceDate: string;
      dueDate?: string;
    }) => {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .select('*, supplier:suppliers(id, name, payment_terms)')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const finalInvoiceNumber = invoiceNumber || (await generateInvoiceNumber());
      
      // Calculate due date from payment terms if not provided
      let finalDueDate = dueDate;
      if (!finalDueDate && order.supplier?.payment_terms) {
        const invoiceDateObj = new Date(invoiceDate);
        invoiceDateObj.setDate(invoiceDateObj.getDate() + order.supplier.payment_terms);
        finalDueDate = invoiceDateObj.toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('supplier_invoices')
        .insert({
          invoice_number: finalInvoiceNumber,
          supplier_id: order.supplier_id,
          purchase_order_id: orderId,
          invoice_date: invoiceDate,
          due_date: finalDueDate || null,
          subtotal: order.subtotal || 0,
          tax_amount: order.tax_amount || 0,
          total: order.total || 0,
          paid_amount: 0,
          status: 'unpaid',
        } as TablesInsert<'supplier_invoices'>)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

// Update supplier invoice
export function useUpdateSupplierInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...invoice }: Partial<SupplierInvoiceInput> & { id: string }) => {
      const validated = SupplierInvoiceSchema.partial().parse(invoice);

      const { error } = await supabase
        .from('supplier_invoices')
        .update(validated as TablesUpdate<'supplier_invoices'>)
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-invoice', variables.id] });
    },
  });
}

// Cancel supplier invoice
export function useCancelSupplierInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('supplier_invoices')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-invoice', id] });
    },
  });
}

// Register supplier payment
export function useRegisterSupplierPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: SupplierPaymentInput) => {
      const validated = SupplierPaymentSchema.parse(payment);

      // Get current invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('supplier_invoices')
        .select('*')
        .eq('id', validated.invoice_id)
        .single();

      if (invoiceError) throw invoiceError;

      if (invoice.status === 'cancelled') {
        throw new Error('Não é possível registrar pagamento em fatura cancelada');
      }

      // Insert payment
      const { error: paymentError } = await supabase
        .from('supplier_payments')
        .insert(validated as TablesInsert<'supplier_payments'>);

      if (paymentError) throw paymentError;

      // Calculate new paid amount
      const { data: payments, error: sumError } = await supabase
        .from('supplier_payments')
        .select('amount')
        .eq('invoice_id', validated.invoice_id);

      if (sumError) throw sumError;

      const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const invoiceTotal = invoice.total || 0;

      // Determine new status
      let newStatus: SupplierInvoiceStatus = 'unpaid';
      if (totalPaid >= invoiceTotal) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'partial';
      }

      // Update invoice
      const { error: updateError } = await supabase
        .from('supplier_invoices')
        .update({
          paid_amount: totalPaid,
          status: newStatus,
        })
        .eq('id', validated.invoice_id);

      if (updateError) throw updateError;

      return { invoiceId: validated.invoice_id, newStatus, totalPaid };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['supplier-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-invoice', variables.invoice_id] });
    },
  });
}
