import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Technician {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  is_active: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TechnicianInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  is_active?: boolean;
  notes?: string | null;
}

export const useTechnicians = () => {
  return useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Technician[];
    },
  });
};

export const useActiveTechnicians = () => {
  return useQuery({
    queryKey: ['technicians', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Technician[];
    },
  });
};

export const useCreateTechnician = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TechnicianInput) => {
      const { data, error } = await supabase
        .from('technicians')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Técnico cadastrado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao cadastrar técnico: ' + error.message);
    },
  });
};

export const useUpdateTechnician = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: TechnicianInput & { id: string }) => {
      const { data, error } = await supabase
        .from('technicians')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Técnico atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar técnico: ' + error.message);
    },
  });
};

export const useDeleteTechnician = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('technicians')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Técnico excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir técnico: ' + error.message);
    },
  });
};
