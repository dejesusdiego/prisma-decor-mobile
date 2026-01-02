import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export centralized formatters for convenience
export { formatCurrency, formatDate, formatDateTime, formatPercent, formatPhone, formatArea, formatMeters, formatCurrencyValue } from './formatters';
