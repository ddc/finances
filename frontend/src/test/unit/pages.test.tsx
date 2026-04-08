import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../../hooks/useAuth";
import { ThemeModeContext } from "../../hooks/useThemeMode";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Expenses from "../../pages/Expenses";
import Deposits from "../../pages/Deposits";
import Transfers from "../../pages/Transfers";
import NfeSamples from "../../pages/NfeSamples";
import Dashboard from "../../pages/Dashboard";
import Login from "../../pages/Login";

const mockLogin = vi.fn();
const mockAuth: AuthContextType = {
  user: { id: "1", username: "admin", role: "admin" },
  token: "test-token",
  login: mockLogin,
  logout: async () => {},
  isAdmin: true,
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeModeContext.Provider value={{ mode: "light", toggleMode: () => {} }}>
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter>{children}</MemoryRouter>
        </AuthContext.Provider>
      </ThemeModeContext.Provider>
    </LocalizationProvider>
  );
}

// --- Mock API modules ---

const mockListExpenses = vi.fn();
const mockCreateExpense = vi.fn().mockResolvedValue({ id: "e2" });
const mockUpdateExpense = vi.fn().mockResolvedValue({ id: "e1" });
const mockDeleteExpense = vi.fn().mockResolvedValue(undefined);

vi.mock("../../api/expenses", () => ({
  listExpenses: (...args: unknown[]) => mockListExpenses(...args),
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
  updateExpense: (...args: unknown[]) => mockUpdateExpense(...args),
  deleteExpense: (...args: unknown[]) => mockDeleteExpense(...args),
}));

const mockListDeposits = vi.fn();
const mockCreateDeposit = vi.fn().mockResolvedValue({ id: "d2" });
const mockUpdateDeposit = vi.fn().mockResolvedValue({ id: "d1" });
const mockDeleteDeposit = vi.fn().mockResolvedValue(undefined);

vi.mock("../../api/deposits", () => ({
  listDeposits: (...args: unknown[]) => mockListDeposits(...args),
  createDeposit: (...args: unknown[]) => mockCreateDeposit(...args),
  updateDeposit: (...args: unknown[]) => mockUpdateDeposit(...args),
  deleteDeposit: (...args: unknown[]) => mockDeleteDeposit(...args),
}));

const mockListTransfers = vi.fn();
const mockCreateTransfer = vi.fn().mockResolvedValue({ id: "t2" });
const mockDeleteTransfer = vi.fn().mockResolvedValue(undefined);

vi.mock("../../api/transfers", () => ({
  listTransfers: (...args: unknown[]) => mockListTransfers(...args),
  createTransfer: (...args: unknown[]) => mockCreateTransfer(...args),
  updateTransfer: vi.fn().mockResolvedValue({ id: "t1" }),
  deleteTransfer: (...args: unknown[]) => mockDeleteTransfer(...args),
}));

const mockListNfeSamples = vi.fn();
const mockCreateNfeSample = vi.fn().mockResolvedValue({ id: "n2" });
const mockUpdateNfeSample = vi.fn().mockResolvedValue({ id: "n1" });
const mockDeleteNfeSample = vi.fn().mockResolvedValue(undefined);

vi.mock("../../api/nfeSamples", () => ({
  listNfeSamples: (...args: unknown[]) => mockListNfeSamples(...args),
  createNfeSample: (...args: unknown[]) => mockCreateNfeSample(...args),
  updateNfeSample: (...args: unknown[]) => mockUpdateNfeSample(...args),
  deleteNfeSample: (...args: unknown[]) => mockDeleteNfeSample(...args),
}));

