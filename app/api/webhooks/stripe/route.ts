import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db';
import Order from '@/models/Order';
import { getStripe } from '@/lib/stripe';
import { STRIPE_WEBHOOK_SECRET } from '@/config/stripe';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook misconfigured' }, { status: 500 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Stripe webhook signature verification failed:', msg);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session?.metadata?.orderId;
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent && typeof session.payment_intent === 'object'
            ? (session.payment_intent as any).id
            : undefined;

      if (!orderId) {
        console.warn('Stripe checkout.session.completed without orderId metadata');
        return NextResponse.json({ received: true }, { status: 200 });
      }

      await connectDB();

      await Order.updateOne(
        { _id: orderId },
        {
          $set: {
            status: 'paid',
            paymentIntentId: paymentIntentId || undefined,
            stripeSessionId: session.id,
          },
        }
      ).catch((e) => {
        console.error('Failed to update order after payment:', e);
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Stripe webhook handler failed:', error);
    // Return 200 to avoid Stripe retry storms; log for investigation.
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

