import { currencyColor, DYNAMIC_COLORS } from "../utils/chartColors";
import type { Expense, Deposit, Transfer } from "../types";

type TranslateFn = (key: string) => string;

function translateLabel(t: TranslateFn, prefix: string, code: string, fallback: string): string {
  const key = prefix + code;
  const translated = t(key);
  return translated === key ? fallback : translated;
}

function buildPieMap(
  items: Record<string, unknown>[],
  keyFn: (item: Record<string, unknown>) => string,
  valueFn: (item: Record<string, unknown>) => number,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) || 0) + valueFn(item));
  }
  return map;
}

function toDynamicPie(map: Map<string, number>) {
  return Array.from(map.entries())
    .map(([name, value], i) => ({ name, value, fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length] }))
    .filter((d) => d.value > 0);
}

export function useDashboardCharts(
  t: TranslateFn,
  expenses: Expense[],
  deposits: Deposit[],
  transfers: Transfer[],
) {
  const catName = (code: string, fallback: string) => translateLabel(t, "expenses.categories.", code, fallback);
  const compName = (code: string, fallback: string) => translateLabel(t, "deposits.companies.", code, fallback);
  const bnkName = (code: string, fallback: string) => translateLabel(t, "transfers.banks.", code, fallback);

  const asMap = (arr: unknown[]) => arr as unknown as Record<string, unknown>[];

  const expenseByCategoryPie = toDynamicPie(
    buildPieMap(asMap(expenses), (e) => catName(e.category_code as string, e.category_label as string), (e) => Number(e.amount)),
  );

  const depositByCurrencyMap = new Map<string, { value: number; symbol: string }>();
  for (const d of deposits) {
    const existing = depositByCurrencyMap.get(d.currency_code);
    depositByCurrencyMap.set(d.currency_code, { value: (existing?.value || 0) + Number(d.amount_foreign), symbol: d.currency_symbol });
  }
  const depositByCurrencyPie = Array.from(depositByCurrencyMap.entries())
    .map(([name, { value, symbol }]) => ({ name, value, symbol, fill: currencyColor(name) }))
    .filter((d) => d.value > 0);

  const depositByCompanyPie = toDynamicPie(
    buildPieMap(asMap(deposits), (d) => compName(d.company_code as string, d.company_label as string), (d) => Number(d.amount_brl)),
  );

  const totalDepositsForeign = deposits.reduce((sum, d) => sum + Number(d.amount_foreign), 0);
  const totalDepositsBrl = deposits.reduce((sum, d) => sum + Number(d.amount_brl), 0);
  const foreignVsBrlPie = [
    { name: t("deposits.foreignCurrency"), value: totalDepositsForeign, fill: "#8b5cf6" },
    { name: "BRL", value: totalDepositsBrl, fill: "#22c55e" },
  ].filter((d) => d.value > 0);

  const companyCurrencyMap = new Map<string, { value: number; symbol: string }>();
  for (const d of deposits) {
    const key = compName(d.company_code, d.company_label) + " (" + d.currency_code + ")";
    const existing = companyCurrencyMap.get(key);
    companyCurrencyMap.set(key, { value: (existing?.value || 0) + Number(d.amount_foreign), symbol: d.currency_symbol });
  }
  const companyCurrencyPie = Array.from(companyCurrencyMap.entries())
    .map(([name, { value, symbol }], i) => ({ name, value, symbol, fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length] }))
    .filter((d) => d.value > 0);

  const brlByCurrencyPie = Array.from(
    buildPieMap(asMap(deposits), (d) => d.currency_code as string, (d) => Number(d.amount_brl)).entries(),
  ).map(([name, value]) => ({ name, value, fill: currencyColor(name) })).filter((d) => d.value > 0);

  const depositsCountPie = toDynamicPie(
    buildPieMap(asMap(deposits), (d) => compName(d.company_code as string, d.company_label as string), () => 1),
  );

  const transferByBankPie = toDynamicPie(
    buildPieMap(asMap(transfers), (tr) => bnkName(tr.bank_code as string, tr.bank_label as string), (tr) => Number(tr.amount_brl)),
  );

  return {
    expenseByCategoryPie,
    depositByCurrencyPie,
    depositByCompanyPie,
    foreignVsBrlPie,
    companyCurrencyPie,
    brlByCurrencyPie,
    depositsCountPie,
    transferByBankPie,
  };
}
