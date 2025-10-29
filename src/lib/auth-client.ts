// src/lib/auth-client.ts
// Thin proxy so the app can keep importing "@/lib/auth-client"

import { useSession, signIn, signOut, getSession } from "next-auth/react";

export { useSession, signIn, signOut, getSession };

// Optional convenience object for legacy imports: { authClient }
export const authClient = {
  // usage: const { data, status } = authClient.useSession()
  useSession,
  signIn,
  signOut,
  getSession,
};

export default authClient; // in case anything default-imports it


