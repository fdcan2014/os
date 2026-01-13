import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';
import {
  useLocations,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  type PurchaseOrder,
} from '@/hooks/usePurchaseOrders';

const itemSchema = z.object({
  product_id: z.string().min(1, 'Produto obrigatório'),
  variant_id: z.string().nullable().optional(),
  quantity: z.number().min(1, 'Mínimo 1'),
  unit_cost: z.number().min(0, 'Custo inválido'),
  discount_percent: z.number().min(0).max(100).default(0),
  tax_rate: z.number().min(0).max(100).default(0),
});

const formSchema = z.object({
  supplier_id: z.string().min(1, 'Fornecedor obrigatório'),
  location_id: z.string().min(1, 'Local obrigatório'),
  order_date: z.string().min(1, 'Data obrigatória'),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Adicione pelo menos um item'),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: PurchaseOrder | null;
}

export function PurchaseOrderFormModal({ open, onOpenChange, order }: Props) {
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: locations = [], isLoading: loadingLocations } = useLocations();
  const createOrder = useCreatePurchaseOrder();
  const updateOrder = useUpdatePurchaseOrder();

  const isEditing = !!order;
  const isSubmitting = createOrder.isPending || updateOrder.isPending;

  const defaultLocation = locations.find((l) => l.is_default)?.id || '';

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplier_id: '',
      location_id: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_date: '',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');

  // Calculate totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    watchItems.forEach((item) => {
      const lineBase = item.quantity * item.unit_cost;
      const lineDiscount = lineBase * ((item.discount_percent || 0) / 100);
      const lineAfterDiscount = lineBase - lineDiscount;
      const lineTax = lineAfterDiscount * ((item.tax_rate || 0) / 100);

      subtotal += lineBase;
      discountAmount += lineDiscount;
      taxAmount += lineTax;
    });

    return {
      subtotal,
      taxAmount,
      discountAmount,
      total: subtotal - discountAmount + taxAmount,
    };
  }, [watchItems]);

  // Initialize form when order changes
  useEffect(() => {
    if (open) {
      if (order) {
        reset({
          supplier_id: order.supplier_id,
          location_id: order.location_id,
          order_date: order.order_date?.split('T')[0] || '',
          expected_date: order.expected_date?.split('T')[0] || '',
          notes: order.notes || '',
          items:
            order.items?.map((item) => ({
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity,
              unit_cost: item.unit_cost,
              discount_percent: item.discount_percent || 0,
              tax_rate: item.tax_rate || 0,
            })) || [],
        });
      } else {
        reset({
          supplier_id: '',
          location_id: defaultLocation,
          order_date: new Date().toISOString().split('T')[0],
          expected_date: '',
          notes: '',
          items: [],
        });
      }
    }
  }, [open, order, reset, defaultLocation]);

  const handleAddItem = () => {
    append({
      product_id: '',
      variant_id: null,
      quantity: 1,
      unit_cost: 0,
      discount_percent: 0,
      tax_rate: 0,
    });
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`items.${index}.product_id`, productId);
      setValue(`items.${index}.unit_cost`, product.cost_price || 0);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      const orderData = {
        supplier_id: data.supplier_id,
        location_id: data.location_id,
        order_date: data.order_date,
        expected_date: data.expected_date || null,
        notes: data.notes || null,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        discount_amount: totals.discountAmount,
        total: totals.total,
      };

      const itemsData = data.items.map((item) => {
        const lineBase = item.quantity * item.unit_cost;
        const lineDiscount = lineBase * ((item.discount_percent || 0) / 100);
        const lineAfterDiscount = lineBase - lineDiscount;
        const lineTax = lineAfterDiscount * ((item.tax_rate || 0) / 100);
        const lineTotal = lineAfterDiscount + lineTax;

        return {
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          discount_percent: item.discount_percent || 0,
          tax_rate: item.tax_rate || 0,
          total: lineTotal,
        };
      });

      if (isEditing && order) {
        await updateOrder.mutateAsync({
          id: order.id,
          order: orderData,
          items: itemsData,
        });
        toast.success('Pedido atualizado com sucesso!');
      } else {
        await createOrder.mutateAsync({
          order: orderData,
          items: itemsData,
        });
        toast.success('Pedido criado com sucesso!');
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar pedido');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Header Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Fornecedor *</Label>
                  <Select
                    value={watch('supplier_id')}
                    onValueChange={(v) => setValue('supplier_id', v)}
                    disabled={loadingSuppliers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers
                        .filter((s) => s.is_active)
                        .map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.supplier_id && (
                    <p className="text-sm text-destructive">{errors.supplier_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_id">Local de Entrega *</Label>
                  <Select
                    value={watch('location_id')}
                    onValueChange={(v) => setValue('location_id', v)}
                    disabled={loadingLocations}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o local" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                          {location.is_default && ' (Padrão)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.location_id && (
                    <p className="text-sm text-destructive">{errors.location_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order_date">Data do Pedido *</Label>
                  <Input type="date" {...register('order_date')} />
                  {errors.order_date && (
                    <p className="text-sm text-destructive">{errors.order_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expected_date">Data Prevista</Label>
                  <Input type="date" {...register('expected_date')} />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Itens do Pedido *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Item
                  </Button>
                </div>

                {errors.items && !Array.isArray(errors.items) && (
                  <p className="text-sm text-destructive">{errors.items.message}</p>
                )}

                {fields.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[250px]">Produto</TableHead>
                          <TableHead className="w-[80px]">Qtd</TableHead>
                          <TableHead className="w-[120px]">Custo Unit.</TableHead>
                          <TableHead className="w-[80px]">Desc %</TableHead>
                          <TableHead className="w-[80px]">Imp %</TableHead>
                          <TableHead className="w-[120px] text-right">Total</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => {
                          const item = watchItems[index];
                          const lineBase = (item?.quantity || 0) * (item?.unit_cost || 0);
                          const lineDiscount = lineBase * ((item?.discount_percent || 0) / 100);
                          const lineAfterDiscount = lineBase - lineDiscount;
                          const lineTax = lineAfterDiscount * ((item?.tax_rate || 0) / 100);
                          const lineTotal = lineAfterDiscount + lineTax;

                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <Select
                                  value={item?.product_id || ''}
                                  onValueChange={(v) => handleProductChange(index, v)}
                                  disabled={loadingProducts}
                                >
                                  <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products
                                      .filter((p) => p.is_active)
                                      .map((product) => (
                                        <SelectItem key={product.id} value={product.id}>
                                          <span className="font-mono text-xs text-muted-foreground mr-2">
                                            {product.sku}
                                          </span>
                                          {product.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  className="h-9 w-20"
                                  {...register(`items.${index}.quantity`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="h-9 w-28"
                                  {...register(`items.${index}.unit_cost`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  className="h-9 w-20"
                                  {...register(`items.${index}.discount_percent`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  className="h-9 w-20"
                                  {...register(`items.${index}.tax_rate`, {
                                    valueAsNumber: true,
                                  })}
                                />
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium">
                                {formatCurrency(lineTotal)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="border rounded-lg p-8 text-center text-muted-foreground">
                    Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Desconto:</span>
                    <span className="font-mono">-{formatCurrency(totals.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impostos:</span>
                    <span className="font-mono">+{formatCurrency(totals.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 text-lg font-semibold">
                    <span>Total:</span>
                    <span className="font-mono">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  {...register('notes')}
                  placeholder="Observações do pedido..."
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Pedido'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
