"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, Loader2, User, Shield } from "lucide-react";
import { toast } from "sonner";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  const { refetch } = useSession();
  
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  
  const [userFormData, setUserFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [adminFormData, setAdminFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingUser(true);

    console.log("🚀 [USER SIGN-IN] Starting sign-in process...");
    console.log("📧 [USER SIGN-IN] Email:", userFormData.email);

    try {
      console.log("📡 [USER SIGN-IN] Calling authClient.signIn.email()...");
      const { data, error } = await authClient.signIn.email({
        email: userFormData.email,
        password: userFormData.password,
        rememberMe: userFormData.rememberMe,
      });

      console.log("📥 [USER SIGN-IN] Sign-in response received");
      console.log("✅ [USER SIGN-IN] Data:", data);
      console.log("❌ [USER SIGN-IN] Error:", error);

      if (error?.code) {
        console.error("🚫 [USER SIGN-IN] Sign-in error code:", error.code);
        toast.error("Invalid email or password. Please make sure you have already registered an account and try again.");
        setIsLoadingUser(false);
        return;
      }

      // Use the user data directly from sign-in response
      if (data?.user) {
        console.log("👤 [USER SIGN-IN] User found in response:", data.user);
        
        // Check if user is actually admin
        if (data.user.isAdmin) {
          console.warn("⚠️ [USER SIGN-IN] Admin detected in user sign-in - signing out");
          toast.error("Admin accounts must use the Admin sign-in section.");
          await authClient.signOut();
          localStorage.removeItem("bearer_token");
          setIsLoadingUser(false);
          return;
        }
        
        console.log("✅ [USER SIGN-IN] Sign-in successful! Redirecting to /dashboard");
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        console.error("❌ [USER SIGN-IN] No user data in sign-in response");
        toast.error("Session error. Please try signing in again.");
        setIsLoadingUser(false);
      }
    } catch (error) {
      console.error("💥 [USER SIGN-IN] Exception caught:", error);
      toast.error("An error occurred. Please try again.");
      setIsLoadingUser(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingAdmin(true);

    console.log("🚀 [ADMIN SIGN-IN] Starting admin sign-in process...");
    console.log("📧 [ADMIN SIGN-IN] Email:", adminFormData.email);

    try {
      console.log("📡 [ADMIN SIGN-IN] Calling authClient.signIn.email()...");
      const { data, error } = await authClient.signIn.email({
        email: adminFormData.email,
        password: adminFormData.password,
        rememberMe: adminFormData.rememberMe,
      });

      console.log("📥 [ADMIN SIGN-IN] Sign-in response received");
      console.log("✅ [ADMIN SIGN-IN] Data:", data);
      console.log("❌ [ADMIN SIGN-IN] Error:", error);

      if (error?.code) {
        console.error("🚫 [ADMIN SIGN-IN] Sign-in error code:", error.code);
        toast.error("Invalid admin credentials. Please check your email and password.");
        setIsLoadingAdmin(false);
        return;
      }

      // Use the user data directly from sign-in response
      if (data?.user) {
        console.log("👤 [ADMIN SIGN-IN] User found in response:", data.user);
        console.log("👑 [ADMIN SIGN-IN] Is Admin:", data.user.isAdmin);
        
        // Check if user is actually an admin
        if (!data.user.isAdmin) {
          console.warn("⚠️ [ADMIN SIGN-IN] Non-admin detected in admin sign-in - signing out");
          toast.error("This account does not have admin privileges. Please use the User sign-in section.");
          await authClient.signOut();
          localStorage.removeItem("bearer_token");
          setIsLoadingAdmin(false);
          return;
        }
        
        console.log("✅ [ADMIN SIGN-IN] Admin sign-in successful! Redirecting to /dashboard");
        toast.success("Welcome back, Admin!");
        router.push("/dashboard");
      } else {
        console.error("❌ [ADMIN SIGN-IN] No user data in sign-in response");
        toast.error("Session error. Please try signing in again.");
        setIsLoadingAdmin(false);
      }
    } catch (error) {
      console.error("💥 [ADMIN SIGN-IN] Exception caught:", error);
      toast.error("An error occurred. Please try again.");
      setIsLoadingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex flex-col items-center gap-2">
          <TrendingUp className="h-10 w-10" />
          <h1 className="text-2xl font-bold">Trading Buddy</h1>
          <p className="text-sm text-muted-foreground">AI-Powered Options Trading Platform</p>
          {registered && (
            <div className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ Account created successfully! Please sign in below.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Sign In */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>User Sign In</CardTitle>
                  <CardDescription className="mt-1">
                    Sign in to access your trading account
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="you@example.com"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    required
                    disabled={isLoadingUser}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="user-password">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="user-password"
                    type="password"
                    placeholder="Enter your password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    required
                    disabled={isLoadingUser}
                    autoComplete="off"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="user-remember"
                    checked={userFormData.rememberMe}
                    onCheckedChange={(checked) => setUserFormData({ ...userFormData, rememberMe: checked as boolean })}
                    disabled={isLoadingUser}
                  />
                  <Label htmlFor="user-remember" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoadingUser}>
                  {isLoadingUser ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In as User"
                  )}
                </Button>

                <div className="mt-4 text-center text-sm">
                  <span className="text-muted-foreground">Don't have an account? </span>
                  <Link href="/sign-up" className="text-primary hover:underline font-medium">
                    Create one here
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Admin Sign In */}
          <Card className="border-2 border-primary/30 bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Admin Sign In</CardTitle>
                  <CardDescription className="mt-1">
                    Sign in with admin credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@tradingbuddy.ai"
                    value={adminFormData.email}
                    onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                    required
                    disabled={isLoadingAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter admin password"
                    value={adminFormData.password}
                    onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                    required
                    disabled={isLoadingAdmin}
                    autoComplete="off"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="admin-remember"
                    checked={adminFormData.rememberMe}
                    onCheckedChange={(checked) => setAdminFormData({ ...adminFormData, rememberMe: checked as boolean })}
                    disabled={isLoadingAdmin}
                  />
                  <Label htmlFor="admin-remember" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoadingAdmin} variant="default">
                  {isLoadingAdmin ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Sign In as Admin
                    </>
                  )}
                </Button>

                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    <Shield className="h-3 w-3 inline mr-1" />
                    Admin access requires elevated privileges
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>By signing in, you agree to our <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link></p>
        </div>
      </div>
    </div>
  );
}
