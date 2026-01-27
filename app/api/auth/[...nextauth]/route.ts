import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * NextAuth route handler for App Router
 * Handles all authentication routes: /api/auth/signin, /api/auth/signout, etc.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
