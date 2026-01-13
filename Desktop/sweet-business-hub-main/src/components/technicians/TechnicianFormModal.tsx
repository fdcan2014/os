import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Technician, TechnicianInput } from '@/hooks/useTechnicians';

const technicianSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  is_active: z.boolean(),
  notes: z.string().optional(),
});

type TechnicianFormData = z.infer<typeof technicianSchema>;

interface TechnicianFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technician?: Technician | null;
  onSubmit: (data: TechnicianInput) => void;
  isLoading?: boolean;
}

export function TechnicianFormModal({
  open,
  onOpenChange,
  technician,
  onSubmit,
  isLoading,
}: TechnicianFormModalProps) {
  const form = useForm<TechnicianFormData>({
    resolver: zodResolver(technicianSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      specialty: '',
      is_active: true,
      notes: '',
    },
  });

  useEffect(() => {
    if (technician) {
      form.reset({
        name: technician.name,
        email: technician.email || '',
        phone: technician.phone || '',
        specialty: technician.specialty || '',
        is_active: technician.is_active ?? true,
        notes: technician.notes || '',
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        is_active: true,
        notes: '',
      });
    }
  }, [technician, form]);

  const handleSubmit = (data: TechnicianFormData) => {
    onSubmit({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      specialty: data.specialty || null,
      is_active: data.is_active,
      notes: data.notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {technician ? 'Editar Técnico' : 'Novo Técnico'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do técnico" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Eletrônica, Mecânica, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre o técnico..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Ativo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Técnico disponível para novas ordens de serviço
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : technician ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
