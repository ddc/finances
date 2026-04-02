import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../../hooks/useAuth";
import { ThemeModeContext } from "../../hooks/useThemeMode";
import Layout from "../../components/Layout";

const mockAuth: AuthContextType = {
  user: { id: "1", username: "admin", role: "admin" },
  token: "test-token",
  login: async () => {},
  logout: async () => {},
  isAdmin: true,
};

function renderLayout() {
  return render(
    <ThemeModeContext.Provider value={{ mode: "light", toggleMode: () => {} }}>
      <AuthContext.Provider value={mockAuth}>
        <MemoryRouter>
          <Layout />
        </MemoryRouter>
      </AuthContext.Provider>
    </ThemeModeContext.Provider>
  );
}

describe("Layout", () => {
  it("renders app title", () => {
    renderLayout();
    expect(screen.getByText("Finances")).toBeInTheDocument();
  });

  it("renders all nav items", () => {
    renderLayout();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Expenses")).toBeInTheDocument();
    expect(screen.getByText("Deposits")).toBeInTheDocument();
    expect(screen.getByText("Transfers")).toBeInTheDocument();
    expect(screen.getByText("NFE Samples")).toBeInTheDocument();
  });

  it("renders theme toggle button", () => {
    renderLayout();
    expect(screen.getByTestId("DarkModeIcon")).toBeInTheDocument();
  });

  it("renders user icon button", () => {
    renderLayout();
    expect(screen.getByTestId("AccountCircleIcon")).toBeInTheDocument();
  });
});
