const DYNAMIC_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#f97316", "#f59e0b", "#ec4899", "#14b8a6"];

export const CURRENCY_ORDER = ["USD", "EUR", "GBP", "CAD", "AUD"];

const CURRENCY_COLORS: Record<string, string> = {
  USD: "#8b5cf6",
  EUR: "#6366f1",
  GBP: "#3b82f6",
  CAD: "#f97316",
  AUD: "#f59e0b",
};

export function currencyColor(code: string): string {
  return CURRENCY_COLORS[code] || "#94a3b8";
}

export function dynamicColor(index: number): string {
  return DYNAMIC_COLORS[index % DYNAMIC_COLORS.length];
}

export { DYNAMIC_COLORS };
