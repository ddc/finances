import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../../src/hooks/useAuth";
import { ThemeModeContext } from "../../src/hooks/useThemeMode";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import Expenses from "../../src/pages/Expenses";
import Deposits from "../../src/pages/Deposits";
import Transfers from "../../src/pages/Transfers";
import NfeSamples from "../../src/pages/NfeSamples";
import Dashboard from "../../src/pages/Dashboard";
import Login from "../../src/pages/Login";

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

// noinspection JSUnusedGlobalSymbols
vi.mock("../../src/api/expenses", () => ({
  listExpenses: (...args: unknown[]) => mockListExpenses(...args),
  createExpense: (...args: unknown[]) => mockCreateExpense(...args),
  updateExpense: (...args: unknown[]) => mockUpdateExpense(...args),
  deleteExpense: (...args: unknown[]) => mockDeleteExpense(...args),
}));

const mockListDeposits = vi.fn();
const mockCreateDeposit = vi.fn().mockResolvedValue({ id: "d2" });
const mockDeleteDeposit = vi.fn().mockResolvedValue(undefined);

// noinspection JSUnusedGlobalSymbols
vi.mock("../../src/api/deposits", () => ({
  listDeposits: (...args: unknown[]) => mockListDeposits(...args),
  createDeposit: (...args: unknown[]) => mockCreateDeposit(...args),
  updateDeposit: vi.fn().mockResolvedValue({ id: "d1" }),
  deleteDeposit: (...args: unknown[]) => mockDeleteDeposit(...args),
}));

const mockListTransfers = vi.fn();
const mockCreateTransfer = vi.fn().mockResolvedValue({ id: "t2" });
const mockDeleteTransfer = vi.fn().mockResolvedValue(undefined);

// noinspection JSUnusedGlobalSymbols
vi.mock("../../src/api/transfers", () => ({
  listTransfers: (...args: unknown[]) => mockListTransfers(...args),
  createTransfer: (...args: unknown[]) => mockCreateTransfer(...args),
  updateTransfer: vi.fn().mockResolvedValue({ id: "t1" }),
  deleteTransfer: (...args: unknown[]) => mockDeleteTransfer(...args),
}));

const mockListNfeSamples = vi.fn();
const mockCreateNfeSample = vi.fn().mockResolvedValue({ id: "n2" });
const mockDeleteNfeSample = vi.fn().mockResolvedValue(undefined);

// noinspection JSUnusedGlobalSymbols
vi.mock("../../src/api/nfeSamples", () => ({
  listNfeSamples: (...args: unknown[]) => mockListNfeSamples(...args),
  createNfeSample: (...args: unknown[]) => mockCreateNfeSample(...args),
  updateNfeSample: vi.fn().mockResolvedValue({ id: "n1" }),
  deleteNfeSample: (...args: unknown[]) => mockDeleteNfeSample(...args),
}));

