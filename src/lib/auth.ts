// Compatibility shim so legacy imports from "@/lib/auth" don't blow up the build.
// Prefer migrating files to getServerSession(authOptions) or getCurrentUser later.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

// Some old code referenced `getCurrentUser()`. Emulate that shape:
export const auth = {
  api: {
    async getSession() {
      return getServerSession(authOptions);
    },
  },
};


