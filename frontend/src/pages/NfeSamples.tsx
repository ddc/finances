import { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridCellParams } from "@mui/x-data-grid";
import StyledDataGrid from "../components/StyledDataGrid";
import { useAuth } from "../hooks/useAuth";
import { listNfeSamples, createNfeSample, updateNfeSample, deleteNfeSample } from "../api/nfeSamples";
import DataGridExport from "../components/DataGridExport";
import type { NfeSample } from "../types";

const EMPTY_FORM = { description: "", body: "" };

export default function NfeSamples() {
  const { t } = useTranslation();
  const monthKeys = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const MONTH_NAMES = monthKeys.map(k => t(`months.${k}`));

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
    { field: "description", headerName: t("nfeSamples.description"), flex: 1 },
    {
      field: "body",
      headerName: t("nfeSamples.body"),
      flex: 3,
      valueGetter: (value: string) => value.substring(0, 100) + (value.length > 100 ? "..." : ""),
    },
    { field: "created_at", headerName: t("nfeSamples.created"), flex: 1, valueGetter: (value: string) => new Date(value).toLocaleDateString() },
    ...(isAdmin
      ? [
          {
            field: "actions",
            headerName: t("common.actions"),
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
        <Typography variant="h5">{t("nfeSamples.title")}</Typography>
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
          {isAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
              {t("nfeSamples.addNfe")}
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
        <DialogTitle>{t("nfeSamples.nfeBody")}</DialogTitle>
        <DialogContent>
          <Box sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: "0.9rem", mt: 1 }}>
            {previewBody}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewBody(null)}>{t("common.close")}</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingId ? t("nfeSamples.editNfe") : t("nfeSamples.addNfe")}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          <TextField
            label={t("nfeSamples.description")} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextField
            label={t("nfeSamples.body")} value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            multiline rows={16}
            placeholder="Paste the full NFE body here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleSave}>{t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}>
        <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
        <DialogContent>
          <Typography>{t("deleteConfirm.nfe")}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>{t("common.cancel")}</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>{t("common.delete")}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
