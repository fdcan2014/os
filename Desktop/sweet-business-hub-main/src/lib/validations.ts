import { z } from 'zod';

// Customer validation schema
export const CustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  code: z.string().max(50, 'Code must be less than 50 characters').nullable().optional(),
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters').nullable().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  phone: z.string().max(50, 'Phone must be less than 50 characters').nullable().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  tax_id: z.string().max(50, 'Tax ID must be less than 50 characters').nullable().optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').nullable().optional(),
  city: z.string().max(100, 'City must be less than 100 characters').nullable().optional(),
  state: z.string().max(100, 'State must be less than 100 characters').nullable().optional(),
  postal_code: z.string().max(20, 'Postal code must be less than 20 characters').nullable().optional(),
  credit_limit: z.number().min(0, 'Credit limit cannot be negative').max(999999999, 'Credit limit too high').default(0),
  current_balance: z.number().min(-999999999).max(999999999).default(0),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').nullable().optional(),
  is_active: z.boolean().default(true),
});

export type CustomerInput = z.infer<typeof CustomerSchema>;

// Supplier validation schema
export const SupplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  code: z.string().max(50, 'Code must be less than 50 characters').nullable().optional(),
  contact_name: z.string().max(200, 'Contact name must be less than 200 characters').nullable().optional(),
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters').nullable().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  phone: z.string().max(50, 'Phone must be less than 50 characters').nullable().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  tax_id: z.string().max(50, 'Tax ID must be less than 50 characters').nullable().optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').nullable().optional(),
  city: z.string().max(100, 'City must be less than 100 characters').nullable().optional(),
  state: z.string().max(100, 'State must be less than 100 characters').nullable().optional(),
  postal_code: z.string().max(20, 'Postal code must be less than 20 characters').nullable().optional(),
  payment_terms: z.number().min(0, 'Payment terms cannot be negative').max(365, 'Payment terms cannot exceed 365 days').default(30),
  notes: z.string().max(2000, 'Notes must be less than 2000 characters').nullable().optional(),
  is_active: z.boolean().default(true),
});

export type SupplierInput = z.infer<typeof SupplierSchema>;

// Product validation schema
export const ProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters'),
  barcode: z.string().max(100, 'Barcode must be less than 100 characters').nullable().optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').nullable().optional(),
  category_id: z.string().uuid('Invalid category').nullable().optional(),
  brand_id: z.string().uuid('Invalid brand').nullable().optional(),
  unit_id: z.string().uuid('Invalid unit').nullable().optional(),
  cost_price: z.number().min(0, 'Cost price cannot be negative').max(999999999, 'Cost price too high').default(0),
  sell_price: z.number().min(0, 'Sell price cannot be negative').max(999999999, 'Sell price too high').default(0),
  tax_rate_id: z.string().uuid('Invalid tax rate').nullable().optional(),
  min_stock: z.number().min(0, 'Minimum stock cannot be negative').max(999999999).default(0),
  max_stock: z.number().min(0, 'Maximum stock cannot be negative').max(999999999).nullable().optional(),
  reorder_point: z.number().min(0, 'Reorder point cannot be negative').max(999999999).default(0),
  has_variants: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof ProductSchema>;

// Auth validation schemas
export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password must be less than 128 characters'),
});

export const SignUpSchema = z.object({
  email: z.string().email('Please enter a valid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
