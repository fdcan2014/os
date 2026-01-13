import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { PurchaseOrderSchema, type PurchaseOrderInput, type PurchaseOrderItemInput } from '@/lib/validations';

export type PurchaseOrderStatus = 'draft' | 'approved' | 'partial' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  received_quantity: number;
  unit_cost: number;
  discount_percent: number;
  tax_rate: number;
  total: number;
  product?: {
    id: string;
    sku: string;
    name: string;
    cost_price: number | null;
  };
  variant?: {
    id: string;
    sku: string;
    name: string;
    cost_price: number | null;
  } | null;
}

export interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  location_id: string;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_date: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  supplier?: {
    id: string;
    name: string;
    payment_terms: number | null;
  };
  location?: {
    id: string;
    name: string;
  };
  items?: PurchaseOrderItem[];
}

export interface Location {
  id: string;
  name: string;
  is_default: boolean | null;
  is_active: boolean | null;
}

// Fetch all purchase orders
export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(id, name, payment_terms),
          location:locations(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
}

// Fetch single purchase order with items
export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(id, name, payment_terms),
          location:locations(id, name)
        `)
        .eq('id', id)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!order) return null;

      const { data: items, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select(`
          *,
          product:products(id, sku, name, cost_price),
          variant:product_variants(id, sku, name, cost_price)
        `)
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      return { ...order, items: items || [] } as PurchaseOrder;
    },
    enabled: !!id,
  });
}

// Fetch locations for dropdown
export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Location[];
    },
  });
}

// Generate next order number
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('order_number')
    .ilike('order_number', `OC-${year}-%`)
    .order('order_number', { ascending: false })
    .limit(1);

  if (error) throw error;

  let nextNumber = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].order_number;
    const match = lastNumber.match(/OC-\d{4}-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `OC-${year}-${String(nextNumber).padStart(4, '0')}`;
}

// Create purchase order
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      order,
      items,
    }: {
      order: PurchaseOrderInput;
      items: PurchaseOrderItemInput[];
    }) => {
      const validated = PurchaseOrderSchema.parse(order);
      const orderNumber = await generateOrderNumber();

      // Insert order
      const { data: newOrder, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          ...validated,
          order_number: orderNumber,
          status: 'draft',
        } as TablesInsert<'purchase_orders'>)
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert items
      if (items.length > 0) {
        const itemsToInsert = items.map((item) => ({
          order_id: newOrder.id,
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          received_quantity: 0,
          unit_cost: item.unit_cost,
          discount_percent: item.discount_percent || 0,
          tax_rate: item.tax_rate || 0,
          total: item.total,
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(itemsToInsert as TablesInsert<'purchase_order_items'>[]);

        if (itemsError) throw itemsError;
      }

      return newOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

// Update purchase order
export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      order,
      items,
    }: {
      id: string;
      order: Partial<PurchaseOrderInput>;
      items?: PurchaseOrderItemInput[];
    }) => {
      const validated = PurchaseOrderSchema.partial().parse(order);

      // Update order header
      const { error: orderError } = await supabase
        .from('purchase_orders')
        .update(validated as TablesUpdate<'purchase_orders'>)
        .eq('id', id);

      if (orderError) throw orderError;

      // Update items if provided
      if (items !== undefined) {
        // Delete existing items
        const { error: deleteError } = await supabase
          .from('purchase_order_items')
          .delete()
          .eq('order_id', id);

        if (deleteError) throw deleteError;

        // Insert new items
        if (items.length > 0) {
          const itemsToInsert = items.map((item) => ({
            order_id: id,
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: item.quantity,
            received_quantity: 0,
            unit_cost: item.unit_cost,
            discount_percent: item.discount_percent || 0,
            tax_rate: item.tax_rate || 0,
            total: item.total,
          }));

          const { error: itemsError } = await supabase
            .from('purchase_order_items')
            .insert(itemsToInsert as TablesInsert<'purchase_order_items'>[]);

          if (itemsError) throw itemsError;
        }
      }

      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.id] });
    },
  });
}

// Approve purchase order
export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: 'approved' })
        .eq('id', id)
        .eq('status', 'draft');

      if (error) throw error;
      return { id };
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
    },
  });
}

// Cancel purchase order
export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First check if any items have been received
      const { data: items, error: checkError } = await supabase
        .from('purchase_order_items')
        .select('received_quantity')
        .eq('order_id', id);

      if (checkError) throw checkError;

      const hasReceivedItems = items?.some((item) => (item.received_quantity || 0) > 0);
      if (hasReceivedItems) {
        throw new Error('Não é possível cancelar um pedido com itens já recebidos');
      }

      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;
      return { id };
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
    },
  });
}

// Receive purchase order items
export function useReceivePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      receivedItems,
      notes,
    }: {
      orderId: string;
      receivedItems: Array<{
        purchaseOrderItemId: string;
        quantity: number;
        unitCost: number;
      }>;
      notes?: string;
    }) => {
      // Get the order to get location_id
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .select('location_id')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Get current items
      const { data: currentItems, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Process each received item
      for (const received of receivedItems) {
        if (received.quantity <= 0) continue;

        const item = currentItems?.find((i) => i.id === received.purchaseOrderItemId);
        if (!item) continue;

        const maxReceivable = item.quantity - (item.received_quantity || 0);
        const qtyToReceive = Math.min(received.quantity, maxReceivable);

        if (qtyToReceive <= 0) continue;

        // Update purchase_order_items.received_quantity
        const { error: updateItemError } = await supabase
          .from('purchase_order_items')
          .update({
            received_quantity: (item.received_quantity || 0) + qtyToReceive,
          })
          .eq('id', item.id);

        if (updateItemError) throw updateItemError;

        // Insert stock_movement
        const { error: movementError } = await supabase.from('stock_movements').insert({
          product_id: item.product_id,
          variant_id: item.variant_id,
          location_id: order.location_id,
          type: 'receipt',
          quantity: qtyToReceive,
          unit_cost: received.unitCost,
          reference_type: 'purchase_order',
          reference_id: orderId,
          notes: notes || null,
        });

        if (movementError) throw movementError;

        // Upsert stock_items
        let stockQuery = supabase
          .from('stock_items')
          .select('*')
          .eq('product_id', item.product_id)
          .eq('location_id', order.location_id);
        
        if (item.variant_id) {
          stockQuery = stockQuery.eq('variant_id', item.variant_id);
        } else {
          stockQuery = stockQuery.is('variant_id', null);
        }
        
        const { data: existingStock, error: stockCheckError } = await stockQuery.maybeSingle();

        if (stockCheckError) throw stockCheckError;

        if (existingStock) {
          const oldQty = existingStock.quantity || 0;
          const oldAvgCost = existingStock.avg_cost || 0;
          const newQty = oldQty + qtyToReceive;
          const newAvgCost = newQty > 0 ? ((oldQty * oldAvgCost) + (qtyToReceive * received.unitCost)) / newQty : received.unitCost;

          const { error: updateStockError } = await supabase
            .from('stock_items')
            .update({
              quantity: newQty,
              avg_cost: newAvgCost,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingStock.id);

          if (updateStockError) throw updateStockError;
        } else {
          const { error: insertStockError } = await supabase.from('stock_items').insert({
            product_id: item.product_id,
            variant_id: item.variant_id,
            location_id: order.location_id,
            quantity: qtyToReceive,
            avg_cost: received.unitCost,
            reserved_quantity: 0,
          });

          if (insertStockError) throw insertStockError;
        }
      }

      // Update order status
      const { data: updatedItems, error: refetchError } = await supabase
        .from('purchase_order_items')
        .select('quantity, received_quantity')
        .eq('order_id', orderId);

      if (refetchError) throw refetchError;

      const allReceived = updatedItems?.every((i) => (i.received_quantity || 0) >= i.quantity);
      const someReceived = updatedItems?.some((i) => (i.received_quantity || 0) > 0);

      let newStatus: PurchaseOrderStatus = 'approved';
      if (allReceived) {
        newStatus = 'received';
      } else if (someReceived) {
        newStatus = 'partial';
      }

      const { error: statusError } = await supabase
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (statusError) throw statusError;

      return { orderId, newStatus };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
