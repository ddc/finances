import { useState, useEffect } from "react";
import {
  Box, Card, CardContent, Typography, FormControl, InputLabel, Select, MenuItem, Grid,
  List, ListItem, ListItemText, Chip,
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { getDashboard } from "../api/dashboard";
import type { DashboardData } from "../types";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#6366f1", "#ef4444", "#3b82f6", "#22c55e"];

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number | "">("");
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    getDashboard(year, month || undefined).then(setData);
  }, [year, month]);

  if (!data) return null;

  const filterLabel = month
    ? `${MONTH_NAMES[month - 1]} ${year}`
    : `${year}`;

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
        <Typography variant="h5">Dashboard — {filterLabel}</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {data.ptax_usd_brl && (
            <Chip label={`PTAX: R$ ${data.ptax_usd_brl.toFixed(2)}`} color="success" variant="outlined" />
          )}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Month</InputLabel>
            <Select value={month} label="Month" onChange={(e) => setMonth(e.target.value as number | "")}>
              <MenuItem value="">All</MenuItem>
              {MONTH_NAMES.map((name, i) => (
                <MenuItem key={i + 1} value={i + 1}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Year</InputLabel>
            <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total Income (USD)", value: data.summary.total_income_usd, color: "#8b5cf6", prefix: "$" },
          { label: "Total Income (BRL)", value: data.summary.total_income_brl, color: "#6366f1", prefix: "R$" },
          { label: "Total Expenses", value: data.summary.total_expenses_brl, color: "#ef4444", prefix: "R$" },
          { label: "Total Transferred", value: data.summary.total_transferred_brl, color: "#3b82f6", prefix: "R$" },
          { label: "Net Balance", value: data.summary.net_balance_brl, color: "#22c55e", prefix: "R$" },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 2.4 }}>
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
              <Typography variant="h6" gutterBottom>Overview</Typography>
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
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                    <Legend />
                  </PieChart>
                ) : (
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
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
              <Typography variant="h6" gutterBottom>Recent Activity</Typography>
              <List dense>
                {data.recent_activity.map((item, i) => (
                  <ListItem key={i}>
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
