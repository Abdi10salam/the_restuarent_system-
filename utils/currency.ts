// utils/currency.ts

/**
 * Currency configuration for the Restaurant Management System
 */

export const CURRENCY = {
  code: 'UGX',
  symbol: 'USh',
  name: 'Ugandan Shilling',
  // Exchange rate: 1 USD = 3700 UGX (approximate)
  usdToUgxRate: 3700,
};

/**
 * Format a number as Ugandan Shillings
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: false, as UGX doesn't use decimals)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, showDecimals: boolean = false): string {
  // UGX doesn't use decimal places in practice
  const roundedAmount = Math.round(amount);
  
  // Format with thousand separators
  const formattedNumber = roundedAmount.toLocaleString('en-UG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return `${CURRENCY.symbol} ${formattedNumber}`;
}

/**
 * Convert USD to UGX
 * @param usdAmount - Amount in USD
 * @returns Amount in UGX
 */
export function convertUsdToUgx(usdAmount: number): number {
  return Math.round(usdAmount * CURRENCY.usdToUgxRate);
}

/**
 * Convert UGX to USD
 * @param ugxAmount - Amount in UGX
 * @returns Amount in USD
 */
export function convertUgxToUsd(ugxAmount: number): number {
  return ugxAmount / CURRENCY.usdToUgxRate;
}

/**
 * Parse a currency input string to a number
 * @param input - The input string (can include currency symbols)
 * @returns The parsed number
 */
export function parseCurrencyInput(input: string): number {
  // Remove currency symbols and commas
  const cleanedInput = input.replace(/[^0-9.]/g, '');
  return parseFloat(cleanedInput) || 0;
}

/**
 * Format currency for display in the app (without decimals)
 * @param amount - The amount in UGX
 * @returns Formatted string
 */
export function displayPrice(amount: number): string {
  return formatCurrency(amount, false);
}

/**
 * Get just the currency symbol
 */
export function getCurrencySymbol(): string {
  return CURRENCY.symbol;
}