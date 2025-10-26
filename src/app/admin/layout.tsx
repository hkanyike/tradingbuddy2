"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { 
  Shield, 
  Users, 
  TrendingUp, 
  Plug, 
  AlertTriangle, 
  Database, 
  BarChart3, 
  Bell, 
  Settings,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

const adminNavItems = [
  { href: "/admin/invite-codes", label: "Invite Codes", icon: Ticket },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/strategies", label: "Strategy Oversight", icon: TrendingUp },
  { href: "/admin/broker-connections", label: "Broker Connections", icon: Plug },
  { href: "/admin/risk-monitoring", label: "Risk Monitoring", icon: AlertTriangle },
  { href: "/admin/market-data", label: "Market Data", icon: Database },
  { href: "/admin/positions-trades", label: "Positions & Trades", icon: BarChart3 },
  { href: "/admin/alerts", label: "Alert Management", icon: Bell },
  { href: "/admin/settings", label: "System Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && (!session?.user || !session.user.isAdmin)) {
      toast.error("Admin access required");
      router.push("/");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session?.user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">System management & oversight</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1 sticky top-24">
              {adminNavItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}