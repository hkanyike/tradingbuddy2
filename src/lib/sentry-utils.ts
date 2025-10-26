import * as Sentry from "@sentry/nextjs";

/**
 * Capture a custom error with additional context
 */
export function captureError(
  error: Error | string,
  context?: {
    level?: Sentry.SeverityLevel;
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    user?: {
      id?: string;
      email?: string;
      username?: string;
    };
  }
) {
  const errorToCapture = typeof error === 'string' ? new Error(error) : error;
  
  Sentry.captureException(errorToCapture, {
    level: context?.level || 'error',
    tags: context?.tags,
    extra: context?.extra,
    user: context?.user,
  });
}

/**
 * Capture a message (not an error)
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info'
) {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for all future events
 */
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
} | null) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb (trail of events leading to error)
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, any>,
  category?: string
) {
  Sentry.addBreadcrumb({
    message,
    data,
    category: category || 'custom',
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Wrap async function with error tracking
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context?: {
    name: string;
    tags?: Record<string, string>;
  }
): Promise<T> {
  try {
    addBreadcrumb(`Starting: ${context?.name || 'operation'}`);
    const result = await fn();
    addBreadcrumb(`Completed: ${context?.name || 'operation'}`);
    return result;
  } catch (error) {
    captureError(error as Error, {
      tags: context?.tags,
      extra: {
        operationName: context?.name,
      },
    });
    throw error;
  }
}
