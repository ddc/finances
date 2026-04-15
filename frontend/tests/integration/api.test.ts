import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../../src/api/client";
import { login, logout, getMe } from "../../src/api/auth";
import { listExpenses, createExpense, updateExpense, deleteExpense } from "../../src/api/expenses";
import { listDeposits, createDeposit, updateDeposit, deleteDeposit } from "../../src/api/deposits";
import { listTransfers, createTransfer, updateTransfer, deleteTransfer } from "../../src/api/transfers";
import { listNfeSamples, createNfeSample } from "../../src/api/nfeSamples";
import { getDashboard } from "../../src/api/dashboard";
import { listExpenseCategories, listCurrencies, listBanks, listCompanies } from "../../src/api/lookups";

vi.mock("../../src/api/client", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

const mockClient = vi.mocked(client);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Auth API", () => {
  it("login sends username and password", async () => {
    mockClient.post.mockResolvedValueOnce({ data: { user: { id: "1", username: "admin", role: "admin" } } });
    const result = await login("admin", "pass");
    expect(mockClient.post).toHaveBeenCalledWith("/auth/login/", { username: "admin", password: "pass" });
    expect(result.user.username).toBe("admin");
  });

  it("logout calls post", async () => {
    mockClient.post.mockResolvedValueOnce({ data: null });
    await logout();
    expect(mockClient.post).toHaveBeenCalledWith("/auth/logout/");
  });

  it("getMe calls get", async () => {
    mockClient.get.mockResolvedValueOnce({ data: { id: "1", username: "admin", role: "admin" } });
    const user = await getMe();
    expect(mockClient.get).toHaveBeenCalledWith("/auth/me/");
    expect(user.username).toBe("admin");
  });
});

describe("Expenses API", () => {
  it("listExpenses with params", async () => {
    mockClient.get.mockResolvedValueOnce({ data: [] });
    await listExpenses({ year: "2026" });
    expect(mockClient.get).toHaveBeenCalledWith("/expenses/", { params: { year: "2026" } });
  });

  it("createExpense sends FormData", async () => {
    const expense = { expense_date: "2026-01-05", category: "cat-uuid-1", amount: 100 };
    mockClient.post.mockResolvedValueOnce({ data: { id: "1", ...expense } });
    const result = await createExpense(expense);
    expect(mockClient.post).toHaveBeenCalledWith("/expenses/", expect.any(FormData));
    expect(result.id).toBe("1");
  });

  it("createExpense with receipt file", async () => {
    const expense = { expense_date: "2026-01-05", category: "cat-uuid-1", amount: 100 };
    const file = new File(["pdf"], "receipt.pdf", { type: "application/pdf" });
    mockClient.post.mockResolvedValueOnce({ data: { id: "1", ...expense } });
    await createExpense(expense, file);
    const formData = mockClient.post.mock.calls[0][1] as FormData;
    expect(formData.get("receipt_file")).toBeTruthy();
  });

  it("createExpense with nfe file", async () => {
    const expense = { expense_date: "2026-01-05", category: "cat-uuid-1", amount: 100 };
    const nfe = new File(["pdf"], "nfe.pdf", { type: "application/pdf" });
    mockClient.post.mockResolvedValueOnce({ data: { id: "1", ...expense } });
    await createExpense(expense, undefined, nfe);
    const formData = mockClient.post.mock.calls[0][1] as FormData;
    expect(formData.get("nfe_file")).toBeTruthy();
  });

  it("updateExpense sends FormData", async () => {
    const expense = { expense_date: "2026-01-05", category: "cat-uuid-1", amount: 200 };
    mockClient.put.mockResolvedValueOnce({ data: { id: "1", ...expense } });
    const result = await updateExpense("1", expense);
    const call = mockClient.put.mock.calls[0];
    expect(call[0]).toBe("/expenses/1/");
    expect(call[1]).toBeInstanceOf(FormData);
    expect(result.id).toBe("1");
  });

  it("updateExpense with files", async () => {
    const expense = { expense_date: "2026-01-05", category: "cat-uuid-1", amount: 200 };
    const receipt = new File(["pdf"], "receipt.pdf", { type: "application/pdf" });
    const nfe = new File(["pdf"], "nfe.pdf", { type: "application/pdf" });
    mockClient.put.mockResolvedValueOnce({ data: { id: "1", ...expense } });
    await updateExpense("1", expense, receipt, nfe);
    const formData = mockClient.put.mock.calls[0][1] as FormData;
    expect(formData.get("receipt_file")).toBeTruthy();
    expect(formData.get("nfe_file")).toBeTruthy();
  });

  it("deleteExpense sends delete", async () => {
    mockClient.delete.mockResolvedValueOnce({});
    await deleteExpense("abc-123");
    expect(mockClient.delete).toHaveBeenCalledWith("/expenses/abc-123/");
  });
});

