// src/lib/auth-options.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// If you already have a real db check, wire it here.
// Keep imports minimal to avoid build-time schema errors.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        // TODO: Replace with your real lookup.
        // For now, allow a single admin test user by email.
        const isAdmin = creds.email.endsWith("@admin.test");
        return {
          id: "user-" + creds.email,
          email: creds.email,
          name: creds.email.split("@")[0],
          isAdmin,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.isAdmin = Boolean((user as any).isAdmin);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};

