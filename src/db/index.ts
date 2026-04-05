import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './napkin-a2a.db';
const sqlite = new Database(path.resolve(process.cwd(), dbPath));
sqlite.pragma('journal_mode = WAL');
export const db = drizzle(sqlite, { schema });
export { schema };