describe("Deposits API", () => {
  it("listDeposits with params", async () => {
    mockClient.get.mockResolvedValueOnce({ data: [] });
    await listDeposits({ year: "2026", month: "1" });
    expect(mockClient.get).toHaveBeenCalledWith("/deposits/", { params: { year: "2026", month: "1" } });
  });

  it("createDeposit sends FormData", async () => {
    const deposit = { deposit_date: "2026-01-02", invoice_number: "INV-001" };
    mockClient.post.mockResolvedValueOnce({ data: { id: "1", ...deposit } });
    const result = await createDeposit(deposit);
    expect(mockClient.post).toHaveBeenCalledWith("/deposits/", expect.any(FormData));
    expect(result.id).toBe("1");
  });

  it("createDeposit with files", async () => {
    const deposit = { deposit_date: "2026-01-02" };
    const nfe = new File(["pdf"], "nfe.pdf", { type: "application/pdf" });
    const invoice = new File(["pdf"], "invoice.pdf", { type: "application/pdf" });
    mockClient.post.mockResolvedValueOnce({ data: { id: "1", ...deposit } });
    await createDeposit(deposit, nfe, invoice);
    const formData = mockClient.post.mock.calls[0][1] as FormData;
    expect(formData.get("nfe_file")).toBeTruthy();
    expect(formData.get("invoice_file")).toBeTruthy();
  });

  it("updateDeposit sends FormData", async () => {
    const deposit = { deposit_date: "2026-01-02" };
    mockClient.put.mockResolvedValueOnce({ data: { id: "1", ...deposit } });
    await updateDeposit("1", deposit);
    expect(mockClient.put).toHaveBeenCalledWith("/deposits/1/", expect.any(FormData));
  });

  it("deleteDeposit sends delete", async () => {
    mockClient.delete.mockResolvedValueOnce({});
    await deleteDeposit("dep-123");
    expect(mockClient.delete).toHaveBeenCalledWith("/deposits/dep-123/");
  });
});

describe("Transfers API", () => {
  it("listTransfers with params", async () => {
    mockClient.get.mockResolvedValueOnce({ data: [] });
    await listTransfers({ year: "2026", bank: "some-uuid" });
    expect(mockClient.get).toHaveBeenCalledWith("/transfers/", { params: { year: "2026", bank: "some-uuid" } });
  });

  it("createTransfer sends FormData", async () => {
    const transfer = { transfer_date: "2026-01-02", deposit: "dep-1", bank: "bank-uuid-1", amount_brl: 5890 };
    mockClient.post.mockResolvedValueOnce({ data: { id: "1", ...transfer } });
    const result = await createTransfer(transfer);
    expect(mockClient.post).toHaveBeenCalledWith("/transfers/", expect.any(FormData));
    expect(result.id).toBe("1");
  });

  it("createTransfer with file", async () => {
    const transfer = { transfer_date: "2026-01-02", deposit: "dep-1", bank: "bank-1", amount_brl: 5890 };
    const file = new File(["pdf"], "transfer.pdf", { type: "application/pdf" });
    mockClient.post.mockResolvedValueOnce({ data: { id: "1", ...transfer } });
    await createTransfer(transfer, file);
    const formData = mockClient.post.mock.calls[0][1] as FormData;
    expect(formData.get("transfer_file")).toBeTruthy();
  });

  it("updateTransfer sends FormData", async () => {
    const transfer = { transfer_date: "2026-01-02", deposit: "dep-1", bank: "bank-1", amount_brl: 5900 };
    mockClient.put.mockResolvedValueOnce({ data: { id: "1", ...transfer } });
    await updateTransfer("1", transfer);
    expect(mockClient.put).toHaveBeenCalledWith("/transfers/1/", expect.any(FormData));
  });

  it("deleteTransfer sends delete", async () => {
    mockClient.delete.mockResolvedValueOnce({});
    await deleteTransfer("tr-123");
    expect(mockClient.delete).toHaveBeenCalledWith("/transfers/tr-123/");
  });
});

