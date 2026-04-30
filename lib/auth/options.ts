export const runtime = 'nodejs';

import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { connectDB } = await import('@/lib/db/mongoose');
        const { UserModel } = await import('@/lib/db/models/User');

        await connectDB();

        const user = await UserModel.findOne({ email: credentials.email });
        if (!user) {
          return null;
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordCorrect) {
          return null;
        }

        if (!user.isVerified) {
          const { resendOTP } = await import('@/lib/auth/otp');
          await resendOTP(user.email);
          throw new Error('Email not verified');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          plan: user.subscription.plan,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.plan = (user as any).plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        (session.user as any).plan = token.plan || 'free';
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

import NextAuth from 'next-auth';
export const { handlers, auth } = NextAuth(authOptions);
