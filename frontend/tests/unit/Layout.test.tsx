import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../../src/hooks/useAuth";
import { ThemeModeContext } from "../../src/hooks/useThemeMode";
import Layout from "../../src/components/Layout";

const mockLogout = vi.fn();

const mockAuth: AuthContextType = {
  user: { id: "1", username: "admin", role: "admin" },
  token: "test-token",
  login: async () => {},
  logout: mockLogout,
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

  it("toggles drawer on menu icon click", () => {
    renderLayout();
    const toggleBtn = screen.getByTestId("ChevronLeftIcon").closest("button")!;
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("MenuIcon")).toBeInTheDocument();
  });

  it("opens user menu and shows username", () => {
    renderLayout();
    const userBtn = screen.getByTestId("AccountCircleIcon").closest("button")!;
    fireEvent.click(userBtn);
    expect(screen.getByText("admin (admin)")).toBeInTheDocument();
    expect(screen.getByText("Admin Panel")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls logout when clicking logout menu item", async () => {
    renderLayout();
    const userBtn = screen.getByTestId("AccountCircleIcon").closest("button")!;
    fireEvent.click(userBtn);
    fireEvent.click(screen.getByText("Logout"));
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
  });

  it("opens language menu and shows options", () => {
    renderLayout();
    const langBtn = screen.getByTestId("LanguageIcon").closest("button")!;
    fireEvent.click(langBtn);
    expect(screen.getByText("EN-US")).toBeInTheDocument();
    expect(screen.getByText("PT-BR")).toBeInTheDocument();
  });
});
