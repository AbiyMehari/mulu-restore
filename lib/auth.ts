import { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JWT } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import User from '@/models/User';

/**
 * User roles as defined in PRD
 */
export type UserRole = 'admin' | 'customer';

/**
 * Extended session type with role
 */
export interface ExtendedSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
  };
}

/**
 * Extended JWT token type with role
 */
export interface ExtendedToken extends JWT {
  id?: string;
  role?: UserRole;
}

/**
 * NextAuth configuration
 * Uses JWT sessions with Credentials provider
 * Supports role-based access control (admin, customer)
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate email + password exist
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Normalize email
        const normalizedEmail = credentials.email.trim().toLowerCase();
        const plainPassword = credentials.password;

        try {
          // Connect to MongoDB
          await connectDB();

          // Find user by email (stored lowercased in DB)
          const user = await User.findOne({ email: normalizedEmail });

          // If user not found, return null
          if (!user) {
            return null;
          }

          // Compare password with stored passwordHash using bcryptjs
          const isValidPassword = await bcrypt.compare(
            plainPassword,
            user.passwordHash
          );

          // If password is invalid, return null
          if (!isValidPassword) {
            return null;
          }

          // If valid, return user data
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name ?? null,
            role: user.role,
          };
        } catch (error) {
          // On any error, return null (do NOT throw)
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - user object is available
      if (user) {
        token.id = user.id;
        token.role = (user as ExtendedSession['user']).role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id and role to session
      if (session.user && token) {
        (session as ExtendedSession).user.id = token.id as string;
        (session as ExtendedSession).user.role = token.role as UserRole;
      }
      return session as ExtendedSession;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Helper function to check if user has required role
 * @param userRole - User's role
 * @param requiredRole - Required role to access resource
 * @returns boolean indicating if user has required role
 */
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  
  // Admin has access to everything
  if (userRole === 'admin') return true;
  
  // Customer can only access customer resources
  return userRole === requiredRole;
}

/**
 * Helper function to check if user is admin
 * @param userRole - User's role
 * @returns boolean indicating if user is admin
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
  return userRole === 'admin';
}

/**
 * Get the current session server-side
 * Use this in API routes and server components
 * 
 * @returns Promise<ExtendedSession | null> Current session or null if not authenticated
 * 
 * @example
 * ```ts
 * const session = await getCurrentSession();
 * if (!session) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export async function getCurrentSession(): Promise<ExtendedSession | null> {
  const session = await getServerSession(authOptions);
  return session as ExtendedSession | null;
}

/**
 * Get the current user server-side
 * Use this in API routes and server components
 * 
 * @returns Promise<ExtendedSession['user'] | null> Current user or null if not authenticated
 * 
 * @example
 * ```ts
 * const user = await getCurrentUser();
 * if (!user) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export async function getCurrentUser(): Promise<ExtendedSession['user'] | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

/**
 * Require authentication - throws error if user is not authenticated
 * Use this in API routes and server components that require authentication
 * 
 * @returns Promise<ExtendedSession['user']> Current user (never null)
 * @throws Error if user is not authenticated
 * 
 * @example
 * ```ts
 * try {
 *   const user = await requireAuth();
 *   // user is guaranteed to be authenticated
 * } catch (error) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * ```
 */
export async function requireAuth(): Promise<ExtendedSession['user']> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Require admin role - throws error if user is not admin
 * Use this in API routes and server components that require admin access
 * 
 * @returns Promise<ExtendedSession['user']> Current admin user (never null)
 * @throws Error if user is not authenticated or not admin
 * 
 * @example
 * ```ts
 * try {
 *   const admin = await requireAdmin();
 *   // admin is guaranteed to be authenticated and have admin role
 * } catch (error) {
 *   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * }
 * ```
 */
export async function requireAdmin(): Promise<ExtendedSession['user']> {
  const user = await requireAuth();
  if (!isAdmin(user.role)) {
    throw new Error('Admin access required');
  }
  return user;
}
