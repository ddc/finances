import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DataGridExport from "../../src/components/DataGridExport";
import type { GridColDef } from "@mui/x-data-grid";

const mockSave = vi.fn();
vi.mock("jspdf", () => ({
  default: class {
    save = mockSave;
  },
}));
vi.mock("jspdf-autotable", () => ({ default: vi.fn() }));

const columns: GridColDef[] = [
  { field: "name", headerName: "Name" },
  { field: "amount", headerName: "Amount" },
];

const rows = [
  { name: "Test", amount: 100 },
  { name: "Test2", amount: null },
  { name: undefined, amount: true },
];

describe("DataGridExport", () => {
  it("renders CSV, Excel, and PDF export buttons", () => {
    render(<DataGridExport rows={rows} columns={columns} filename="test" />);
    expect(screen.getByText("Export CSV")).toBeInTheDocument();
    expect(screen.getByText("Export Excel")).toBeInTheDocument();
    expect(screen.getByText("Export PDF")).toBeInTheDocument();
  });

  it("exports CSV on click", () => {
    render(<DataGridExport rows={rows} columns={columns} filename="test" />);

    const createObjectURL = vi.fn(() => "blob:test");
    globalThis.URL.createObjectURL = createObjectURL;
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return { set href(_v: string) {}, set download(_v: string) {}, click: clickSpy } as unknown as HTMLAnchorElement;
      }
      return origCreate(tag);
    });

    fireEvent.click(screen.getByText("Export CSV"));
    expect(clickSpy).toHaveBeenCalled();
    expect(createObjectURL).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("exports Excel on click", async () => {
    render(<DataGridExport rows={rows} columns={columns} filename="test" />);

    const createObjectURL = vi.fn(() => "blob:test");
    globalThis.URL.createObjectURL = createObjectURL;
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        return { set href(_v: string) {}, set download(_v: string) {}, click: clickSpy } as unknown as HTMLAnchorElement;
      }
      return origCreate(tag);
    });

    fireEvent.click(screen.getByText("Export Excel"));
    await vi.waitFor(() => expect(clickSpy).toHaveBeenCalled());
    vi.restoreAllMocks();
  });

  it("exports PDF on click", async () => {
    render(<DataGridExport rows={rows} columns={columns} filename="test" />);
    fireEvent.click(screen.getByText("Export PDF"));
    await vi.waitFor(() => expect(mockSave).toHaveBeenCalledWith("test.pdf"));
  });
});
