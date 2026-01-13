import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceTypeInput {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export function useServiceTypes() {
  return useQuery({
    queryKey: ['service_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as ServiceType[];
    },
  });
}

export function useActiveServiceTypes() {
  return useQuery({
    queryKey: ['service_types', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_types')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as ServiceType[];
    },
  });
}

export function useCreateServiceType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: ServiceTypeInput) => {
      const { data, error } = await supabase
        .from('service_types')
        .insert(input)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_types'] });
      toast({
        title: 'Tipo de serviço criado',
        description: 'O tipo de serviço foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar tipo de serviço',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateServiceType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: ServiceTypeInput & { id: string }) => {
      const { data, error } = await supabase
        .from('service_types')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_types'] });
      toast({
        title: 'Tipo de serviço atualizado',
        description: 'O tipo de serviço foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar tipo de serviço',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteServiceType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_types'] });
      toast({
        title: 'Tipo de serviço excluído',
        description: 'O tipo de serviço foi excluído com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir tipo de serviço',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
