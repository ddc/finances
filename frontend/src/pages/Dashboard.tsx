import { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem,
  List, ListItem, ListItemText, Chip, IconButton, Tooltip,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie,
} from "recharts";
import { useTranslation } from "react-i18next";
import { getDashboard } from "../api/dashboard";
import { listExpenses } from "../api/expenses";
import { listDeposits } from "../api/deposits";
import { listTransfers } from "../api/transfers";
import { listCurrencies } from "../api/lookups";
import type { DashboardData, CurrencyOption, Expense, Deposit, Transfer } from "../types";
import CurrencyFlag from "../components/CurrencyFlag";
import { CURRENCY_ORDER, currencyColor, DYNAMIC_COLORS } from "../utils/chartColors";

const PIE_COLORS = ["#6366f1", "#ef4444", "#3b82f6", "#22c55e"];

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "pt-BR" ? "pt-BR" : "en-US";
  const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const MONTH_NAMES = monthKeys.map((k) => t(`months.${k}`));


  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState<number | "">(currentYear);
  const [month, setMonth] = useState<number | "">("");
  const [currency, setCurrency] = useState("USD");
  const [data, setData] = useState<DashboardData | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    listCurrencies().then((list) => {
      const sorted = [...list].sort((a, b) => {
        const ai = CURRENCY_ORDER.indexOf(a.code);
        const bi = CURRENCY_ORDER.indexOf(b.code);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
      setCurrencies(sorted);
      setCurrency((prev) => sorted.some((c) => c.code === prev) ? prev : (sorted[0]?.code || "USD"));
    });
  }, []);

  const fetchData = useCallback(() => {
    const params: Record<string, string> = {};
    if (year) params.year = String(year);
    if (month) params.month = String(month);

    getDashboard(year || undefined, month || undefined, currency).then(setData);
    listExpenses(params).then(setExpenses);
    listDeposits(params).then(setDeposits);
    listTransfers(params).then(setTransfers);
  }, [year, month, currency]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!data) return null;

  const filterLabel = (() => {
    if (month) return MONTH_NAMES[month - 1] + (year ? " " + year : "");
    if (year) return String(year);
    return t("filters.all");
  })();

  const pieData = [
    { name: t("dashboard.income"), value: Number(data.summary.total_income_brl), fill: PIE_COLORS[0] },
    { name: t("dashboard.expenses"), value: Number(data.summary.total_expenses_brl), fill: PIE_COLORS[1] },
    { name: t("dashboard.transferred"), value: Number(data.summary.total_transferred_brl), fill: PIE_COLORS[2] },
  ].filter((d) => d.value > 0);

  const barData = data.monthly.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    [t("dashboard.income")]: Number(m.income_brl),
    [t("dashboard.expenses")]: Number(m.expenses_brl),
    [t("dashboard.transferred")]: Number(m.transferred_brl),
  }));

  // Pie chart data: expenses by category
  const categoryName = (code: string, fallback: string) => {
    const key = "expenses.categories." + code;
    const translated = t(key);
    return translated === key ? fallback : translated;
  };
  const companyName = (code: string, fallback: string) => {
    const key = "deposits.companies." + code;
    const translated = t(key);
    return translated === key ? fallback : translated;
  };
  const bankName = (code: string, fallback: string) => {
    const key = "transfers.banks." + code;
    const translated = t(key);
    return translated === key ? fallback : translated;
  };
  const expenseByCategoryMap = new Map<string, number>();
  for (const e of expenses) {
    const key = categoryName(e.category_code, e.category_label);
    expenseByCategoryMap.set(key, (expenseByCategoryMap.get(key) || 0) + Number(e.amount));
  }
  const expenseByCategoryPie = Array.from(expenseByCategoryMap.entries())
    .map(([name, value], i) => ({ name, value, fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length] }))
    .filter((d) => d.value > 0);

  // Pie chart data: deposits by currency
  const depositByCurrencyMap = new Map<string, { value: number; symbol: string }>();
  for (const d of deposits) {
    const key = d.currency_code;
    const existing = depositByCurrencyMap.get(key);
    depositByCurrencyMap.set(key, {
      value: (existing?.value || 0) + Number(d.amount_foreign),
      symbol: d.currency_symbol,
    });
  }
  const depositByCurrencyPie = Array.from(depositByCurrencyMap.entries())
    .map(([name, { value, symbol }]) => ({ name, value, symbol, fill: currencyColor(name) }))
    .filter((d) => d.value > 0);

  // Pie chart data: deposits by company
  const depositByCompanyMap = new Map<string, number>();
  for (const d of deposits) {
    const key = companyName(d.company_code, d.company_label);
    depositByCompanyMap.set(key, (depositByCompanyMap.get(key) || 0) + Number(d.amount_brl));
  }
  const depositByCompanyPie = Array.from(depositByCompanyMap.entries())
    .map(([name, value], i) => ({ name, value, fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length] }))
    .filter((d) => d.value > 0);

  // Pie chart data: deposits foreign vs BRL
  const totalDepositsForeign = deposits.reduce((sum, d) => sum + Number(d.amount_foreign), 0);
  const totalDepositsBrl = deposits.reduce((sum, d) => sum + Number(d.amount_brl), 0);
  const foreignVsBrlPie = [
    { name: t("deposits.foreign"), value: totalDepositsForeign, fill: "#8b5cf6" },
    { name: "BRL", value: totalDepositsBrl, fill: "#22c55e" },
  ].filter((d) => d.value > 0);

  // Pie chart data: company by currency
  const companyCurrencyMap = new Map<string, { value: number; symbol: string }>();
  for (const d of deposits) {
    const key = companyName(d.company_code, d.company_label) + " (" + d.currency_code + ")";
    const existing = companyCurrencyMap.get(key);
    companyCurrencyMap.set(key, { value: (existing?.value || 0) + Number(d.amount_foreign), symbol: d.currency_symbol });
  }
  const companyCurrencyPie = Array.from(companyCurrencyMap.entries())
    .map(([name, { value, symbol }], i) => ({ name, value, symbol, fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length] }))
    .filter((d) => d.value > 0);

  // Pie chart data: BRL by currency
  const brlByCurrencyMap = new Map<string, number>();
  for (const d of deposits) {
    brlByCurrencyMap.set(d.currency_code, (brlByCurrencyMap.get(d.currency_code) || 0) + Number(d.amount_brl));
  }
  const brlByCurrencyPie = Array.from(brlByCurrencyMap.entries())
    .map(([name, value]) => ({ name, value, fill: currencyColor(name) }))
    .filter((d) => d.value > 0);

  // Pie chart data: deposits count by company
  const depositsCountMap = new Map<string, number>();
  for (const d of deposits) {
    const compName = companyName(d.company_code, d.company_label);
    depositsCountMap.set(compName, (depositsCountMap.get(compName) || 0) + 1);
  }
  const depositsCountPie = Array.from(depositsCountMap.entries())
    .map(([name, value], i) => ({ name, value, fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length] }))
    .filter((d) => d.value > 0);

  // Pie chart data: transfers by bank
  const transferByBankMap = new Map<string, number>();
  for (const tr of transfers) {
    const key = bankName(tr.bank_code, tr.bank_label);
    transferByBankMap.set(key, (transferByBankMap.get(key) || 0) + Number(tr.amount_brl));
  }
  const transferByBankPie = Array.from(transferByBankMap.entries())
    .map(([name, value], i) => ({ name, value, fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length] }))
    .filter((d) => d.value > 0);

  const legendWithPct = (pieItems: Array<{ name: string; value: number }>) => (value: string, entry: { payload?: unknown }) => {
    const total = pieItems.reduce((s, d) => s + d.value, 0);
    const pct = total > 0 ? ((Number((entry.payload as Record<string, unknown>)?.value) / total) * 100).toFixed(1) : "0";
    return value + " (" + pct + "%)";
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">{t("nav.dashboard")} — {filterLabel}</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {data.ptax_data_hora && (
            <Chip label={"PTAX " + data.ptax_data_hora.split(".")[0]} variant="outlined" />
          )}
          {data.ptax_compra && (
            <Chip label={currency + " " + t("dashboard.buy") + ": R$ " + Number(data.ptax_compra).toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} color="success" variant="outlined" />
          )}
          {data.ptax_venda && (
            <Chip label={currency + " " + t("dashboard.sell") + ": R$ " + Number(data.ptax_venda).toLocaleString(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} color="info" variant="outlined" />
          )}
          <Tooltip title="Refresh">
            <IconButton
              size="small"
              onClick={() => {
                setRefreshing(true);
                fetchData();
                setTimeout(() => setRefreshing(false), 1000);
              }}
            >
              <Refresh sx={{
                animation: refreshing ? "spin 1s linear infinite" : "none",
                "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
              }} />
            </IconButton>
          </Tooltip>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>{t("filters.currency")}</InputLabel>
            <Select value={currency} label={t("filters.currency")} onChange={(e) => setCurrency(e.target.value)}>
              {currencies.map((c) => (
                <MenuItem key={c.id} value={c.code}>{c.code}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t("filters.month")}</InputLabel>
            <Select
              value={month}
              label={t("filters.month")}
              onChange={(e) => {
                const val = e.target.value as string | number;
                setMonth(val === "" ? "" : Number(val));
              }}
            >
              <MenuItem value="">{t("filters.all")}</MenuItem>
              {MONTH_NAMES.map((name, i) => (
                <MenuItem key={i + 1} value={i + 1}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>{t("filters.year")}</InputLabel>
            <Select value={year} label={t("filters.year")} onChange={(e) => {
                const val = e.target.value as string | number;
                setYear(val === "" ? "" : Number(val));
              }}>
              <MenuItem value="">{t("filters.all")}</MenuItem>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Row 1: Income by currency — fixed 5 columns */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        {currencies.map((curr) => (
          <Card key={curr.id} sx={{ flex: "1 1 0", minWidth: 0 }}>
            <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
              <Typography color="text.secondary" gutterBottom>
                {t("dashboard.totalIncomeForeign", { currency: curr.code })} <CurrencyFlag code={curr.code} />
              </Typography>
              <Typography variant="h5" sx={{ color: currencyColor(curr.code) }}>
                {curr.symbol} {Number(data.summary.income_by_currency[curr.code] || 0).toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Row 2: BRL totals — fixed 4 columns */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        {[
          { key: "income", label: <>{t("dashboard.totalIncomeBrl")} <CurrencyFlag code="BRL" /></>, value: data.summary.total_income_brl, color: "#22c55e", prefix: "R$" },
          { key: "expenses", label: t("dashboard.totalExpenses"), value: data.summary.total_expenses_brl, color: "#ef4444", prefix: "R$" },
          { key: "transferred", label: t("dashboard.totalTransferred"), value: data.summary.total_transferred_brl, color: "#3b82f6", prefix: "R$" },
          { key: "net", label: t("dashboard.netBalance"), value: data.summary.net_balance_brl, color: Number(data.summary.net_balance_brl) >= 0 ? "#22c55e" : "#ef4444", prefix: "R$" },
        ].map((card) => (
          <Card key={card.key} sx={{ flex: "1 1 0", minWidth: 0 }}>
            <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
              <Typography color="text.secondary" gutterBottom>{card.label}</Typography>
              <Typography variant="h5" sx={{ color: card.color }}>
                {card.prefix} {Number(card.value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Overview chart - full width */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{t("dashboard.overview")}</Typography>
          <ResponsiveContainer width="100%" height={300}>
            {month ? (
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: R$ ${value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}`}
                    />
                    <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => `R$ ${Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })}`} />
                    <Legend formatter={legendWithPct(pieData)} />
                  </PieChart>
                ) : (
                  <AreaChart data={barData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} />
                    <Legend />
                    <Area type="monotone" dataKey={t("dashboard.income")} stroke="#22c55e" fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey={t("dashboard.expenses")} stroke="#ef4444" fillOpacity={1} fill="url(#colorExpenses)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

      {/* Detail pie charts — 2x2 grid: Deposits, then Expenses, then Transfers */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("dashboard.depositsForeignVsBrl")}</Typography>
            {foreignVsBrlPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={foreignVsBrlPie} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => name + ": " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                  />
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                  <Legend formatter={legendWithPct(foreignVsBrlPie)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">{t("common.noData")}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("dashboard.depositsByCurrency")}</Typography>
            {depositByCurrencyPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={depositByCurrencyPie} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value, ...rest }) => name + ": " + (rest as unknown as Record<string, string>).symbol + " " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                  />
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value, _name, props) => (props.payload as Record<string, string>).symbol + " " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                  <Legend formatter={legendWithPct(depositByCurrencyPie)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">{t("common.noData")}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("dashboard.depositsByCompany")}</Typography>
            {depositByCompanyPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={depositByCompanyPie} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => name + ": R$ " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                  />
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => "R$ " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                  <Legend formatter={legendWithPct(depositByCompanyPie)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">{t("common.noData")}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("dashboard.depositsCompanyCurrency")}</Typography>
            {companyCurrencyPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={companyCurrencyPie} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value, ...rest }) => name + ": " + (rest as unknown as Record<string, string>).symbol + " " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                  />
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value, _name, props) => (props.payload as Record<string, string>).symbol + " " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                  <Legend formatter={legendWithPct(companyCurrencyPie)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">{t("common.noData")}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("dashboard.brlByCurrency")}</Typography>
            {brlByCurrencyPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={brlByCurrencyPie} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => name + ": R$ " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                  />
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => "R$ " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                  <Legend formatter={legendWithPct(brlByCurrencyPie)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">{t("common.noData")}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("dashboard.depositsCount")}</Typography>
            {depositsCountPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={depositsCountPie} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => name + ": " + value}
                  />
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} />
                  <Legend formatter={legendWithPct(depositsCountPie)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">{t("common.noData")}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("dashboard.expensesByCategory")}</Typography>
            {expenseByCategoryPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={expenseByCategoryPie} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => name + ": R$ " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                  />
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => "R$ " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                  <Legend formatter={legendWithPct(expenseByCategoryPie)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">{t("common.noData")}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("dashboard.transfersByBank")}</Typography>
            {transferByBankPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={transferByBankPie} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => name + ": R$ " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                  />
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => "R$ " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                  <Legend formatter={legendWithPct(transferByBankPie)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">{t("common.noData")}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Recent Activity - bottom, columns of 10 */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>{t("dashboard.recentActivity")}</Typography>
          <Box sx={{ display: "flex", gap: 0 }}>
            {Array.from({ length: Math.ceil(data.recent_activity.length / 10) }, (_, col) => (
              <List key={col} dense sx={{ flex: "0 0 auto", minWidth: 300 }}>
                {data.recent_activity.slice(col * 10, (col + 1) * 10).map((item) => (
                  <ListItem key={item.type + "-" + item.date + "-" + item.description}>
                    <ListItemText
                      primary={item.description + " — R$ " + Number(item.amount_brl).toFixed(2)}
                      secondary={t("common.types." + item.type) + " • " + item.date}
                    />
                  </ListItem>
                ))}
              </List>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
