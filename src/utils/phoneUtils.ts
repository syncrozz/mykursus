/**
 * Phone Number Normalization & Verification Utility
 * Optimized for Malaysian mobile and fixed phone formats
 * Follows DCOREV1 privacy and data-integrity principles
 */

export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  // Strip all non-numeric characters (spaces, dashes, parentheses, plus signs)
  let digits = raw.replace(/\D/g, '');

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
 * Masks a phone number for display to prevent casual data leakage
 * Example: '019-2345671' -> '019-***5671'
 */
export function maskPhoneNumber(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7) return raw;

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