vi.mock("../../api/lookups", () => ({
  listExpenseCategories: vi.fn().mockResolvedValue([
    { id: "c1", code: "TAXES", label: "Taxes" },
    { id: "c2", code: "OTHER", label: "Other" },
  ]),
  listCurrencies: vi.fn().mockResolvedValue([
    { id: "cu1", code: "USD", label: "US Dollar", symbol: "$" },
    { id: "cu2", code: "EUR", label: "Euro", symbol: "€" },
  ]),
  listBanks: vi.fn().mockResolvedValue([
    { id: "b1", code: "SANTANDER", label: "Santander" },
  ]),
  listCompanies: vi.fn().mockResolvedValue([
    { id: "co1", code: "DEEL", label: "Deel" },
  ]),
}));

const mockGetDashboard = vi.fn();

vi.mock("../../api/dashboard", () => ({
  getDashboard: (...args: unknown[]) => mockGetDashboard(...args),
}));

// --- Test data ---

const EXPENSE_ROW = {
  id: "e1", expense_date: "2026-01-05", category: "c1", category_code: "TAXES",
  category_label: "Taxes", description: "Tax", amount: 100, has_receipt_file: true,
  created_by: "admin", created_at: "2026-01-05", updated_at: "2026-01-05",
};

const DEPOSIT_ROW = {
  id: "d1", deposit_date: "2026-01-02", company: "co1", company_code: "DEEL",
  company_label: "Deel", invoice_number: "INV-001", invoice_issue_date: "2025-12-26",
  period_start: "2025-12-21", period_end: "2025-12-27", currency: "cu1",
  currency_code: "USD", currency_symbol: "$", exchange_rate: 5.28,
  amount_foreign: 1115, amount_brl: 5894, has_nfe_file: true, has_invoice_file: true,
  created_by: "admin", created_at: "2026-01-02", updated_at: "2026-01-02",
};

const TRANSFER_ROW = {
  id: "t1", transfer_date: "2026-01-02", deposit: "d1", bank: "b1",
  bank_code: "SANTANDER", bank_label: "Santander", amount_brl: 5890,
  has_transfer_file: true, created_by: "admin", created_at: "2026-01-02",
  updated_at: "2026-01-02",
};

const NFE_ROW = {
  id: "n1", description: "Test NFE", body: "<xml>test body</xml>",
  created_by: "admin", created_at: "2026-01-01", updated_at: "2026-01-01",
};

const DASHBOARD_DATA = {
  year: 2026, month: null, currency: "USD",
  ptax_compra: "5.70", ptax_venda: "5.71", ptax_data_hora: "2026-04-04 13:09:20",
  summary: {
    income_by_currency: { USD: 1115 }, total_income_brl: 5894,
    total_expenses_brl: 100, total_transferred_brl: 5890, net_balance_brl: -96,
  },
  monthly: [{ month: 1, income_brl: 5894, income_foreign: 1115, expenses_brl: 100, transferred_brl: 5890 }],
  recent_activity: [
    { type: "deposit", description: "Deel INV-001", amount_brl: 5894, date: "2026-01-02" },
    { type: "expense", description: "Taxes", amount_brl: 100, date: "2026-01-05" },
    { type: "transfer", description: "Santander", amount_brl: 5890, date: "2026-01-02" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockListExpenses.mockResolvedValue([EXPENSE_ROW]);
  mockListDeposits.mockResolvedValue([DEPOSIT_ROW]);
  mockListTransfers.mockResolvedValue([TRANSFER_ROW]);
  mockListNfeSamples.mockResolvedValue([NFE_ROW]);
  mockGetDashboard.mockResolvedValue(DASHBOARD_DATA);
});

// ==================== Expenses ====================

describe("Expenses page", () => {
  it("renders data and pie chart", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Taxes")).toBeInTheDocument());
    expect(screen.getByText("Total BRL")).toBeInTheDocument();
  });

  it("opens add dialog and submits", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => screen.getByText("Add Expense"));
    fireEvent.click(screen.getByText("Add Expense"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    // Click save without filling required fields triggers validation
    fireEvent.click(screen.getByText("Save"));
    // amount is empty so createExpense should NOT be called
    expect(mockCreateExpense).not.toHaveBeenCalled();
  });

  it("opens edit dialog on edit icon", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => screen.getByText("Taxes"));
    const editBtns = screen.getAllByTestId("EditIcon");
    fireEvent.click(editBtns[0]);
    await waitFor(() => expect(screen.getByText("Edit Expense")).toBeInTheDocument());
  });

  it("deletes expense", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => screen.getByText("Taxes"));
    fireEvent.click(screen.getAllByTestId("DeleteIcon")[0]);
    await waitFor(() => screen.getByText("Confirm Delete"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(mockDeleteExpense).toHaveBeenCalledWith("e1"));
  });

  it("shows receipt file icon", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => screen.getByText("Taxes"));
    expect(screen.getByTestId("DescriptionIcon")).toBeInTheDocument();
  });

  it("cancels delete dialog", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => screen.getByText("Taxes"));
    fireEvent.click(screen.getAllByTestId("DeleteIcon")[0]);
    await waitFor(() => screen.getByText("Confirm Delete"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(mockDeleteExpense).not.toHaveBeenCalled();
  });
});