vi.mock("../../src/api/lookups", () => ({
  listExpenseCategories: vi.fn().mockResolvedValue([
    { id: "c1", code: "TAXES", label: "Taxes" },
    { id: "c2", code: "OTHER", label: "Other" },
  ]),
  listExpenseSubCategories: vi.fn().mockResolvedValue([
    { id: "s1", parent: "c1", parent_code: "TAXES", code: "TFE", label: "TFE" },
    { id: "s2", parent: "c1", parent_code: "TAXES", code: "IRPF", label: "IRPF" },
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

// noinspection JSUnusedGlobalSymbols
vi.mock("../../src/api/dashboard", () => ({
  getDashboard: (...args: unknown[]) => mockGetDashboard(...args),
}));

// --- Test data ---

const EXPENSE_ROW = {
  id: "e1", expense_date: "2026-01-05", category: "c1", category_code: "TAXES",
  category_label: "Taxes", sub_category: "s1", sub_category_code: "TFE", sub_category_label: "TFE",
  description: "Tax", amount: 100, has_receipt_file: true,
  has_nfe_file: false, has_payment_receipt_file: true,
  created_by: "admin", created_at: "2026-01-05", updated_at: "2026-01-05",
};

const DEPOSIT_ROW = {
  id: "d1", deposit_date: "2026-01-02", company: "co1", company_code: "DEEL",
  company_label: "Deel", invoice_number: "INV-001",
  period_start: "2025-12-21", period_end: "2025-12-27", currency: "cu1",
  currency_code: "USD", currency_symbol: "$", exchange_rate: 5.28,
  exchange_rate_effective: 5.2834, operation_cost: 12.50, financial_operation_tax: 3.25,
  amount_foreign: 1115, amount_brl: 5894, has_nfe_file: true, has_invoice_file: true, has_transaction_statement_file: true,
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
  it("renders page with summary cards", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/Total BRL/)).toBeInTheDocument());
    expect(mockListExpenses).toHaveBeenCalled();
  });

  it("opens add dialog and validates required fields", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => screen.getByText("Add Expense"));
    fireEvent.click(screen.getByText("Add Expense"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Save"));
    expect(mockCreateExpense).not.toHaveBeenCalled();
  });

  it("closes dialog on cancel", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => screen.getByText("Add Expense"));
    fireEvent.click(screen.getByText("Add Expense"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(screen.queryByText("Save")).not.toBeInTheDocument());
  });

  it("renders with empty data", async () => {
    mockListExpenses.mockResolvedValue([]);
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Add Expense")).toBeInTheDocument());
  });

  it("calls API on load with filters", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => expect(mockListExpenses).toHaveBeenCalled());
  });

  it("renders Payment Receipt icon for row with has_payment_receipt_file=true", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => expect(mockListExpenses).toHaveBeenCalled());
    expect(await screen.findByTitle("Payment Receipt")).toBeInTheDocument();
  });

  it("shows Payment Receipt upload button in dialog", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => screen.getByText("Add Expense"));
    fireEvent.click(screen.getByText("Add Expense"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Upload Payment Receipt")).toBeInTheDocument();
  });

  it("opens payment_receipt file URL when Payment Receipt icon is clicked", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<Wrapper><Expenses /></Wrapper>);
    const icon = await screen.findByTitle("Payment Receipt");
    fireEvent.click(icon);
    expect(openSpy).toHaveBeenCalledWith(`/api/v1/expenses/${EXPENSE_ROW.id}/file/payment_receipt/`, "_blank");
    openSpy.mockRestore();
  });

  it("submits uploaded payment receipt file to createExpense", async () => {
    mockListExpenses.mockResolvedValue([]);
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => screen.getByText("Add Expense"));
    fireEvent.click(screen.getByText("Add Expense"));
    const dialog = await screen.findByRole("dialog");
    const getInput = (label: string) => within(dialog).getByRole("textbox", { name: new RegExp("^" + label) }) as HTMLInputElement;
    fireEvent.change(getInput("Description"), { target: { value: "Office supplies" } });
    fireEvent.change(getInput("Amount BRL"), { target: { value: "99.00" } });
    fireEvent.blur(getInput("Amount BRL"));
    const uploadBtn = within(dialog).getByText("Upload Payment Receipt");
    const fileInput = uploadBtn.parentElement!.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "payment.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(within(dialog).getByText("payment.pdf")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByText("Save"));
    await waitFor(() => expect(mockCreateExpense).toHaveBeenCalled());
    const callArgs = mockCreateExpense.mock.calls[0];
    expect(callArgs[3]).toBe(file);
  });

  it("shows 'Current: Payment Receipt uploaded' when editing an expense that has one", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => expect(mockListExpenses).toHaveBeenCalled());
    fireEvent.click(await screen.findByTitle("Edit"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Current: Payment Receipt uploaded/)).toBeInTheDocument();
  });

  it("shows Sub-Category field label when editing an expense in TAXES category", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => expect(mockListExpenses).toHaveBeenCalled());
    fireEvent.click(await screen.findByTitle("Edit"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByText("Sub-Category").length).toBeGreaterThan(0);
  });

  it("renders Sub-Category column and shows the row's sub_category label", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => expect(mockListExpenses).toHaveBeenCalled());
    expect(await screen.findByText("Sub-Category")).toBeInTheDocument();
    expect(await screen.findAllByText(EXPENSE_ROW.sub_category_label)).not.toHaveLength(0);
  });

  it("submits sub_category in payload when saving an edited expense", async () => {
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => expect(mockListExpenses).toHaveBeenCalled());
    fireEvent.click(await screen.findByTitle("Edit"));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByText("Save"));
    await waitFor(() => expect(mockUpdateExpense).toHaveBeenCalled());
    const payload = mockUpdateExpense.mock.calls[0][1];
    expect(payload.sub_category).toBe(EXPENSE_ROW.sub_category);
  });

  it("omits sub_category (sends null) when editing an expense without one", async () => {
    mockListExpenses.mockResolvedValue([{ ...EXPENSE_ROW, sub_category: null, sub_category_code: null, sub_category_label: null }]);
    render(<Wrapper><Expenses /></Wrapper>);
    await waitFor(() => expect(mockListExpenses).toHaveBeenCalled());
    fireEvent.click(await screen.findByTitle("Edit"));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByText("Save"));
    await waitFor(() => expect(mockUpdateExpense).toHaveBeenCalled());
    const payload = mockUpdateExpense.mock.calls[0][1];
    expect(payload.sub_category).toBeNull();
  });
});

// ==================== Deposits ====================

