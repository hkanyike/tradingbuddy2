import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options"; // you already created this

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

