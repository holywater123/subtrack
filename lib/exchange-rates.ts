const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest";

// Approximate rates (units of currency per 1 USD) used only if the live
// API is unreachable, so the dashboard still renders a total.
const FALLBACK_USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  MYR: 4.47,
  SGD: 1.34,
  JPY: 149,
  AUD: 1.52,
  CAD: 1.36,
  CNY: 7.24,
  HKD: 7.82,
  INR: 83.4,
  IDR: 15750,
  PHP: 56.5,
  THB: 35.8,
  KRW: 1330,
  NZD: 1.64,
  CHF: 0.88,
  ZAR: 18.7,
  BRL: 5.0,
  MXN: 17.1,
  TRY: 32.5,
  ILS: 3.7,
  NOK: 10.6,
  SEK: 10.4,
  DKK: 6.86,
  PLN: 4.0,
  CZK: 23.2,
  HUF: 355,
  RON: 4.57,
  BGN: 1.8,
  ISK: 138,
};

// Rates are "units of X per 1 unit of `base`". Convert an amount in currency
// X to `base` with: amount / rates[X].
export async function getExchangeRates(
  base: string
): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${FRANKFURTER_URL}?base=${base}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Exchange rate API returned ${res.status}`);
    const data = (await res.json()) as { rates: Record<string, number> };
    return { ...data.rates, [base]: 1 };
  } catch {
    // FALLBACK_USD_RATES[X] is "units of X per 1 USD", so
    // (units of X per 1 USD) / (units of base per 1 USD) = units of X per 1 base.
    const baseUnitsPerUsd = FALLBACK_USD_RATES[base] ?? 1;
    const rates: Record<string, number> = {};
    for (const [currency, unitsPerUsd] of Object.entries(
      FALLBACK_USD_RATES
    )) {
      rates[currency] = unitsPerUsd / baseUnitsPerUsd;
    }
    return rates;
  }
}

export function convertToBase(
  amount: number,
  currency: string,
  rates: Record<string, number>
) {
  const rate = rates[currency] ?? 1;
  return amount / rate;
}
