const CURRENCY_FLAGS: Record<string, string> = {
  USD: "\u{1F1FA}\u{1F1F8}",
  EUR: "\u{1F1EA}\u{1F1FA}",
  GBP: "\u{1F1EC}\u{1F1E7}",
  BRL: "\u{1F1E7}\u{1F1F7}",
  CAD: "\u{1F1E8}\u{1F1E6}",
  AUD: "\u{1F1E6}\u{1F1FA}",
  JPY: "\u{1F1EF}\u{1F1F5}",
  CHF: "\u{1F1E8}\u{1F1ED}",
};

export function currencyFlag(code: string): string {
  return CURRENCY_FLAGS[code] || "";
}
