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
import { listTransfers, createTransfer, updateTransfer, deleteTransfer } from "../api/transfers";
import { listDeposits } from "../api/deposits";
import { listBanks } from "../api/lookups";
import DataGridExport from "../components/DataGridExport";
import { MonthFilter, YearFilter } from "../components/PageFilters";
import DeleteDialog from "../components/DeleteDialog";
import PageHeader from "../components/PageHeader";
import type { Transfer, Deposit, BankOption } from "../types";

const DYNAMIC_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#f97316", "#f59e0b", "#ec4899", "#14b8a6"];

const today = () => new Date().toISOString().split("T")[0];
const EMPTY_FORM = () => ({
  transfer_date: today(),
  deposit: "",
  bank: "" as string,
  amount_brl: "",
});

export default function Transfers() {
  const { t } = useTranslation();

  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Transfer[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM());
  const [submitted, setSubmitted] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { listBanks().then(setBanks); }, []);

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    if (yearFilter) params.year = yearFilter;
    if (monthFilter) params.month = monthFilter;
    if (bankFilter) params.bank = bankFilter;
    listTransfers(params).then(setRows);
  }, [yearFilter, monthFilter, bankFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { listDeposits().then(setDeposits); }, []);

  const depositLabel = (id: string) => {
    const d = deposits.find((dep) => dep.id === id);
    return d ? d.company_label + " - " + d.currency_code + " " + d.amount_foreign + " - " + d.deposit_date : id;
  };

  const handleOpen = (transfer?: Transfer) => {
    if (transfer) {
      setEditingId(transfer.id);
      setForm({
        transfer_date: transfer.transfer_date,
        deposit: transfer.deposit,
        bank: transfer.bank,
        amount_brl: String(transfer.amount_brl),
      });
    } else {
      setEditingId(null);
      const defaultBank = banks[0];
      setForm({ ...EMPTY_FORM(), bank: defaultBank ? defaultBank.id : "" });
    }
    setSubmitted(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (!form.transfer_date || !form.deposit || !form.bank || !form.amount_brl) return;
    const payload = {
      transfer_date: form.transfer_date,
      deposit: form.deposit,
      bank: form.bank,
      amount_brl: Number(form.amount_brl),
    };
    if (editingId) {
      await updateTransfer(editingId, payload);
    } else {
      await createTransfer(payload);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTransfer(deleteId);
      setDeleteId(null);
      load();
    }
  };

  const columns: GridColDef[] = [
    { field: "transfer_date", headerName: t("transfers.transferDate"), flex: 1 },
    { field: "bank_label", headerName: t("transfers.bank"), flex: 1 },
    { field: "amount_brl", headerName: t("transfers.amountBrl"), flex: 1, type: "number", valueFormatter: (value: number) => Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) },
    {
      field: "deposit",
      headerName: t("transfers.deposit"),
      flex: 2,
      valueGetter: (value: string) => depositLabel(value),
    },
    ...(isAdmin
      ? [
          {
            field: "actions",
            headerName: t("common.actions"),
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params: { row: Transfer }) => (
              <>
                <IconButton size="small" onClick={() => handleOpen(params.row)}><Edit fontSize="small" /></IconButton>
                <IconButton size="small" color="error" onClick={() => setDeleteId(params.row.id)}><Delete fontSize="small" /></IconButton>
              </>
            ),
          } as GridColDef,
        ]
      : []),
  ];

  // Pie chart data: breakdown by bank
  const bankTotals = banks.map((bank, i) => ({
    name: bank.label,
    value: rows.filter((r) => r.bank_code === bank.code).reduce((sum, r) => sum + Number(r.amount_brl), 0),
    color: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length],
  })).filter((d) => d.value > 0);

  return (
    <Box>
      <PageHeader title={t("transfers.title")} monthFilter={monthFilter} yearFilter={yearFilter}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t("filters.bank")}</InputLabel>
          <Select value={bankFilter} label={t("filters.bank")} onChange={(e) => setBankFilter(e.target.value)}>
            <MenuItem value="">{t("filters.all")}</MenuItem>
            {banks.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <MonthFilter value={monthFilter} onChange={setMonthFilter} />
        <YearFilter value={yearFilter} onChange={setYearFilter} />
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            {t("transfers.addTransfer")}
          </Button>
        )}
      </PageHeader>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
            <Typography color="text.secondary" variant="body2">{t("transfers.total")}</Typography>
            <Typography variant="h6" sx={{ color: "#22c55e" }}>
              R$ {rows.reduce((sum, r) => sum + Number(r.amount_brl), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
        {[...banks].sort((a, b) => a.code === "OTHER" ? 1 : b.code === "OTHER" ? -1 : 0).map((bank, i) => {
          const bankTotal = rows.filter((r) => r.bank_code === bank.code).reduce((sum, r) => sum + Number(r.amount_brl), 0);
          if (bankTotal <= 0) return null;
          return (
            <Card key={bank.code} sx={{ minWidth: 200 }}>
              <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                <Typography color="text.secondary" variant="body2">{"Total " + bank.label}</Typography>
                <Typography variant="h6" sx={{ color: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length] }}>
                  R$ {bankTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <DataGridExport rows={rows} columns={columns.filter((c) => c.field !== "actions")} filename="transfers" />
        </Box>
      </Box>

      {bankTotals.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("dashboard.overview")}</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bankTotals}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                >
                  {bankTotals.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => "R$ " + Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} />
                <Legend formatter={(value, entry) => {
                  const total = bankTotals.reduce((s, d) => s + d.value, 0);
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
        <DialogTitle>{editingId ? t("transfers.editTransfer") : t("transfers.addTransfer")}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label={t("transfers.transferDate")} type="date" value={form.transfer_date}
            onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required error={submitted && !form.transfer_date}
          />
          <FormControl fullWidth required error={submitted && !form.deposit}>
            <InputLabel>{t("transfers.deposit")}</InputLabel>
            <Select value={form.deposit} label={t("transfers.deposit")} onChange={(e) => setForm({ ...form, deposit: e.target.value })}>
              {deposits.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.company_label} - {d.currency_code} {d.amount_foreign} - {d.deposit_date}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required error={submitted && !form.bank}>
            <InputLabel>{t("transfers.bank")}</InputLabel>
            <Select value={form.bank} label={t("transfers.bank")} onChange={(e) => setForm({ ...form, bank: e.target.value })}>
              {banks.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t("transfers.amountBrl")} type="number" value={form.amount_brl}
            onChange={(e) => setForm({ ...form, amount_brl: e.target.value })}
            required error={submitted && !form.amount_brl}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleSave}>{t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      <DeleteDialog
        open={Boolean(deleteId)}
        message={t("deleteConfirm.transfer")}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
