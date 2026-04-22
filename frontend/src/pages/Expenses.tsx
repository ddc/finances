import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
  Card, CardContent,
} from "@mui/material";
import { Add, Edit, Delete, Description, Receipt, AccountBalance } from "@mui/icons-material";
import { PieChart, Pie, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import type { GridColDef } from "@mui/x-data-grid";
import CurrencyField from "../components/CurrencyField";
import StyledDataGrid from "../components/StyledDataGrid";
import { useAuth } from "../hooks/useAuth";
import { listExpenses, createExpense, updateExpense, deleteExpense } from "../api/expenses";
import { listExpenseCategories, listExpenseSubCategories } from "../api/lookups";
import DataGridExport from "../components/DataGridExport";
import { MonthFilter, YearFilter } from "../components/PageFilters";
import DeleteDialog from "../components/DeleteDialog";
import PageHeader from "../components/PageHeader";
import type { Expense, ExpenseCategory, ExpenseSubCategory } from "../types";
import CurrencyFlag from "../components/CurrencyFlag";
import { sortOptionsOtherLast } from "../utils/i18nHelpers";

const DYNAMIC_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#f97316", "#f59e0b", "#ec4899", "#14b8a6"];

const today = () => new Date().toISOString().split("T")[0];
const EMPTY_FORM = () => ({ expense_date: today(), category: "" as string, sub_category: "" as string, description: "", amount: "" });

export default function Expenses() {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "pt-BR" ? "pt-BR" : "en-US";
  const formatNumber = (value: number) => Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 });

  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ExpenseSubCategory[]>([]);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM());
  const [submitted, setSubmitted] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [nfeFile, setNfeFile] = useState<File | null>(null);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);

  useEffect(() => { listExpenseCategories().then(setCategories); }, []);
  useEffect(() => { listExpenseSubCategories().then(setSubCategories); }, []);

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
      setForm({
        expense_date: expense.expense_date,
        category: expense.category,
        sub_category: expense.sub_category || "",
        description: expense.description,
        amount: String(expense.amount),
      });
    } else {
      setEditingId(null);
      const defaultCat = categories.find((c) => c.code === "OTHER");
      setForm({ ...EMPTY_FORM(), category: defaultCat ? defaultCat.id : (categories[0]?.id || "") });
    }
    setSubmitted(false);
    setReceiptFile(null);
    setNfeFile(null);
    setPaymentReceiptFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (!form.expense_date || !form.category || !form.amount) return;
    const selectedCat = categories.find((c) => c.id === form.category);
    if (selectedCat?.code === "OTHER" && !form.description) return;
    const payload: Partial<Expense> = {
      expense_date: form.expense_date,
      category: form.category,
      sub_category: form.sub_category || null,
      description: form.description,
      amount: Number(form.amount),
    };
    if (editingId) {
      await updateExpense(editingId, payload, receiptFile || undefined, nfeFile || undefined, paymentReceiptFile || undefined);
    } else {
      await createExpense(payload, receiptFile || undefined, nfeFile || undefined, paymentReceiptFile || undefined);
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
  const availableSubCategories = subCategories.filter((s) => s.parent === form.category);

  const categoryName = (code: string, fallback: string) => {
    const key = "expenses.categories." + code;
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const translateCategory = (row: Expense) => categoryName(row.category_code, row.category_label);
  const translateSubCategory = (row: Expense) => row.sub_category_label ?? "";

  const columns: GridColDef[] = [
    { field: "expense_date", headerName: t("expenses.date"), flex: 1 },
    { field: "category_label", headerName: t("expenses.category"), flex: 1, valueGetter: (_value, row: Expense) => translateCategory(row) },
    { field: "sub_category_label", headerName: t("expenses.subCategory"), flex: 2, valueGetter: (_value, row: Expense) => translateSubCategory(row) },
    { field: "description", headerName: t("expenses.description"), flex: 1 },
    { field: "amount", headerName: t("expenses.amount"), flex: 1, type: "number", valueFormatter: (value: number) => formatNumber(Number(value)) },
    {
      field: "actions",
      headerName: t("common.actions"),
      width: isAdmin ? 210 : 130,
      sortable: false,
      filterable: false,
      renderCell: (params: { row: Expense }) => (
        <>
          {params.row.has_receipt_file && (
            <IconButton size="small" title={t("expenses.receiptFile")} onClick={() => window.open(`/api/v1/expenses/${params.row.id}/file/receipt/`, "_blank")}>
              <Description fontSize="small" color="info" />
            </IconButton>
          )}
          {params.row.has_nfe_file && (
            <IconButton size="small" title={t("expenses.nfeFile")} onClick={() => window.open(`/api/v1/expenses/${params.row.id}/file/nfe/`, "_blank")}>
              <Receipt fontSize="small" color="success" />
            </IconButton>
          )}
          {params.row.has_payment_receipt_file && (
            <IconButton size="small" title={t("expenses.paymentReceiptFile")} onClick={() => window.open(`/api/v1/expenses/${params.row.id}/file/payment_receipt/`, "_blank")}>
              <AccountBalance fontSize="small" color="warning" />
            </IconButton>
          )}
          {isAdmin && (
            <>
              <IconButton size="small" title={t("common.edit")} onClick={() => handleOpen(params.row)}><Edit fontSize="small" /></IconButton>
              <IconButton size="small" title={t("common.delete")} color="error" onClick={() => setDeleteId(params.row.id)}><Delete fontSize="small" /></IconButton>
            </>
          )}
        </>
      ),
    } as GridColDef,
  ];

  // Pie chart data: breakdown by category
  const pieData = categories.map((cat, i) => ({
    name: categoryName(cat.code, cat.label),
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
              <MenuItem key={c.id} value={c.id}>{categoryName(c.code, c.label)}</MenuItem>
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
            <Typography color="text.secondary" variant="body2">{t("expenses.total")}{" "}<CurrencyFlag code="BRL" /></Typography>
            <Typography variant="h6" sx={{ color: "#ef4444" }}>
              R$ {rows.reduce((sum, r) => sum + Number(r.amount), 0).toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
        {[...categories].sort((a, b) => {
          if (a.code === "OTHER") return 1;
          if (b.code === "OTHER") return -1;
          return 0;
        }).map((cat, i) => {
          const catTotal = rows.filter((r) => r.category_code === cat.code).reduce((sum, r) => sum + Number(r.amount), 0);
          if (catTotal <= 0) return null;
          return (
            <Card key={cat.code} sx={{ minWidth: 200 }}>
              <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                <Typography color="text.secondary" variant="body2">{"Total " + categoryName(cat.code, cat.label)}</Typography>
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

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("dashboard.expensesByCategory")}</Typography>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
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
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">{t("common.noData")}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>

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
          <DatePicker
            label={t("expenses.date")}
            value={form.expense_date ? dayjs(form.expense_date) : null}
            onChange={(v) => setForm({ ...form, expense_date: v ? v.format("YYYY-MM-DD") : "" })}
            slotProps={{ textField: { required: true, error: submitted && !form.expense_date } }}
          />
          <FormControl fullWidth required error={submitted && !form.category}>
            <InputLabel>{t("expenses.category")}</InputLabel>
            <Select value={form.category} label={t("expenses.category")} onChange={(e) => setForm({ ...form, category: e.target.value, sub_category: "" })}>
              {sortOptionsOtherLast(categories, (c) => c.code, (c) => categoryName(c.code, c.label)).map((c) => (
                <MenuItem key={c.id} value={c.id}>{categoryName(c.code, c.label)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {availableSubCategories.length > 0 && (
            <FormControl fullWidth>
              <InputLabel>{t("expenses.subCategory")}</InputLabel>
              <Select
                value={form.sub_category}
                label={t("expenses.subCategory")}
                onChange={(e) => setForm({ ...form, sub_category: e.target.value })}
              >
                <MenuItem value="">{t("filters.all")}</MenuItem>
                {sortOptionsOtherLast(availableSubCategories, (s) => s.code, (s) => s.label).map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            label={t("expenses.description")} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required={selectedCatCode === "OTHER"}
            error={submitted && selectedCatCode === "OTHER" && !form.description}
          />
          <CurrencyField label={t("expenses.amount")} value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} required error={submitted && !form.amount} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button variant="outlined" component="label">
              {t("expenses.uploadNfe")}
              <input type="file" accept=".pdf" hidden onChange={(e) => setNfeFile(e.target.files?.[0] || null)} />
            </Button>
            {nfeFile && <Typography variant="body2">{nfeFile.name}</Typography>}
            {!nfeFile && editingId && rows.find((r) => r.id === editingId)?.has_nfe_file && (
              <Typography variant="body2" color="text.secondary">
                Current: NFE uploaded
              </Typography>
            )}
          </Box>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button variant="outlined" component="label">
              {t("expenses.uploadPaymentReceipt")}
              <input type="file" accept=".pdf" hidden onChange={(e) => setPaymentReceiptFile(e.target.files?.[0] || null)} />
            </Button>
            {paymentReceiptFile && <Typography variant="body2">{paymentReceiptFile.name}</Typography>}
            {!paymentReceiptFile && editingId && rows.find((r) => r.id === editingId)?.has_payment_receipt_file && (
              <Typography variant="body2" color="text.secondary">
                Current: Payment Receipt uploaded
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
