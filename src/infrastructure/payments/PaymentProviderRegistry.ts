import prisma from '@/lib/db';
import type { PaymentProvider } from '@/domain/services/PaymentProvider';
import { StripeProvider } from './StripeProvider';

// Mapa código→instancia de cada proveedor soportado por el código. Sumar
// un proveedor nuevo (Wompi, Mercado Pago, Pix...) es agregar una entrada
// acá + su clase — nada más del sistema cambia.
const PROVIDERS: Record<string, PaymentProvider> = {
  stripe: new StripeProvider(),
};

// Resuelve, para un país, el proveedor de pago activo con mayor prioridad
// (CountryPaymentProvider). Si el país no tiene ninguno activo o el código
// no tiene una clase registrada todavía, lanza un error explícito en vez
// de caer silenciosamente a un proveedor incorrecto.
export async function getActivePaymentProvider(countryId: string): Promise<PaymentProvider> {
  const config = await prisma.countryPaymentProvider.findFirst({
    where: { countryId, isActive: true },
    orderBy: { priority: 'asc' },
    include: { paymentProvider: true },
  });

  if (!config) {
    throw new Error(`No active payment provider configured for country ${countryId}`);
  }

  const provider = PROVIDERS[config.paymentProvider.code];
  if (!provider) {
    throw new Error(`Payment provider "${config.paymentProvider.code}" has no implementation registered`);
  }

  return provider;
}
