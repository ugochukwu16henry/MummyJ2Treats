
import 'dotenv/config';
// Database seed script for MummyJ2Treats
// Run with: pnpm ts-node database/seed.ts

import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  await client.connect();

  // Example: Insert categories
  await client.query(`
    INSERT INTO categories (id, name, slug) VALUES
      ('00000000-0000-0000-0000-000000000001', 'Small Chops', 'small-chops'),
      ('00000000-0000-0000-0000-000000000002', 'Buffets', 'buffets'),
      ('00000000-0000-0000-0000-000000000003', 'Drinks', 'drinks'),
      ('00000000-0000-0000-0000-000000000004', 'Cakes', 'cakes'),
      ('00000000-0000-0000-0000-000000000005', 'Parfait', 'parfait')
    ON CONFLICT (slug) DO NOTHING;
  `);

  // Example: Insert a vendor
  await client.query(`
    INSERT INTO users (id, role, first_name, last_name, email, phone, password_hash, is_active)
    VALUES ('00000000-0000-0000-0000-000000000010', 'vendor', 'Jane', 'Doe', 'jane@vendor.com', '08012345678', 'hashedpassword', true)
    ON CONFLICT (email) DO NOTHING;
  `);
  await client.query(`
    INSERT INTO vendors (id, user_id, business_name, slug, is_verified)
    VALUES ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'Jane Treats', 'jane-treats', true)
    ON CONFLICT (slug) DO NOTHING;
  `);

  // Example: Insert a product
  await client.query(`
    INSERT INTO products (id, vendor_id, name, slug, price, stock, is_active)
    VALUES ('00000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000020', 'Spring Rolls', 'spring-rolls', 2500, 100, true)
    ON CONFLICT (slug) DO NOTHING;
  `);

  await client.end();
  console.log('Database seeded successfully.');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
