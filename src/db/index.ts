import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';

const sqlite = new Database(Bun.env.DATABASE_FILE);
export const db = drizzle({ client: sqlite });

