import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useCreateSupplierInvoice, type SupplierInvoice } from '@/hooks/useSupplierInvoices';

const formSchema = z.object({
  invoice_number: z.string().optional(),
  supplier_id: z.string().min(1, 'Fornecedor obrigatório'),
  invoice_date: z.string().min(1, 'Data obrigatória'),
  due_date: z.string().optional(),
  subtotal: z.number().min(0).default(0),
  tax_amount: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: SupplierInvoice | null;
}

export function SupplierInvoiceFormModal({ open, onOpenChange, invoice }: Props) {
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  const createInvoice = useCreateSupplierInvoice();

  const isEditing = !!invoice;
  const isSubmitting = createInvoice.isPending;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_number: '',
      supplier_id: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      subtotal: 0,
      tax_amount: 0,
      total: 0,
      notes: '',
    },
  });

  const subtotal = watch('subtotal');
  const taxAmount = watch('tax_amount');

  useEffect(() => {
    const total = (subtotal || 0) + (taxAmount || 0);
    setValue('total', total);
  }, [subtotal, taxAmount, setValue]);

  useEffect(() => {
    if (open) {
      if (invoice) {
        reset({
          invoice_number: invoice.invoice_number,
          supplier_id: invoice.supplier_id,
          invoice_date: invoice.invoice_date?.split('T')[0] || '',
          due_date: invoice.due_date?.split('T')[0] || '',
          subtotal: invoice.subtotal || 0,
          tax_amount: invoice.tax_amount || 0,
          total: invoice.total || 0,
          notes: invoice.notes || '',
        });
      } else {
        reset({
          invoice_number: '',
          supplier_id: '',
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: '',
          subtotal: 0,
          tax_amount: 0,
          total: 0,
          notes: '',
        });
      }
    }
  }, [open, invoice, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await createInvoice.mutateAsync({
        invoice_number: data.invoice_number || '',
        supplier_id: data.supplier_id,
        invoice_date: data.invoice_date,
        due_date: data.due_date || null,
        subtotal: data.subtotal,
        tax_amount: data.tax_amount,
        total: data.total,
        notes: data.notes || null,
      });

      toast.success('Fatura criada com sucesso!');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar fatura');
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Fatura' : 'Nova Fatura de Fornecedor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="invoice_number">Número da Fatura</Label>
            <Input
              {...register('invoice_number')}
              placeholder="Deixe em branco para gerar automaticamente"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Data da Fatura *</Label>
              <Input type="date" {...register('invoice_date')} />
              {errors.invoice_date && (
                <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Vencimento</Label>
              <Input type="date" {...register('due_date')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register('subtotal', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_amount">Impostos</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                {...register('tax_amount', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 flex justify-between items-center">
            <span className="font-medium">Total:</span>
            <span className="font-mono font-semibold text-lg">
              {formatCurrency(watch('total'))}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea {...register('notes')} placeholder="Observações..." rows={2} />
          </div>

          <DialogFooter>
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
              {isEditing ? 'Salvar' : 'Criar Fatura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
