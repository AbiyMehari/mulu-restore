import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '@/config/stripe';

let stripeSingleton: Stripe | null = null;

export function getStripe() {
  if (stripeSingleton) return stripeSingleton;
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  stripeSingleton = new Stripe(STRIPE_SECRET_KEY, { typescript: true });
  return stripeSingleton;
}