// ==================== Deposits ====================

describe("Deposits page", () => {
  it("renders data with currency cards and pie charts", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Total BRL")).toBeInTheDocument());
    expect(screen.getByText("INV-001")).toBeInTheDocument();
  });

  it("opens add dialog", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => screen.getByText("Add Deposit"));
    fireEvent.click(screen.getByText("Add Deposit"));
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("opens edit dialog", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => screen.getByText("INV-001"));
    fireEvent.click(screen.getAllByTestId("EditIcon")[0]);
    await waitFor(() => expect(screen.getByText("Edit Deposit")).toBeInTheDocument());
  });

  it("deletes deposit", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => screen.getByText("INV-001"));
    fireEvent.click(screen.getAllByTestId("DeleteIcon")[0]);
    await waitFor(() => screen.getByText("Confirm Delete"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(mockDeleteDeposit).toHaveBeenCalledWith("d1"));
  });

  it("shows nfe and invoice file icons", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => screen.getByText("INV-001"));
    expect(screen.getByTestId("DescriptionIcon")).toBeInTheDocument();
    expect(screen.getByTestId("ReceiptIcon")).toBeInTheDocument();
  });

  it("submit with empty required fields does not call API", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => screen.getByText("Add Deposit"));
    fireEvent.click(screen.getByText("Add Deposit"));
    fireEvent.click(screen.getByText("Save"));
    expect(mockCreateDeposit).not.toHaveBeenCalled();
  });
});

// ==================== Transfers ====================

