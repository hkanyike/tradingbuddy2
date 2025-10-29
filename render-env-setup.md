# Render Environment Variables Setup

## Required Environment Variables

Set these in your Render dashboard under "Environment" tab:

### 1. NextAuth Configuration
```
NEXTAUTH_URL=https://tradingbuddy2.onrender.com
NEXTAUTH_SECRET=your-secret-key-here
```

### 2. Database Configuration (Turso)
```
DATABASE_URL=libsql://your-database-name.turso.io
TURSO_CONNECTION_URL=libsql://your-database-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

### 3. Optional API Keys
```
ALPACA_API_KEY=your-alpaca-key
ALPACA_API_SECRET=your-alpaca-secret
OPENAI_API_KEY=your-openai-key
```

## How to Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## How to Get Turso Credentials

1. Go to [turso.tech](https://turso.tech)
2. Create a database
3. Get the database URL and auth token from the dashboard

## Next Steps

1. Set up these environment variables in Render
2. Wait for the new deployment to complete
3. Test the site at https://tradingbuddy2.onrender.com
