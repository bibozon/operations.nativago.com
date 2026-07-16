import type { Money } from '@/domain/entities/Money';

export type CheckoutSessionInput = {
  amount: Money;
  description: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
};

export type CheckoutSessionResult = {
  redirectUrl: string;
  providerRef: string;
};

export type PaymentEvent = {
  type: 'payment_succeeded' | 'payment_failed';
  providerRef: string;
};

// Contrato único para cualquier pasarela de pago. Agregar un proveedor
// nuevo (Wompi, Mercado Pago, Pix...) implica escribir una clase que
// implemente esta interfaz — el resto del sistema (checkout, webhooks)
// nunca cambia. Ver PaymentProviderRegistry para cómo se elige el
// proveedor activo por país.
export interface PaymentProvider {
  readonly code: string;
  createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult>;
  verifyWebhook(rawBody: string, signature: string): PaymentEvent | null;
}
