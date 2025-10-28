// src/lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import type { Session } from "next-auth";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function getCurrentSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

// Minimal compat for old Better Auth-style usage in some files
export const auth = {
  api: {
    async getSession(_opts?: { headers?: Headers | (() => Headers) }) {
      // Fall back to server session; if headers are provided (edge), try JWT
      try {
        return await getServerSession(authOptions);
      } catch {
        return null;
      }
    },
  },
};

// Helper to read JWT in API handlers that run in edge/runtime: 'nodejs'
export async function getJwtUserFromRequest(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token ?? null;
}

