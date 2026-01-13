import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import type { Tables } from '@/integrations/supabase/types';

export type Product = Tables<'products'>;
export type Customer = Tables<'customers'>;

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number;
  quantity: number;
  maxStock: number;
}

export interface POSState {
  cart: CartItem[];
  customer: Customer | null;
  discount: number;
  discountType: 'percent' | 'fixed';
  paymentMethod: 'cash' | 'card' | 'pix' | null;
  amountPaid: number;
}

const SaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
    costPrice: z.number().nonnegative(),
  })).min(1, 'O carrinho não pode estar vazio'),
  customerId: z.string().uuid().nullable(),
  subtotal: z.number().nonnegative(),
  discountAmount: z.number().nonnegative(),
  taxAmount: z.number().nonnegative(),
  total: z.number().positive(),
  paidAmount: z.number().nonnegative(),
});

export function usePOSProducts(search: string) {
  return useQuery({
    queryKey: ['pos-products', search],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          sku,
          barcode,
          sell_price,
          cost_price,
          is_active,
          stock_items(quantity, location_id)
        `)
        .eq('is_active', true)
        .order('name');

      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      return data.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        sellPrice: p.sell_price ?? 0,
        costPrice: p.cost_price ?? 0,
        stock: p.stock_items?.reduce((sum, s) => sum + (s.quantity ?? 0), 0) ?? 0,
      }));
    },
    staleTime: 30000,
  });
}

export function usePOSCustomers(search: string) {
  return useQuery({
    queryKey: ['pos-customers', search],
    queryFn: async () => {
      let query = supabase
        .from('customers')
        .select('id, name, code, phone, email, credit_limit, current_balance')
        .eq('is_active', true)
        .order('name');

      if (search.trim()) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data;
    },
    enabled: search.length > 0,
  });
}

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
      return data;
    },
  });
}

export function useDefaultLocation() {
  return useQuery({
    queryKey: ['default-location'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('is_active', true)
        .eq('is_default', true)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        // Fallback to first active location
        const { data: fallback, error: fallbackError } = await supabase
          .from('locations')
          .select('id, name')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        if (fallbackError) throw fallbackError;
        return fallback;
      }
      
      return data;
    },
  });
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company')
        .select('default_tax_rate, currency_symbol')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return {
        taxRate: data?.default_tax_rate ?? 0,
        currencySymbol: data?.currency_symbol ?? 'R$',
      };
    },
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      items: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        costPrice: number;
        discountPercent?: number;
        taxRate?: number;
      }>;
      customerId: string | null;
      locationId: string;
      subtotal: number;
      discountAmount: number;
      taxAmount: number;
      total: number;
      paidAmount: number;
      paymentMethodId: string | null;
    }) => {
      // Validate input
      const validation = SaleSchema.safeParse(params);
      if (!validation.success) {
        throw new Error(validation.error.errors[0]?.message || 'Dados inválidos');
      }

      // Generate invoice number
      const { data: lastInvoice } = await supabase
        .from('sales_invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let nextNumber = 1;
      if (lastInvoice?.invoice_number) {
        const match = lastInvoice.invoice_number.match(/FAT-(\d+)/);
        if (match) nextNumber = parseInt(match[1], 10) + 1;
      }
      const invoiceNumber = `FAT-${nextNumber.toString().padStart(6, '0')}`;

      // Determine status
      let status = 'draft';
      if (params.paidAmount >= params.total) {
        status = 'paid';
      } else if (params.paidAmount > 0) {
        status = 'partial';
      } else {
        status = 'confirmed';
      }

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('sales_invoices')
        .insert({
          invoice_number: invoiceNumber,
          customer_id: params.customerId,
          location_id: params.locationId,
          invoice_date: new Date().toISOString(),
          subtotal: params.subtotal,
          discount_amount: params.discountAmount,
          tax_amount: params.taxAmount,
          total: params.total,
          paid_amount: params.paidAmount,
          status,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const invoiceItems = params.items.map((item) => ({
        invoice_id: invoice.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        cost_price: item.costPrice,
        discount_percent: item.discountPercent ?? 0,
        tax_rate: item.taxRate ?? 0,
        total: item.unitPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('sales_invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      // Create payment if paid
      if (params.paidAmount > 0 && params.paymentMethodId) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            invoice_id: invoice.id,
            amount: params.paidAmount,
            payment_method_id: params.paymentMethodId,
            payment_date: new Date().toISOString(),
          });

        if (paymentError) throw paymentError;
      }

      // Create stock movements
      for (const item of params.items) {
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: item.productId,
            location_id: params.locationId,
            type: 'sale',
            quantity: -item.quantity,
            unit_cost: item.costPrice,
            reference_type: 'sales_invoice',
            reference_id: invoice.id,
          });

        if (movementError) {
          console.error('Stock movement error:', movementError);
        }

        // Update stock_items
        const { data: stockItem } = await supabase
          .from('stock_items')
          .select('id, quantity')
          .eq('product_id', item.productId)
          .eq('location_id', params.locationId)
          .maybeSingle();

        if (stockItem) {
          await supabase
            .from('stock_items')
            .update({ quantity: (stockItem.quantity ?? 0) - item.quantity })
            .eq('id', stockItem.id);
        }
      }

      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] });
      toast.success('Venda finalizada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao finalizar venda: ${error.message}`);
    },
  });
}
