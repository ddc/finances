import { describe, it, expect, vi, beforeEach } from "vitest";

describe("API client interceptor", () => {
  let errorHandler: (error: { response?: { status: number }; config?: { url: string } }) => Promise<never>;
  let mockLocalStorage: Record<string, unknown>;

  beforeEach(async () => {
    vi.resetModules();
    mockLocalStorage = {};
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        removeItem: vi.fn((key: string) => { delete mockLocalStorage[key]; }),
        getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
        setItem: vi.fn((key: string, val: unknown) => { mockLocalStorage[key] = val; }),
      },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "location", {
      value: { href: "/" },
      writable: true,
      configurable: true,
    });

    const mockUse = vi.fn();
    vi.doMock("axios", () => ({
      default: {
        create: () => ({
          interceptors: {
            response: { use: mockUse },
          },
        }),
      },
    }));
    await import("../../api/client");
    errorHandler = mockUse.mock.calls[0][1];
  });

  it("redirects on 401 for non-auth-me URLs", async () => {
    try {
      await errorHandler({ response: { status: 401 }, config: { url: "/expenses/" } });
    } catch {
      // expected
    }
    expect(globalThis.localStorage.removeItem).toHaveBeenCalledWith("user");
    expect(globalThis.location.href).toBe("/login");
  });

  it("does not redirect on 401 for /auth/me", async () => {
    try {
      await errorHandler({ response: { status: 401 }, config: { url: "/auth/me" } });
    } catch {
      // expected
    }
    expect(globalThis.localStorage.removeItem).not.toHaveBeenCalled();
  });

  it("rejects non-401 errors without redirect", async () => {
    try {
      await errorHandler({ response: { status: 500 }, config: { url: "/expenses/" } });
    } catch {
      // expected
    }
    expect(globalThis.localStorage.removeItem).not.toHaveBeenCalled();
  });
});
