"use client";

import "./globals.css";
import { ReactNode } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "@/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const metadata = {
  title: "Operations Nativago Backoffice",
  description: "Panel administrativo para operaciones Nativago",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
