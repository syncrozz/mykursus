/**
 * Phone Number Normalization & Verification Utility
 * Optimized for Malaysian mobile and fixed phone formats
 * Follows DCOREV1 & SES 4.4 privacy and data-integrity principles
 */

/**
 * Safely expands scientific notation string (e.g. "6.0197123001E+10", "1.45313756e8", "+6.0197123001E+10")
 * to a full text digit representation without lossy JavaScript floating-point conversions.
 */
export function expandScientificNotation(raw: string | number): string {
  if (raw === null || raw === undefined) return '';
  const str = String(raw).trim();
  if (!str) return '';

  // Check if string contains scientific notation (e.g. 6.0197123001E+10 or 6.01971e10)
  const match = str.match(/^([+-]?\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/);
  if (!match) {
    return str;
  }

  const sign = match[1].startsWith('-') ? '-' : '';
  const intPart = match[1].replace(/^[+-]/, '');
  const fracPart = match[2] || '';
  const exponent = parseInt(match[3], 10);

  if (isNaN(exponent)) return str;

  if (exponent > 0) {
    if (exponent >= fracPart.length) {
      const zeros = '0'.repeat(exponent - fracPart.length);
      return `${sign}${intPart}${fracPart}${zeros}`;
    } else {
      const shiftedInt = intPart + fracPart.substring(0, exponent);
      const remainingFrac = fracPart.substring(exponent);
      return `${sign}${shiftedInt}.${remainingFrac}`;
    }
  } else if (exponent < 0) {
    const absExp = Math.abs(exponent);
    if (absExp <= intPart.length) {
      const left = intPart.substring(0, intPart.length - absExp);
      const right = intPart.substring(intPart.length - absExp) + fracPart;
      return `${sign}${left || '0'}.${right}`;
    } else {
      const zeros = '0'.repeat(absExp - intPart.length);
      return `${sign}0.${zeros}${intPart}${fracPart}`;
    }
  }

  return `${sign}${intPart}${fracPart ? '.' + fracPart : ''}`;
}

export function normalizePhoneNumber(raw: string | number | undefined | null): string {
  if (raw === null || raw === undefined) return '';
  const textVal = String(raw).trim();
  if (!textVal) return '';

  // 1. Recover scientific notation safely without lossy floating-point operations
  const expanded = expandScientificNotation(textVal);

  // 2. Strip all non-numeric characters (spaces, dashes, parentheses, plus signs)
  let digits = expanded.replace(/\D/g, '');
  if (!digits) return '';

  // If starts with international 0060, trim 00
  if (digits.startsWith('0060')) {
    digits = digits.substring(2);
  }

  // If starts with Malaysian country code 60
  if (digits.startsWith('60')) {
    return digits;
  }

  // If starts with local prefix 0 (e.g. 0123456789 -> 60123456789)
  if (digits.startsWith('0')) {
    return '60' + digits.substring(1);
  }

  // If entered without leading zero (e.g. 123456789 or 192345671)
  if (digits.length >= 8 && digits.startsWith('1')) {
    return '60' + digits;
  }

  return digits;
}

/**
 * Format phone number nicely for standard Malaysian display
 * e.g. 60197123001 -> 019-712 3001 or 019-7123001
 */
export function formatPhoneNumber(raw: string | number | undefined | null): string {
  if (!raw) return '';
  const normalized = normalizePhoneNumber(raw);
  if (!normalized) return String(raw);

  let local = normalized;
  if (local.startsWith('60')) {
    local = '0' + local.substring(2);
  }

  if (local.length === 10) {
    return `${local.substring(0, 3)}-${local.substring(3, 6)} ${local.substring(6)}`;
  }
  if (local.length === 11) {
    return `${local.substring(0, 3)}-${local.substring(3, 7)} ${local.substring(7)}`;
  }
  return local;
}

/**
 * Masks a phone number for display to prevent casual data leakage
 * Example: '019-2345671' -> '019-***5671'
 */
export function maskPhoneNumber(raw: string | number | undefined | null): string {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < 7) return String(raw);

  // Format nicely with asterisks in middle
  let displayDigits = digits;
  if (displayDigits.startsWith('60')) {
    displayDigits = '0' + displayDigits.substring(2);
  }

  if (displayDigits.length >= 9) {
    const prefix = displayDigits.substring(0, 3);
    const suffix = displayDigits.substring(displayDigits.length - 4);
    return `${prefix}-***${suffix}`;
  }

  return `${displayDigits.substring(0, 2)}***${displayDigits.substring(displayDigits.length - 2)}`;
}
