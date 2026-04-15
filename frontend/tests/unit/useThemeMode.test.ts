import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useThemeMode, ThemeModeContext } from "../../src/hooks/useThemeMode";
import { createElement } from "react";

describe("useThemeMode", () => {
  it("returns default light mode", () => {
    const { result } = renderHook(() => useThemeMode());
    expect(result.current.mode).toBe("light");
  });

  it("returns provided mode from context", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(ThemeModeContext.Provider, { value: { mode: "dark", toggleMode: () => {} } }, children);

    const { result } = renderHook(() => useThemeMode(), { wrapper });
    expect(result.current.mode).toBe("dark");
  });
});
