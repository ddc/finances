import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Container, TextField, Typography, Alert, FormControlLabel, Checkbox } from "@mui/material";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const savedUsername = (() => { try { return localStorage.getItem("rememberedUsername") || ""; } catch { return ""; } })();
  const [username, setUsername] = useState(savedUsername);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(!!savedUsername);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username);
      } else {
        localStorage.removeItem("rememberedUsername");
      }
      navigate("/");
    } catch {
      setError(t("auth.invalidCredentials"));
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="h4" gutterBottom>{t("app.title")}</Typography>
        {error && <Alert severity="error" sx={{ width: "100%", mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          <TextField
            label={t("auth.username")} fullWidth margin="normal" required
            value={username} onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label={t("auth.password")} type="password" fullWidth margin="normal" required
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <FormControlLabel
            control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />}
            label={t("auth.rememberMe")}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 1 }}>{t("auth.login")}</Button>
        </Box>
      </Box>
    </Container>
  );
}