describe("Lookups API", () => {
  it("listExpenseCategories", async () => {
    mockClient.get.mockResolvedValueOnce({ data: [{ id: "1", code: "TAXES", label: "Taxes" }] });
    const result = await listExpenseCategories();
    expect(mockClient.get).toHaveBeenCalledWith("/expense-categories/");
    expect(result).toHaveLength(1);
  });

  it("listCurrencies", async () => {
    mockClient.get.mockResolvedValueOnce({ data: [{ id: "1", code: "USD", label: "US Dollar", symbol: "$" }] });
    const result = await listCurrencies();
    expect(mockClient.get).toHaveBeenCalledWith("/currencies/");
    expect(result[0].code).toBe("USD");
  });

  it("listBanks", async () => {
    mockClient.get.mockResolvedValueOnce({ data: [{ id: "1", code: "SANTANDER", label: "Santander" }] });
    const result = await listBanks();
    expect(mockClient.get).toHaveBeenCalledWith("/banks/");
    expect(result[0].code).toBe("SANTANDER");
  });

  it("listCompanies", async () => {
    mockClient.get.mockResolvedValueOnce({ data: [{ id: "1", code: "DEEL", label: "Deel" }] });
    const result = await listCompanies();
    expect(mockClient.get).toHaveBeenCalledWith("/companies/");
    expect(result[0].code).toBe("DEEL");
  });
});

describe("NFE Samples API", () => {
  it("listNfeSamples with params", async () => {
    mockClient.get.mockResolvedValueOnce({ data: [] });
    await listNfeSamples({ year: "2026" });
    expect(mockClient.get).toHaveBeenCalledWith("/nfe-samples/", { params: { year: "2026" } });
  });

  it("createNfeSample sends payload", async () => {
    const nfe = { description: "Test NFE", body: "NFE body text" };
    mockClient.post.mockResolvedValueOnce({ data: { id: "1", ...nfe } });
    const result = await createNfeSample(nfe);
    expect(mockClient.post).toHaveBeenCalledWith("/nfe-samples/", nfe);
    expect(result.id).toBe("1");
  });
});

describe("Dashboard API", () => {
  it("getDashboard with year only", async () => {
    mockClient.get.mockResolvedValueOnce({ data: { year: 2026 } });
    await getDashboard(2026);
    expect(mockClient.get).toHaveBeenCalledWith("/dashboard/", { params: { year: 2026 } });
  });

  it("getDashboard with year and month", async () => {
    mockClient.get.mockResolvedValueOnce({ data: { year: 2026, month: 1 } });
    await getDashboard(2026, 1);
    expect(mockClient.get).toHaveBeenCalledWith("/dashboard/", { params: { year: 2026, month: 1 } });
  });

  it("getDashboard with currency", async () => {
    mockClient.get.mockResolvedValueOnce({ data: { year: 2026, currency: "EUR" } });
    await getDashboard(2026, undefined, "EUR");
    expect(mockClient.get).toHaveBeenCalledWith("/dashboard/", { params: { year: 2026, currency: "EUR" } });
  });
});