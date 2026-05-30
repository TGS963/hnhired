/**
 * Shared salary formatting utility using Intl.NumberFormat.
 * Automatically handles every world currency correctly:
 * - Symbol placement (before/after amount per locale convention)
 * - Decimal rules (JPY/KRW show no decimals; USD shows none at our scale)
 * - Grouping separators per locale
 *
 * We use a compact "engineering" style — e.g. $150k, ₹6L, ¥15M — for
 * list views where space is tight, and full Intl formatting for detail views.
 */

export type SalaryRow = {
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
};

// Currencies that use Lakhs/Crore notation natively (×1,00,000 = 1L).
const LAKH_CURRENCIES = new Set(['INR', 'PKR', 'BDT', 'NPR', 'LKR']);

// Currencies with very large face values that we abbreviate as "M" (millions).
const MILLION_CURRENCIES = new Set(['JPY', 'KRW', 'IDR', 'VND', 'IRR', 'CLP']);

/**
 * Format a salary number compactly for list/card views.
 * Examples:
 *   USD 150000      → $150k
 *   INR 600000      → ₹6L
 *   JPY 8000000     → ¥8M
 *   EUR 90000       → €90k
 *   GBP 60000       → £60k
 *   SGD 100000      → S$100k
 */
function compact(amount: number, currency: string): string {
  const cur = currency.toUpperCase();

  if (LAKH_CURRENCIES.has(cur)) {
    const sym = currencySymbol(cur);
    const lakhs = amount / 100_000;
    const str = Number.isInteger(lakhs) ? lakhs.toFixed(0) : lakhs.toFixed(1);
    return `${sym}${str}L`;
  }

  if (MILLION_CURRENCIES.has(cur)) {
    const sym = currencySymbol(cur);
    const millions = amount / 1_000_000;
    const str = Number.isInteger(millions) ? millions.toFixed(0) : millions.toFixed(1);
    return `${sym}${str}M`;
  }

  // Standard: abbreviate to "k" (thousands)
  const sym = currencySymbol(cur);
  const k = Math.round(amount / 1000);
  return `${sym}${k}k`;
}

/**
 * Returns the currency symbol/prefix for compact display.
 * Uses Intl.NumberFormat to get the native symbol, then extracts just the
 * symbol portion. Falls back to the ISO code if extraction fails.
 */
function currencySymbol(currency: string): string {
  try {
    // Format 0 and extract everything that isn't a digit or whitespace.
    // This gives us the symbol in the correct position.
    const formatted = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(0);
    // Remove digits, thousands separators, and trim
    const sym = formatted.replace(/[\d,.\s]/g, '').trim();
    return sym || currency + ' ';
  } catch {
    return currency + ' ';
  }
}

/**
 * Compact salary string for JobRow / JobCard list views.
 * Returns null when no salary data is available.
 */
export function formatSalary(row: SalaryRow): string | null {
  const { salary_min, salary_max } = row;
  if (salary_min == null && salary_max == null) return null;

  const cur = (row.currency ?? 'USD').toUpperCase();

  if (salary_min != null && salary_max != null) {
    // Same currency symbol prefix + range
    if (LAKH_CURRENCIES.has(cur)) {
      const sym = currencySymbol(cur);
      const lo = salary_min / 100_000;
      const hi = salary_max / 100_000;
      const fmt = (n: number) => (Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1));
      return `${sym}${fmt(lo)}–${fmt(hi)}L`;
    }
    if (MILLION_CURRENCIES.has(cur)) {
      const sym = currencySymbol(cur);
      const lo = salary_min / 1_000_000;
      const hi = salary_max / 1_000_000;
      const fmt = (n: number) => (Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1));
      return `${sym}${fmt(lo)}–${fmt(hi)}M`;
    }
    const sym = currencySymbol(cur);
    return `${sym}${Math.round(salary_min / 1000)}–${Math.round(salary_max / 1000)}k`;
  }

  if (salary_min != null) return `${compact(salary_min, cur)}+`;
  return `up to ${compact(salary_max!, cur)}`;
}

/**
 * Full Intl-formatted salary string for the job detail page.
 * Uses the browser/Node locale for correct number grouping.
 * Examples:
 *   USD 150000/200000  → "$150,000 – $200,000"
 *   INR 600000/1000000 → "₹6,00,000 – ₹10,00,000"
 *   JPY 8000000        → "From ¥8,000,000"
 */
export function formatSalaryFull(row: SalaryRow): string | null {
  const { salary_min, salary_max } = row;
  if (salary_min == null && salary_max == null) return null;

  const cur = (row.currency ?? 'USD').toUpperCase();

  let intlCur = cur;
  try {
    // Validate the currency code is recognized by Intl
    new Intl.NumberFormat('en', { style: 'currency', currency: intlCur });
  } catch {
    intlCur = 'USD';
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: intlCur,
      maximumFractionDigits: 0,
    }).format(n);

  if (salary_min != null && salary_max != null)
    return `${fmt(Number(salary_min))} – ${fmt(Number(salary_max))}`;
  if (salary_min != null) return `From ${fmt(Number(salary_min))}`;
  return `Up to ${fmt(Number(salary_max))}`;
}
