"use client";

import { useSession } from "@/lib/auth-client";
import { useMemo } from "react";

export function useCurrentUser() {
  const { data: session, status } = useSession();
  
  const user = useMemo(() => {
    if (!session?.user) return null;
    
    return {
      id: (session.user as any).id,
      email: session.user.email,
      name: session.user.name,
      isAdmin: Boolean((session.user as any).isAdmin),
    };
  }, [session]);

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: !!user,
  };
}
