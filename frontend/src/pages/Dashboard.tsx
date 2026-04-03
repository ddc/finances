import { useState, useEffect, useCallback } from "react";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Grid,
  List, ListItem, ListItemText, Chip, IconButton, Tooltip,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useTranslation } from "react-i18next";
import { getDashboard } from "../api/dashboard";
import type { DashboardData } from "../types";

const PIE_COLORS = ["#6366f1", "#ef4444", "#3b82f6", "#22c55e"];
const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];
const CURRENCY_COLORS: Record<string, string> = {
  USD: "#8b5cf6", EUR: "#6366f1", GBP: "#3b82f6", CAD: "#22c55e", AUD: "#f59e0b",
};

export default function Dashboard() {
  const { t } = useTranslation();
  const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const MONTH_NAMES = monthKeys.map((k) => t(`months.${k}`));

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number | "">("");
  const [currency, setCurrency] = useState("USD");
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchData = useCallback(() => {
    getDashboard(year, month || undefined, currency).then(setData);
  }, [year, month, currency]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!data) return null;

  const filterLabel = month ? `${MONTH_NAMES[month - 1]} ${year}` : `${year}`;

  const pieData = [
    { name: "Income", value: Number(data.summary.total_income_brl) },
    { name: "Expenses", value: Number(data.summary.total_expenses_brl) },
    { name: "Transferred", value: Number(data.summary.total_transferred_brl) },
  ].filter((d) => d.value > 0);

  const barData = data.monthly.map((m) => ({
    name: MONTH_NAMES[m.month - 1],
    Income: Number(m.income_brl),
    Expenses: Number(m.expenses_brl),
    Transferred: Number(m.transferred_brl),
  }));

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5">{t("nav.dashboard")} — {filterLabel}</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {data.ptax_compra && (
            <Chip label={`${currency} ${t("dashboard.buy")}: R$ ${data.ptax_compra}`} color="success" variant="outlined" />
          )}
          {data.ptax_venda && (
            <Chip label={`${currency} ${t("dashboard.sell")}: R$ ${data.ptax_venda}`} color="info" variant="outlined" />
          )}
          <Tooltip title="Refresh">
            <IconButton onClick={fetchData} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>{t("filters.currency")}</InputLabel>
            <Select value={currency} label={t("filters.currency")} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
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
            <Select value={year} label={t("filters.year")} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Row 1: Income by currency */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {CURRENCIES.map((curr) => (
          <Grid key={curr} size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  {t("dashboard.totalIncomeForeign", { currency: curr })}
                </Typography>
                <Typography variant="h5" sx={{ color: CURRENCY_COLORS[curr] }}>
                  {Number(data.summary.income_by_currency[curr] || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Row 2: BRL totals */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: t("dashboard.totalIncomeBrl"), value: data.summary.total_income_brl, color: "#6366f1", prefix: "R$" },
          { label: t("dashboard.totalExpenses"), value: data.summary.total_expenses_brl, color: "#ef4444", prefix: "R$" },
          { label: t("dashboard.totalTransferred"), value: data.summary.total_transferred_brl, color: "#3b82f6", prefix: "R$" },
          { label: t("dashboard.netBalance"), value: data.summary.net_balance_brl, color: "#22c55e", prefix: "R$" },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>{card.label}</Typography>
                <Typography variant="h5" sx={{ color: card.color }}>
                  {card.prefix} {Number(card.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
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
                      label={({ name, value }) => `${name}: R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="Income" fill="#6366f1" />
                    <Bar dataKey="Expenses" fill="#ef4444" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t("dashboard.recentActivity")}</Typography>
              <List dense>
                {data.recent_activity.map((item) => (
                  <ListItem key={`${item.type}-${item.date}-${item.description}`}>
                    <ListItemText
                      primary={`${item.description} — R$ ${Number(item.amount_brl).toFixed(2)}`}
                      secondary={`${item.type} • ${item.date}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
