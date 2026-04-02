import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
  Card, CardContent,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import type { GridColDef } from "@mui/x-data-grid";
import StyledDataGrid from "../components/StyledDataGrid";
import { useAuth } from "../hooks/useAuth";
import { listTransfers, createTransfer, updateTransfer, deleteTransfer } from "../api/transfers";
import { listDeposits } from "../api/deposits";
import DataGridExport from "../components/DataGridExport";
import type { Transfer, Deposit } from "../types";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const BANKS = ["SANTANDER"] as const;

const EMPTY_FORM = {
  transfer_date: "",
  deposit: "",
  bank_name: "SANTANDER" as string,
  amount_brl: "",
};

export default function Transfers() {
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
    { field: "transfer_date", headerName: "Transfer Date", flex: 1 },
    { field: "bank_name", headerName: "Bank", flex: 1 },
    { field: "amount_brl", headerName: "Amount (BRL)", flex: 1, type: "number" },
    {
      field: "deposit",
      headerName: "Deposit",
      flex: 2,
      valueGetter: (value: string) => depositLabel(value),
    },
    ...(isAdmin
      ? [
          {
            field: "actions",
            headerName: "Actions",
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

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">
          Transfers{monthFilter ? ` — ${MONTH_NAMES[Number(monthFilter) - 1]}` : ""}{yearFilter ? ` ${yearFilter}` : ""}
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Month</InputLabel>
            <Select value={monthFilter} label="Month" onChange={(e) => setMonthFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {MONTH_NAMES.map((name, i) => (
                <MenuItem key={i + 1} value={String(i + 1)}>{name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Year</InputLabel>
            <Select value={yearFilter} label="Year" onChange={(e) => setYearFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <MenuItem key={y} value={String(y)}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Bank</InputLabel>
            <Select value={bankFilter} label="Bank" onChange={(e) => setBankFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {BANKS.map((b) => (
                <MenuItem key={b} value={b}>{b}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
              Add Transfer
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
            <Typography color="text.secondary" variant="body2">Total</Typography>
            <Typography variant="h6" sx={{ color: "#3b82f6" }}>
              R$ {rows.reduce((sum, r) => sum + Number(r.amount_brl), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </Typography>
          </CardContent>
        </Card>
        <DataGridExport rows={rows} columns={columns.filter((c) => c.field !== "actions")} filename="transfers" />
      </Box>

      <StyledDataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? "Edit Transfer" : "Add Transfer"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label="Transfer Date" type="date" value={form.transfer_date}
            onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControl fullWidth>
            <InputLabel>Deposit</InputLabel>
            <Select value={form.deposit} label="Deposit" onChange={(e) => setForm({ ...form, deposit: e.target.value })}>
              {deposits.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.invoice_number} ({d.deposit_date})</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Bank</InputLabel>
            <Select value={form.bank_name} label="Bank" onChange={(e) => setForm({ ...form, bank_name: e.target.value })}>
              {BANKS.map((b) => (
                <MenuItem key={b} value={b}>{b}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Amount (BRL)" type="number" value={form.amount_brl}
            onChange={(e) => setForm({ ...form, amount_brl: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this transfer?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
