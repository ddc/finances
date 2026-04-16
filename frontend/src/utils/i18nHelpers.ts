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
