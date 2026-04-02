import { useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { AuthContext } from "./hooks/useAuth";
import { ThemeModeContext } from "./hooks/useThemeMode";
import type { User } from "./types";
import * as authApi from "./api/auth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import Deposits from "./pages/Deposits";
import Transfers from "./pages/Transfers";
import NfeSamples from "./pages/NfeSamples";

function buildTheme(mode: "light" | "dark") {
  return createTheme({ palette: { mode } });
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"light" | "dark">(
    () => (localStorage.getItem("themeMode") as "light" | "dark") || "light"
  );

  const theme = useMemo(() => buildTheme(mode), [mode]);

  const themeModeValue = useMemo(() => ({
    mode,
    toggleMode: () => {
      setMode((prev) => {
        const next = prev === "light" ? "dark" : "light";
        localStorage.setItem("themeMode", next);
        return next;
      });
    },
  }), [mode]);

  useEffect(() => {
    if (token) {
      authApi.getMe().then(setUser).catch(() => {
        setToken(null);
        localStorage.removeItem("token");
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const authValue = useMemo(() => ({
    user,
    token,
    isAdmin: user?.role === "admin",
    login: async (username: string, password: string) => {
      const resp = await authApi.login(username, password);
      localStorage.setItem("token", resp.token);
      localStorage.setItem("user", JSON.stringify(resp.user));
      setToken(resp.token);
      setUser(resp.user);
    },
    logout: async () => {
      try { await authApi.logout(); } catch { /* token may already be invalid */ }
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    },
  }), [user, token]);

  if (loading) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ThemeModeContext.Provider value={themeModeValue}>
        <AuthContext.Provider value={authValue}>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
              <Route element={token ? <Layout /> : <Navigate to="/login" />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/deposits" element={<Deposits />} />
                <Route path="/transfers" element={<Transfers />} />
                <Route path="/nfe-samples" element={<NfeSamples />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthContext.Provider>
      </ThemeModeContext.Provider>
    </ThemeProvider>
  );
}
