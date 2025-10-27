// instrumentation.ts
// Minimal, Sentry-free instrumentation hooks for Next.js App Router.

export async function register() {
  // No-op: previously initialized Sentry here
}

// Optional: hook so server request errors don’t warn about a missing handler
export function onRequestError(err: unknown) {
  // Keep it lightweight to avoid noisy logs in prod if you prefer
  console.error('[onRequestError]', err)
}
