import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth, AuthContext, type AuthContextType } from "../../hooks/useAuth";
import { createElement } from "react";

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used within AuthProvider");
  });

  it("returns context value when inside AuthProvider", () => {
    const mockValue: AuthContextType = {
      user: { id: "1", username: "admin", role: "admin" },
      token: "test-token",
      login: async () => {},
      logout: async () => {},
      isAdmin: true,
    };

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(AuthContext.Provider, { value: mockValue }, children);

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user?.username).toBe("admin");
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.token).toBe("test-token");
  });
});
