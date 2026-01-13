-- Create service_orders table
CREATE TABLE public.service_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'invoiced', 'cancelled')),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  equipment_name VARCHAR(255),
  equipment_brand VARCHAR(100),
  equipment_model VARCHAR(100),
  equipment_serial VARCHAR(100),
  reported_issue TEXT,
  diagnosis TEXT,
  solution TEXT,
  technician_notes TEXT,
  estimated_completion DATE,
  actual_completion TIMESTAMP WITH TIME ZONE,
  labor_cost DECIMAL(10,2) DEFAULT 0,
  parts_cost DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_order_items table
CREATE TABLE public.service_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id UUID NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  description VARCHAR(255),
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for service_orders
CREATE POLICY "Users can view all service orders" ON public.service_orders FOR SELECT USING (true);
CREATE POLICY "Users can create service orders" ON public.service_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update service orders" ON public.service_orders FOR UPDATE USING (true);
CREATE POLICY "Users can delete service orders" ON public.service_orders FOR DELETE USING (true);

-- RLS policies for service_order_items
CREATE POLICY "Users can view all service order items" ON public.service_order_items FOR SELECT USING (true);
CREATE POLICY "Users can create service order items" ON public.service_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update service order items" ON public.service_order_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete service order items" ON public.service_order_items FOR DELETE USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_service_orders_updated_at
BEFORE UPDATE ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_service_orders_customer ON public.service_orders(customer_id);
CREATE INDEX idx_service_orders_status ON public.service_orders(status);
CREATE INDEX idx_service_order_items_order ON public.service_order_items(service_order_id);