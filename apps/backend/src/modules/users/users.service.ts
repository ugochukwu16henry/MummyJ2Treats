import { Injectable, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

const DELETION_GRACE_DAYS = 14;

@Injectable()
export class UsersService {
  private deletionColumnsEnsured = false;

  constructor(private readonly db: DatabaseService) {}

  private async ensureDeletionColumns() {
    if (this.deletionColumnsEnsured) return;
    this.deletionColumnsEnsured = true;
    await this.db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMP NULL`);
    await this.db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS delete_after TIMESTAMP NULL`);
  }

  async findAll() {
    const result = await this.db.query('SELECT id, first_name, last_name, email, role, is_active FROM users');
    return { data: result.rows };
  }

  async findOne(id: string) {
    const result = await this.db.query('SELECT id, first_name, last_name, email, role, is_active FROM users WHERE id = $1', [id]);
    return result.rows[0] ?? null;
  }

  async update(id: string, dto: Record<string, unknown>) {
    const fields = Object.keys(dto);
    if (!fields.length) {
      const existing = await this.findOne(id);
      return existing;
    }

    const setClauses = fields.map((field, index) => `${field} = $${index + 2}`);
    const values = fields.map((field) => dto[field]);

    const result = await this.db.query(
      `UPDATE users SET ${setClauses.join(', ')}, updated_at = now() WHERE id = $1 RETURNING id, first_name, last_name, email, role, is_active`,
      [id, ...values],
    );
    return result.rows[0] ?? null;
  }

  async findByEmail(email: string) {
    const result = await this.db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ?? null;
  }

  /** Case-insensitive lookup so we detect existing accounts regardless of email casing. */
  async findByEmailIgnoreCase(email: string) {
    const result = await this.db.query('SELECT * FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))', [email]);
    return result.rows[0] ?? null;
  }

  /** Admin only: delete a user (e.g. customer) by id. */
  async deleteUser(id: string): Promise<boolean> {
    const r = await this.db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return (r.rowCount ?? 0) > 0;
  }

  /** Self-service: request account deletion. Account is purged after 2 weeks. Admin cannot use this. */
  async requestAccountDeletion(userId: string): Promise<{ deleteAfter: string }> {
    await this.ensureDeletionColumns();
    const user = await this.db.query<{ role: string }>(
      'SELECT role FROM users WHERE id = $1',
      [userId],
    );
    const row = user.rows[0];
    if (!row) throw new ForbiddenException('User not found');
    if (row.role === 'admin') {
      throw new ForbiddenException('Founder admin account cannot be deleted via self-service.');
    }
    const deleteAfter = new Date();
    deleteAfter.setDate(deleteAfter.getDate() + DELETION_GRACE_DAYS);
    await this.db.query(
      `UPDATE users SET deletion_requested_at = NOW(), delete_after = $2, updated_at = NOW() WHERE id = $1`,
      [userId, deleteAfter.toISOString()],
    );
    return { deleteAfter: deleteAfter.toISOString() };
  }

  /** Get current user's deletion status. */
  async getDeletionStatus(userId: string): Promise<{ deletionRequestedAt: string | null; deleteAfter: string | null } | null> {
    await this.ensureDeletionColumns();
    const r = await this.db.query<{ deletion_requested_at: string | null; delete_after: string | null }>(
      'SELECT deletion_requested_at, delete_after FROM users WHERE id = $1',
      [userId],
    );
    const row = r.rows[0];
    if (!row) return null;
    return {
      deletionRequestedAt: row.deletion_requested_at,
      deleteAfter: row.delete_after,
    };
  }

  /** Cancel scheduled deletion. */
  async cancelDeletion(userId: string): Promise<boolean> {
    await this.ensureDeletionColumns();
    const r = await this.db.query(
      `UPDATE users SET deletion_requested_at = NULL, delete_after = NULL, updated_at = NOW() WHERE id = $1 RETURNING id`,
      [userId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  /** Purge users whose delete_after <= now(). Call daily (e.g. admin cron). */
  async purgeScheduledDeletions(): Promise<{ purged: number }> {
    await this.ensureDeletionColumns();
    const list = await this.db.query<{ id: string; role: string }>(
      `SELECT id, role FROM users WHERE delete_after IS NOT NULL AND delete_after <= NOW()`,
    );
    let purged = 0;
    for (const user of list.rows) {
      try {
        await this.purgeUser(user.id, user.role);
        purged += 1;
      } catch {
        // log and continue
      }
    }
    return { purged };
  }

  private async purgeUser(userId: string, role: string): Promise<void> {
    if (role === 'rider') {
      const rider = await this.db.query<{ id: string }>('SELECT id FROM riders WHERE user_id = $1', [userId]);
      if (rider.rows[0]) {
        const riderId = rider.rows[0].id;
        await this.db.query('UPDATE orders SET rider_id = NULL WHERE rider_id = $1', [riderId]);
        await this.db.query('DELETE FROM rider_location_logs WHERE rider_id = $1', [riderId]);
        await this.db.query('DELETE FROM riders WHERE id = $1', [riderId]);
      }
    }
    if (role === 'vendor') {
      const vendor = await this.db.query<{ id: string }>('SELECT id FROM vendors WHERE user_id = $1', [userId]);
      if (vendor.rows[0]) {
        const vendorId = vendor.rows[0].id;
        const posts = await this.db.query<{ id: string }>('SELECT id FROM blog_posts WHERE vendor_id = $1', [vendorId]);
        for (const p of posts.rows) {
          await this.db.query('DELETE FROM blog_media_embeds WHERE post_id = $1', [p.id]);
        }
        await this.db.query('DELETE FROM blog_posts WHERE vendor_id = $1', [vendorId]);
        await this.db.query('DELETE FROM blog_subscriptions WHERE vendor_id = $1', [vendorId]);
        await this.db.query('DELETE FROM products WHERE vendor_id = $1', [vendorId]);
        await this.db.query('UPDATE orders SET vendor_id = NULL WHERE vendor_id = $1', [vendorId]);
        await this.db.query('DELETE FROM vendor_profiles WHERE vendor_id = $1', [vendorId]);
        await this.db.query('DELETE FROM vendors WHERE id = $1', [vendorId]);
      }
    }
    if (role === 'customer') {
      await this.db.query('DELETE FROM carts WHERE customer_id = $1', [userId]);
      await this.db.query('UPDATE orders SET customer_id = NULL WHERE customer_id = $1', [userId]);
    }
    await this.db.query('DELETE FROM users WHERE id = $1', [userId]);
  }

  async anyAdminExists(): Promise<boolean> {
    const result = await this.db.query(
      'SELECT 1 FROM users WHERE role = $1 LIMIT 1',
      ['admin'],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async createUser(params: {
    role: 'admin' | 'vendor' | 'customer' | 'rider';
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passwordHash: string;
  }) {
    const id = uuidv4();
    const emailLower = params.email.trim().toLowerCase();
    const result = await this.db.query(
      `INSERT INTO users (id, role, first_name, last_name, email, phone, password_hash, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, role, first_name, last_name, email, phone, is_active`,
      [id, params.role, params.firstName, params.lastName, emailLower, params.phone ?? null, params.passwordHash],
    );
    return result.rows[0];
  }
}
