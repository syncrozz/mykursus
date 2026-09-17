/**
 * Utility for formatting dates to DD-MM-YYYY (Day-Month-Year)
 * Example: '2026-09-09' -> '09-09-2026'
 */

/**
 * Replaces any YYYY-MM-DD pattern inside a string with DD-MM-YYYY
 * e.g. "2026-09-09 hingga 2026-09-11" -> "09-09-2026 hingga 11-09-2026"
 */
export function replaceYMDWithDMY(text?: string | null): string {
  if (!text) return '';
  return text.replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, '$3-$2-$1');
}

export function formatDateDMY(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return '';

    // If string already matches DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Match YYYY-MM-DD pattern anywhere in the string
    if (/\b\d{4}-\d{2}-\d{2}\b/.test(trimmed)) {
      return replaceYMDWithDMY(trimmed);
    }

    // Try parsing standard Date string
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }

    return trimmed;
  }

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return '';
}

/**
 * Formats a date range into DD-MM-YYYY format
 * Example: '2026-09-09', '2026-09-11' -> '09-09-2026 hingga 11-09-2026'
 */
export function formatDateRangeDMY(start?: string | null, end?: string | null, separator = 'hingga'): string {
  const formattedStart = formatDateDMY(start);
  const formattedEnd = formatDateDMY(end);

  if (formattedStart && formattedEnd) {
    if (formattedStart === formattedEnd) {
      return formattedStart;
    }
    return `${formattedStart} ${separator} ${formattedEnd}`;
  }

  return formattedStart || formattedEnd || '';
}

/**
 * Formats a datetime string into DD-MM-YYYY HH:mm
 * Example: '2026-09-09 14:00' -> '09-09-2026 14:00'
 */
export function formatDateTimeDMY(dateTimeInput?: string | Date | null): string {
  if (!dateTimeInput) return '';

  if (typeof dateTimeInput === 'string') {
    const trimmed = dateTimeInput.trim();
    // Check if format contains YYYY-MM-DD
    if (/\b\d{4}-\d{2}-\d{2}\b/.test(trimmed)) {
      return replaceYMDWithDMY(trimmed);
    }
    const dmy = formatDateDMY(trimmed);
    if (dmy) return dmy;
  }

  const d = typeof dateTimeInput === 'string' ? new Date(dateTimeInput) : dateTimeInput;
  if (d instanceof Date && !isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  return String(dateTimeInput);
}
