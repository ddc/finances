import i18n from "./i18n";
import { useState, useEffect, useMemo } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { I18nextProvider } from "react-i18next";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt-br";
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
    authApi.getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const isAuthenticated = !!user;

  const authValue = useMemo(() => ({
    user,
    token: null,
    isAdmin: user?.role === "admin",
    login: async (username: string, password: string) => {
      const resp = await authApi.login(username, password);
      localStorage.setItem("user", JSON.stringify(resp.user));
      setUser(resp.user);
    },
    logout: async () => {
      try { await authApi.logout(); } catch { /* cookie may already be cleared */ }
      localStorage.removeItem("user");
      setUser(null);
    },
  }), [user]);

  if (loading) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={i18n.language === "pt-BR" ? "pt-br" : "en"}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ThemeModeContext.Provider value={themeModeValue}>
          <AuthContext.Provider value={authValue}>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
                <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
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
      </LocalizationProvider>
    </I18nextProvider>
  );
}
