import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Always load .env from project root (works for both CJS and ESM)
dotenvConfig({ path: resolve(process.cwd(), '.env') });

// Debug: Print DATABASE_URL with password masked
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL.replace(/(postgres:\/\/[^:]+:)[^@]+(@)/, '$1*****$2');
  console.log('DATABASE_URL:', url);
} else {
  console.log('DATABASE_URL is not set');
}
import { Client } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  try {
    const dir = 'database';
    let files = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    // If base schema already exists (users table), skip 001_init_schema.sql
    const hasUsers = await client.query(
      "SELECT to_regclass('public.users') as reg",
    );
    if (hasUsers.rows[0]?.reg) {
      files = files.filter((f) => f !== '001_init_schema.sql');
    }

    for (const file of files) {
      const sql = readFileSync(join(dir, file), 'utf8');
      console.log(`Running migration: ${file}`);
      await client.query(sql);
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
