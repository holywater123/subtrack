// Static data shared by the mandatory onboarding flow (app/onboarding/) and
// its editable-afterward counterpart in Settings.

export type TrackingFocus = "subscriptions" | "daily_spend" | "income" | "everything";

export const TRACKING_FOCUS_OPTIONS: { value: TrackingFocus; label: string }[] = [
  { value: "subscriptions", label: "Subscriptions" },
  { value: "daily_spend", label: "Daily spend" },
  { value: "income", label: "Income" },
  { value: "everything", label: "Everything" },
];

export const OCCUPATION_OPTIONS: string[] = [
  "Student",
  "Employed",
  "Self-employed",
  "Freelancer",
  "Business owner",
  "Retired",
  "Other",
];

export const LIFESTYLE_OPTIONS: string[] = [
  "Busy & on-the-go",
  "Homebody",
  "Frequent traveler",
  "Family-focused",
  "Student life",
  "Other",
];

// One representative country per currency in lib/currencies.ts's CURRENCIES,
// plus the common Eurozone countries all mapping to EUR. Not exhaustive -
// anything not listed falls back to DEFAULT_FALLBACK_CURRENCY. Malaysia
// isn't a sensible universal default for a stranger onboarding from an
// unlisted country, so the fallback is USD, not this app's BASE_CURRENCY.
export const COUNTRY_CURRENCY: Record<string, string> = {
  MY: "MYR",
  SG: "SGD",
  US: "USD",
  GB: "GBP",
  JP: "JPY",
  AU: "AUD",
  CA: "CAD",
  CN: "CNY",
  HK: "HKD",
  IN: "INR",
  ID: "IDR",
  PH: "PHP",
  TH: "THB",
  KR: "KRW",
  NZ: "NZD",
  CH: "CHF",
  ZA: "ZAR",
  BR: "BRL",
  MX: "MXN",
  TR: "TRY",
  IL: "ILS",
  NO: "NOK",
  SE: "SEK",
  DK: "DKK",
  PL: "PLN",
  CZ: "CZK",
  HU: "HUF",
  RO: "RON",
  BG: "BGN",
  IS: "ISK",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  IE: "EUR",
  PT: "EUR",
  AT: "EUR",
  BE: "EUR",
  FI: "EUR",
  GR: "EUR",
};

export const DEFAULT_FALLBACK_CURRENCY = "USD";

export const COUNTRIES: { code: string; name: string }[] = [
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "CN", name: "China" },
  { code: "HK", name: "Hong Kong" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" },
  { code: "TH", name: "Thailand" },
  { code: "KR", name: "South Korea" },
  { code: "NZ", name: "New Zealand" },
  { code: "CH", name: "Switzerland" },
  { code: "ZA", name: "South Africa" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "TR", name: "Turkey" },
  { code: "IL", name: "Israel" },
  { code: "NO", name: "Norway" },
  { code: "SE", name: "Sweden" },
  { code: "DK", name: "Denmark" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "HU", name: "Hungary" },
  { code: "RO", name: "Romania" },
  { code: "BG", name: "Bulgaria" },
  { code: "IS", name: "Iceland" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "FI", name: "Finland" },
  { code: "GR", name: "Greece" },
  { code: "OTHER", name: "Other / not listed" },
];

export function currencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY[countryCode] ?? DEFAULT_FALLBACK_CURRENCY;
}
