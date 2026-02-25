import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync } from 'fs';

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();
  const sql = readFileSync('database/001_init_schema.sql', 'utf8');
  try {
    await client.query(sql);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
