import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TestimonialsService {
  constructor(private readonly db: DatabaseService) {}

  async create(params: {
    userId?: string | null;
    target: 'founder' | 'vendor';
    vendorId?: string | null;
    content: string;
    imageUrl?: string;
  }) {
    if (!params.content.trim()) {
      throw new BadRequestException('Content is required');
    }

    const result = await this.db.query(
      `INSERT INTO testimonials (
        id, user_id, vendor_id, target_type, content, image_url
      ) VALUES (
        $1, $2, $3, $4, $5, $6
      )
      RETURNING *`,
      [
        uuidv4(),
        params.userId ?? null,
        params.vendorId ?? null,
        params.target,
        params.content.trim(),
        params.imageUrl ?? null,
      ],
    );
    return result.rows[0];
  }

  async listApprovedForFounder(limit = 10) {
    const r = await this.db.query(
      `SELECT t.*, u.first_name, u.last_name
       FROM testimonials t
       LEFT JOIN users u ON u.id = t.user_id
       WHERE t.target_type = 'founder' AND t.is_approved = true
       ORDER BY t.created_at DESC
       LIMIT $1`,
      [limit],
    );
    return { data: r.rows };
  }

  async listApprovedForVendorSlug(slug: string, limit = 10) {
    const r = await this.db.query(
      `SELECT t.*, u.first_name, u.last_name
       FROM testimonials t
       JOIN vendors v ON v.id = t.vendor_id
       LEFT JOIN users u ON u.id = t.user_id
       WHERE t.target_type = 'vendor' AND t.is_approved = true AND v.slug = $1
       ORDER BY t.created_at DESC
       LIMIT $2`,
      [slug, limit],
    );
    return { data: r.rows };
  }

  async listForAdmin(opts: { status?: 'pending' | 'approved'; target?: 'founder' | 'vendor' }) {
    const conditions: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (opts.status === 'pending') {
      conditions.push('t.is_approved = false');
    }
    if (opts.status === 'approved') {
      conditions.push('t.is_approved = true');
    }
    if (opts.target) {
      conditions.push(`t.target_type = $${index++}`);
      values.push(opts.target);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const r = await this.db.query(
      `SELECT t.*, u.first_name, u.last_name, v.business_name AS vendor_name, v.slug AS vendor_slug
       FROM testimonials t
       LEFT JOIN users u ON u.id = t.user_id
       LEFT JOIN vendors v ON v.id = t.vendor_id
       ${where}
       ORDER BY t.created_at DESC
       LIMIT 100`,
      values,
    );
    return { data: r.rows };
  }

  async approve(id: string) {
    const r = await this.db.query(
      `UPDATE testimonials
       SET is_approved = true, approved_at = now()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    if (!r.rows[0]) {
      throw new BadRequestException('Testimonial not found');
    }
    return r.rows[0];
  }

  async delete(id: string) {
    const r = await this.db.query(
      `DELETE FROM testimonials
       WHERE id = $1
       RETURNING *`,
      [id],
    );
    if (!r.rows[0]) {
      throw new BadRequestException('Testimonial not found');
    }
    return { success: true };
  }
}

