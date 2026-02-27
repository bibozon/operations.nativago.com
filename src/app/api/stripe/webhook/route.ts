import Stripe from 'stripe';
import prisma from '@/lib/db';
import { headers } from 'next/headers';

export const runtime = 'nodejs';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
}

const stripe = new Stripe(stripeSecretKey);


export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const hdrs = await headers();
  const sig = hdrs.get('stripe-signature');

  if (!sig) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }


  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET');
    return new Response('Webhook not configured', { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig as string,
      webhookSecret
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err);
    return new Response('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingIdRaw = session.metadata?.bookingId;
    const bookingId = bookingIdRaw ? Number(bookingIdRaw) : NaN;

    if (Number.isFinite(bookingId)) {
      try {
        await prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: 'PAID' },
        });
      } catch (error) {
        console.error('Failed to update booking paymentStatus', error);
      }
    }
  }

  return new Response('ok');
}
