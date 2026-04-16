import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, IconButton,
  Card, CardContent,
} from "@mui/material";
import { Add, Edit, Delete, Description } from "@mui/icons-material";
import { PieChart, Pie, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import type { GridColDef } from "@mui/x-data-grid";
import CurrencyField from "../components/CurrencyField";
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
import CurrencyFlag from "../components/CurrencyFlag";

const DYNAMIC_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#f97316", "#f59e0b", "#ec4899", "#14b8a6"];

const today = () => new Date().toISOString().split("T")[0];
const EMPTY_FORM = () => ({
  transfer_date: today(),
  deposit: "",
  bank: "" as string,
  amount_brl: "",
});

export default function Transfers() {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "pt-BR" ? "pt-BR" : "en-US";
  const formatNumber = (value: number) => Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 });

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
  const [transferFile, setTransferFile] = useState<File | null>(null);

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

  const companyName = (code: string, fallback: string) => {
    const key = "deposits.companies." + code;
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const depositLabel = (id: string) => {
    const d = deposits.find((dep) => dep.id === id);
    if (!d) return id;
    const company = companyName(d.company_code, d.company_label);
    return company + " - " + d.currency_code + " " + formatNumber(Number(d.amount_foreign)) + " - BRL " + formatNumber(Number(d.amount_brl)) + " - " + d.deposit_date;
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
    setTransferFile(null);
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
      await updateTransfer(editingId, payload, transferFile || undefined);
    } else {
      await createTransfer(payload, transferFile || undefined);
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

  const bankName = (code: string, fallback: string) => {
    const key = "transfers.banks." + code;
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const columns: GridColDef[] = [
    { field: "transfer_date", headerName: t("transfers.transferDate"), flex: 1 },
    { field: "bank_label", headerName: t("transfers.bank"), flex: 1, valueGetter: (_value, row: Transfer) => bankName(row.bank_code, row.bank_label) },
    { field: "amount_brl", headerName: t("transfers.amountBrl"), flex: 1, type: "number", valueFormatter: (value: number) => formatNumber(Number(value)) },
    {
      field: "deposit",
      headerName: t("transfers.deposit"),
      flex: 2,
      valueGetter: (value: string) => depositLabel(value),
    },
    {
      field: "actions",
      headerName: t("common.actions"),
      width: isAdmin ? 150 : 60,
      sortable: false,
      filterable: false,
      renderCell: (params: { row: Transfer }) => (
        <>
          {params.row.has_transfer_file && (
            <IconButton size="small" title={t("transfers.transferFile")} onClick={() => window.open(`/api/v1/transfers/${params.row.id}/file/`, "_blank")}>
              <Description fontSize="small" color="info" />
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

  // Pie chart data: breakdown by bank
  const bankTotals = banks.map((bank, i) => ({
    name: bankName(bank.code, bank.label),
    value: rows.filter((r) => r.bank_code === bank.code).reduce((sum, r) => sum + Number(r.amount_brl), 0),
    fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length],
  })).filter((d) => d.value > 0);

  return (
    <Box>
      <PageHeader title={t("transfers.title")} monthFilter={monthFilter} yearFilter={yearFilter}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t("filters.bank")}</InputLabel>
          <Select value={bankFilter} label={t("filters.bank")} onChange={(e) => setBankFilter(e.target.value)}>
            <MenuItem value="">{t("filters.all")}</MenuItem>
            {banks.map((b) => (
              <MenuItem key={b.id} value={b.id}>{bankName(b.code, b.label)}</MenuItem>
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
            <Typography color="text.secondary" variant="body2">{t("transfers.total")}{" "}<CurrencyFlag code="BRL" /></Typography>
            <Typography variant="h6" sx={{ color: "#22c55e" }}>
              R$ {rows.reduce((sum, r) => sum + Number(r.amount_brl), 0).toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
        {[...banks].sort((a, b) => {
          if (a.code === "OTHER") return 1;
          if (b.code === "OTHER") return -1;
          return 0;
        }).map((bank, i) => {
          const bankTotal = rows.filter((r) => r.bank_code === bank.code).reduce((sum, r) => sum + Number(r.amount_brl), 0);
          if (bankTotal <= 0) return null;
          return (
            <Card key={bank.code} sx={{ minWidth: 200 }}>
              <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                <Typography color="text.secondary" variant="body2">{"Total " + bankName(bank.code, bank.label)}</Typography>
                <Typography variant="h6" sx={{ color: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length] }}>
                  R$ {bankTotal.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
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
            <Typography variant="h6" gutterBottom>{t("dashboard.transfersByBank")}</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bankTotals}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: R$ ${value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}`}
                />
                <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => "R$ " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
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
          <DatePicker
            label={t("transfers.transferDate")}
            value={form.transfer_date ? dayjs(form.transfer_date) : null}
            onChange={(v) => setForm({ ...form, transfer_date: v ? v.format("YYYY-MM-DD") : "" })}
            slotProps={{ textField: { required: true, error: submitted && !form.transfer_date } }}
          />
          <FormControl fullWidth required error={submitted && !form.deposit}>
            <InputLabel>{t("transfers.deposit")}</InputLabel>
            <Select value={form.deposit} label={t("transfers.deposit")} onChange={(e) => setForm({ ...form, deposit: e.target.value })}>
              {deposits.map((d) => (
                <MenuItem key={d.id} value={d.id}>{depositLabel(d.id)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth required error={submitted && !form.bank}>
            <InputLabel>{t("transfers.bank")}</InputLabel>
            <Select value={form.bank} label={t("transfers.bank")} onChange={(e) => setForm({ ...form, bank: e.target.value })}>
              {banks.map((b) => (
                <MenuItem key={b.id} value={b.id}>{bankName(b.code, b.label)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <CurrencyField
            label={t("transfers.amountBrl")} value={form.amount_brl}
            onChange={(v) => setForm({ ...form, amount_brl: v })}
            required error={submitted && !form.amount_brl}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button variant="outlined" component="label">
              {t("transfers.uploadTransfer")}
              <input type="file" accept=".pdf" hidden onChange={(e) => setTransferFile(e.target.files?.[0] || null)} />
            </Button>
            {transferFile && <Typography variant="body2">{transferFile.name}</Typography>}
            {!transferFile && editingId && rows.find((r) => r.id === editingId)?.has_transfer_file && (
              <Typography variant="body2" color="text.secondary">
                Current: Transfer uploaded
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
        message={t("deleteConfirm.transfer")}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