describe("Deposits page", () => {
  it("renders page with currency cards", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/Total BRL/)).toBeInTheDocument());
    expect(mockListDeposits).toHaveBeenCalled();
  });

  it("opens add dialog and validates", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => screen.getByText("Add Deposit"));
    fireEvent.click(screen.getByText("Add Deposit"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Save"));
    expect(mockCreateDeposit).not.toHaveBeenCalled();
  });

  it("closes dialog on cancel", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => screen.getByText("Add Deposit"));
    fireEvent.click(screen.getByText("Add Deposit"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(screen.queryByText("Save")).not.toBeInTheDocument());
  });

  it("renders with empty data", async () => {
    mockListDeposits.mockResolvedValue([]);
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Add Deposit")).toBeInTheDocument());
  });

  it("renders datagrid with all columns including VET and Operation Cost", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/Total BRL/)).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Show extra columns"));
    expect(screen.getByText(/Effective Ex/)).toBeInTheDocument();
    expect(screen.getByText(/Operation Cost/)).toBeInTheDocument();
  });

  it("renders with deposit missing new optional fields", async () => {
    mockListDeposits.mockResolvedValue([{ ...DEPOSIT_ROW, exchange_rate_effective: null, operation_cost: null, financial_operation_tax: null, exchange_rate: null }]);
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/Total BRL/)).toBeInTheDocument());
  });

  it("fills add form and saves with exchange_rate_effective and operation_cost", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => screen.getByText("Add Deposit"));
    fireEvent.click(screen.getByText("Add Deposit"));
    const dialog = await screen.findByRole("dialog");
    const getInput = (label: string) => within(dialog).getByRole("textbox", { name: new RegExp("^" + label) }) as HTMLInputElement;
    fireEvent.change(getInput("Amount Foreign"), { target: { value: "1000.00" } });
    fireEvent.blur(getInput("Amount Foreign"));
    fireEvent.change(getInput("Amount BRL"), { target: { value: "5000.00" } });
    fireEvent.blur(getInput("Amount BRL"));
    fireEvent.change(getInput("Exchange Rate"), { target: { value: "5.0000" } });
    fireEvent.blur(getInput("Exchange Rate"));
    fireEvent.change(getInput("Effective Exchange Rate"), { target: { value: "5.1234" } });
    fireEvent.blur(getInput("Effective Exchange Rate"));
    fireEvent.change(getInput("Operation Cost"), { target: { value: "10.50" } });
    fireEvent.blur(getInput("Operation Cost"));
    fireEvent.change(getInput("Financial Operation Tax"), { target: { value: "3.25" } });
    fireEvent.blur(getInput("Financial Operation Tax"));
    fireEvent.click(within(dialog).getByText("Save"));
    await waitFor(() => expect(mockCreateDeposit).toHaveBeenCalled());
    const payload = mockCreateDeposit.mock.calls[0][0];
    expect(payload.exchange_rate_effective).toBe(5.1234);
    expect(payload.operation_cost).toBe(10.5);
    expect(payload.financial_operation_tax).toBe(3.25);
  });

  it("saves with null optional fields when empty", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => screen.getByText("Add Deposit"));
    fireEvent.click(screen.getByText("Add Deposit"));
    const dialog = await screen.findByRole("dialog");
    const getInput = (label: string) => within(dialog).getByRole("textbox", { name: new RegExp("^" + label) }) as HTMLInputElement;
    fireEvent.change(getInput("Amount Foreign"), { target: { value: "1000.00" } });
    fireEvent.blur(getInput("Amount Foreign"));
    fireEvent.change(getInput("Amount BRL"), { target: { value: "5000.00" } });
    fireEvent.blur(getInput("Amount BRL"));
    fireEvent.click(within(dialog).getByText("Save"));
    await waitFor(() => expect(mockCreateDeposit).toHaveBeenCalled());
    const payload = mockCreateDeposit.mock.calls[0][0];
    expect(payload.exchange_rate_effective).toBeNull();
    expect(payload.operation_cost).toBeNull();
    expect(payload.financial_operation_tax).toBeNull();
  });

  it("renders datagrid with Financial Oper. Tax column", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => expect(screen.getByTitle("Show extra columns")).toBeInTheDocument());
    fireEvent.click(screen.getByTitle("Show extra columns"));
    expect(screen.getByText("Financial Oper. Tax")).toBeInTheDocument();
  });

  it("toggles extra columns on button click", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => expect(screen.getByTitle("Show extra columns")).toBeInTheDocument());
    expect(screen.queryByText("Financial Oper. Tax")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Show extra columns"));
    expect(screen.getByText("Financial Oper. Tax")).toBeInTheDocument();
    fireEvent.click(screen.getByTitle("Hide extra columns"));
    expect(screen.queryByText("Financial Oper. Tax")).not.toBeInTheDocument();
  });

  it("renders Transaction Statement icon for row with has_transaction_statement_file=true", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => expect(mockListDeposits).toHaveBeenCalled());
    expect(await screen.findByTitle("Transaction Statement")).toBeInTheDocument();
  });

  it("shows Transaction Statement upload button in dialog", async () => {
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => screen.getByText("Add Deposit"));
    fireEvent.click(screen.getByText("Add Deposit"));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Upload Transaction Statement")).toBeInTheDocument();
  });

  it("edits a deposit with period_end before period_start, shows helper text and blocks save", async () => {
    mockListDeposits.mockResolvedValue([{ ...DEPOSIT_ROW, period_start: "2025-12-27", period_end: "2025-12-21" }]);
    render(<Wrapper><Deposits /></Wrapper>);
    await waitFor(() => expect(mockListDeposits).toHaveBeenCalled());
    fireEvent.click(screen.getByTitle("Edit"));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByText("Save"));
    expect(mockCreateDeposit).not.toHaveBeenCalled();
    expect(within(dialog).getByText("Period end cannot be before period start")).toBeInTheDocument();
  });
});

