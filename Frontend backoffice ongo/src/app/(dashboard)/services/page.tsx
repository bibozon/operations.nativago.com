"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listServices, createService, updateService, deleteService, Service } from "@/lib/servicesApi";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from "@mui/material";

interface ServiceFormState {
  id?: string;
  name: string;
  description?: string;
  city?: string;
  price?: number;
  active: boolean;
}

const emptyForm: ServiceFormState = {
  name: "",
  description: "",
  city: "",
  price: undefined,
  active: true,
};

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["services"], queryFn: listServices });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ServiceFormState>(emptyForm);

  const createMutation = useMutation({
    mutationFn: (payload: Omit<Service, "id">) => createService(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setOpen(false);
      setForm(emptyForm);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<Service, "id">> }) =>
      updateService(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setOpen(false);
      setForm(emptyForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const handleOpenEdit = (service: Service) => {
    setForm({
      id: service.id,
      name: service.name,
      description: service.description,
      city: service.city,
      price: service.price,
      active: service.active,
    });
    setOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      description: form.description,
      city: form.city,
      price: form.price,
      active: form.active,
    };

    if (form.id) {
      updateMutation.mutate({ id: form.id, payload });
    } else {
      createMutation.mutate(payload as Omit<Service, "id">);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Servicios</Typography>
        <Button variant="contained" onClick={handleOpenCreate}>
          Nuevo servicio
        </Button>
      </Box>

      {isLoading && <Typography>Cargando servicios...</Typography>}
      {error && (
        <Typography color="error">
          Error al cargar servicios. Verifica la conexión con el backend.
        </Typography>
      )}

      {data && (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Ciudad</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Activo</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((service) => (
                <TableRow key={service.id} hover>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.city}</TableCell>
                  <TableCell>{service.price}</TableCell>
                  <TableCell>{service.active ? "Sí" : "No"}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleOpenEdit(service)}>
                      Editar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(service.id)}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Descripción"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            rows={3}
          />
          <TextField
            label="Ciudad"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Precio"
            type="number"
            value={form.price ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, price: e.target.value ? Number(e.target.value) : undefined }))
            }
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
            }
            label="Activo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
