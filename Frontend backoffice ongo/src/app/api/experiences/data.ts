export interface Service {
  id: string;
  name: string;
  description?: string;
  city?: string;
  price?: number;
  active: boolean;
}

// Estado en memoria compartido para entorno de demo.
export const services: Service[] = [
  {
    id: "s1",
    name: "Tour centro histórico",
    description: "Recorrido guiado por el centro histórico de la ciudad.",
    city: "Cusco",
    price: 40,
    active: true,
  },
  {
    id: "s2",
    name: "Experiencia gastronómica",
    description: "Degustación de platos típicos locales.",
    city: "Lima",
    price: 60,
    active: true,
  },
];
