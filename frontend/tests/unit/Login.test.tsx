import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthContext, type AuthContextType } from "../../src/hooks/useAuth";
import Login from "../../src/pages/Login";

const mockLogin = vi.fn();

const mockAuth: AuthContextType = {
  user: null,
  token: null,
  login: mockLogin,
  logout: async () => {},
  isAdmin: false,
};

function renderLogin() {
  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe("Login", () => {
  it("renders login form with username and password fields", () => {
    renderLogin();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("renders app title", () => {
    renderLogin();
    expect(screen.getByText("Finances")).toBeInTheDocument();
  });

  it("calls login with username and password on submit", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/username/i), "admin");
    await user.type(screen.getByLabelText(/password/i), "admin123");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(mockLogin).toHaveBeenCalledWith("admin", "admin123");
  });

  it("shows error on failed login", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Invalid"));
    renderLogin();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/username/i), "wrong");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText("Invalid username or password")).toBeInTheDocument();
  });
});
