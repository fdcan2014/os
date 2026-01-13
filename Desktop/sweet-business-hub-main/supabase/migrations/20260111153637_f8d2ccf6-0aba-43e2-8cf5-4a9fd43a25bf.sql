
-- =====================================================
-- SWEET ERP DATABASE SCHEMA
-- Single-tenant ERP system
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COMPANY & SETTINGS
-- =====================================================

CREATE TABLE public.company (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Company',
  legal_name TEXT,
  tax_id TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Brazil',
  currency TEXT DEFAULT 'BRL',
  currency_symbol TEXT DEFAULT 'R$',
  default_tax_rate DECIMAL(5,2) DEFAULT 0,
  receipt_header TEXT,
  receipt_footer TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'warehouse' CHECK (type IN ('warehouse', 'store', 'other')),
  address TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'cash' CHECK (type IN ('cash', 'card', 'pix', 'bank_transfer', 'credit', 'other')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- PRODUCTS & CATALOG
-- =====================================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  brand_id UUID REFERENCES public.brands(id),
  unit_id UUID REFERENCES public.units(id),
  cost_price DECIMAL(12,2) DEFAULT 0,
  sell_price DECIMAL(12,2) DEFAULT 0,
  tax_rate_id UUID REFERENCES public.tax_rates(id),
  min_stock DECIMAL(12,3) DEFAULT 0,
  max_stock DECIMAL(12,3),
  reorder_point DECIMAL(12,3) DEFAULT 0,
  has_variants BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  cost_price DECIMAL(12,2) DEFAULT 0,
  sell_price DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- CUSTOMERS & SUPPLIERS
-- =====================================================

CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  credit_limit DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  tax_id TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- INVENTORY
-- =====================================================

CREATE TABLE public.stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id),
  quantity DECIMAL(12,3) DEFAULT 0,
  reserved_quantity DECIMAL(12,3) DEFAULT 0,
  avg_cost DECIMAL(12,2) DEFAULT 0,
  last_count_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, variant_id, location_id)
);

CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  location_id UUID NOT NULL REFERENCES public.locations(id),
  type TEXT NOT NULL CHECK (type IN ('receipt', 'sale', 'adjustment', 'transfer_in', 'transfer_out', 'return', 'count')),
  quantity DECIMAL(12,3) NOT NULL,
  unit_cost DECIMAL(12,2),
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number TEXT UNIQUE NOT NULL,
  from_location_id UUID NOT NULL REFERENCES public.locations(id),
  to_location_id UUID NOT NULL REFERENCES public.locations(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  quantity DECIMAL(12,3) NOT NULL,
  received_quantity DECIMAL(12,3) DEFAULT 0
);

CREATE TABLE public.stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_number TEXT UNIQUE NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.stock_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID NOT NULL REFERENCES public.stock_counts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  expected_quantity DECIMAL(12,3) DEFAULT 0,
  counted_quantity DECIMAL(12,3),
  variance DECIMAL(12,3) GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED
);

-- =====================================================
-- PURCHASING
-- =====================================================

CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  location_id UUID NOT NULL REFERENCES public.locations(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'partial', 'received', 'cancelled')),
  order_date DATE DEFAULT CURRENT_DATE,
  expected_date DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  quantity DECIMAL(12,3) NOT NULL,
  received_quantity DECIMAL(12,3) DEFAULT 0,
  unit_cost DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL
);

CREATE TABLE public.supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.supplier_invoices(id),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SALES
-- =====================================================

CREATE TABLE public.sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  location_id UUID NOT NULL REFERENCES public.locations(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'paid', 'partial', 'cancelled', 'refunded')),
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  pos_session_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  quantity DECIMAL(12,3) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT UNIQUE NOT NULL,
  invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id),
  customer_id UUID REFERENCES public.customers(id),
  location_id UUID NOT NULL REFERENCES public.locations(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
  return_date DATE DEFAULT CURRENT_DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  refund_amount DECIMAL(12,2) DEFAULT 0,
  restock BOOLEAN DEFAULT true,
  reason TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  quantity DECIMAL(12,3) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL
);

-- =====================================================
-- POS
-- =====================================================

CREATE TABLE public.pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_number TEXT UNIQUE NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id),
  opened_by UUID REFERENCES auth.users(id),
  closed_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opening_float DECIMAL(12,2) DEFAULT 0,
  expected_cash DECIMAL(12,2) DEFAULT 0,
  actual_cash DECIMAL(12,2),
  discrepancy DECIMAL(12,2),
  total_sales DECIMAL(12,2) DEFAULT 0,
  total_returns DECIMAL(12,2) DEFAULT 0,
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE public.pos_cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.pos_sessions(id),
  type TEXT NOT NULL CHECK (type IN ('cash_in', 'cash_out', 'sale', 'refund')),
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  reference_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key for pos_session_id in sales_invoices
ALTER TABLE public.sales_invoices 
ADD CONSTRAINT fk_sales_invoices_pos_session 
FOREIGN KEY (pos_session_id) REFERENCES public.pos_sessions(id);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_stock_items_product ON public.stock_items(product_id);
CREATE INDEX idx_stock_items_location ON public.stock_items(location_id);
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created ON public.stock_movements(created_at);
CREATE INDEX idx_sales_invoices_customer ON public.sales_invoices(customer_id);
CREATE INDEX idx_sales_invoices_date ON public.sales_invoices(invoice_date);
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_updated_at BEFORE UPDATE ON public.company
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON public.stock_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_invoices_updated_at BEFORE UPDATE ON public.sales_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_cash_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users full access (single-tenant system)
CREATE POLICY "Authenticated users can manage company" ON public.company FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage locations" ON public.locations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage tax_rates" ON public.tax_rates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage payment_methods" ON public.payment_methods FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage brands" ON public.brands FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage units" ON public.units FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage product_variants" ON public.product_variants FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage customers" ON public.customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage suppliers" ON public.suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage stock_items" ON public.stock_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage stock_movements" ON public.stock_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage stock_transfers" ON public.stock_transfers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage stock_transfer_items" ON public.stock_transfer_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage stock_counts" ON public.stock_counts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage stock_count_items" ON public.stock_count_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage purchase_orders" ON public.purchase_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage purchase_order_items" ON public.purchase_order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage supplier_invoices" ON public.supplier_invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage supplier_payments" ON public.supplier_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage sales_invoices" ON public.sales_invoices FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage sales_invoice_items" ON public.sales_invoice_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage payments" ON public.payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage returns" ON public.returns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage return_items" ON public.return_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage pos_sessions" ON public.pos_sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage pos_cash_movements" ON public.pos_cash_movements FOR ALL USING (auth.role() = 'authenticated');
