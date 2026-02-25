import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  try {
    const dir = 'database';
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

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
