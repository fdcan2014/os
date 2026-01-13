import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServiceOrderAttachment {
  id: string;
  service_order_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  attachment_type: 'before' | 'after' | 'other';
  description: string | null;
  created_at: string;
}

export interface UploadAttachmentInput {
  serviceOrderId: string;
  file: File;
  attachmentType: 'before' | 'after' | 'other';
  description?: string;
}

const BUCKET_NAME = 'service-order-attachments';
const SUPABASE_URL = 'https://hbogmpyeraenauhxfncw.supabase.co';

export function useServiceOrderAttachments(serviceOrderId: string) {
  return useQuery({
    queryKey: ['service-order-attachments', serviceOrderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_order_attachments')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ServiceOrderAttachment[];
    },
    enabled: !!serviceOrderId,
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ serviceOrderId, file, attachmentType, description }: UploadAttachmentInput) => {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${serviceOrderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // Create attachment record
      const { data, error: insertError } = await supabase
        .from('service_order_attachments')
        .insert({
          service_order_id: serviceOrderId,
          file_name: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          attachment_type: attachmentType,
          description: description || null,
        })
        .select()
        .single();
      
      if (insertError) {
        // Rollback: delete uploaded file
        await supabase.storage.from(BUCKET_NAME).remove([fileName]);
        throw insertError;
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-order-attachments', variables.serviceOrderId] });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, filePath, serviceOrderId }: { id: string; filePath: string; serviceOrderId: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);
      
      if (storageError) throw storageError;
      
      // Delete record
      const { error: deleteError } = await supabase
        .from('service_order_attachments')
        .delete()
        .eq('id', id);
      
      if (deleteError) throw deleteError;
      
      return serviceOrderId;
    },
    onSuccess: (serviceOrderId) => {
      queryClient.invalidateQueries({ queryKey: ['service-order-attachments', serviceOrderId] });
    },
  });
}

export function getAttachmentUrl(filePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
