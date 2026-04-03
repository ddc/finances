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
import DataGridExport from "../components/DataGridExport";
import type { Transfer, Deposit } from "../types";

const BANKS = ["SANTANDER"] as const;

const BANK_COLORS: Record<string, string> = {
  SANTANDER: "#3b82f6",
};

const EMPTY_FORM = {
  transfer_date: "",
  deposit: "",
  bank_name: "SANTANDER" as string,
  amount_brl: "",
};

export default function Transfers() {
  const { t } = useTranslation();
  const monthKeys = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const MONTH_NAMES = monthKeys.map(k => t(`months.${k}`));

  const { isAdmin } = useAuth();
  const currentYear = new Date().getFullYear();
  const [rows, setRows] = useState<Transfer[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [yearFilter, setYearFilter] = useState(String(currentYear));
  const [monthFilter, setMonthFilter] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    if (yearFilter) params.year = yearFilter;
    if (monthFilter) params.month = monthFilter;
    if (bankFilter) params.bank_name = bankFilter;
    listTransfers(params).then(setRows);
  }, [yearFilter, monthFilter, bankFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { listDeposits().then(setDeposits); }, []);

  const depositLabel = (id: string) => {
    const d = deposits.find((dep) => dep.id === id);
    return d ? `${d.invoice_number} (${d.deposit_date})` : id;
  };

  const handleOpen = (transfer?: Transfer) => {
    if (transfer) {
      setEditingId(transfer.id);
      setForm({
        transfer_date: transfer.transfer_date,
        deposit: transfer.deposit,
        bank_name: transfer.bank_name,
        amount_brl: String(transfer.amount_brl),
      });
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      transfer_date: form.transfer_date,
      deposit: form.deposit,
      bank_name: form.bank_name as Transfer["bank_name"],
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
    { field: "bank_name", headerName: t("transfers.bank"), flex: 1 },
    { field: "amount_brl", headerName: t("transfers.amountBrl"), flex: 1, type: "number" },
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
  const bankTotals = BANKS.map((bank) => ({
    name: bank,
    value: rows.filter((r) => r.bank_name === bank).reduce((sum, r) => sum + Number(r.amount_brl), 0),
    color: BANK_COLORS[bank] || "#94a3b8",
  })).filter((d) => d.value > 0);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">
          {t("transfers.title")}{monthFilter ? ` — ${MONTH_NAMES[Number(monthFilter) - 1]}` : ""}{yearFilter ? ` ${yearFilter}` : ""}
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
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t("filters.bank")}</InputLabel>
            <Select value={bankFilter} label={t("filters.bank")} onChange={(e) => setBankFilter(e.target.value)}>
              <MenuItem value="">{t("filters.all")}</MenuItem>
              {BANKS.map((b) => (
                <MenuItem key={b} value={b}>{b}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
              {t("transfers.addTransfer")}
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
            <Typography color="text.secondary" variant="body2">{t("transfers.total")}</Typography>
            <Typography variant="h6" sx={{ color: "#3b82f6" }}>
              R$ {rows.reduce((sum, r) => sum + Number(r.amount_brl), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
        <DataGridExport rows={rows} columns={columns.filter((c) => c.field !== "actions")} filename="transfers" />
      </Box>

      {monthFilter && bankTotals.length > 0 && (
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
                  {bankTotals.map((entry, i) => (
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
        <DialogTitle>{editingId ? t("transfers.editTransfer") : t("transfers.addTransfer")}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label={t("transfers.transferDate")} type="date" value={form.transfer_date}
            onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl fullWidth>
            <InputLabel>{t("transfers.deposit")}</InputLabel>
            <Select value={form.deposit} label={t("transfers.deposit")} onChange={(e) => setForm({ ...form, deposit: e.target.value })}>
              {deposits.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.invoice_number} ({d.deposit_date})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>{t("transfers.bank")}</InputLabel>
            <Select value={form.bank_name} label={t("transfers.bank")} onChange={(e) => setForm({ ...form, bank_name: e.target.value })}>
              {BANKS.map((b) => (
                <MenuItem key={b} value={b}>{b}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label={t("transfers.amountBrl")} type="number" value={form.amount_brl}
            onChange={(e) => setForm({ ...form, amount_brl: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleSave}>{t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
        <DialogContent>
          <Typography>{t("deleteConfirm.transfer")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{t("common.cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>{t("common.delete")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
