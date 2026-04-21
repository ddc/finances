import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
  Card, CardContent,
} from "@mui/material";
import { Add, Edit, Delete, Description, Receipt, Remove, AccountBalance } from "@mui/icons-material";
import { PieChart, Pie, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import type { GridColDef } from "@mui/x-data-grid";
import CurrencyField from "../components/CurrencyField";
import StyledDataGrid from "../components/StyledDataGrid";
import { useAuth } from "../hooks/useAuth";
import { listDeposits, createDeposit, updateDeposit, deleteDeposit } from "../api/deposits";
import { listCurrencies, listCompanies } from "../api/lookups";
import DataGridExport from "../components/DataGridExport";
import { MonthFilter, YearFilter } from "../components/PageFilters";
import DeleteDialog from "../components/DeleteDialog";
import PageHeader from "../components/PageHeader";
import type { Deposit, CurrencyOption, CompanyOption } from "../types";
import CurrencyFlag from "../components/CurrencyFlag";
import { currencyColor, DYNAMIC_COLORS, sortByCurrencyOrder } from "../utils/chartColors";
import { translateLabel, buildFilterParams } from "../utils/i18nHelpers";

const today = () => new Date().toISOString().split("T")[0];
const optStr = (val: string | number | null | undefined) => val ? String(val) : "";
const optNum = (val: string) => val ? Number(val) : null;

function formatOptional(value: number, locale: string, decimals: number): string {
  if (value === null || value === undefined) return "";
  return Number(value).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

type DepositForm = ReturnType<typeof EMPTY_FORM>;
function getLocale(lang: string) { return lang === "pt-BR" ? "pt-BR" : "en-US"; }

function buildPayload(form: DepositForm) {
  return {
    deposit_date: form.deposit_date,
    company: form.company,
    invoice_number: form.invoice_number || "",
    invoice_issue_date: form.invoice_issue_date || null,
    period_start: form.period_start || null,
    period_end: form.period_end || null,
    currency: form.currency,
    exchange_rate: optNum(form.exchange_rate),
    exchange_rate_effective: optNum(form.exchange_rate_effective),
    operation_cost: optNum(form.operation_cost),
    financial_operation_tax: optNum(form.financial_operation_tax),
    amount_foreign: Number(form.amount_foreign),
    amount_brl: Number(form.amount_brl),
  };
}

function depositToForm(d: Deposit) {
  return {
    deposit_date: d.deposit_date,
    company: d.company,
    invoice_number: d.invoice_number,
    invoice_issue_date: d.invoice_issue_date || "",
    period_start: d.period_start || "",
    period_end: d.period_end || "",
    currency: d.currency,
    exchange_rate: optStr(d.exchange_rate),
    exchange_rate_effective: optStr(d.exchange_rate_effective),
    operation_cost: optStr(d.operation_cost),
    financial_operation_tax: optStr(d.financial_operation_tax),
    amount_foreign: String(d.amount_foreign),
    amount_brl: String(d.amount_brl),
  };
}
const EMPTY_FORM = () => ({
  deposit_date: today(),
  company: "" as string,
  invoice_number: "",
  invoice_issue_date: "",
  period_start: "",
  period_end: "",
  currency: "" as string,
  exchange_rate: "",
  exchange_rate_effective: "",
  operation_cost: "",
  financial_operation_tax: "",
  amount_foreign: "",
  amount_brl: "",
});

function buildCompanyCurrencyPie(rows: Deposit[], companyName: (code: string, fallback: string) => string) {
  const map = new Map<string, { value: number; symbol: string }>();
  for (const r of rows) {
    const key = companyName(r.company_code, r.company_label) + " (" + r.currency_code + ")";
    const existing = map.get(key);
    map.set(key, { value: (existing?.value ?? 0) + Number(r.amount_foreign), symbol: r.currency_symbol });
  }
  return Array.from(map.entries())
    .map(([name, { value, symbol }], i) => ({ name, value, symbol, fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length] }))
    .filter((d) => d.value > 0);
}

function periodInvalid(start: string, end: string) {
  return !!start && !!end && end < start;
}

const TOGGLEABLE_COLUMNS = [
  "invoice_issue_date",
  "period_start",
  "period_end",
  "exchange_rate_effective",
  "operation_cost",
  "financial_operation_tax",
];

type PieDatum = { name: string; value: number; fill: string; symbol?: string };

type PieCardProps = Readonly<{
  title: string;
  data: PieDatum[];
  numberLocale: string;
  emptyLabel: string;
  label: (p: { name: string; value: number; symbol?: string }) => string;
  tooltipFormatter?: (value: number, symbol: string) => string;
}>;

function PieCard({ title, data, numberLocale, emptyLabel, label, tooltipFormatter }: PieCardProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const fmt = tooltipFormatter ?? ((v) => Number(v).toLocaleString(numberLocale, { minimumFractionDigits: 2 }));
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                label={({ name, value, ...rest }) => label({ name: String(name), value: Number(value), symbol: (rest as unknown as Record<string, string>).symbol })}
              />
              <RechartsTooltip cursor={false} contentStyle={{ backgroundColor: "rgba(55,65,81,0.95)", border: "none", borderRadius: 8, color: "#fff" }} formatter={(value, _name, props) => fmt(Number(value), (props.payload as unknown as Record<string, string>)?.symbol ?? "")} />
              <Legend formatter={(value, entry) => {
                const pct = total > 0 ? ((Number((entry.payload as Record<string, unknown>)?.value) / total) * 100).toFixed(1) : "0";
                return value + " (" + pct + "%)";
              }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ height: 350, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography color="text.secondary">{emptyLabel}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function buildAggregates(
  rows: Deposit[],
  currencies: CurrencyOption[],
  companies: CompanyOption[],
  companyName: (code: string, fallback: string) => string,
  foreignLabel: string,
) {
  const totalBrl = rows.reduce((sum, r) => sum + Number(r.amount_brl), 0);
  const currencyTotals = currencies.map((curr) => ({
    name: curr.code,
    value: rows.filter((r) => r.currency_code === curr.code).reduce((sum, r) => sum + Number(r.amount_foreign), 0),
    fill: currencyColor(curr.code),
    symbol: curr.symbol,
  })).filter((d) => d.value > 0);
  const totalForeign = currencyTotals.reduce((sum, c) => sum + c.value, 0);
  const overviewPieData = [
    { name: foreignLabel, value: totalForeign, fill: "#8b5cf6" },
    { name: "BRL", value: totalBrl, fill: "#22c55e" },
  ].filter((d) => d.value > 0);
  const companyTotalsBrl = companies.map((comp, i) => ({
    name: companyName(comp.code, comp.label),
    value: rows.filter((r) => r.company_code === comp.code).reduce((sum, r) => sum + Number(r.amount_brl), 0),
    fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length],
  })).filter((d) => d.value > 0);
  const companyCurrencyPie = buildCompanyCurrencyPie(rows, companyName);
  const brlByCurrencyPie = currencies.map((curr) => ({
    name: curr.code,
    value: rows.filter((r) => r.currency_code === curr.code).reduce((sum, r) => sum + Number(r.amount_brl), 0),
    fill: currencyColor(curr.code),
  })).filter((d) => d.value > 0);
  const depositsCountPie = companies.map((comp, i) => ({
    name: companyName(comp.code, comp.label),
    value: rows.filter((r) => r.company_code === comp.code).length,
    fill: DYNAMIC_COLORS[i % DYNAMIC_COLORS.length],
  })).filter((d) => d.value > 0);
  return { totalBrl, currencyTotals, overviewPieData, companyTotalsBrl, companyCurrencyPie, brlByCurrencyPie, depositsCountPie };
}

export default function Deposits() {
  const { t, i18n } = useTranslation();
  const numberLocale = getLocale(i18n.language);
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
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [extraColsVisible, setExtraColsVisible] = useState(false);

  useEffect(() => { listCompanies().then(setCompanies); }, []);
  useEffect(() => {
    listCurrencies().then((list) => setCurrencies(sortByCurrencyOrder(list)));
  }, []);

  const load = useCallback(() => {
    listDeposits(buildFilterParams({ year: yearFilter, month: monthFilter })).then(setRows);
  }, [yearFilter, monthFilter]);

  useEffect(() => { load(); }, [load]);

  const getDefaultForm = () => {
    const currId = currencies.find((c) => c.code === "USD")?.id || currencies[0]?.id || "";
    return { ...EMPTY_FORM(), company: companies[0]?.id || "", currency: currId };
  };

  const handleOpen = (deposit?: Deposit) => {
    setEditingId(deposit?.id || null);
    setForm(deposit ? depositToForm(deposit) : getDefaultForm());
    setSubmitted(false);
    setNfeFile(null);
    setInvoiceFile(null);
    setStatementFile(null);
    setDialogOpen(true);
  };

  const isFormValid = () =>
    !!(form.deposit_date && form.company && form.currency && form.amount_foreign && form.amount_brl)
    && !periodInvalid(form.period_start, form.period_end);

  const handleSave = async () => {
    setSubmitted(true);
    if (!isFormValid()) return;
    const payload = buildPayload(form);
    const nfe = nfeFile || undefined;
    const invoice = invoiceFile || undefined;
    const statement = statementFile || undefined;
    if (editingId) await updateDeposit(editingId, payload, nfe, invoice, statement);
    else await createDeposit(payload, nfe, invoice, statement);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDeposit(deleteId);
    setDeleteId(null);
    load();
  };

  const companyName = (code: string, fallback: string) => translateLabel(t, "deposits.companies.", code, fallback);

  const renderActions = (params: { row: Deposit }) => (
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
      {params.row.has_transaction_statement_file && (
        <IconButton size="small" title={t("deposits.transactionStatementFile")} onClick={() => window.open(`/api/v1/deposits/${params.row.id}/file/transaction_statement/`, "_blank")}>
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
  );

  const columns: GridColDef[] = [
    { field: "deposit_date", headerName: t("deposits.depositDate"), flex: 0.9 },
    { field: "invoice_issue_date", headerName: t("deposits.issueDate"), flex: 0.9 },
    { field: "period_start", headerName: t("deposits.periodStart"), flex: 0.9 },
    { field: "period_end", headerName: t("deposits.periodEnd"), flex: 0.9 },
    { field: "company_label", headerName: t("deposits.company"), flex: 1, valueGetter: (_value, row: Deposit) => companyName(row.company_code, row.company_label) },
    { field: "invoice_number", headerName: t("deposits.invoiceNumber"), flex: 0.8 },
    { field: "currency_code", headerName: t("deposits.currency"), flex: 0.6 },
    { field: "exchange_rate", headerName: t("deposits.exchangeRate"), flex: 1, type: "number", valueFormatter: (value: number) => formatOptional(value, numberLocale, 4) },
    { field: "exchange_rate_effective", headerName: t("deposits.exchangeRateEffectiveShort"), flex: 1.1, type: "number", valueFormatter: (value: number) => formatOptional(value, numberLocale, 4) },
    { field: "operation_cost", headerName: t("deposits.operationCost"), flex: 1.2, type: "number", valueFormatter: (value: number) => formatOptional(value, numberLocale, 2) },
    { field: "financial_operation_tax", headerName: t("deposits.financialOperationTaxShort"), flex: 1, type: "number", valueFormatter: (value: number) => formatOptional(value, numberLocale, 2) },
    { field: "amount_foreign", headerName: t("deposits.amountForeign"), flex: 1.2, type: "number", valueFormatter: (value: number) => formatNumber(Number(value)) },
    { field: "amount_brl", headerName: t("deposits.amountBrl"), flex: 1, type: "number", valueFormatter: (value: number) => formatNumber(Number(value)) },
    {
      field: "toggle",
      headerName: "",
      width: 40,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      disableExport: true,
      renderHeader: () => (
        <IconButton
          size="small"
          title={extraColsVisible ? t("deposits.hideExtraColumns") : t("deposits.showExtraColumns")}
          onClick={() => setExtraColsVisible((v) => !v)}
          sx={{ color: "#fff" }}
        >
          {extraColsVisible ? <Remove fontSize="small" /> : <Add fontSize="small" />}
        </IconButton>
      ),
      renderCell: () => null,
    } as GridColDef,
    {
      field: "actions",
      headerName: t("common.actions"),
      width: isAdmin ? 160 : 110,
      sortable: false,
      filterable: false,
      renderCell: renderActions,
    } as GridColDef,
  ];

  const columnVisibilityModel = TOGGLEABLE_COLUMNS.reduce<Record<string, boolean>>(
    (acc, field) => { acc[field] = extraColsVisible; return acc; },
    {},
  );

  const { totalBrl, currencyTotals, overviewPieData, companyTotalsBrl, companyCurrencyPie, brlByCurrencyPie, depositsCountPie } =
    buildAggregates(rows, currencies, companies, companyName, t("deposits.foreignCurrency"));

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
            <Typography color="text.secondary" variant="body2">{t("deposits.totalBrl")}{" "}<CurrencyFlag code="BRL" /></Typography>
            <Typography variant="h6" sx={{ color: "#22c55e" }}>
              R$ {totalBrl.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
        {currencyTotals.map((ct) => (
          <Card key={ct.name} sx={{ minWidth: 160 }}>
            <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
              <Typography color="text.secondary" variant="body2">{"Total " + ct.name}{" "}<CurrencyFlag code={ct.name} /></Typography>
              <Typography variant="h6" sx={{ color: ct.fill }}>
                {ct.symbol} {ct.value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        ))}
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <DataGridExport rows={rows} columns={columns.filter((c) => c.field !== "actions" && c.field !== "toggle")} filename="deposits" />
        </Box>
      </Box>

      {/* Pie charts — 2x2 grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
        <PieCard
          title={t("dashboard.depositsForeignVsBrl")} data={overviewPieData}
          numberLocale={numberLocale} emptyLabel={t("common.noData")}
          label={({ name, value }) => name + ": " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
        />
        <PieCard
          title={t("dashboard.depositsByCurrency")} data={currencyTotals}
          numberLocale={numberLocale} emptyLabel={t("common.noData")}
          label={({ name, value, symbol }) => name + ": " + (symbol ?? "") + " " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
          tooltipFormatter={(v, symbol) => (symbol ?? "") + " " + v.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
        />
        <PieCard
          title={t("dashboard.depositsByCompany")} data={companyTotalsBrl}
          numberLocale={numberLocale} emptyLabel={t("common.noData")}
          label={({ name, value }) => name + ": R$ " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
          tooltipFormatter={(v) => "R$ " + v.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
        />
        <PieCard
          title={t("dashboard.depositsCompanyCurrency")} data={companyCurrencyPie}
          numberLocale={numberLocale} emptyLabel={t("common.noData")}
          label={({ name, value, symbol }) => name + ": " + (symbol ?? "") + " " + Number(value).toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
          tooltipFormatter={(v, symbol) => (symbol ?? "") + " " + v.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
        />
        <PieCard
          title={t("dashboard.brlByCurrency")} data={brlByCurrencyPie}
          numberLocale={numberLocale} emptyLabel={t("common.noData")}
          label={({ name, value }) => name + ": R$ " + value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
          tooltipFormatter={(v) => "R$ " + v.toLocaleString(numberLocale, { minimumFractionDigits: 2 })}
        />
        <PieCard
          title={t("dashboard.depositsCount")} data={depositsCountPie}
          numberLocale={numberLocale} emptyLabel={t("common.noData")}
          label={({ name, value }) => name + ": " + value}
          tooltipFormatter={String}
        />
      </Box>

      <StyledDataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        columnVisibilityModel={columnVisibilityModel}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? t("deposits.editDeposit") : t("deposits.addDeposit")}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <DatePicker
            label={t("deposits.depositDate")}
            value={form.deposit_date ? dayjs(form.deposit_date) : null}
            onChange={(v) => setForm({ ...form, deposit_date: v ? v.format("YYYY-MM-DD") : "" })}
            slotProps={{ textField: { required: true, error: submitted && !form.deposit_date } }}
          />
          <FormControl fullWidth required error={submitted && !form.company}>
            <InputLabel>{t("deposits.company")}</InputLabel>
            <Select value={form.company} label={t("deposits.company")} onChange={(e) => setForm({ ...form, company: e.target.value })}>
              {companies.map((c) => (
                <MenuItem key={c.id} value={c.id}>{companyName(c.code, c.label)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t("deposits.invoiceNumber")} value={form.invoice_number}
            onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
          />
          <DatePicker
            label={t("deposits.issueDate")}
            value={form.invoice_issue_date ? dayjs(form.invoice_issue_date) : null}
            onChange={(v) => setForm({ ...form, invoice_issue_date: v ? v.format("YYYY-MM-DD") : "" })}
          />
          <DatePicker
            label={t("deposits.periodStart")}
            value={form.period_start ? dayjs(form.period_start) : null}
            onChange={(v) => setForm({ ...form, period_start: v ? v.format("YYYY-MM-DD") : "" })}
          />
          <DatePicker
            label={t("deposits.periodEnd")}
            value={form.period_end ? dayjs(form.period_end) : null}
            onChange={(v) => setForm({ ...form, period_end: v ? v.format("YYYY-MM-DD") : "" })}
            minDate={form.period_start ? dayjs(form.period_start) : undefined}
            slotProps={{
              textField: {
                error: submitted && periodInvalid(form.period_start, form.period_end),
                helperText: submitted && periodInvalid(form.period_start, form.period_end) ? t("deposits.periodEndBeforeStart") : "",
              },
            }}
          />
          <FormControl fullWidth required error={submitted && !form.currency}>
            <InputLabel>{t("deposits.currency")}</InputLabel>
            <Select value={form.currency} label={t("deposits.currency")} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
              {currencies.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.code}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <CurrencyField
            label={t("deposits.exchangeRate")} value={form.exchange_rate}
            onChange={(v) => setForm({ ...form, exchange_rate: v })}
            decimalPlaces={4}
          />
          <CurrencyField
            label={t("deposits.exchangeRateEffective")} value={form.exchange_rate_effective}
            onChange={(v) => setForm({ ...form, exchange_rate_effective: v })}
            decimalPlaces={4}
          />
          <CurrencyField
            label={t("deposits.operationCost")} value={form.operation_cost}
            onChange={(v) => setForm({ ...form, operation_cost: v })}
          />
          <CurrencyField
            label={t("deposits.financialOperationTax")} value={form.financial_operation_tax}
            onChange={(v) => setForm({ ...form, financial_operation_tax: v })}
          />
          <CurrencyField
            label={t("deposits.amountForeign")} value={form.amount_foreign}
            onChange={(v) => setForm({ ...form, amount_foreign: v })}
            required error={submitted && !form.amount_foreign}
          />
          <CurrencyField
            label={t("deposits.amountBrl")} value={form.amount_brl}
            onChange={(v) => setForm({ ...form, amount_brl: v })}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button variant="outlined" component="label">
              {t("deposits.uploadTransactionStatement")}
              <input type="file" accept=".pdf" hidden onChange={(e) => setStatementFile(e.target.files?.[0] || null)} />
            </Button>
            {statementFile && <Typography variant="body2">{statementFile.name}</Typography>}
            {!statementFile && editingId && rows.find((r) => r.id === editingId)?.has_transaction_statement_file && (
              <Typography variant="body2" color="text.secondary">
                Current: Transaction Statement uploaded
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
