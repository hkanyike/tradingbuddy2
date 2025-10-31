// src/lib/auth-options.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

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
        
        try {
          // Look up user in database
          const users = await db
            .select()
            .from(user)
            .where(eq(user.email, creds.email))
            .limit(1);

          if (users.length === 0) {
            // Create a new user if they don't exist (for demo purposes)
            const hashedPassword = await bcrypt.hash(creds.password, 12);
            const nowISO = new Date().toISOString();
            const newUser = await db.insert(user).values({
              id: `user-${Date.now()}`,
              name: creds.email.split("@")[0],
              email: creds.email,
              emailVerified: nowISO,
              isAdmin: creds.email.endsWith("@admin.test"),
              portfolioBalance: 100000,
              riskTolerance: "moderate",
              executionMode: "manual",
              createdAt: nowISO,
              updatedAt: nowISO,
            }).returning();

            return {
              id: newUser[0].id,
              email: newUser[0].email,
              name: newUser[0].name,
              isAdmin: newUser[0].isAdmin,
            };
          }

          const dbUser = users[0];
          
          // For demo purposes, accept any password for existing users
          // In production, you'd verify the password hash
          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            isAdmin: dbUser.isAdmin,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
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
    signIn: "/sign-in",
  },
};

