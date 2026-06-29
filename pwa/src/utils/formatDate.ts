/**
 * Locale-independent date formatters for consistent display across all user devices.
 * Always renders in Nigerian English ("5 Jun 2026") regardless of device locale setting.
 */

const DATE_FMT = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const DATE_SHORT_FMT = new Intl.DateTimeFormat('en-NG', {
  day: 'numeric',
  month: 'short',
});

const DATE_MONTH_YEAR_FMT = new Intl.DateTimeFormat('en-NG', {
  month: 'short',
  year: 'numeric',
});

export const formatDate = (date: string | Date): string =>
  DATE_FMT.format(new Date(date));

export const formatDateShort = (date: string | Date): string =>
  DATE_SHORT_FMT.format(new Date(date));

export const formatDateMonthYear = (date: string | Date): string =>
  DATE_MONTH_YEAR_FMT.format(new Date(date));
