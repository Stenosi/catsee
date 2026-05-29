import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';
import { db } from '@/db';
import * as schema from '@/db/schema';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      nickname: string;
      role: 'user' | 'admin';
      onboardingCompleted: boolean;
      banned: boolean;
    };
  }
}

// DrizzleAdapter aspetta una users table con colonne name/image che noi non abbiamo.
// Sovrascriviamo createUser per iniettare username e nickname generati temporaneamente.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const baseAdapter = DrizzleAdapter(db, {
  usersTable: schema.users as any,
  accountsTable: schema.accounts as any,
  sessionsTable: schema.sessions as any,
  verificationTokensTable: schema.verificationTokens as any,
});

const adapter = {
  ...baseAdapter,
  async createUser(data: {
    email: string;
    emailVerified: Date | null;
    name?: string | null;
    image?: string | null;
  }) {
    const tempUsername = `user_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
    const [user] = await db
      .insert(schema.users)
      .values({
        email: data.email,
        emailVerified: data.emailVerified,
        username: tempUsername,
        nickname: data.name ?? tempUsername,
        onboardingCompleted: false,
      })
      .returning();
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified ?? null,
      name: user.nickname,
      image: user.avatarUrl ?? null,
    };
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: 'database' },
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY!,
      from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
    }),
  ],
  pages: {
    signIn: '/login',
    verifyRequest: '/login/verify',
    error: '/login',
  },
  callbacks: {
    async session({ session, user }) {
      // Con strategy "database", user è la riga del DB restituita dall'adapter.
      // Il tipo è AdapterUser ma a runtime contiene tutti i nostri campi custom.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbUser = user as any;
      session.user.id = dbUser.id;
      session.user.username = dbUser.username ?? '';
      session.user.nickname = dbUser.nickname ?? '';
      session.user.role = dbUser.role ?? 'user';
      session.user.onboardingCompleted = dbUser.onboardingCompleted ?? false;
      session.user.banned = dbUser.banned ?? false;
      return session;
    },
  },
});
