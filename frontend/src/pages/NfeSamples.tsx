import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import type { GridColDef, GridCellParams } from "@mui/x-data-grid";
import StyledDataGrid from "../components/StyledDataGrid";
import { useAuth } from "../hooks/useAuth";
import { listNfeSamples, createNfeSample, updateNfeSample, deleteNfeSample } from "../api/nfeSamples";
import DataGridExport from "../components/DataGridExport";
import type { NfeSample } from "../types";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EMPTY_FORM = { description: "", body: "" };

export default function NfeSamples() {
  const { isAdmin } = useAuth();
  const currentYear = new Date().getFullYear();
  const [rows, setRows] = useState<NfeSample[]>([]);
  const [yearFilter, setYearFilter] = useState(String(currentYear));
  const [monthFilter, setMonthFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewBody, setPreviewBody] = useState<string | null>(null);

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    if (yearFilter) params.year = yearFilter;
    if (monthFilter) params.month = monthFilter;
    listNfeSamples(params).then(setRows);
  }, [yearFilter, monthFilter]);

  useEffect(() => { load(); }, [load]);

  const handleOpen = (nfe?: NfeSample) => {
    if (nfe) {
      setEditingId(nfe.id);
      setForm({ description: nfe.description, body: nfe.body });
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = { description: form.description, body: form.body };
    if (editingId) {
      await updateNfeSample(editingId, payload);
    } else {
      await createNfeSample(payload);
    }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteNfeSample(deleteId);
      setDeleteId(null);
      load();
    }
  };

  const handleCellDoubleClick = (params: GridCellParams) => {
    if (params.field === "body") {
      const row = rows.find((r) => r.id === params.id);
      if (row) setPreviewBody(row.body);
    }
  };

  const columns: GridColDef[] = [
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "body",
      headerName: "Body",
      flex: 3,
      valueGetter: (value: string) => value.substring(0, 100) + (value.length > 100 ? "..." : ""),
    },
    { field: "created_at", headerName: "Created", flex: 1, valueGetter: (value: string) => new Date(value).toLocaleDateString() },
    ...(isAdmin
      ? [
          {
            field: "actions",
            headerName: "Actions",
            width: 120,
            sortable: false,
            filterable: false,
            renderCell: (params: { row: NfeSample }) => (
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
        <Typography variant="h5">NFE Samples</Typography>
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
              Add NFE
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <DataGridExport rows={rows} columns={columns.filter((c) => c.field !== "actions")} filename="nfe-samples" />
      </Box>

      <StyledDataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        onCellDoubleClick={handleCellDoubleClick}
      />

      {/* Read-only body preview dialog */}
      <Dialog open={previewBody !== null} onClose={() => setPreviewBody(null)} maxWidth="md" fullWidth>
        <DialogTitle>NFE Body</DialogTitle>
        <DialogContent>
          <Box sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "0.9rem", mt: 1 }}>
            {previewBody}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewBody(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? "Edit NFE" : "Add NFE"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            label="Body" value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            multiline rows={16}
            placeholder="Paste the full NFE body here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this NFE?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
