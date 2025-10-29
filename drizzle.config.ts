import { defineConfig } from 'drizzle-kit';
import type { Config } from 'drizzle-kit';

// Safe fallback for build time - supports both TURSO_* and DATABASE_* env vars
const url = 
  process.env.TURSO_CONNECTION_URL || 
  process.env.DATABASE_URL || 
  'file:./local.db';

const authToken = 
  process.env.TURSO_AUTH_TOKEN || 
  process.env.DATABASE_AUTH_TOKEN || 
  undefined;

const dbConfig: Config = defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url,
    authToken,
  },
});

export default dbConfig;