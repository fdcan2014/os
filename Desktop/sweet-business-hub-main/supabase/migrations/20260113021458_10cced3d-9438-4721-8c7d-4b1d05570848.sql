-- Create storage bucket for service order attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('service-order-attachments', 'service-order-attachments', true);

-- Create table to track attachments metadata
CREATE TABLE public.service_order_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  attachment_type TEXT NOT NULL DEFAULT 'other' CHECK (attachment_type IN ('before', 'after', 'other')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_order_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for attachments
CREATE POLICY "Allow authenticated users to view attachments"
ON public.service_order_attachments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert attachments"
ON public.service_order_attachments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete attachments"
ON public.service_order_attachments
FOR DELETE
TO authenticated
USING (true);

-- Storage policies for service-order-attachments bucket
CREATE POLICY "Allow authenticated users to upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service-order-attachments');

CREATE POLICY "Allow public to view attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'service-order-attachments');

CREATE POLICY "Allow authenticated users to delete attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'service-order-attachments');