import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts any Arabic-Indic (٠-٩) or Persian (۰-۹) digits and Arabic decimal marks (٫ ،) to standard English numerals (0-9, .).
 */
export function toEnglishNumbers(input: any): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9')
    .replace(/[٫،]/g, '.');
}

/**
 * Converts input into a clean floating-point number, safely parsing Arabic numerals if present.
 */
export function parseEnglishNumber(input: any): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input) return 0;
  const normalized = toEnglishNumbers(input).trim();
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a number into English numerals with standard 0-2 decimal places.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value || 0);
}

/**
 * Formats a number strictly with 2 decimal places in English numerals.
 */
export function formatCurrencyExact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(value || 0);
}
