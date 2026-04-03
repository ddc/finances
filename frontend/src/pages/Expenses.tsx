import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
  Card, CardContent,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import type { GridColDef } from "@mui/x-data-grid";
import StyledDataGrid from "../components/StyledDataGrid";
import { useAuth } from "../hooks/useAuth";
import { listExpenses, createExpense, updateExpense, deleteExpense } from "../api/expenses";
import DataGridExport from "../components/DataGridExport";
import type { Expense } from "../types";

const CATEGORIES = ["IMPOSTOS", "PLANO_SAUDE", "CONTABILIDADE", "OTHER"] as const;

const CATEGORY_COLORS: Record<string, string> = {
  IMPOSTOS: "#6366f1",
  PLANO_SAUDE: "#8b5cf6",
  CONTABILIDADE: "#3b82f6",
  OTHER: "#22c55e",
};

const EMPTY_FORM = { expense_date: "", category: "OTHER" as string, description: "", amount: "" };

export default function Expenses() {
  const { t } = useTranslation();
  const monthKeys = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const MONTH_NAMES = monthKeys.map(k => t(`months.${k}`));

  const categoryLabel = (cat: string) => t(`expenses.categories.${cat}`) || cat;

  const { isAdmin } = useAuth();
  const currentYear = new Date().getFullYear();
  const [rows, setRows] = useState<Expense[]>([]);
  const [yearFilter, setYearFilter] = useState(String(currentYear));
  const [monthFilter, setMonthFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    if (yearFilter) params.year = yearFilter;
    if (monthFilter) params.month = monthFilter;
    if (categoryFilter) params.category = categoryFilter;
    listExpenses(params).then(setRows);
  }, [yearFilter, monthFilter, categoryFilter]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (expense?: Expense) => {
    if (expense) {
      setEditingId(expense.id);
      setForm({ expense_date: expense.expense_date, category: expense.category, description: expense.description, amount: String(expense.amount) });
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      expense_date: form.expense_date,
      category: form.category as Expense["category"],
      description: form.description,
      amount: Number(form.amount),
    };
    if (editingId) {
      await updateExpense(editingId, payload);
    } else {
      await createExpense(payload);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteExpense(deleteId);
      setDeleteId(null);
      load();
    }
  };

  const columns: GridColDef[] = [
    { field: "expense_date", headerName: t("expenses.date"), flex: 1 },
    { field: "category", headerName: t("expenses.category"), flex: 1, valueGetter: (value: string) => categoryLabel(value) },
    { field: "description", headerName: t("expenses.description"), flex: 2 },
    { field: "amount", headerName: t("expenses.amount"), flex: 1, type: "number" },
    ...(isAdmin
      ? [
          {
            field: "actions",
            headerName: t("common.actions"),
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params: { row: Expense }) => (
              <>
                <IconButton size="small" onClick={() => handleOpen(params.row)}><Edit fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => setDeleteId(params.row.id)}><Delete fontSize="small" /></IconButton>
              </>
            ),
          } as GridColDef,
        ]
      : []),
  ];

  // Pie chart data: breakdown by category
  const pieData = CATEGORIES.map((cat) => ({
    name: categoryLabel(cat),
    value: rows.filter((r) => r.category === cat).reduce((sum, r) => sum + Number(r.amount), 0),
    color: CATEGORY_COLORS[cat],
  })).filter((d) => d.value > 0);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">
          {t("expenses.title")}{monthFilter ? ` — ${MONTH_NAMES[Number(monthFilter) - 1]}` : ""}{yearFilter ? ` ${yearFilter}` : ""}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>{t("filters.month")}</InputLabel>
            <Select value={monthFilter} label={t("filters.month")} onChange={(e) => setMonthFilter(e.target.value)}>
              <MenuItem value="">{t("filters.all")}</MenuItem>
              {MONTH_NAMES.map((name, i) => (
                <MenuItem key={i + 1} value={String(i + 1)}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>{t("filters.year")}</InputLabel>
            <Select value={yearFilter} label={t("filters.year")} onChange={(e) => setYearFilter(e.target.value)}>
              <MenuItem value="">{t("filters.all")}</MenuItem>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <MenuItem key={y} value={String(y)}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t("filters.category")}</InputLabel>
            <Select value={categoryFilter} label={t("filters.category")} onChange={(e) => setCategoryFilter(e.target.value)}>
              <MenuItem value="">{t("filters.all")}</MenuItem>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{categoryLabel(c)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
              {t("expenses.addExpense")}
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
            <Typography color="text.secondary" variant="body2">{t("expenses.total")}</Typography>
            <Typography variant="h6" sx={{ color: "#ef4444" }}>
              R$ {rows.reduce((sum, r) => sum + Number(r.amount), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
        <DataGridExport rows={rows} columns={columns.filter((c) => c.field !== "actions")} filename="expenses" />
      </Box>

      {monthFilter && pieData.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("dashboard.overview")}</Typography>
            <ResponsiveContainer width="100%" height={300}>
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
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <StyledDataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? t("expenses.editExpense") : t("expenses.addExpense")}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label={t("expenses.date")} type="date" value={form.expense_date}
            onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl fullWidth>
            <InputLabel>{t("expenses.category")}</InputLabel>
            <Select value={form.category} label={t("expenses.category")} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{categoryLabel(c)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label={t("expenses.description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <TextField label={t("expenses.amount")} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleSave}>{t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
        <DialogContent>
          <Typography>{t("deleteConfirm.expense")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{t("common.cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>{t("common.delete")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
