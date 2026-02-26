import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import * as argon2 from 'argon2';
import { Client } from 'pg';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const email = 'ugochukwuhenry16@gmail.com';
  const password = '1995Mobuchi@';
  const firstName = 'Henry';
  const lastName = 'Ugochukwu';
  const role = 'admin';

  const passwordHash = await argon2.hash(password);
  const id = uuidv4();

  const existing = await client.query('SELECT * FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    // Ensure the existing founder account is an active admin and reset the password
    await client.query(
      `UPDATE users
       SET role = $2,
           first_name = COALESCE(first_name, $3),
           last_name = COALESCE(last_name, $4),
           password_hash = $5,
           is_active = true
       WHERE email = $1`,
      [email, role, firstName, lastName, passwordHash],
    );
    console.log('Existing admin updated with new password:', email);
  } else {
    await client.query(
      `INSERT INTO users (id, role, first_name, last_name, email, password_hash, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [id, role, firstName, lastName, email, passwordHash]
    );
    console.log('Founder admin created:', email);
  }
  await client.end();
}

main().catch((err) => {
  console.error('Error creating admin:', err);
  process.exit(1);
});
