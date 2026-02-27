import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NewsletterService {
  constructor(private readonly db: DatabaseService) {}

  async subscribe(email: string) {
    const trimmed = (email || '').trim().toLowerCase();
    if (!trimmed) {
      throw new BadRequestException('Email is required');
    }

    const id = uuidv4();
    const result = await this.db.query(
      `INSERT INTO newsletter_subscriptions (id, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING *`,
      [id, trimmed],
    );
    return result.rows[0];
  }

  async listAll(limit = 500) {
    const r = await this.db.query(
      `SELECT id, email, created_at
       FROM newsletter_subscriptions
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit],
    );
    return { data: r.rows };
  }
}

