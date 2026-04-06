import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
  Card, CardContent,
} from "@mui/material";
import { Add, Edit, Delete, Description, Receipt } from "@mui/icons-material";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import type { GridColDef } from "@mui/x-data-grid";
import StyledDataGrid from "../components/StyledDataGrid";
import { useAuth } from "../hooks/useAuth";
import { listDeposits, createDeposit, updateDeposit, deleteDeposit } from "../api/deposits";
import { listCurrencies, listCompanies } from "../api/lookups";
import DataGridExport from "../components/DataGridExport";
import { MonthFilter, YearFilter } from "../components/PageFilters";
import DeleteDialog from "../components/DeleteDialog";
import PageHeader from "../components/PageHeader";
import type { Deposit, CurrencyOption, CompanyOption } from "../types";

const DYNAMIC_COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#f97316", "#f59e0b", "#ec4899", "#14b8a6"];

const today = () => new Date().toISOString().split("T")[0];
const EMPTY_FORM = () => ({
  deposit_date: today(),
  company: "" as string,
  invoice_number: "",
  invoice_issue_date: "",
  period_start: "",
  period_end: "",
  currency: "" as string,
  exchange_rate: "",
  amount_foreign: "",
  amount_brl: "",
});

export default function Deposits() {
  const { t, i18n } = useTranslation();
  const numberLocale = i18n.language === "pt-BR" ? "pt-BR" : "en-US";
  const formatNumber = (value: number) => Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 });

  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Deposit[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM());
  const [submitted, setSubmitted] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [nfeFile, setNfeFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  useEffect(() => { listCompanies().then(setCompanies); }, []);
  useEffect(() => { listCurrencies().then(setCurrencies); }, []);

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
        company: deposit.company,
        invoice_number: deposit.invoice_number,
        invoice_issue_date: deposit.invoice_issue_date || "",
        period_start: deposit.period_start || "",
        period_end: deposit.period_end || "",
        currency: deposit.currency,
        exchange_rate: deposit.exchange_rate ? String(deposit.exchange_rate) : "",
        amount_foreign: String(deposit.amount_foreign),
        amount_brl: String(deposit.amount_brl),
      });
    } else {
      setEditingId(null);
      const defaultCurr = currencies.find((c) => c.code === "USD");
      setForm({ ...EMPTY_FORM(), company: companies[0]?.id || "", currency: defaultCurr ? defaultCurr.id : (currencies[0]?.id || "") });
    }
    setSubmitted(false);
    setNfeFile(null);
    setInvoiceFile(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (!form.deposit_date || !form.company || !form.currency || !form.amount_foreign || !form.amount_brl) return;
    if (form.period_start && form.period_end && form.period_end < form.period_start) return;
    const payload = {
      deposit_date: form.deposit_date,
      company: form.company,
      invoice_number: form.invoice_number || "",
      invoice_issue_date: form.invoice_issue_date || null,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
      currency: form.currency,
      exchange_rate: form.exchange_rate ? Number(form.exchange_rate) : null,
      amount_foreign: Number(form.amount_foreign),
      amount_brl: Number(form.amount_brl),
    };
    if (editingId) {
      await updateDeposit(editingId, payload, nfeFile || undefined, invoiceFile || undefined);
    } else {
      await createDeposit(payload, nfeFile || undefined, invoiceFile || undefined);
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
    { field: "period_start", headerName: t("deposits.periodStart"), flex: 1 },
    { field: "period_end", headerName: t("deposits.periodEnd"), flex: 1 },
    { field: "company_label", headerName: t("deposits.company"), flex: 1 },
    { field: "invoice_number", headerName: t("deposits.invoiceNumber"), flex: 1 },
    { field: "currency_code", headerName: t("deposits.currency"), flex: 0.7 },
    { field: "exchange_rate", headerName: t("deposits.exchangeRate"), flex: 1, type: "number", valueFormatter: (value: number) => value === null || value === undefined ? "" : formatNumber(Number(value)) },
    { field: "amount_foreign", headerName: t("deposits.amountForeign"), flex: 1, type: "number", valueFormatter: (value: number) => formatNumber(Number(value)) },
    { field: "amount_brl", headerName: t("deposits.amountBrl"), flex: 1, type: "number", valueFormatter: (value: number) => formatNumber(Number(value)) },
    {
      field: "actions",
      headerName: t("common.actions"),
      width: isAdmin ? 180 : 100,
      sortable: false,
      filterable: false,
      renderCell: (params: { row: Deposit }) => (
        <>
          {params.row.has_nfe_file && (
            <IconButton size="small" title={t("deposits.nfeFile")} onClick={() => window.open(`/api/v1/deposits/${params.row.id}/file/nfe/`, "_blank")}>
              <Description fontSize="small" color="info" />
            </IconButton>
          )}
          {params.row.has_invoice_file && (
            <IconButton size="small" title={t("deposits.invoiceFile")} onClick={() => window.open(`/api/v1/deposits/${params.row.id}/file/invoice/`, "_blank")}>
              <Receipt fontSize="small" color="success" />
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

  const totalBrl = rows.reduce((sum, r) => sum + Number(r.amount_brl), 0);

  const currencyTotals = currencies.map((curr, i) => ({
    name: curr.code,
    value: rows.filter((r) => r.currency_code === curr.code).reduce((sum, r) => sum + Number(r.amount_foreign), 0),
    color: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length],
    symbol: curr.symbol,
  })).filter((d) => d.value > 0);

  const totalForeign = currencyTotals.reduce((sum, c) => sum + c.value, 0);

  const overviewPieData = [
    { name: t("deposits.totalForeign"), value: totalForeign, color: "#8b5cf6" },
    { name: "BRL", value: totalBrl, color: "#22c55e" },
  ].filter((d) => d.value > 0);

  const companyTotalsBrl = companies.map((comp, i) => ({
    name: comp.label,
    value: rows.filter((r) => r.company_code === comp.code).reduce((sum, r) => sum + Number(r.amount_brl), 0),
    color: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length],
  })).filter((d) => d.value > 0);

  const companyTotalsForeign = companies.map((comp, i) => ({
    name: comp.label,
    value: rows.filter((r) => r.company_code === comp.code).reduce((sum, r) => sum + Number(r.amount_foreign), 0),
    color: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length],
  })).filter((d) => d.value > 0);

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

      {/* Currency amount cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Card sx={{ minWidth: 160 }}>
          <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
            <Typography color="text.secondary" variant="body2">{t("deposits.totalBrl")}</Typography>
            <Typography variant="h6" sx={{ color: "#22c55e" }}>
              R$ {totalBrl.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
        {currencyTotals.map((ct) => (
          <Card key={ct.name} sx={{ minWidth: 160 }}>
            <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
              <Typography color="text.secondary" variant="body2">{"Total " + ct.name}</Typography>
              <Typography variant="h6" sx={{ color: ct.color }}>
                {ct.symbol} {ct.value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        ))}
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <DataGridExport rows={rows} columns={columns.filter((c) => c.field !== "actions")} filename="deposits" />
        </Box>
      </Box>

      {/* Pie charts — 2x2 grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("deposits.totalForeign")} vs BRL</Typography>
            {overviewPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={overviewPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => name + ": " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                  >
                    {overviewPieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                  <Legend formatter={(value, entry) => {
                    const total = overviewPieData.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? ((Number((entry.payload as Record<string, unknown>)?.value) / total) * 100).toFixed(1) : "0";
                    return value + " (" + pct + "%)";
                  }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("filters.currency")}</Typography>
            {currencyTotals.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={currencyTotals} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => name + ": " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                  >
                    {currencyTotals.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                  <Legend formatter={(value, entry) => {
                    const total = currencyTotals.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? ((Number((entry.payload as Record<string, unknown>)?.value) / total) * 100).toFixed(1) : "0";
                    return value + " (" + pct + "%)";
                  }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("deposits.company")} (BRL)</Typography>
            {companyTotalsBrl.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={companyTotalsBrl} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => name + ": R$ " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                  >
                    {companyTotalsBrl.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => "R$ " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                  <Legend formatter={(value, entry) => {
                    const total = companyTotalsBrl.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? ((Number((entry.payload as Record<string, unknown>)?.value) / total) * 100).toFixed(1) : "0";
                    return value + " (" + pct + "%)";
                  }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>{t("deposits.company")} ({t("deposits.totalForeign")})</Typography>
            {companyTotalsForeign.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie data={companyTotalsForeign} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                    label={({ name, value }) => name + ": " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
                  >
                    {companyTotalsForeign.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value) => Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })} />
                  <Legend formatter={(value, entry) => {
                    const total = companyTotalsForeign.reduce((s, d) => s + d.value, 0);
                    const pct = total > 0 ? ((Number((entry.payload as Record<string, unknown>)?.value) / total) * 100).toFixed(1) : "0";
                    return value + " (" + pct + "%)";
                  }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography color="text.secondary">No data</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      <StyledDataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? t("deposits.editDeposit") : t("deposits.addDeposit")}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label={t("deposits.depositDate")} type="date" value={form.deposit_date}
            onChange={(e) => setForm({ ...form, deposit_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required error={submitted && !form.deposit_date}
          />
          <FormControl fullWidth required error={submitted && !form.company}>
            <InputLabel>{t("deposits.company")}</InputLabel>
            <Select value={form.company} label={t("deposits.company")} onChange={(e) => setForm({ ...form, company: e.target.value })}>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
            error={submitted && !!form.period_start && !!form.period_end && form.period_end < form.period_start}
            helperText={submitted && !!form.period_start && !!form.period_end && form.period_end < form.period_start ? "Period end cannot be before period start" : ""}
          />
          <FormControl fullWidth required error={submitted && !form.currency}>
            <InputLabel>{t("deposits.currency")}</InputLabel>
            <Select value={form.currency} label={t("deposits.currency")} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {currencies.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.code}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t("deposits.exchangeRate")} type="number" value={form.exchange_rate}
            onChange={(e) => setForm({ ...form, exchange_rate: e.target.value })}
          />
          <TextField
            label={t("deposits.amountForeign")} type="number" value={form.amount_foreign}
            onChange={(e) => setForm({ ...form, amount_foreign: e.target.value })}
            required error={submitted && !form.amount_foreign}
          />
          <TextField
            label={t("deposits.amountBrl")} type="number" value={form.amount_brl}
            onChange={(e) => setForm({ ...form, amount_brl: e.target.value })}
            required error={submitted && !form.amount_brl}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button variant="outlined" component="label">
              {t("deposits.uploadNfe")}
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
              {t("deposits.uploadInvoice")}
              <input type="file" accept=".pdf" hidden onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)} />
            </Button>
            {invoiceFile && <Typography variant="body2">{invoiceFile.name}</Typography>}
            {!invoiceFile && editingId && rows.find((r) => r.id === editingId)?.has_invoice_file && (
              <Typography variant="body2" color="text.secondary">
                Current: Invoice uploaded
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
        message={t("deleteConfirm.deposit")}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
