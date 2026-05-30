/**
 * Live exchange rate utilities using the Frankfurter API (api.frankfurter.app).
 * Frankfurter is open-source, uses ECB data, requires no API key, and supports
 * all major world currencies. Rates are fetched once per ingest run and cached
 * in memory for the duration of the process.
 */

export type ExchangeRates = Record<string, number>;

let _cachedRates: ExchangeRates | null = null;

/**
 * Fetches latest exchange rates from Frankfurter (ECB data).
 * Returns a map of currency code → rate-to-USD (e.g. { EUR: 1.08, INR: 0.012 }).
 * Results are memoized for the lifetime of the process.
 */
export async function fetchUsdRates(): Promise<ExchangeRates> {
  if (_cachedRates) return _cachedRates;

  const url = 'https://api.frankfurter.app/latest?from=USD';
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Frankfurter API error: ${res.status} ${res.statusText}`);

  const json = (await res.json()) as { rates: Record<string, number>; base: string };

  // Frankfurter returns rates AS { "EUR": 0.925, ... } meaning 1 USD = 0.925 EUR.
  // We want { "EUR": 1/0.925 = 1.08 } i.e. 1 EUR = 1.08 USD (to convert TO usd).
  // But for toUsd(amount, currency) we want: amountUsd = amount * rateToUsd
  // So: rateToUsd for EUR = 1 / 0.925 ≈ 1.08  ← divide raw rate into 1
  // And USD itself = 1.
  const rates: ExchangeRates = { USD: 1 };
  for (const [code, rawRate] of Object.entries(json.rates)) {
    if (typeof rawRate === 'number' && rawRate > 0) {
      rates[code] = 1 / rawRate;
    }
  }

  _cachedRates = rates;
  return rates;
}

/**
 * Convert an amount in the given currency to USD.
 * Returns null if the currency is unknown or rates are unavailable.
 */
export function toUsd(amount: number, currency: string, rates: ExchangeRates): number | null {
  const code = currency.toUpperCase().trim();
  const rate = rates[code];
  if (rate == null) return null;
  return Math.round(amount * rate);
}
