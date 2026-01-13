-- Create service_types table
CREATE TABLE public.service_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read, authenticated write)
CREATE POLICY "Anyone can view service types" 
ON public.service_types FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert service types" 
ON public.service_types FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update service types" 
ON public.service_types FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete service types" 
ON public.service_types FOR DELETE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_service_types_updated_at
  BEFORE UPDATE ON public.service_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add service_type_id to service_orders table
ALTER TABLE public.service_orders 
ADD COLUMN service_type_id UUID REFERENCES public.service_types(id);

-- Insert some default service types
INSERT INTO public.service_types (name, description) VALUES
  ('Manutenção', 'Manutenção preventiva e corretiva de equipamentos'),
  ('Reparo', 'Reparo de equipamentos com defeito'),
  ('Instalação', 'Instalação de novos equipamentos'),
  ('Configuração', 'Configuração e ajustes de equipamentos'),
  ('Limpeza', 'Limpeza técnica de equipamentos');