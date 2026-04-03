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
import { listDeposits, createDeposit, updateDeposit, deleteDeposit } from "../api/deposits";
import DataGridExport from "../components/DataGridExport";
import { MonthFilter, YearFilter } from "../components/PageFilters";
import DeleteDialog from "../components/DeleteDialog";
import PageHeader from "../components/PageHeader";
import type { Deposit } from "../types";

const DEPOSIT_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

const EMPTY_FORM = {
  deposit_date: "",
  invoice_number: "",
  invoice_issue_date: "",
  period_start: "",
  period_end: "",
  currency: "USD" as string,
  amount_foreign: "",
  amount_brl: "",
};

export default function Deposits() {
  const { t } = useTranslation();

  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Deposit[]>([]);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    if (yearFilter) params.year = yearFilter;
    if (monthFilter) params.month = monthFilter;
    listDeposits(params).then(setRows);
  }, [yearFilter, monthFilter]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (deposit?: Deposit) => {
    if (deposit) {
      setEditingId(deposit.id);
      setForm({
        deposit_date: deposit.deposit_date,
        invoice_number: deposit.invoice_number,
        invoice_issue_date: deposit.invoice_issue_date,
        period_start: deposit.period_start,
        period_end: deposit.period_end,
        currency: deposit.currency,
        amount_foreign: String(deposit.amount_foreign),
        amount_brl: String(deposit.amount_brl),
      });
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      deposit_date: form.deposit_date,
      invoice_number: form.invoice_number,
      invoice_issue_date: form.invoice_issue_date,
      period_start: form.period_start,
      period_end: form.period_end,
      currency: form.currency as Deposit["currency"],
      amount_foreign: Number(form.amount_foreign),
      amount_brl: Number(form.amount_brl),
    };
    if (editingId) {
      await updateDeposit(editingId, payload);
    } else {
      await createDeposit(payload);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDeposit(deleteId);
      setDeleteId(null);
      load();
    }
  };

  const columns: GridColDef[] = [
    { field: "deposit_date", headerName: t("deposits.depositDate"), flex: 1 },
    { field: "invoice_issue_date", headerName: t("deposits.issueDate"), flex: 1 },
    { field: "invoice_number", headerName: t("deposits.invoiceNumber"), flex: 1 },
    { field: "currency", headerName: t("deposits.currency"), flex: 0.5 },
    { field: "period_start", headerName: t("deposits.periodStart"), flex: 1 },
    { field: "period_end", headerName: t("deposits.periodEnd"), flex: 1 },
    { field: "amount_foreign", headerName: t("deposits.amountForeign"), flex: 1, type: "number" },
    { field: "amount_brl", headerName: t("deposits.amountBrl"), flex: 1, type: "number" },
    ...(isAdmin
      ? [
          {
            field: "actions",
            headerName: t("common.actions"),
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params: { row: Deposit }) => (
              <>
                <IconButton size="small" onClick={() => handleOpen(params.row)}><Edit fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => setDeleteId(params.row.id)}><Delete fontSize="small" /></IconButton>
              </>
            ),
          } as GridColDef,
        ]
      : []),
  ];

  // Pie chart data: USD vs BRL totals
  const totalForeign = rows.reduce((sum, r) => sum + Number(r.amount_foreign), 0);
  const totalBrl = rows.reduce((sum, r) => sum + Number(r.amount_brl), 0);
  const pieData = [
    { name: "Foreign", value: totalForeign, color: "#8b5cf6" },
    { name: "BRL", value: totalBrl, color: "#6366f1" },
  ].filter((d) => d.value > 0);

  return (
    <Box>
      <PageHeader title={t("deposits.title")} monthFilter={monthFilter} yearFilter={yearFilter}>
        <MonthFilter value={monthFilter} onChange={setMonthFilter} />
        <YearFilter value={yearFilter} onChange={setYearFilter} />
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            {t("deposits.addDeposit")}
          </Button>
        )}
      </PageHeader>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
              <Typography color="text.secondary" variant="body2">{t("deposits.totalForeign")}</Typography>
              <Typography variant="h6" sx={{ color: "#8b5cf6" }}>
                $ {totalForeign.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
              <Typography color="text.secondary" variant="body2">{t("deposits.totalBrl")}</Typography>
              <Typography variant="h6" sx={{ color: "#6366f1" }}>
                R$ {totalBrl.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <DataGridExport rows={rows} columns={columns.filter((c) => c.field !== "actions")} filename="deposits" />
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
                  label={({ name, value }) => {
                    const prefix = name === "USD" ? "$" : "R$";
                    return `${name}: ${prefix} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                  }}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value, name) => {
                  const prefix = name === "USD" ? "$" : "R$";
                  return `${prefix} ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
                }} />
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
        <DialogTitle>{editingId ? t("deposits.editDeposit") : t("deposits.addDeposit")}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label={t("deposits.depositDate")} type="date" value={form.deposit_date}
            onChange={(e) => setForm({ ...form, deposit_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={t("deposits.invoiceNumber")} value={form.invoice_number}
            onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
          />
          <TextField
            label={t("deposits.issueDate")} type="date" value={form.invoice_issue_date}
            onChange={(e) => setForm({ ...form, invoice_issue_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={t("deposits.periodStart")} type="date" value={form.period_start}
            onChange={(e) => setForm({ ...form, period_start: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label={t("deposits.periodEnd")} type="date" value={form.period_end}
            onChange={(e) => setForm({ ...form, period_end: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl fullWidth>
            <InputLabel>{t("deposits.currency")}</InputLabel>
            <Select value={form.currency} label={t("deposits.currency")} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {DEPOSIT_CURRENCIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t("deposits.amountForeign")} type="number" value={form.amount_foreign}
            onChange={(e) => setForm({ ...form, amount_foreign: e.target.value })}
          />
          <TextField
            label={t("deposits.amountBrl")} type="number" value={form.amount_brl}
            onChange={(e) => setForm({ ...form, amount_brl: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleSave}>{t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog
        open={Boolean(deleteId)}
        message={t("deleteConfirm.deposit")}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
