import { useState, useEffect } from 'react';
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
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { usePaymentMethods, useRegisterSupplierPayment } from '@/hooks/useSupplierInvoices';

const formSchema = z.object({
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  payment_date: z.string().min(1, 'Data obrigatória'),
  payment_method_id: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  invoiceId: string;
  remainingAmount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterPaymentModal({
  invoiceId,
  remainingAmount,
  open,
  onOpenChange,
}: Props) {
  const { data: paymentMethods = [], isLoading: loadingMethods } = usePaymentMethods();
  const registerPayment = useRegisterSupplierPayment();

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
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_method_id: '',
      reference: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        amount: remainingAmount > 0 ? remainingAmount : 0,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method_id: '',
        reference: '',
        notes: '',
      });
    }
  }, [open, remainingAmount, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      await registerPayment.mutateAsync({
        invoice_id: invoiceId,
        amount: data.amount,
        payment_date: data.payment_date,
        payment_method_id: data.payment_method_id || null,
        reference: data.reference || null,
        notes: data.notes || null,
      });

      toast.success('Pagamento registrado com sucesso!');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar pagamento');
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
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Registrar Pagamento
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saldo Devedor:</span>
              <span className="font-mono font-semibold">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Pagamento *</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_date">Data do Pagamento *</Label>
              <Input type="date" {...register('payment_date')} />
              {errors.payment_date && (
                <p className="text-sm text-destructive">{errors.payment_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method_id">Forma de Pagamento</Label>
              <Select
                value={watch('payment_method_id')}
                onValueChange={(v) => setValue('payment_method_id', v)}
                disabled={loadingMethods}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Referência / Comprovante</Label>
            <Input {...register('reference')} placeholder="Ex: Número do boleto, PIX..." />
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
              disabled={registerPayment.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={registerPayment.isPending}>
              {registerPayment.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Registrar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
