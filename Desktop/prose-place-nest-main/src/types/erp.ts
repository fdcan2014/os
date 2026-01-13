// Sweet ERP Type Definitions

export interface Company {
  id: string;
  name: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  currency: string;
  defaultTaxRate: number;
  receiptHeader?: string;
  receiptFooter?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  name: string;
  type: 'warehouse' | 'store';
  address?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  description?: string;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Unit {
  id: string;
  name: string;
  abbreviation: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: Category;
  brandId?: string;
  brand?: Brand;
  unitId?: string;
  unit?: Unit;
  costPrice: number;
  sellingPrice: number;
  taxClass: 'standard' | 'reduced' | 'zero';
  isActive: boolean;
  hasVariants: boolean;
  imageUrl?: string;
  reorderPoint: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  attributes: Record<string, string>;
  costPrice: number;
  sellingPrice: number;
  isActive: boolean;
}

export interface StockItem {
  id: string;
  productId: string;
  variantId?: string;
  locationId: string;
  location?: Location;
  quantity: number;
  reservedQuantity: number;
  lastCountedAt?: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  variantId?: string;
  locationId: string;
  type: 'receipt' | 'sale' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'return';
  quantity: number;
  reference?: string;
  referenceId?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  creditLimit: number;
  currentBalance: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  supplier?: Supplier;
  status: 'draft' | 'approved' | 'partial' | 'received' | 'cancelled';
  orderDate: Date;
  expectedDate?: Date;
  locationId: string;
  location?: Location;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  items: PurchaseOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  product?: Product;
  variantId?: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  taxRate: number;
  total: number;
}

export interface SalesInvoice {
  id: string;
  number: string;
  customerId?: string;
  customer?: Customer;
  status: 'draft' | 'confirmed' | 'paid' | 'partial' | 'cancelled' | 'refunded';
  invoiceDate: Date;
  dueDate?: Date;
  locationId: string;
  location?: Location;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  notes?: string;
  items: SalesInvoiceItem[];
  payments: Payment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SalesInvoiceItem {
  id: string;
  salesInvoiceId: string;
  productId: string;
  product?: Product;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  total: number;
}

export interface Payment {
  id: string;
  salesInvoiceId: string;
  method: 'cash' | 'card' | 'pix' | 'bank_transfer' | 'other';
  amount: number;
  reference?: string;
  paidAt: Date;
  createdBy: string;
}

export interface POSSession {
  id: string;
  locationId: string;
  location?: Location;
  status: 'open' | 'closed';
  openingFloat: number;
  closingCount?: number;
  expectedCash?: number;
  discrepancy?: number;
  openedAt: Date;
  closedAt?: Date;
  openedBy: string;
  closedBy?: string;
  notes?: string;
  cashMovements: POSCashMovement[];
}

export interface POSCashMovement {
  id: string;
  sessionId: string;
  type: 'cash_in' | 'cash_out' | 'sale' | 'refund';
  amount: number;
  reason?: string;
  reference?: string;
  createdAt: Date;
  createdBy: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'pix' | 'bank_transfer' | 'other';
  isActive: boolean;
  isDefault: boolean;
}

// Dashboard metrics
export interface DashboardMetrics {
  todaySales: number;
  todayOrders: number;
  todayProfit: number;
  lowStockCount: number;
  pendingPurchases: number;
  unpaidInvoices: number;
  salesTrend: { date: string; amount: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
}

// Cart for POS
export interface CartItem {
  productId: string;
  variantId?: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxRate: number;
  total: number;
}

export interface Cart {
  items: CartItem[];
  customerId?: string;
  customer?: Customer;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  orderDiscount: number;
}
