"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Shield, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface InviteCode {
  id: number;
  code: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  createdByUserId: string;
}

export default function AdminInviteCodesPage() {
  const router = useRouter();
  const { data: session, status } = useSession(); // "loading" | "authenticated" | "unauthenticated"

  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Local form state
  const [newCode, setNewCode] = useState({
    code: "",
    maxUses: "1",
    expiresAt: "",
  });

  // Derived admin flag (type-safe with next-auth.d.ts augmentation)
  const isAdmin = !!session?.user?.isAdmin;

  // Redirect non-admins as soon as we know
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || !isAdmin) {
      toast.error("Admin access required");
      router.replace("/");
    }
  }, [status, session, isAdmin, router]);

  // Fetch invite codes (after admin gate passes)
  const fetchInviteCodes = async () => {
    setIsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch("/api/admin/invite-codes?includeExpired=true", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });

      if (!res.ok) {
        const err = await safeJson(res);
        toast.error(err?.error || "Failed to fetch invite codes");
        return;
      }

      const data: InviteCode[] = await res.json();
      setInviteCodes(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load invite codes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && isAdmin) {
      fetchInviteCodes();
    }
  }, [status, isAdmin]);

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = newCode.code.trim();
    if (!trimmed) {
      toast.error("Code cannot be empty");
      return;
    }

    const parsedMax = parseInt(newCode.maxUses, 10);
    const maxUses = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 1;

    // datetime-local returns local time; send as ISO if provided
    const expiresAt =
      newCode.expiresAt ? new Date(newCode.expiresAt).toISOString() : null;

    setIsCreating(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
        body: JSON.stringify({ code: trimmed, maxUses, expiresAt }),
      });

      if (!res.ok) {
        const err = await safeJson(res);
        toast.error(err?.error || "Failed to create invite code");
        return;
      }

      toast.success("Invite code created successfully!");
      setNewCode({ code: "", maxUses: "1", expiresAt: "" });
      setShowCreateForm(false);
      fetchInviteCodes();
    } catch {
      toast.error("An error occurred while creating the code");
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(
      () => {
        setCopiedCode(code);
        toast.success("Code copied to clipboard!");
        window.setTimeout(() => setCopiedCode(null), 2000);
      },
      () => toast.error("Failed to copy")
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Loading states (page-level)
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If not admin (already redirected), render nothing
  if (!isAdmin) return null;

  const totalUses = useMemo(
    () => inviteCodes.reduce((sum, c) => sum + (c.currentUses || 0), 0),
    [inviteCodes]
  );
  const activeCount = useMemo(
    () => inviteCodes.filter((c) => c.isActive).length,
    [inviteCodes]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Manage invite codes</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Codes</CardDescription>
                <CardTitle className="text-3xl">{inviteCodes.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Codes</CardDescription>
                <CardTitle className="text-3xl">{activeCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Uses</CardDescription>
                <CardTitle className="text-3xl">{totalUses}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Create Invite Code Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invite Codes</CardTitle>
                  <CardDescription>
                    Create and manage invite codes for new users
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateForm((s) => !s)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Code
                </Button>
              </div>
            </CardHeader>

            {showCreateForm && (
              <CardContent className="border-t pt-6">
                <form onSubmit={handleCreateCode} className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Code *</Label>
                      <Input
                        id="code"
                        placeholder="e.g., BETA-2024"
                        value={newCode.code}
                        onChange={(e) =>
                          setNewCode({ ...newCode, code: e.target.value })
                        }
                        required
                        disabled={isCreating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxUses">Max Uses *</Label>
                      <Input
                        id="maxUses"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={newCode.maxUses}
                        onChange={(e) =>
                          setNewCode({ ...newCode, maxUses: e.target.value })
                        }
                        required
                        disabled={isCreating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                      <Input
                        id="expiresAt"
                        type="datetime-local"
                        value={newCode.expiresAt}
                        onChange={(e) =>
                          setNewCode({ ...newCode, expiresAt: e.target.value })
                        }
                        disabled={isCreating}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Code"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}

            {/* Invite Codes Table */}
            <CardContent className={showCreateForm ? "border-t pt-6" : ""}>
              {inviteCodes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invite codes yet. Create one to get started.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inviteCodes.map((code) => {
                        const isExpired =
                          !!code.expiresAt &&
                          new Date(code.expiresAt).getTime() < Date.now();
                        const isExhausted = code.currentUses >= code.maxUses;

                        return (
                          <TableRow key={code.id}>
                            <TableCell className="font-mono font-medium">
                              {code.code}
                            </TableCell>
                            <TableCell>
                              {!code.isActive ? (
                                <Badge variant="secondary">Inactive</Badge>
                              ) : isExpired ? (
                                <Badge variant="destructive">Expired</Badge>
                              ) : isExhausted ? (
                                <Badge variant="secondary">Used Up</Badge>
                              ) : (
                                <Badge variant="default">Active</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {code.currentUses} / {code.maxUses}
                            </TableCell>
                            <TableCell>{formatDate(code.expiresAt)}</TableCell>
                            <TableCell>{formatDate(code.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(code.code)}
                                className="gap-2"
                              >
                                {copiedCode === code.code ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4" />
                                    Copy
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

/** Safely parse JSON body from a non-OK response without throwing */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
