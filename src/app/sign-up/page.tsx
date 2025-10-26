"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { TrendingUp, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeStatus, setCodeStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [formData, setFormData] = useState({
    inviteCode: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  console.log("🔵 [SIGN-UP] Page rendered with form data:", {
    hasInviteCode: !!formData.inviteCode,
    hasName: !!formData.name,
    hasEmail: !!formData.email,
    hasPassword: !!formData.password,
    hasConfirmPassword: !!formData.confirmPassword,
    codeStatus
  });

  const validateInviteCode = async (code: string) => {
    if (!code.trim()) {
      console.log("⚪ [INVITE-CODE] Empty code, skipping validation");
      setCodeStatus("idle");
      return;
    }

    console.log("🔍 [INVITE-CODE] Starting validation for code:", code.trim());
    setIsValidatingCode(true);
    
    try {
      console.log("📡 [INVITE-CODE] Sending validation request to /api/invite-codes/validate");
      const response = await fetch("/api/invite-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();
      console.log("📡 [INVITE-CODE] Validation response:", { status: response.status, data });
      
      if (data.valid) {
        console.log("✅ [INVITE-CODE] Code is valid!");
        setCodeStatus("valid");
        toast.success("Valid invite code!");
      } else {
        console.log("❌ [INVITE-CODE] Code is invalid:", data.message);
        setCodeStatus("invalid");
        toast.error(data.message || "Invalid invite code");
      }
    } catch (error) {
      console.error("🔴 [INVITE-CODE] Validation failed with error:", error);
      setCodeStatus("invalid");
      toast.error("Failed to validate invite code");
    } finally {
      setIsValidatingCode(false);
      console.log("🏁 [INVITE-CODE] Validation complete");
    }
  };

  const handleInviteCodeBlur = () => {
    console.log("👁️ [INVITE-CODE] Input blur event, code:", formData.inviteCode);
    if (formData.inviteCode.trim()) {
      validateInviteCode(formData.inviteCode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 [REGISTRATION] Form submitted");
    console.log("📋 [REGISTRATION] Form data:", {
      name: formData.name,
      email: formData.email,
      hasInviteCode: !!formData.inviteCode.trim(),
      inviteCode: formData.inviteCode.trim(),
      codeStatus,
      passwordLength: formData.password.length
    });
    
    // Only validate invite code if one was entered
    if (formData.inviteCode.trim() && codeStatus !== "valid") {
      console.log("⚠️ [REGISTRATION] Blocked: Invalid invite code");
      toast.error("Please enter a valid invite code or leave it empty");
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      console.log("⚠️ [REGISTRATION] Blocked: Passwords don't match");
      toast.error("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 8) {
      console.log("⚠️ [REGISTRATION] Blocked: Password too short");
      toast.error("Password must be at least 8 characters");
      return;
    }

    console.log("✅ [REGISTRATION] All validations passed, proceeding...");
    setIsLoading(true);

    try {
      console.log("📡 [REGISTRATION] Calling authClient.signUp.email...");
      const { data, error } = await authClient.signUp.email({
        email: formData.email,
        name: formData.name,
        password: formData.password,
      });

      console.log("📡 [REGISTRATION] Auth response received:", { 
        hasData: !!data, 
        hasError: !!error,
        userId: data?.user?.id 
      });

      if (error) {
        const errorMap: Record<string, string> = {
          USER_ALREADY_EXISTS: "Email already registered",
        };
        
        console.error("🔴 [REGISTRATION] Registration error:", error);
        
        const errorMessage = error.code 
          ? (errorMap[error.code] || `Registration failed: ${error.code}`)
          : error.message || "Registration failed";
        
        console.log("🔴 [REGISTRATION] Showing error to user:", errorMessage);
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      console.log("✅ [REGISTRATION] User created successfully! User ID:", data?.user?.id);

      // Consume the invite code if one was used
      if (data?.user?.id && formData.inviteCode.trim() && codeStatus === "valid") {
        console.log("🎟️ [INVITE-CODE] Consuming invite code for user:", data.user.id);
        try {
          const consumeResponse = await fetch("/api/invite-codes/consume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              code: formData.inviteCode.trim(),
              userId: data.user.id,
            }),
          });
          const consumeData = await consumeResponse.json();
          console.log("🎟️ [INVITE-CODE] Consume response:", { 
            status: consumeResponse.status, 
            data: consumeData 
          });
        } catch (consumeError) {
          console.error("🔴 [INVITE-CODE] Failed to consume invite code:", consumeError);
        }
      } else {
        console.log("⚪ [INVITE-CODE] Skipping invite code consumption (not provided or not valid)");
      }

      console.log("🎉 [REGISTRATION] Registration flow complete! Redirecting to sign-in...");
      toast.success("Account created successfully!");
      router.push("/sign-in?registered=true");
    } catch (error) {
      console.error("🔴 [REGISTRATION] Unexpected error during registration:", error);
      toast.error("An error occurred during registration");
    } finally {
      setIsLoading(false);
      console.log("🏁 [REGISTRATION] Registration process finished");
    }
  };

  const isFormValid = 
    formData.name.trim() &&
    formData.email.trim() &&
    formData.password.length >= 8 &&
    formData.password === formData.confirmPassword &&
    (!formData.inviteCode.trim() || codeStatus === "valid");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <TrendingUp className="h-10 w-10" />
          <h1 className="text-2xl font-bold">Trading Buddy</h1>
          <p className="text-sm text-muted-foreground">AI-Powered Options Trading Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>
              Enter your details to get started. Invite code is optional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invite Code (Optional)</Label>
                <div className="relative">
                  <Input
                    id="inviteCode"
                    type="text"
                    placeholder="Enter your invite code (optional)"
                    value={formData.inviteCode}
                    onChange={(e) => {
                      console.log("✏️ [INVITE-CODE] Input changed:", e.target.value);
                      setFormData({ ...formData, inviteCode: e.target.value });
                      setCodeStatus("idle");
                    }}
                    onBlur={handleInviteCodeBlur}
                    disabled={isLoading}
                    className={
                      codeStatus === "valid" 
                        ? "border-green-500" 
                        : codeStatus === "invalid" 
                        ? "border-red-500" 
                        : ""
                    }
                  />
                  {isValidatingCode && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!isValidatingCode && codeStatus === "valid" && (
                    <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                  )}
                  {!isValidatingCode && codeStatus === "invalid" && (
                    <XCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => {
                    console.log("✏️ [FORM] Name changed:", e.target.value);
                    setFormData({ ...formData, name: e.target.value });
                  }}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => {
                    console.log("✏️ [FORM] Email changed:", e.target.value);
                    setFormData({ ...formData, email: e.target.value });
                  }}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => {
                    console.log("✏️ [FORM] Password changed, length:", e.target.value.length);
                    setFormData({ ...formData, password: e.target.value });
                  }}
                  required
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    console.log("✏️ [FORM] Confirm password changed, matches:", e.target.value === formData.password);
                    setFormData({ ...formData, confirmPassword: e.target.value });
                  }}
                  required
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <Link href="/sign-in" className="text-primary hover:underline">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}