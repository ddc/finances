import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
  Card, CardContent,
} from "@mui/material";
import { Add, Edit, Delete, Description } from "@mui/icons-material";
import { PieChart, Pie, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import type { GridColDef } from "@mui/x-data-grid";
import StyledDataGrid from "../components/StyledDataGrid";
import { useAuth } from "../hooks/useAuth";
import { listExpenses, createExpense, updateExpense, deleteExpense } from "../api/expenses";
import { listExpenseCategories } from "../api/lookups";
import DataGridExport from "../components/DataGridExport";
import { MonthFilter, YearFilter } from "../components/PageFilters";
import DeleteDialog from "../components/DeleteDialog";
import PageHeader from "../components/PageHeader";
import type { Expense, ExpenseCategory } from "../types";

const DYNAMIC_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#f97316", "#f59e0b", "#ec4899", "#14b8a6"];

const today = () => new Date().toISOString().split("T")[0];
const EMPTY_FORM = () => ({ expense_date: today(), category: "" as string, description: "", amount: "" });

export default function Expenses() {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "pt-BR" ? "pt-BR" : "en-US";
  const formatNumber = (value: number) => Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 });

  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM());
  const [submitted, setSubmitted] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => { listExpenseCategories().then(setCategories); }, []);

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
      const defaultCat = categories.find((c) => c.code === "OTHER");
      setForm({ ...EMPTY_FORM(), category: defaultCat ? defaultCat.id : (categories[0]?.id || "") });
    }
    setSubmitted(false);
    setReceiptFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (!form.expense_date || !form.category || !form.amount) return;
    const selectedCat = categories.find((c) => c.id === form.category);
    if (selectedCat?.code === "OTHER" && !form.description) return;
    const payload = {
      expense_date: form.expense_date,
      category: form.category,
      description: form.description,
      amount: Number(form.amount),
    };
    if (editingId) {
      await updateExpense(editingId, payload, receiptFile || undefined);
    } else {
      await createExpense(payload, receiptFile || undefined);
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

  const selectedCatCode = categories.find((c) => c.id === form.category)?.code;

  const columns: GridColDef[] = [
    { field: "expense_date", headerName: t("expenses.date"), flex: 1 },
    { field: "category_label", headerName: t("expenses.category"), flex: 1 },
    { field: "description", headerName: t("expenses.description"), flex: 2 },
    { field: "amount", headerName: t("expenses.amount"), flex: 1, type: "number", valueFormatter: (value: number) => formatNumber(Number(value)) },
    {
      field: "actions",
      headerName: t("common.actions"),
      width: isAdmin ? 150 : 60,
      sortable: false,
      filterable: false,
      renderCell: (params: { row: Expense }) => (
        <>
          {params.row.has_receipt_file && (
            <IconButton size="small" title={t("expenses.receiptFile")} onClick={() => window.open(`/api/v1/expenses/${params.row.id}/file/`, "_blank")}>
              <Description fontSize="small" color="info" />
            </IconButton>
          )}
          {isAdmin && (
            <>
              <IconButton size="small" onClick={() => handleOpen(params.row)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" color="error" onClick={() => setDeleteId(params.row.id)}><Delete fontSize="small" /></IconButton>
            </>
          )}
        </>
      ),
    } as GridColDef,
  ];

  // Pie chart data: breakdown by category
  const pieData = categories.map((cat, i) => ({
    name: cat.label,
    value: rows.filter((r) => r.category_code === cat.code).reduce((sum, r) => sum + Number(r.amount), 0),
    fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length],
  })).filter((d) => d.value > 0);

  return (
    <Box>
      <PageHeader title={t("expenses.title")} monthFilter={monthFilter} yearFilter={yearFilter}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t("filters.category")}</InputLabel>
          <Select value={categoryFilter} label={t("filters.category")} onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="">{t("filters.all")}</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <MonthFilter value={monthFilter} onChange={setMonthFilter} />
        <YearFilter value={yearFilter} onChange={setYearFilter} />
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            {t("expenses.addExpense")}
          </Button>
        )}
      </PageHeader>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
            <Typography color="text.secondary" variant="body2">{t("expenses.total")}</Typography>
            <Typography variant="h6" sx={{ color: "#ef4444" }}>
              R$ {rows.reduce((sum, r) => sum + Number(r.amount), 0).toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
        {[...categories].sort((a, b) => a.code === "OTHER" ? 1 : b.code === "OTHER" ? -1 : 0).map((cat, i) => {
          const catTotal = rows.filter((r) => r.category_code === cat.code).reduce((sum, r) => sum + Number(r.amount), 0);
          if (catTotal <= 0) return null;
          return (
            <Card key={cat.code} sx={{ minWidth: 200 }}>
              <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                <Typography color="text.secondary" variant="body2">{"Total " + cat.label}</Typography>
                <Typography variant="h6" sx={{ color: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length] }}>
                  R$ {catTotal.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <DataGridExport rows={rows} columns={columns.filter((c) => c.field !== "actions")} filename="expenses" />
        </Box>
      </Box>

      {pieData.length > 0 && (
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
                  label={({ name, value }) => `${name}: R$ ${value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}`}
                />
                <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => "R$ " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                <Legend formatter={(value, entry) => {
                  const total = pieData.reduce((s, d) => s + d.value, 0);
                  const pct = total > 0 ? ((Number((entry.payload as Record<string, unknown>)?.value) / total) * 100).toFixed(1) : "0";
                  return value + " (" + pct + "%)";
                }} />
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
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? t("expenses.editExpense") : t("expenses.addExpense")}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label={t("expenses.date")} type="date" value={form.expense_date}
            onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required error={submitted && !form.expense_date}
          />
          <FormControl fullWidth required error={submitted && !form.category}>
            <InputLabel>{t("expenses.category")}</InputLabel>
            <Select value={form.category} label={t("expenses.category")} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t("expenses.description")} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required={selectedCatCode === "OTHER"}
            error={submitted && selectedCatCode === "OTHER" && !form.description}
          />
          <TextField label={t("expenses.amount")} type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required error={submitted && !form.amount} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button variant="outlined" component="label">
              {t("expenses.uploadReceipt")}
              <input type="file" accept=".pdf" hidden onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} />
            </Button>
            {receiptFile && <Typography variant="body2">{receiptFile.name}</Typography>}
            {!receiptFile && editingId && rows.find((r) => r.id === editingId)?.has_receipt_file && (
              <Typography variant="body2" color="text.secondary">
                Current: Receipt uploaded
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleSave}>{t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog
        open={Boolean(deleteId)}
        message={t("deleteConfirm.expense")}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
