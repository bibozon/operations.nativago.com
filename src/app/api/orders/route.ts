// Alias de /api/catalog/bookings — el marketplace (cmsBookingClient.ts)
// consume /api/orders como nombre "oficial" de esta API (ver comentario en
// ese archivo: "el CMS es la única fuente de verdad para reservas"). La
// lógica real vive en un solo lugar (catalog/bookings/route.ts) para no
// duplicar la transacción Serializable de capacidad/overlap — este archivo
// solo re-expone esos mismos handlers bajo la ruta que el marketplace
// realmente llama.
export { POST, GET } from '../catalog/bookings/route';
