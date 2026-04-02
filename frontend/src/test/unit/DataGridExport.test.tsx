import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import DataGridExport from "../../components/DataGridExport";
import type { GridColDef } from "@mui/x-data-grid";

const columns: GridColDef[] = [
  { field: "name", headerName: "Name" },
  { field: "amount", headerName: "Amount" },
];

const rows = [
  { name: "Test", amount: 100 },
  { name: "Test2", amount: 200 },
];

describe("DataGridExport", () => {
  it("renders CSV, Excel, and PDF export buttons", () => {
    render(<DataGridExport rows={rows} columns={columns} filename="test" />);
    expect(screen.getByText("Export CSV")).toBeInTheDocument();
    expect(screen.getByText("Export Excel")).toBeInTheDocument();
    expect(screen.getByText("Export PDF")).toBeInTheDocument();
  });
});
