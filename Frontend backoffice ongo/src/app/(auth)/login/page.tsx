"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Box, TextField, Button, Typography, Paper } from "@mui/material";
import { loginOperator } from "@/lib/apiClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token } = await loginOperator(email, password);
      localStorage.setItem("session_token", token);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Credenciales inválidas o error de servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
        <Typography variant="h5" gutterBottom>
          Operations Nativago - Login
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
          />
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
