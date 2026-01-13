import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  code?: string | null;
}

/**
 * Generates a category code from the category name
 * @param categoryName - The category name
 * @returns 3 character code
 */
export function generateCategoryCode(categoryName: string): string {
  if (!categoryName || categoryName.trim().length === 0) {
    return "GEN";
  }

  // Remove non-alphabetic characters and take first 3 letters
  const cleanName = categoryName.replace(/[^a-zA-Z]/g, "");
  return cleanName.substring(0, 3).toUpperCase() || "GEN";
}

/**
 * Generates a short random alphanumeric code
 * @param length - The length of the code (default: 4)
 * @returns Alphanumeric code
 */
function generateRandomCode(length: number = 4): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing characters (0, O, 1, I)
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Gets the next sequential number for a given category prefix
 * @param prefix - The category prefix (e.g., "ELE")
 * @returns The next sequential number (e.g., "001")
 */
export async function getNextSequentialNumber(prefix: string): Promise<string> {
  try {
    // Query products that start with this prefix
    const { data: products, error } = await supabase
      .from("products")
      .select("sku")
      .ilike("sku", `${prefix}-%`)
      .order("sku", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching products for SKU:", error);
      return "001";
    }

    if (!products || products.length === 0) {
      return "001";
    }

    // Find the highest sequential number
    let maxNumber = 0;
    for (const product of products) {
      const parts = product.sku.split("-");
      if (parts.length >= 2) {
        const numPart = parseInt(parts[1], 10);
        if (!isNaN(numPart) && numPart > maxNumber) {
          maxNumber = numPart;
        }
      }
    }

    // Increment and pad to 3 digits
    const nextNumber = maxNumber + 1;
    return nextNumber.toString().padStart(3, "0");
  } catch (error) {
    console.error("Error generating sequential number:", error);
    return "001";
  }
}

/**
 * Generates a complete SKU for a product
 * Format: [CATEGORY]-[SEQUENTIAL]-[RANDOM]
 * Example: ELE-001-X7K2 or CAM-015-AB3F
 * 
 * @param categoryId - The category ID (optional)
 * @param productName - The product name (unused but kept for API compatibility)
 * @param categories - Array of categories with their codes
 * @returns The generated SKU
 */
export async function generateSKU(
  categoryId: string | null | undefined,
  productName: string,
  categories: Category[]
): Promise<string> {
  // Get category code
  let categoryCode = "GEN";
  
  if (categoryId) {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      categoryCode = category.code || generateCategoryCode(category.name);
    }
  }

  // Get next sequential number for this category
  const sequentialNumber = await getNextSequentialNumber(categoryCode);

  // Generate random suffix for extra uniqueness
  const randomSuffix = generateRandomCode(4);

  return `${categoryCode}-${sequentialNumber}-${randomSuffix}`;
}

/**
 * Generates a simple hash-based SKU
 * Format: SKU-[RANDOM]
 * Example: SKU-9F3A72
 * 
 * @returns The generated SKU
 */
export function generateSimpleSKU(): string {
  const randomCode = generateRandomCode(6);
  return `SKU-${randomCode}`;
}

/**
 * Checks if a SKU already exists in the database
 * @param sku - The SKU to check
 * @param excludeProductId - Optional product ID to exclude (for editing)
 * @returns true if SKU exists, false otherwise
 */
export async function checkSKUExists(
  sku: string,
  excludeProductId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from("products")
      .select("id")
      .eq("sku", sku);

    if (excludeProductId) {
      query = query.neq("id", excludeProductId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      console.error("Error checking SKU:", error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error("Error checking SKU existence:", error);
    return false;
  }
}

/**
 * Validates and ensures SKU uniqueness, appending suffix if needed
 * @param sku - The SKU to validate
 * @param excludeProductId - Optional product ID to exclude
 * @returns A unique SKU (original or modified)
 */
export async function ensureUniqueSKU(
  sku: string,
  excludeProductId?: string
): Promise<string> {
  let currentSKU = sku;
  let attempts = 0;
  const maxAttempts = 10;

  while (await checkSKUExists(currentSKU, excludeProductId) && attempts < maxAttempts) {
    // Append random suffix to make it unique
    const suffix = generateRandomCode(2);
    currentSKU = `${sku}-${suffix}`;
    attempts++;
  }

  return currentSKU;
}
