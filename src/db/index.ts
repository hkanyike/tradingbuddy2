import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

// Be resilient during builds: fall back to a local file DB if env vars
// are not present at build time. At runtime, Render/Vercel set the vars.
const url =
  process.env.TURSO_CONNECTION_URL ||
  process.env.DATABASE_URL ||
  'file:./local.db';

const authToken =
  process.env.TURSO_AUTH_TOKEN ||
  process.env.DATABASE_AUTH_TOKEN ||
  undefined;

const client = createClient(
  authToken
    ? { url, authToken }
    : { url }
);

export const db = drizzle(client, { schema });

export type Database = typeof db;
