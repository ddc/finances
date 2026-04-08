import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DeleteDialog from "../../components/DeleteDialog";
import { MonthFilter, YearFilter } from "../../components/PageFilters";
import PageHeader from "../../components/PageHeader";

describe("DeleteDialog", () => {
  it("renders message and buttons when open", () => {
    render(<DeleteDialog open={true} message="Delete this item?" onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText("Delete this item?")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("calls onConfirm when delete clicked", () => {
    const onConfirm = vi.fn();
    render(<DeleteDialog open={true} message="Delete?" onClose={vi.fn()} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onClose when cancel clicked", () => {
    const onClose = vi.fn();
    render(<DeleteDialog open={true} message="Delete?" onClose={onClose} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("MonthFilter", () => {
  it("renders month filter", () => {
    const { container } = render(<MonthFilter value="" onChange={vi.fn()} />);
    expect(container.querySelector("label")).toHaveTextContent("Month");
  });
});

describe("YearFilter", () => {
  it("renders year filter", () => {
    const { container } = render(<YearFilter value="" onChange={vi.fn()} />);
    expect(container.querySelector("label")).toHaveTextContent("Year");
  });
});

describe("PageHeader", () => {
  it("renders title with year", () => {
    render(<PageHeader title="Expenses" monthFilter="" yearFilter="2026" />);
    expect(screen.getByText("Expenses 2026")).toBeInTheDocument();
  });

  it("renders title without filters", () => {
    render(<PageHeader title="Expenses" monthFilter="" yearFilter="" />);
    expect(screen.getByText("Expenses")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <PageHeader title="Test" monthFilter="" yearFilter="">
        <button>Add</button>
      </PageHeader>
    );
    expect(screen.getByText("Add")).toBeInTheDocument();
  });
});
