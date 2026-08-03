// Matches the currency set supported by the Frankfurter exchange-rate API
// (lib/exchange-rates.ts) so every currency here always has a live rate.
export const CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "MYR", label: "Malaysian Ringgit", symbol: "RM" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "CNY", label: "Chinese Yuan", symbol: "¥" },
  { code: "HKD", label: "Hong Kong Dollar", symbol: "HK$" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "IDR", label: "Indonesian Rupiah", symbol: "Rp" },
  { code: "PHP", label: "Philippine Peso", symbol: "₱" },
  { code: "THB", label: "Thai Baht", symbol: "฿" },
  { code: "KRW", label: "South Korean Won", symbol: "₩" },
  { code: "NZD", label: "New Zealand Dollar", symbol: "NZ$" },
  { code: "CHF", label: "Swiss Franc", symbol: "Fr" },
  { code: "ZAR", label: "South African Rand", symbol: "R" },
  { code: "BRL", label: "Brazilian Real", symbol: "R$" },
  { code: "MXN", label: "Mexican Peso", symbol: "Mex$" },
  { code: "TRY", label: "Turkish Lira", symbol: "₺" },
  { code: "ILS", label: "Israeli Shekel", symbol: "₪" },
  { code: "NOK", label: "Norwegian Krone", symbol: "kr" },
  { code: "SEK", label: "Swedish Krona", symbol: "kr" },
  { code: "DKK", label: "Danish Krone", symbol: "kr" },
  { code: "PLN", label: "Polish Zloty", symbol: "zł" },
  { code: "CZK", label: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", label: "Hungarian Forint", symbol: "Ft" },
  { code: "RON", label: "Romanian Leu", symbol: "lei" },
  { code: "BGN", label: "Bulgarian Lev", symbol: "лв" },
  { code: "ISK", label: "Icelandic Krona", symbol: "kr" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

export const CURRENCY_CODES: string[] = CURRENCIES.map((c) => c.code);

export function currencySymbol(code: string) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}
