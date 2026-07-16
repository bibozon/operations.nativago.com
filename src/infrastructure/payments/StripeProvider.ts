import { getStripe } from '@/lib/stripe';
import type {
  CheckoutSessionInput,
  CheckoutSessionResult,
  PaymentEvent,
  PaymentProvider,
} from '@/domain/services/PaymentProvider';

// Envuelve el Stripe ya existente detrás del contrato PaymentProvider.
// Mismo comportamiento de antes (checkout.sessions.create), solo que ahora
// desacoplado — agregar Wompi/Mercado Pago/Pix es escribir una clase
// hermana, sin tocar esta ni el código que la llama.
export class StripeProvider implements PaymentProvider {
  readonly code = 'stripe';

  async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
    const stripe = getStripe();
    if (!stripe) {
      throw new Error('Stripe not configured');
    }

    const decimalDigits = input.amount.currencyCode === 'COP' || input.amount.currencyCode === 'CLP' ? 0 : 2;
    const unitAmount = Math.round(input.amount.amount * 10 ** decimalDigits);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: input.amount.currencyCode.toLowerCase(),
            unit_amount: unitAmount,
            product_data: { name: input.description },
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: input.metadata,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }

    return { redirectUrl: session.url, providerRef: session.id };
  }

  verifyWebhook(_rawBody: string, _signature: string): PaymentEvent | null {
    // El webhook actual (src/app/api/stripe/webhook/route.ts) sigue
    // verificando la firma directo con el SDK de Stripe — no se migró en
    // esta fase para no tocar el flujo de confirmación de pago en
    // producción sin poder probarlo end-to-end. Queda pendiente para
    // cuando se sume el segundo proveedor real (Fase 5).
    throw new Error('StripeProvider.verifyWebhook not wired yet — see api/stripe/webhook/route.ts');
  }
}
