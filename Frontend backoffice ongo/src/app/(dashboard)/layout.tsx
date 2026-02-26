"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppBar, Box, Toolbar, Typography, Button, Container, Tabs, Tab } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("session_token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("session_token");
    router.push("/login");
  };

  const currentTab =
    pathname?.startsWith("/dashboard/services")
      ? 0
      : pathname?.startsWith("/dashboard/products")
      ? 1
      : pathname?.startsWith("/dashboard/bookings")
      ? 2
      : false;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Operations Nativago
          </Typography>
          <Tabs value={currentTab} textColor="inherit" indicatorColor="secondary" sx={{ mr: 2 }}>
            <Tab label="Servicios" component={Link} href="/dashboard/services" />
            <Tab label="Productos Nativago" component={Link} href="/dashboard/products" />
            <Tab label="Reservas" component={Link} href="/dashboard/bookings" />
          </Tabs>
          <Button color="inherit" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4, mb: 4, flex: 1 }}>{children}</Container>
    </Box>
  );
}
