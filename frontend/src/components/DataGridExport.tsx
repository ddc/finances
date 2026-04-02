import { Button, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DataGridExportProps<T extends object> {
  rows: T[];
  columns: GridColDef[];
  filename: string;
}

export default function DataGridExport<T extends object>({ rows, columns, filename }: DataGridExportProps<T>) {
  const headers = columns.map((c) => c.headerName || String(c.field));
  const fields = columns.map((c) => c.field);
  const data = rows as unknown as Record<string, unknown>[];

  const exportCSV = () => {
    const csv = [headers.join(","), ...data.map((r) => fields.map((f) => r[f] ?? "").join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.csv`;
    a.click();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map((r) => Object.fromEntries(fields.map((f, i) => [headers[i], r[f]]))));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, filename);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [headers],
      body: data.map((r) => fields.map((f) => String(r[f] ?? ""))),
    });
    doc.save(`${filename}.pdf`);
  };

  return (
    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
      <Button size="small" variant="outlined" onClick={exportCSV}>Export CSV</Button>
      <Button size="small" variant="outlined" onClick={exportExcel}>Export Excel</Button>
      <Button size="small" variant="outlined" onClick={exportPDF}>Export PDF</Button>
    </Stack>
  );
}
