# 🔍 Sentry Error Monitoring Setup Guide

## ✅ What's Been Installed

Your Trading Buddy app now has **complete error monitoring** with Sentry! Here's what's configured:

### Files Created
- ✅ `sentry.client.config.ts` - Browser error tracking
- ✅ `sentry.server.config.ts` - Server-side error tracking  
- ✅ `sentry.edge.config.ts` - Edge runtime error tracking
- ✅ `instrumentation.ts` - Initializes Sentry across all runtimes
- ✅ `src/components/error-boundary.tsx` - React error boundary with auto-reporting
- ✅ `src/app/global-error.tsx` - Global error handler
- ✅ `src/lib/sentry-utils.ts` - Helper utilities for custom error tracking
- ✅ `next.config.ts` - Updated with Sentry webpack plugin

### Features Enabled
- 🎯 **Automatic error capture** (client, server, and edge)
- 📊 **Performance monitoring** (traces API calls, page loads)
- 🎬 **Session replay** (10% of sessions, 100% with errors)
- 🍞 **Breadcrumbs** (tracks user actions before errors)
- 🚫 **Error filtering** (excludes development errors and noise)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Get Your Sentry DSN

1. **Go to [sentry.io](https://sentry.io)** and create a free account
2. **Create a new project:**
   - Platform: **Next.js**
   - Project name: `trading-buddy`
3. **Copy your DSN** (looks like: `https://abc123@o123456.ingest.sentry.io/987654`)

### Step 2: Add Environment Variables

Add to your `.env` file:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_DSN_HERE@o123456.ingest.sentry.io/987654

# Optional: For source map uploads (production only)
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=trading-buddy
SENTRY_AUTH_TOKEN=your-auth-token
```

**Where to get these:**
- `NEXT_PUBLIC_SENTRY_DSN`: From Step 1 above
- `SENTRY_ORG`: Your organization slug (in Sentry settings)
- `SENTRY_PROJECT`: Your project slug (`trading-buddy`)
- `SENTRY_AUTH_TOKEN`: Create in Sentry → Settings → Auth Tokens

### Step 3: Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

**That's it!** Errors will now be automatically tracked. 🎉

---

## 📱 Testing on Mobile Devices

### Method 1: Local Network Access

**Find your computer's local IP:**

**Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Or
hostname -I
```

**Windows (Command Prompt):**
```bash
ipconfig
```
Look for "IPv4 Address" (usually `192.168.x.x` or `10.0.x.x`)

**Access from mobile:**
1. Ensure both devices are on the **same WiFi network**
2. On your mobile browser, go to: `http://YOUR_LOCAL_IP:3000`
   - Example: `http://192.168.1.105:3000`

**If it doesn't work:**

Update `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0",
    "start": "next start -H 0.0.0.0"
  }
}
```

The `-H 0.0.0.0` flag allows external connections.

### Method 2: Use Ngrok (Tunnel)

If local network access doesn't work:

```bash
# Install ngrok
npm install -g ngrok

# Start your dev server
npm run dev

# In another terminal, create tunnel
ngrok http 3000
```

You'll get a public URL like: `https://abc123.ngrok.io` - use this on any device!

---

## 🎯 How to Use Sentry in Your Code

### Automatic Error Tracking

**Already working!** All unhandled errors are automatically captured:

```tsx
// This error will be automatically reported to Sentry
throw new Error("Something went wrong!");
```

### Manual Error Tracking

**Capture specific errors with context:**

```tsx
import { captureError, addBreadcrumb } from "@/lib/sentry-utils";

try {
  await fetchUserData();
} catch (error) {
  captureError(error as Error, {
    level: 'error',
    tags: {
      feature: 'user-profile',
      action: 'fetch-data'
    },
    extra: {
      userId: user.id,
      timestamp: Date.now()
    }
  });
}
```

### Track User Actions (Breadcrumbs)

```tsx
import { addBreadcrumb } from "@/lib/sentry-utils";

// Track important user actions
addBreadcrumb('User clicked Buy button', { 
  symbol: 'AAPL',
  quantity: 100 
}, 'user-action');

addBreadcrumb('API call started', {
  endpoint: '/api/positions'
}, 'api');
```

### Set User Context

```tsx
import { setUser } from "@/lib/sentry-utils";

// After user logs in
setUser({
  id: session.user.id,
  email: session.user.email,
  username: session.user.name
});

// After logout
setUser(null);
```

### Track Performance

```tsx
import { startTransaction } from "@/lib/sentry-utils";

const transaction = startTransaction('Load Dashboard', 'page-load');

try {
  await loadDashboardData();
  transaction.finish();
} catch (error) {
  transaction.setStatus('error');
  transaction.finish();
  throw error;
}
```

### Wrap Async Operations

```tsx
import { withErrorTracking } from "@/lib/sentry-utils";

// Automatically track errors in async functions
const result = await withErrorTracking(
  async () => {
    return await complexOperation();
  },
  {
    name: 'Complex Operation',
    tags: { feature: 'trading' }
  }
);
```

---

## 📊 Real-World Examples for Trading Buddy

### Example 1: Track Position Creation Errors

```tsx
// In your dashboard or position component
const handleCreatePosition = async () => {
  addBreadcrumb('Starting position creation', {
    symbol: newPositionForm.symbol,
    quantity: newPositionForm.quantity
  });

  try {
    const res = await fetch("/api/positions", {
      method: "POST",
      body: JSON.stringify(formData)
    });
    
    if (!res.ok) {
      throw new Error(`Failed to create position: ${res.status}`);
    }
    
    addBreadcrumb('Position created successfully');
  } catch (error) {
    captureError(error as Error, {
      level: 'error',
      tags: {
        feature: 'positions',
        action: 'create'
      },
      extra: {
        symbol: newPositionForm.symbol,
        positionType: newPositionForm.positionType
      }
    });
    toast.error("Failed to create position");
  }
};
```

### Example 2: Track API Failures

```tsx
// In API route handler
import { captureError } from "@/lib/sentry-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Your logic here
    
    return Response.json({ success: true });
  } catch (error) {
    captureError(error as Error, {
      level: 'error',
      tags: {
        api: 'positions',
        method: 'POST'
      },
      extra: {
        requestBody: body
      }
    });
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Example 3: Track WebSocket Connection Issues

```tsx
// In your Alpaca WebSocket integration
ws.onError((error) => {
  captureError(new Error('Alpaca WebSocket error'), {
    level: 'warning',
    tags: {
      feature: 'websocket',
      provider: 'alpaca'
    },
    extra: {
      error: error,
      timestamp: Date.now()
    }
  });
});

ws.onDisconnected(() => {
  addBreadcrumb('WebSocket disconnected', {
    provider: 'alpaca'
  }, 'websocket');
});
```

---

## 🎛️ Sentry Dashboard

### View Your Errors

1. Go to [sentry.io](https://sentry.io)
2. Select your **trading-buddy** project
3. You'll see:
   - **Issues**: All captured errors
   - **Performance**: API response times, page loads
   - **Replays**: Video playback of user sessions with errors

### Key Features to Explore

**🔍 Issue Details:**
- Full stack trace
- User context (who experienced it)
- Breadcrumbs (what they did before error)
- Device/browser info
- Number of users affected

**📊 Performance Monitoring:**
- Slowest API endpoints
- Page load times
- Database query performance
- External API call duration

**🎬 Session Replay:**
- Watch exactly what user did
- See console logs
- Network requests timeline
- DOM mutations

---

## 🎯 Best Practices

### 1. Add Context to Errors

```tsx
// ❌ Bad - no context
throw new Error("Failed");

// ✅ Good - with context
captureError(new Error("Failed to fetch user positions"), {
  tags: { feature: 'positions' },
  extra: { userId: user.id }
});
```

### 2. Use Breadcrumbs Liberally

```tsx
// Track user journey
addBreadcrumb('User navigated to dashboard');
addBreadcrumb('User clicked "Add Position" button');
addBreadcrumb('User entered symbol: AAPL');
addBreadcrumb('User clicked "Create Position"');
// Error occurs here - you'll see the full journey!
```

### 3. Set User Context Early

```tsx
// In your auth flow (after successful login)
useEffect(() => {
  if (session?.user) {
    setUser({
      id: session.user.id,
      email: session.user.email
    });
  }
}, [session]);
```

### 4. Filter Noise

Already configured to filter out:
- Development errors (only production tracked)
- `ResizeObserver loop limit exceeded`
- Non-Error promise rejections

Add more filters in `sentry.client.config.ts` if needed.

---

## 🚨 Testing Your Setup

### Test Error Capture

Add a test button temporarily:

```tsx
<Button
  onClick={() => {
    throw new Error("Test Sentry Error!");
  }}
>
  Test Sentry
</Button>
```

Click it and check Sentry dashboard - you should see the error within seconds!

### Test Manual Capture

```tsx
import { captureMessage } from "@/lib/sentry-utils";

<Button
  onClick={() => {
    captureMessage("Test message from Trading Buddy", "info");
  }}
>
  Test Message
</Button>
```

### Test Breadcrumbs

```tsx
import { addBreadcrumb } from "@/lib/sentry-utils";

<Button
  onClick={() => {
    addBreadcrumb("Test breadcrumb");
    throw new Error("Error after breadcrumb");
  }}
>
  Test Breadcrumb
</Button>
```

---

## 📈 Production Checklist

Before deploying:

- [ ] `NEXT_PUBLIC_SENTRY_DSN` is set in production environment
- [ ] Source maps are uploaded (set `SENTRY_AUTH_TOKEN`)
- [ ] Sample rates are adjusted for production traffic:
  ```ts
  tracesSampleRate: 0.1, // 10% in production (reduce costs)
  replaysSessionSampleRate: 0.01, // 1% in production
  ```
- [ ] User context is set after authentication
- [ ] Critical user actions have breadcrumbs
- [ ] API errors are captured with context
- [ ] Test error capture in production (use test account)

---

## 🛟 Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN is set:** `console.log(process.env.NEXT_PUBLIC_SENTRY_DSN)`
2. **Check network:** Open DevTools → Network → Look for requests to `sentry.io`
3. **Check filtering:** Errors might be filtered out (dev mode, specific error types)
4. **Check project:** Make sure you're looking at correct project in Sentry

### Source Maps Not Working

1. **Set auth token:** `SENTRY_AUTH_TOKEN` in `.env`
2. **Enable uploads:** Check `next.config.ts` has `withSentryConfig`
3. **Check build output:** Look for "Sentry: Uploading source maps" during build

### Performance Issues

If Sentry is slowing down your app:

1. **Reduce sample rates:**
   ```ts
   tracesSampleRate: 0.1, // Sample only 10%
   replaysSessionSampleRate: 0.01, // Replay 1% of sessions
   ```

2. **Disable in development:**
   ```ts
   if (process.env.NODE_ENV === 'development') {
     return null;
   }
   ```

---

## 📚 Additional Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)
- [Error Filtering](https://docs.sentry.io/platform-redirect/?next=/configuration/filtering/)

---

## 🎉 You're All Set!

Your Trading Buddy app now has **enterprise-grade error monitoring**! Every error, performance issue, and user problem will be automatically tracked and reported.

**Next Steps:**
1. ✅ Set up your Sentry account and get your DSN
2. ✅ Add `NEXT_PUBLIC_SENTRY_DSN` to `.env`
3. ✅ Test with a test error button
4. ✅ Monitor your dashboard at [sentry.io](https://sentry.io)

Happy trading! 🚀📈