// ==================== Transfers ====================

describe("Transfers page", () => {
  it("renders page with summary", async () => {
    render(<Wrapper><Transfers /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/Total BRL/)).toBeInTheDocument());
    expect(mockListTransfers).toHaveBeenCalled();
  });

  it("opens add dialog and validates", async () => {
    render(<Wrapper><Transfers /></Wrapper>);
    await waitFor(() => screen.getByText("Add Transfer"));
    fireEvent.click(screen.getByText("Add Transfer"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Save"));
    expect(mockCreateTransfer).not.toHaveBeenCalled();
  });

  it("closes dialog on cancel", async () => {
    render(<Wrapper><Transfers /></Wrapper>);
    await waitFor(() => screen.getByText("Add Transfer"));
    fireEvent.click(screen.getByText("Add Transfer"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(screen.queryByText("Save")).not.toBeInTheDocument());
  });

  it("renders with empty data", async () => {
    mockListTransfers.mockResolvedValue([]);
    render(<Wrapper><Transfers /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Add Transfer")).toBeInTheDocument());
  });
});

// ==================== NfeSamples ====================

describe("NfeSamples page", () => {
  it("renders page", async () => {
    render(<Wrapper><NfeSamples /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Add NFE Sample")).toBeInTheDocument());
    expect(mockListNfeSamples).toHaveBeenCalled();
  });

  it("opens add dialog and validates", async () => {
    render(<Wrapper><NfeSamples /></Wrapper>);
    await waitFor(() => screen.getByText("Add NFE Sample"));
    fireEvent.click(screen.getByText("Add NFE Sample"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Save"));
    expect(mockCreateNfeSample).not.toHaveBeenCalled();
  });

  it("closes dialog on cancel", async () => {
    render(<Wrapper><NfeSamples /></Wrapper>);
    await waitFor(() => screen.getByText("Add NFE Sample"));
    fireEvent.click(screen.getByText("Add NFE Sample"));
    expect(screen.getByText("Save")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => expect(screen.queryByText("Save")).not.toBeInTheDocument());
  });

  it("renders with empty data", async () => {
    mockListNfeSamples.mockResolvedValue([]);
    render(<Wrapper><NfeSamples /></Wrapper>);
    await waitFor(() => expect(screen.getByText("Add NFE Sample")).toBeInTheDocument());
  });
});

// ==================== Dashboard ====================

describe("Dashboard page", () => {
  it("renders with PTAX data", async () => {
    render(<Wrapper><Dashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/Dashboard/)).toBeInTheDocument());
    expect(screen.getByText(/PTAX/)).toBeInTheDocument();
    expect(screen.getByText(/5\.70/)).toBeInTheDocument();
  });

  it("renders recent activity", async () => {
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

  it("renders with month filter active (pie chart mode)", async () => {
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

  it("renders with empty monthly data", async () => {
    mockGetDashboard.mockResolvedValue({ ...DASHBOARD_DATA, monthly: [], recent_activity: [] });
    render(<Wrapper><Dashboard /></Wrapper>);
    await waitFor(() => expect(screen.getByText(/Dashboard/)).toBeInTheDocument());
  });
});

// ==================== Login ====================

describe("Login page", () => {
  it("renders login form", () => {
    render(<Wrapper><Login /></Wrapper>);
    expect(screen.getByText("Finances")).toBeInTheDocument();
    expect(screen.getByText("Login")).toBeInTheDocument();
  });

  it("submits login form successfully", async () => {
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

  it("toggles remember me", () => {
    render(<Wrapper><Login /></Wrapper>);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });
});
