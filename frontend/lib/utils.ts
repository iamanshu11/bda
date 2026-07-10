import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely (resolves conflicts, supports conditionals).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number into a compact human label, e.g. 24000 -> "24,000".
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}
