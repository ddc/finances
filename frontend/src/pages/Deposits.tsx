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
import { listDeposits, createDeposit, updateDeposit, deleteDeposit } from "../api/deposits";
import DataGridExport from "../components/DataGridExport";
import type { Deposit } from "../types";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EMPTY_FORM = {
  deposit_date: "",
  invoice_number: "",
  invoice_issue_date: "",
  period_start: "",
  period_end: "",
  amount_usd: "",
  amount_brl: "",
};

export default function Deposits() {
  const { isAdmin } = useAuth();
  const currentYear = new Date().getFullYear();
  const [rows, setRows] = useState<Deposit[]>([]);
  const [yearFilter, setYearFilter] = useState(String(currentYear));
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
        amount_usd: String(deposit.amount_usd),
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
      amount_usd: Number(form.amount_usd),
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
    { field: "deposit_date", headerName: "Deposit Date", flex: 1 },
    { field: "invoice_issue_date", headerName: "Issue Date", flex: 1 },
    { field: "invoice_number", headerName: "Invoice #", flex: 1 },
    { field: "period_start", headerName: "Period Start", flex: 1 },
    { field: "period_end", headerName: "Period End", flex: 1 },
    { field: "amount_usd", headerName: "Amount (USD)", flex: 1, type: "number" },
    { field: "amount_brl", headerName: "Amount (BRL)", flex: 1, type: "number" },
    ...(isAdmin
      ? [
          {
            field: "actions",
            headerName: "Actions",
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

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5">
          Deposits{monthFilter ? ` — ${MONTH_NAMES[Number(monthFilter) - 1]}` : ""}{yearFilter ? ` ${yearFilter}` : ""}
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
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
              Add Deposit
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Card sx={{ minWidth: 200 }}>
            <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
              <Typography color="text.secondary" variant="body2">Total (USD)</Typography>
              <Typography variant="h6" sx={{ color: "#8b5cf6" }}>
                $ {rows.reduce((sum, r) => sum + Number(r.amount_usd), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ minWidth: 200 }}>
            <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
              <Typography color="text.secondary" variant="body2">Total (BRL)</Typography>
              <Typography variant="h6" sx={{ color: "#6366f1" }}>
                R$ {rows.reduce((sum, r) => sum + Number(r.amount_brl), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <DataGridExport rows={rows} columns={columns.filter((c) => c.field !== "actions")} filename="deposits" />
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
        <DialogTitle>{editingId ? "Edit Deposit" : "Add Deposit"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label="Deposit Date" type="date" value={form.deposit_date}
            onChange={(e) => setForm({ ...form, deposit_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Invoice Number" value={form.invoice_number}
            onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
          />
          <TextField
            label="Invoice Issue Date" type="date" value={form.invoice_issue_date}
            onChange={(e) => setForm({ ...form, invoice_issue_date: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Period Start" type="date" value={form.period_start}
            onChange={(e) => setForm({ ...form, period_start: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Period End" type="date" value={form.period_end}
            onChange={(e) => setForm({ ...form, period_end: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Amount (USD)" type="number" value={form.amount_usd}
            onChange={(e) => setForm({ ...form, amount_usd: e.target.value })}
          />
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
          <Typography>Are you sure you want to delete this deposit?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
