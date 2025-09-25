/**
 * Currency utility functions for consistent Indian Rupee formatting
 */

/**
 * Format price in Indian Rupees with appropriate scaling
 * @param price - Price in INR (number)
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  if (!price || price === 0) {
    return '₹0';
  }

  if (price >= 10000000) {
    // Format as crores for amounts >= 1 crore
    return `₹${(price / 10000000).toFixed(1)}Cr`;
  } else if (price >= 100000) {
    // Format as lakhs for amounts >= 1 lakh
    return `₹${(price / 100000).toFixed(1)}L`;
  } else if (price >= 1000) {
    // Format as thousands for amounts >= 1000
    return `₹${(price / 1000).toFixed(0)}K`;
  } else {
    // Regular formatting for smaller amounts
    return `₹${price.toFixed(0)}`;
  }
}

/**
 * Format price with full digits (no scaling)
 * @param price - Price in INR (number)
 * @returns Formatted price string with commas
 */
export function formatPriceFull(price: number): string {
  if (!price || price === 0) {
    return '₹0';
  }

  return `₹${price.toLocaleString('en-IN')}`;
}

/**
 * Parse price from different formats
 * @param priceString - Price string in various formats
 * @returns Price as number
 */
export function parsePrice(priceString: string): number {
  if (!priceString) return 0;

  // Remove currency symbols and normalize
  const cleanPrice = priceString.replace(/[₹$,\s]/g, '');

  // Handle scaled formats
  if (cleanPrice.includes('Cr')) {
    return parseFloat(cleanPrice.replace('Cr', '')) * 10000000;
  } else if (cleanPrice.includes('L')) {
    return parseFloat(cleanPrice.replace('L', '')) * 100000;
  } else if (cleanPrice.includes('K')) {
    return parseFloat(cleanPrice.replace('K', '')) * 1000;
  }

  return parseFloat(cleanPrice) || 0;
}

/**
 * Calculate discount percentage
 * @param originalPrice - Original price in INR
 * @param currentPrice - Current price in INR
 * @returns Discount percentage
 */
export function calculateDiscountPercentage(originalPrice: number, currentPrice: number): number {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) {
    return 0;
  }

  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Calculate savings amount
 * @param originalPrice - Original price in INR
 * @param currentPrice - Current price in INR
 * @returns Savings amount
 */
export function calculateSavings(originalPrice: number, currentPrice: number): number {
  if (!originalPrice || !currentPrice || originalPrice <= currentPrice) {
    return 0;
  }

  return originalPrice - currentPrice;
}