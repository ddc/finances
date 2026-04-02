import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Container, TextField, Typography, Alert } from "@mui/material";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate("/");
    } catch {
      setError("Invalid username or password");
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Typography variant="h4" gutterBottom>Finances</Typography>
        {error && <Alert severity="error" sx={{ width: "100%", mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
          <TextField
            label="Username" fullWidth margin="normal" required
            value={username} onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Password" type="password" fullWidth margin="normal" required
            value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>Login</Button>
        </Box>
      </Box>
    </Container>
  );
}
