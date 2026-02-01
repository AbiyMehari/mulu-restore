export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export function getBaseUrl(request?: Request) {
  const fromRequest = request?.headers.get('origin') || '';
  if (fromRequest) return fromRequest;

  const nextAuthUrl = process.env.NEXTAUTH_URL || '';
  if (nextAuthUrl) return nextAuthUrl;

  return 'http://localhost:3000';
}
