"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md space-y-4 rounded-lg border border-destructive/50 p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h2 className="text-2xl font-bold">Critical Error</h2>
            </div>
            <p className="text-muted-foreground">
              We've encountered a critical error. Our team has been notified and is working on a fix.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-mono text-muted-foreground">
                  {error.message}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="flex-1 rounded-md bg-secondary px-4 py-2 hover:bg-secondary/80"
              >
                <RefreshCw className="mr-2 inline h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="flex-1 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}