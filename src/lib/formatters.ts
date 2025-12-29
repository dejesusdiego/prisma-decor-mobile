/**
 * Centralized formatting utilities for the application
 * Use these functions instead of creating local formatters in components
 */

/**
 * Formats a number as Brazilian Real currency (R$)
 * @param value - The number to format
 * @param showZero - Whether to show "R$ 0,00" for null/undefined/0 values (default: true)
 * @returns Formatted currency string (e.g., "R$ 1.234,56")
 */
export function formatCurrency(value: number | null | undefined, showZero: boolean = true): string {
  if (value === null || value === undefined) {
    return showZero ? 'R$ 0,00' : '-';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formats a number as Brazilian Real currency without the currency symbol
 * @param value - The number to format
 * @returns Formatted number string (e.g., "1.234,56")
 */
export function formatCurrencyValue(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a number as meters (m)
 * @param value - The number to format (in meters)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with "m" suffix (e.g., "2,50m")
 */
export function formatMeters(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) {
    return '0m';
  }
  return `${value.toFixed(decimals).replace('.', ',')}m`;
}

/**
 * Formats a date as Brazilian format (dd/MM/yyyy)
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string (e.g., "25/12/2024")
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formats a date with time as Brazilian format (dd/MM/yyyy HH:mm)
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date-time string (e.g., "25/12/2024 14:30")
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a percentage value
 * @param value - The number to format (0-100 range expected)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "45,5%")
 */
export function formatPercent(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) {
    return '0%';
  }
  return `${value.toFixed(decimals).replace('.', ',')}%`;
}

/**
 * Formats a phone number for display (Brazilian format)
 * @param phone - Phone string with only digits
 * @returns Formatted phone string (e.g., "(47) 99999-9999")
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Formats area in square meters
 * @param value - The number to format (in m²)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with "m²" suffix (e.g., "12,50m²")
 */
export function formatArea(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) {
    return '0m²';
  }
  return `${value.toFixed(decimals).replace('.', ',')}m²`;
}
