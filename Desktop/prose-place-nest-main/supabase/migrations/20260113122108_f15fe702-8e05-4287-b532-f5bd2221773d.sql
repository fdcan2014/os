-- Create technicians table
CREATE TABLE public.technicians (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  specialty TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view technicians"
ON public.technicians
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert technicians"
ON public.technicians
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update technicians"
ON public.technicians
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete technicians"
ON public.technicians
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_technicians_updated_at
BEFORE UPDATE ON public.technicians
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add technician_id to service_orders table
ALTER TABLE public.service_orders 
ADD COLUMN technician_id UUID REFERENCES public.technicians(id);