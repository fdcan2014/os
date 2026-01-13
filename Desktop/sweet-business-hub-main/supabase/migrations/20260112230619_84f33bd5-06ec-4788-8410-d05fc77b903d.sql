-- Add code column to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS code VARCHAR(5);

-- Update existing categories with codes
UPDATE public.categories SET code = 'ELE' WHERE name ILIKE '%electr%' AND code IS NULL;
UPDATE public.categories SET code = 'ACC' WHERE name ILIKE '%access%' AND code IS NULL;
UPDATE public.categories SET code = 'OFF' WHERE name ILIKE '%office%' AND code IS NULL;
UPDATE public.categories SET code = 'FUR' WHERE name ILIKE '%furni%' AND code IS NULL;
UPDATE public.categories SET code = 'AUD' WHERE name ILIKE '%audio%' AND code IS NULL;
UPDATE public.categories SET code = 'CLO' WHERE name ILIKE '%cloth%' AND code IS NULL;
UPDATE public.categories SET code = 'FOO' WHERE name ILIKE '%food%' AND code IS NULL;
UPDATE public.categories SET code = 'BEV' WHERE name ILIKE '%bever%' AND code IS NULL;
UPDATE public.categories SET code = 'SPO' WHERE name ILIKE '%sport%' AND code IS NULL;
UPDATE public.categories SET code = 'TOY' WHERE name ILIKE '%toy%' AND code IS NULL;
UPDATE public.categories SET code = 'HOM' WHERE name ILIKE '%home%' AND code IS NULL;
UPDATE public.categories SET code = 'GAR' WHERE name ILIKE '%garden%' AND code IS NULL;
UPDATE public.categories SET code = 'HEA' WHERE name ILIKE '%health%' AND code IS NULL;
UPDATE public.categories SET code = 'BEA' WHERE name ILIKE '%beauty%' AND code IS NULL;
UPDATE public.categories SET code = 'BOO' WHERE name ILIKE '%book%' AND code IS NULL;
UPDATE public.categories SET code = 'MUS' WHERE name ILIKE '%music%' AND code IS NULL;
UPDATE public.categories SET code = 'GAM' WHERE name ILIKE '%game%' AND code IS NULL;
UPDATE public.categories SET code = 'PET' WHERE name ILIKE '%pet%' AND code IS NULL;
UPDATE public.categories SET code = 'AUT' WHERE name ILIKE '%auto%' AND code IS NULL;
UPDATE public.categories SET code = 'TOO' WHERE name ILIKE '%tool%' AND code IS NULL;

-- For any remaining categories without codes, generate from first 3 letters of name
UPDATE public.categories 
SET code = UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3))
WHERE code IS NULL;