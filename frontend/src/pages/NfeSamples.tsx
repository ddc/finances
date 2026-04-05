import { useState, useEffect, useCallback } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import type { GridColDef, GridCellParams } from "@mui/x-data-grid";
import StyledDataGrid from "../components/StyledDataGrid";
import { useAuth } from "../hooks/useAuth";
import { listNfeSamples, createNfeSample, updateNfeSample, deleteNfeSample } from "../api/nfeSamples";
import DataGridExport from "../components/DataGridExport";
import { MonthFilter, YearFilter } from "../components/PageFilters";
import DeleteDialog from "../components/DeleteDialog";
import PageHeader from "../components/PageHeader";
import type { NfeSample } from "../types";

const EMPTY_FORM = { description: "", body: "" };

export default function NfeSamples() {
  const { t } = useTranslation();

  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<NfeSample[]>([]);
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [monthFilter, setMonthFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
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
    setSubmitted(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (!form.description || !form.body) return;
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
    { field: "created_at", headerName: t("nfeSamples.created"), flex: 1, valueGetter: (value: string) => value.split("T")[0] },
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
      <PageHeader title={t("nfeSamples.title")} monthFilter={monthFilter} yearFilter={yearFilter}>
        <MonthFilter value={monthFilter} onChange={setMonthFilter} />
        <YearFilter value={yearFilter} onChange={setYearFilter} />
        {isAdmin && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            {t("nfeSamples.addNfe")}
          </Button>
        )}
      </PageHeader>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <DataGridExport rows={rows} columns={columns.filter((c) => c.field !== "actions")} filename="nfe-samples" />
      </Box>

      <StyledDataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
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
            required error={submitted && !form.description}
          />
          <TextField
            label={t("nfeSamples.body")} value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            multiline rows={16}
            placeholder="Paste the full NFE body here..."
            required error={submitted && !form.body}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={handleSave}>{t("common.save")}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <DeleteDialog
        open={Boolean(deleteId)}
        message={t("deleteConfirm.nfe")}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </Box>
  );
}
