/**
 * Utilitários para lidar com campos DATE-only (sem timezone)
 * 
 * Problema: campos DATE do Postgres retornam strings 'YYYY-MM-DD'.
 * new Date('2025-01-08') em JS é interpretado como UTC 00:00, que no Brasil (-03)
 * vira '2025-01-07 21:00', causando "datas erradas" na UI.
 * 
 * Solução: usar parseISO do date-fns que preserva a data local.
 */

import { parseISO, format, startOfDay, differenceInDays, isBefore, isAfter, isSameDay as dateFnsSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Parseia uma string DATE-only ('YYYY-MM-DD') para Date local correta
 * Diferente de new Date('YYYY-MM-DD') que interpreta como UTC
 */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  // parseISO trata 'YYYY-MM-DD' como data local, não UTC
  return parseISO(value);
}

/**
 * Formata uma string DATE-only para exibição (ex: '08/01/2025')
 */
export function formatDateOnly(value: string | null | undefined, formatStr: string = 'dd/MM/yyyy'): string {
  if (!value) return '-';
  const date = parseDateOnly(value);
  if (!date) return '-';
  return format(date, formatStr, { locale: ptBR });
}

/**
 * Formata uma string DATE-only para exibição longa (ex: 'quarta-feira, 08 de janeiro')
 */
export function formatDateOnlyLong(value: string | null | undefined): string {
  return formatDateOnly(value, "EEEE, dd 'de' MMMM");
}

/**
 * Verifica se a data DATE-only já passou (comparando apenas dia, sem horário)
 */
export function isPastDateOnly(value: string | null | undefined): boolean {
  if (!value) return false;
  const date = parseDateOnly(value);
  if (!date) return false;
  const today = startOfDay(new Date());
  return isBefore(date, today);
}

/**
 * Verifica se a data DATE-only é hoje
 */
export function isTodayDateOnly(value: string | null | undefined): boolean {
  if (!value) return false;
  const date = parseDateOnly(value);
  if (!date) return false;
  return dateFnsSameDay(date, new Date());
}

/**
 * Calcula dias restantes a partir de hoje (negativo = atrasado)
 * Retorna null se não houver data
 */
export function diasRestantesDateOnly(value: string | null | undefined): number | null {
  if (!value) return null;
  const date = parseDateOnly(value);
  if (!date) return null;
  const today = startOfDay(new Date());
  return differenceInDays(date, today);
}

/**
 * Verifica se duas datas DATE-only são o mesmo dia
 */
export function isSameDayDateOnly(value1: string | Date | null | undefined, value2: string | Date | null | undefined): boolean {
  const date1 = typeof value1 === 'string' ? parseDateOnly(value1) : value1;
  const date2 = typeof value2 === 'string' ? parseDateOnly(value2) : value2;
  if (!date1 || !date2) return false;
  return dateFnsSameDay(date1, date2);
}

/**
 * Retorna startOfDay de hoje (para comparações de disabled em calendário)
 */
export function startOfToday(): Date {
  return startOfDay(new Date());
}
