import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import packageJson from "../../package.json";
import { useTranslation } from "react-i18next";
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Tooltip, Divider, Link,
} from "@mui/material";
import {
  Dashboard as DashboardIcon, Receipt, AccountBalance, SwapHoriz,
  Description, AccountCircle, DarkMode, LightMode, Language, AdminPanelSettings,
  Menu as MenuIcon, ChevronLeft, GitHub,
} from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { useThemeMode } from "../hooks/useThemeMode";

const DRAWER_WIDTH = 240;

export default function Layout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const appVersion = packageJson.version;
  const [drawerOpen, setDrawerOpen] = useState(true);

  const navItems = [
    { label: t("nav.dashboard"), path: "/", icon: <DashboardIcon /> },
    { label: t("nav.deposits"), path: "/deposits", icon: <AccountBalance /> },
    { label: t("nav.expenses"), path: "/expenses", icon: <Receipt /> },
    { label: t("nav.transfers"), path: "/transfers", icon: <SwapHoriz /> },
    { label: t("nav.nfeSamples"), path: "/nfe-samples", icon: <Description /> },
  ];

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate("/login");
  };

  const [lang] = useState(i18n.language);

  const handleLanguageChange = (newLang: string) => {
    localStorage.setItem("language", newLang);
    globalThis.location.reload();
  };

  const currentLang = lang === "pt-BR" ? "PT-BR" : "EN-US";

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 1 }} onClick={() => setDrawerOpen(!drawerOpen)}>
            {drawerOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {t("app.title")}
          </Typography>
          <Tooltip title={mode === "light" ? t("theme.dark") : t("theme.light")}>
            <IconButton color="inherit" onClick={toggleMode}>
              {mode === "light" ? <DarkMode /> : <LightMode />}
            </IconButton>
          </Tooltip>
          <Tooltip title={currentLang}>
            <IconButton color="inherit" onClick={(e) => setLangAnchorEl(e.currentTarget)}>
              <Language />
            </IconButton>
          </Tooltip>
          <Menu anchorEl={langAnchorEl} open={Boolean(langAnchorEl)} onClose={() => setLangAnchorEl(null)}>
            <MenuItem selected={lang === "en"} onClick={() => handleLanguageChange("en")}>EN-US</MenuItem>
            <MenuItem selected={lang === "pt-BR"} onClick={() => handleLanguageChange("pt-BR")}>PT-BR</MenuItem>
          </Menu>
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <AccountCircle />
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>{user?.username} ({user?.role})</MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); window.open("/admin/", "_blank"); }}>
              <ListItemIcon><AdminPanelSettings fontSize="small" /></ListItemIcon>
              {t("auth.adminPanel")}
            </MenuItem>
            <MenuItem onClick={handleLogout}>{t("auth.logout")}</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="persistent"
        open={drawerOpen}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Toolbar />
        <List sx={{ flexGrow: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ textAlign: "center", pb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {appVersion ? t("app.version", { version: appVersion }) : ""}
          </Typography>
          <br />
          <Link
            href="https://github.com/ddc/finances"
            target="_blank"
            rel="noopener"
            color="text.secondary"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: "0.75rem" }}
          >
            <GitHub sx={{ fontSize: "0.875rem" }} /> GitHub
          </Link>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: drawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : "100%",
          ml: drawerOpen ? `${DRAWER_WIDTH}px` : 0,
          minWidth: 0,
          overflowX: "hidden",
          p: 3,
          mt: 8,
          display: "flex",
          flexDirection: "column",
          minHeight: "calc(100vh - 64px)",
          transition: "width 225ms, margin-left 225ms",
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Outlet />
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: "right", mb: -1 }}
        >
          &copy; 2026 DDC Softwares
        </Typography>
      </Box>
    </Box>
  );
}
