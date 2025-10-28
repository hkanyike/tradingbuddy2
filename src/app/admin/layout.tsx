// src/app/admin/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type AdminUser = { isAdmin?: boolean };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    const isAdmin = Boolean((session?.user as AdminUser | undefined)?.isAdmin);
    if (status === "authenticated" && !isAdmin) {
      toast.error("Admin access required");
      router.replace("/");
    }
    if (status === "unauthenticated") {
      router.replace("/auth/signin");
    }
  }, [session, status, router]);

  return <>{children}</>;
}
