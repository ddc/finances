type TranslateFn = (key: string) => string;

export function translateLabel(t: TranslateFn, prefix: string, code: string, fallback: string): string {
  const key = prefix + code;
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export function buildFilterParams(filters: Record<string, string>): Record<string, string> {
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v) params[k] = v;
  }
  return params;
}

export function sortOptionsOtherLast<T>(
  items: readonly T[],
  getCode: (item: T) => string,
  getLabel: (item: T) => string,
): T[] {
  return [...items].sort((a, b) => {
    if (getCode(a) === "OTHER") return 1;
    if (getCode(b) === "OTHER") return -1;
    return getLabel(a).localeCompare(getLabel(b));
  });
}
