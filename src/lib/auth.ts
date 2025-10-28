// src/lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt"; // ensure installed

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const rows = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        const u = rows[0];
        if (!u) return null;

        // ✅ real password verify (adjust field names if different)
        // assuming users.passwordHash
        const ok =
          typeof (u as any).passwordHash === "string" &&
          (await bcrypt.compare(credentials.password, (u as any).passwordHash));
        if (!ok) return null;

        return {
          id: u.id,
          email: u.email,
          name: (u as any).name ?? undefined,
          image: (u as any).image ?? undefined,
          // Ensure your Drizzle schema has users.isAdmin boolean (DEFAULT false)
          isAdmin: Boolean((u as any).isAdmin),
        } as any;
      }
    })
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
    }
  },

  pages: {
    signIn: "/auth/signin"
  }
};
