"use client";

import { useQuery } from "@tanstack/react-query";
import { listBookings } from "@/lib/bookingsApi";
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer } from "@mui/material";

export default function BookingsPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["bookings"], queryFn: listBookings });

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Reservas
      </Typography>
      {isLoading && <Typography>Cargando reservas...</Typography>}
      {error && (
        <Typography color="error">
          Error al cargar reservas. Verifica la conexión con el backend.
        </Typography>
      )}
      {data && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Experiencia</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Ciudad</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Fecha creación</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>{booking.experienceTitle}</TableCell>
                  <TableCell>{booking.userName}</TableCell>
                  <TableCell>{booking.city}</TableCell>
                  <TableCell>{booking.status}</TableCell>
                  <TableCell>{booking.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
