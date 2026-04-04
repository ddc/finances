import { describe, it, expect, vi, beforeEach } from "vitest";
import client from "../../api/client";
import { login, logout, getMe } from "../../api/auth";
import { listExpenses, createExpense, deleteExpense } from "../../api/expenses";
import { listDeposits, createDeposit } from "../../api/deposits";
import { listTransfers, createTransfer } from "../../api/transfers";
import { listNfeSamples, createNfeSample } from "../../api/nfeSamples";
import { getDashboard } from "../../api/dashboard";

vi.mock("../../api/client", () => ({
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
    mockClient.post.mockResolvedValueOnce({ data: { token: "abc", user: { id: "1", username: "admin", role: "admin" } } });
    const result = await login("admin", "pass");
    expect(mockClient.post).toHaveBeenCalledWith("/auth/login/", { username: "admin", password: "pass" });
    expect(result.token).toBe("abc");
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

  it("createExpense sends payload", async () => {
    const expense = { expense_date: "2026-01-05", category: "cat-uuid-1", amount: 100 };
    mockClient.post.mockResolvedValueOnce({ data: { id: "1", ...expense } });
    const result = await createExpense(expense);
    expect(mockClient.post).toHaveBeenCalledWith("/expenses/", expense);
    expect(result.id).toBe("1");
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

  it("createDeposit sends payload", async () => {
    const deposit = { deposit_date: "2026-01-02", invoice_number: "INV-001" };
    mockClient.post.mockResolvedValueOnce({ data: { id: "1", ...deposit } });
    const result = await createDeposit(deposit);
    expect(mockClient.post).toHaveBeenCalledWith("/deposits/", deposit);
    expect(result.id).toBe("1");
  });
});

describe("Transfers API", () => {
  it("listTransfers with params", async () => {
    mockClient.get.mockResolvedValueOnce({ data: [] });
    await listTransfers({ year: "2026", bank: "some-uuid" });
    expect(mockClient.get).toHaveBeenCalledWith("/transfers/", { params: { year: "2026", bank: "some-uuid" } });
  });

  it("createTransfer sends payload", async () => {
    const transfer = { transfer_date: "2026-01-02", deposit: "dep-1", bank: "bank-uuid-1", amount_brl: 5890 };
    mockClient.post.mockResolvedValueOnce({ data: { id: "1", ...transfer } });
    const result = await createTransfer(transfer);
    expect(mockClient.post).toHaveBeenCalledWith("/transfers/", transfer);
    expect(result.id).toBe("1");
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
});
