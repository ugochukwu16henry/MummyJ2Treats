import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database successfully!');
    return client.end();
  })
  .catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
