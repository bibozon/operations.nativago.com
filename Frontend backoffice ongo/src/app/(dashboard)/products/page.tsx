"use client";

import { useQuery } from "@tanstack/react-query";
import { listNativagoProducts } from "@/lib/productsApi";
import { Box, Typography, Grid, Card, CardContent, CardActions, Button } from "@mui/material";

export default function ProductsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["nativago-products"],
    queryFn: listNativagoProducts,
  });

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Productos desde Nativago
      </Typography>

      {isLoading && <Typography>Cargando productos...</Typography>}
      {error && (
        <Typography color="error">
          Error al cargar productos. Verifica la conexión con Nativago/backend.
        </Typography>
      )}

      <Grid container spacing={2}>
        {data?.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{product.title}</Typography>
                {product.city && (
                  <Typography variant="body2" color="text.secondary">
                    Ciudad: {product.city}
                  </Typography>
                )}
                {product.description && (
                  <Typography variant="body2" mt={1}>
                    {product.description}
                  </Typography>
                )}
                {product.price !== undefined && (
                  <Typography variant="subtitle2" mt={1}>
                    Precio desde: {product.price}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button size="small">Ver detalles</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