describe("Transfers page", () => {
  it("renders data with pie chart", async () => {
    render(<Wrapper><Transfers /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Santander")).toBeInTheDocument());
    expect(screen.getByText("Total BRL")).toBeInTheDocument();
  });

  it("opens add dialog", async () => {
    render(<Wrapper><Transfers /></Wrapper>);
    await waitFor(() => screen.getByText("Add Transfer"));
    fireEvent.click(screen.getByText("Add Transfer"));
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("opens edit dialog", async () => {
    render(<Wrapper><Transfers /></Wrapper>);
    await waitFor(() => screen.getByText("Santander"));
    fireEvent.click(screen.getAllByTestId("EditIcon")[0]);
    await waitFor(() => expect(screen.getByText("Edit Transfer")).toBeInTheDocument());
  });

  it("deletes transfer", async () => {
    render(<Wrapper><Transfers /></Wrapper>);
    await waitFor(() => screen.getByText("Santander"));
    fireEvent.click(screen.getAllByTestId("DeleteIcon")[0]);
    await waitFor(() => screen.getByText("Confirm Delete"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(mockDeleteTransfer).toHaveBeenCalledWith("t1"));
  });

  it("shows transfer file icon", async () => {
    render(<Wrapper><Transfers /></Wrapper>);
    await waitFor(() => screen.getByText("Santander"));
    expect(screen.getByTestId("DescriptionIcon")).toBeInTheDocument();
  });

  it("submit with empty required fields does not call API", async () => {
    render(<Wrapper><Transfers /></Wrapper>);
    await waitFor(() => screen.getByText("Add Transfer"));
    fireEvent.click(screen.getByText("Add Transfer"));
    fireEvent.click(screen.getByText("Save"));
    expect(mockCreateTransfer).not.toHaveBeenCalled();
  });
});

// ==================== NfeSamples ====================

describe("NfeSamples page", () => {
  it("renders data", async () => {
    render(<Wrapper><NfeSamples /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Test NFE")).toBeInTheDocument());
  });

  it("opens add dialog and validates", async () => {
    render(<Wrapper><NfeSamples /></Wrapper>);
    await waitFor(() => screen.getByText("Add NFE Sample"));
    fireEvent.click(screen.getByText("Add NFE Sample"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Save"));
    expect(mockCreateNfeSample).not.toHaveBeenCalled();
  });

  it("opens edit dialog", async () => {
    render(<Wrapper><NfeSamples /></Wrapper>);
    await waitFor(() => screen.getByText("Test NFE"));
    fireEvent.click(screen.getAllByTestId("EditIcon")[0]);
    await waitFor(() => expect(screen.getByText("Edit NFE Sample")).toBeInTheDocument());
  });

  it("deletes nfe sample", async () => {
    render(<Wrapper><NfeSamples /></Wrapper>);
    await waitFor(() => screen.getByText("Test NFE"));
    fireEvent.click(screen.getAllByTestId("DeleteIcon")[0]);
    await waitFor(() => screen.getByText("Confirm Delete"));
    fireEvent.click(screen.getByText("Delete"));
    await waitFor(() => expect(mockDeleteNfeSample).toHaveBeenCalledWith("n1"));
  });
});

// ==================== Dashboard ====================

describe("Dashboard page", () => {
  it("renders with PTAX data and recent activity", async () => {
    render(<Wrapper><Dashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/Dashboard/)).toBeInTheDocument());
    expect(screen.getByText(/PTAX/)).toBeInTheDocument();
    expect(screen.getByText(/5\.70/)).toBeInTheDocument();
    expect(screen.getByText(/5\.71/)).toBeInTheDocument();
  });

  it("renders recent activity items", async () => {
    render(<Wrapper><Dashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/Deel INV-001/)).toBeInTheDocument());
  });

  it("renders without ptax data", async () => {
    mockGetDashboard.mockResolvedValue({
      ...DASHBOARD_DATA,
      ptax_compra: null, ptax_venda: null, ptax_data_hora: null,
    });
    render(<Wrapper><Dashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/Dashboard/)).toBeInTheDocument());
  });

  it("renders with month filter showing pie chart", async () => {
    mockGetDashboard.mockResolvedValue({ ...DASHBOARD_DATA, month: 1 });
    render(<Wrapper><Dashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/Dashboard/)).toBeInTheDocument());
  });

  it("clicks refresh button", async () => {
    render(<Wrapper><Dashboard /></Wrapper>);
    await waitFor(() => screen.getByText(/Dashboard/));
    const refreshBtn = screen.getByTestId("RefreshIcon").closest("button")!;
    fireEvent.click(refreshBtn);
    await waitFor(() => expect(mockGetDashboard).toHaveBeenCalledTimes(2));
  });
});

// ==================== Login ====================

describe("Login page", () => {
  it("renders login form", () => {
    render(<Wrapper><Login /></Wrapper>);
    expect(screen.getByText("Finances")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("submits login form", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    render(<Wrapper><Login /></Wrapper>);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "pass123" } });
    fireEvent.click(screen.getByText("Login"));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith("admin", "pass123"));
  });

  it("shows error on failed login", async () => {
    mockLogin.mockRejectedValueOnce(new Error("bad"));
    render(<Wrapper><Login /></Wrapper>);
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "bad" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByText("Login"));
    await waitFor(() => expect(screen.getByText("Invalid username or password")).toBeInTheDocument());
  });
});
