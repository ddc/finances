import { useTranslation } from "react-i18next";
import { Button, Stack } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";

interface DataGridExportProps<T extends object> {
  readonly rows: T[];
  readonly columns: GridColDef[];
  readonly filename: string;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function DataGridExport<T extends object>({ rows, columns, filename }: DataGridExportProps<T>) {
  const { t } = useTranslation();
  const headers = columns.map((c) => c.headerName || String(c.field));
  const fields = columns.map((c) => c.field);
  const data = rows as unknown as Record<string, unknown>[];

  const getRowValues = (r: Record<string, unknown>) => fields.map((f) => cellToString(r[f]));

  const exportCSV = () => {
    const csv = [headers.join(","), ...data.map((r) => getRowValues(r).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename + ".csv";
    a.click();
  };

  const exportExcel = async () => {
    const ExcelJS = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(filename);
    ws.addRow(headers);
    data.forEach((r) => ws.addRow(getRowValues(r)));
    ws.getRow(1).font = { bold: true };
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename + ".xlsx";
    a.click();
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    autoTable(doc, {
      head: [headers],
      body: data.map((r) => getRowValues(r)),
    });
    doc.save(filename + ".pdf");
  };

  return (
    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
      <Button size="small" variant="outlined" onClick={exportCSV}>{t("common.exportCsv")}</Button>
      <Button size="small" variant="outlined" onClick={exportExcel}>{t("common.exportExcel")}</Button>
      <Button size="small" variant="outlined" onClick={exportPDF}>{t("common.exportPdf")}</Button>
    </Stack>
  );
}
