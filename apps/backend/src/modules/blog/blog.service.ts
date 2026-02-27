import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { VendorsService } from '../vendors/vendors.service';
import { UsersService } from '../users/users.service';
import { v4 as uuidv4 } from 'uuid';

type BlogStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  location_state: string | null;
  location_city: string | null;
  featured_image_url: string | null;
  reading_time_minutes: number | null;
  published_at: string | null;
  created_at: string;
  views_count: number;
  author_name: string | null;
  author_slug: string | null;
  author_avatar_url: string | null;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  media_embeds: { provider: string | null; url: string }[];
}

@Injectable()
export class BlogService {
  private initialized = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly vendorsService: VendorsService,
    private readonly usersService: UsersService,
  ) {
    // Best-effort lazy schema initialization
    void this.ensureTables();
  }

  private async ensureTables() {
    if (this.initialized) return;
    this.initialized = true;

    // Core blog posts table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id UUID PRIMARY KEY,
        vendor_id UUID REFERENCES vendors(id),
        title VARCHAR NOT NULL,
        slug VARCHAR UNIQUE NOT NULL,
        excerpt TEXT,
        content TEXT NOT NULL,
        category VARCHAR,
        location_state VARCHAR,
        location_city VARCHAR,
        featured_image_url TEXT,
        reading_time_minutes INT,
        status VARCHAR NOT NULL CHECK (status IN ('DRAFT','PENDING_REVIEW','PUBLISHED','REJECTED','ARCHIVED')),
        seo_title VARCHAR,
        seo_description TEXT,
        og_image_url TEXT,
        views_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        published_at TIMESTAMP
      );
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_vendor_id ON blog_posts(vendor_id);
    `);

    // Subscriptions table (per-author and global)
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS blog_subscriptions (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        vendor_id UUID REFERENCES vendors(id),
        is_global BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now()
      );
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_subscriptions_user_vendor
      ON blog_subscriptions(user_id, vendor_id);
    `);

    // Media embeds table – we store provider + URL, frontend renders safely
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS blog_media_embeds (
        id UUID PRIMARY KEY,
        post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
        provider VARCHAR,
        url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      );
    `);
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_blog_media_embeds_post_id ON blog_media_embeds(post_id);
    `);
  }

  private async generateSlug(base: string): Promise<string> {
    const slugBase = base
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slugBase) {
      return uuidv4();
    }

    let candidate = slugBase;
    let suffix = 1;
    // ensure unique slug
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.db.query(
        'SELECT 1 FROM blog_posts WHERE slug = $1 LIMIT 1',
        [candidate],
      );
      if (existing.rowCount === 0) {
        return candidate;
      }
      suffix += 1;
      candidate = `${slugBase}-${suffix}`;
    }
  }

  async listPublicPosts(params?: {
    search?: string;
    vendorSlug?: string;
    category?: string;
    state?: string;
    city?: string;
    sort?: 'recent' | 'popular';
    limit?: number;
    offset?: number;
  }): Promise<{ data: BlogPostSummary[] }> {
    await this.ensureTables();

    const conditions: string[] = ['p.status = $1'];
    const values: any[] = ['PUBLISHED'];
    let index = 2;

    if (params?.search) {
      conditions.push(
        `(p.title ILIKE $${index} OR p.excerpt ILIKE $${index} OR p.content ILIKE $${index})`,
      );
      values.push(`%${params.search}%`);
      index += 1;
    }
    if (params?.vendorSlug) {
      conditions.push(`v.slug = $${index}`);
      values.push(params.vendorSlug);
      index += 1;
    }
    if (params?.category) {
      conditions.push(`p.category = $${index}`);
      values.push(params.category);
      index += 1;
    }
    if (params?.state) {
      conditions.push(`p.location_state = $${index}`);
      values.push(params.state);
      index += 1;
    }
    if (params?.city) {
      conditions.push(`p.location_city = $${index}`);
      values.push(params.city);
      index += 1;
    }

    let where = '';
    if (conditions.length) {
      where = `WHERE ${conditions.join(' AND ')}`;
    }

    const sort = params?.sort ?? 'recent';
    const orderBy =
      sort === 'popular'
        ? 'ORDER BY p.views_count DESC, p.published_at DESC NULLS LAST'
        : 'ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC';

    const limit = params?.limit ?? 12;
    const offset = params?.offset ?? 0;

    const result = await this.db.query<BlogPostSummary>(
      `
      SELECT
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.category,
        p.location_state,
        p.location_city,
        p.featured_image_url,
        p.reading_time_minutes,
        p.published_at,
        p.created_at,
        p.views_count,
        v.business_name as author_name,
        v.slug as author_slug,
        v.logo_url as author_avatar_url
      FROM blog_posts p
      LEFT JOIN vendors v ON v.id = p.vendor_id
      ${where}
      ${orderBy}
      LIMIT $${index} OFFSET $${index + 1}
      `,
      [...values, limit, offset],
    );

    return { data: result.rows };
  }

  async getPublicPostBySlug(slug: string): Promise<BlogPostDetail | null> {
    await this.ensureTables();

    const result = await this.db.query<any>(
      `
      SELECT
        p.*,
        v.business_name as author_name,
        v.slug as author_slug,
        v.logo_url as author_avatar_url
      FROM blog_posts p
      LEFT JOIN vendors v ON v.id = p.vendor_id
      WHERE p.slug = $1 AND p.status = 'PUBLISHED'
      `,
      [slug],
    );
    const row = result.rows[0];
    if (!row) {
      return null;
    }

    // Increment view count asynchronously (fire and forget)
    void this.db.query('UPDATE blog_posts SET views_count = views_count + 1 WHERE id = $1', [
      row.id,
    ]);

    const embeds = await this.db.query<{ provider: string | null; url: string }>(
      'SELECT provider, url FROM blog_media_embeds WHERE post_id = $1 ORDER BY created_at ASC',
      [row.id],
    );

    const detail: BlogPostDetail = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      category: row.category,
      location_state: row.location_state,
      location_city: row.location_city,
      featured_image_url: row.featured_image_url,
      reading_time_minutes: row.reading_time_minutes,
      published_at: row.published_at,
      created_at: row.created_at,
      views_count: row.views_count,
      author_name: row.author_name,
      author_slug: row.author_slug,
      author_avatar_url: row.author_avatar_url,
      content: row.content,
      seo_title: row.seo_title,
      seo_description: row.seo_description,
      og_image_url: row.og_image_url,
      media_embeds: embeds.rows,
    };

    return detail;
  }

  async listPublicPostsByAuthorSlug(
    vendorSlug: string,
    limit = 20,
    offset = 0,
  ): Promise<{ data: BlogPostSummary[] }> {
    await this.ensureTables();

    const result = await this.db.query<BlogPostSummary>(
      `
      SELECT
        p.id,
        p.title,
        p.slug,
        p.excerpt,
        p.category,
        p.location_state,
        p.location_city,
        p.featured_image_url,
        p.reading_time_minutes,
        p.published_at,
        p.created_at,
        p.views_count,
        v.business_name as author_name,
        v.slug as author_slug,
        v.logo_url as author_avatar_url
      FROM blog_posts p
      JOIN vendors v ON v.id = p.vendor_id
      WHERE v.slug = $1 AND p.status = 'PUBLISHED'
      ORDER BY p.published_at DESC NULLS LAST, p.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [vendorSlug, limit, offset],
    );

    return { data: result.rows };
  }

  async createDraftForVendor(
    vendorId: string,
    dto: {
      title: string;
      content: string;
      excerpt?: string;
      category?: string;
      locationState?: string;
      locationCity?: string;
      featuredImageUrl?: string;
      readingTimeMinutes?: number;
      seoTitle?: string;
      seoDescription?: string;
      ogImageUrl?: string;
      mediaEmbeds?: { provider?: string; url: string }[];
    },
  ) {
    await this.ensureTables();

    const vendor = await this.vendorsService.findOne(vendorId);
    if (!vendor) {
      throw new ForbiddenException('Vendor not found');
    }
    if (!vendor.is_verified) {
      throw new ForbiddenException('Vendor is not verified');
    }

    const slug = await this.generateSlug(dto.title);
    const id = uuidv4();

    const result = await this.db.query(
      `
      INSERT INTO blog_posts (
        id,
        vendor_id,
        title,
        slug,
        excerpt,
        content,
        category,
        location_state,
        location_city,
        featured_image_url,
        reading_time_minutes,
        status,
        seo_title,
        seo_description,
        og_image_url
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'DRAFT',$12,$13,$14
      )
      RETURNING *
      `,
      [
        id,
        vendorId,
        dto.title,
        slug,
        dto.excerpt ?? null,
        dto.content,
        dto.category ?? null,
        dto.locationState ?? null,
        dto.locationCity ?? null,
        dto.featuredImageUrl ?? null,
        dto.readingTimeMinutes ?? null,
        dto.seoTitle ?? null,
        dto.seoDescription ?? null,
        dto.ogImageUrl ?? null,
      ],
    );

    if (dto.mediaEmbeds && dto.mediaEmbeds.length) {
      for (const embed of dto.mediaEmbeds) {
        if (!embed.url) continue;
        await this.db.query(
          `
          INSERT INTO blog_media_embeds (id, post_id, provider, url)
          VALUES ($1, $2, $3, $4)
          `,
          [uuidv4(), id, embed.provider ?? null, embed.url],
        );
      }
    }

    return result.rows[0];
  }

  async updateDraftForVendor(
    vendorId: string,
    postId: string,
    dto: {
      title?: string;
      content?: string;
      excerpt?: string | null;
      category?: string | null;
      locationState?: string | null;
      locationCity?: string | null;
      featuredImageUrl?: string | null;
      readingTimeMinutes?: number | null;
      seoTitle?: string | null;
      seoDescription?: string | null;
      ogImageUrl?: string | null;
      status?: BlogStatus;
      mediaEmbeds?: { provider?: string; url: string }[];
    },
  ) {
    await this.ensureTables();

    const existing = await this.db.query(
      'SELECT * FROM blog_posts WHERE id = $1 AND vendor_id = $2',
      [postId, vendorId],
    );
    const post = existing.rows[0];
    if (!post) {
      return null;
    }
    if (post.status === 'ARCHIVED') {
      throw new ForbiddenException('Archived posts cannot be modified');
    }

    const fields: string[] = [];
    const values: any[] = [postId, vendorId];
    let index = 3;

    if (dto.title !== undefined) {
      fields.push(`title = $${index}`);
      values.push(dto.title);
      index += 1;
    }
    if (dto.content !== undefined) {
      fields.push(`content = $${index}`);
      values.push(dto.content);
      index += 1;
    }
    if (dto.excerpt !== undefined) {
      fields.push(`excerpt = $${index}`);
      values.push(dto.excerpt);
      index += 1;
    }
    if (dto.category !== undefined) {
      fields.push(`category = $${index}`);
      values.push(dto.category);
      index += 1;
    }
    if (dto.locationState !== undefined) {
      fields.push(`location_state = $${index}`);
      values.push(dto.locationState);
      index += 1;
    }
    if (dto.locationCity !== undefined) {
      fields.push(`location_city = $${index}`);
      values.push(dto.locationCity);
      index += 1;
    }
    if (dto.featuredImageUrl !== undefined) {
      fields.push(`featured_image_url = $${index}`);
      values.push(dto.featuredImageUrl);
      index += 1;
    }
    if (dto.readingTimeMinutes !== undefined) {
      fields.push(`reading_time_minutes = $${index}`);
      values.push(dto.readingTimeMinutes);
      index += 1;
    }
    if (dto.seoTitle !== undefined) {
      fields.push(`seo_title = $${index}`);
      values.push(dto.seoTitle);
      index += 1;
    }
    if (dto.seoDescription !== undefined) {
      fields.push(`seo_description = $${index}`);
      values.push(dto.seoDescription);
      index += 1;
    }
    if (dto.ogImageUrl !== undefined) {
      fields.push(`og_image_url = $${index}`);
      values.push(dto.ogImageUrl);
      index += 1;
    }
    if (dto.status !== undefined) {
      fields.push(`status = $${index}`);
      values.push(dto.status);
      index += 1;
    }

    if (fields.length) {
      fields.push(`updated_at = now()`);
    }

    let updated;
    if (fields.length) {
      const result = await this.db.query(
        `
        UPDATE blog_posts
        SET ${fields.join(', ')}
        WHERE id = $1 AND vendor_id = $2
        RETURNING *
        `,
        values,
      );
      updated = result.rows[0] ?? null;
    } else {
      updated = post;
    }

    if (dto.mediaEmbeds) {
      // Replace embeds for this post
      await this.db.query('DELETE FROM blog_media_embeds WHERE post_id = $1', [postId]);
      for (const embed of dto.mediaEmbeds) {
        if (!embed.url) continue;
        await this.db.query(
          `
          INSERT INTO blog_media_embeds (id, post_id, provider, url)
          VALUES ($1, $2, $3, $4)
          `,
          [uuidv4(), postId, embed.provider ?? null, embed.url],
        );
      }
    }

    return updated;
  }

  async submitForReview(vendorId: string, postId: string) {
    await this.ensureTables();

    const result = await this.db.query(
      `
      UPDATE blog_posts
      SET status = 'PENDING_REVIEW', updated_at = now()
      WHERE id = $1 AND vendor_id = $2 AND status IN ('DRAFT','REJECTED')
      RETURNING *
      `,
      [postId, vendorId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new ForbiddenException('Cannot submit this post for review');
    }
    return row;
  }

  async adminListPosts(params?: {
    status?: BlogStatus;
    vendorSlug?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[] }> {
    await this.ensureTables();

    const conditions: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (params?.status) {
      conditions.push(`p.status = $${index}`);
      values.push(params.status);
      index += 1;
    }
    if (params?.vendorSlug) {
      conditions.push(`v.slug = $${index}`);
      values.push(params.vendorSlug);
      index += 1;
    }

    let where = '';
    if (conditions.length) {
      where = `WHERE ${conditions.join(' AND ')}`;
    }

    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;

    const result = await this.db.query(
      `
      SELECT
        p.*,
        v.business_name as author_name,
        v.slug as author_slug
      FROM blog_posts p
      LEFT JOIN vendors v ON v.id = p.vendor_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${index} OFFSET $${index + 1}
      `,
      [...values, limit, offset],
    );
    return { data: result.rows };
  }

  async adminApprove(postId: string) {
    await this.ensureTables();

    const result = await this.db.query(
      `
      UPDATE blog_posts
      SET status = 'PUBLISHED', published_at = COALESCE(published_at, now()), updated_at = now()
      WHERE id = $1 AND status = 'PENDING_REVIEW'
      RETURNING *
      `,
      [postId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException('Post not found or not pending review');
    }
    return row;
  }

  async adminReject(postId: string) {
    await this.ensureTables();

    const result = await this.db.query(
      `
      UPDATE blog_posts
      SET status = 'REJECTED', updated_at = now()
      WHERE id = $1 AND status IN ('PENDING_REVIEW','DRAFT')
      RETURNING *
      `,
      [postId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException('Post not found or cannot be rejected');
    }
    return row;
  }

  async adminArchive(postId: string) {
    await this.ensureTables();

    const result = await this.db.query(
      `
      UPDATE blog_posts
      SET status = 'ARCHIVED', updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [postId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException('Post not found');
    }
    return row;
  }

  async listPostsForVendor(
    vendorId: string,
    limit = 100,
    offset = 0,
  ): Promise<{ data: any[] }> {
    await this.ensureTables();

    const result = await this.db.query(
      `
      SELECT
        p.*,
        v.business_name as author_name,
        v.slug as author_slug,
        v.logo_url as author_avatar_url
      FROM blog_posts p
      JOIN vendors v ON v.id = p.vendor_id
      WHERE v.id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [vendorId, limit, offset],
    );
    return { data: result.rows };
  }

  async attachUploadedMediaForVendor(
    vendorId: string,
    postId: string,
    url: string,
    provider?: string,
  ) {
    await this.ensureTables();

    const existing = await this.db.query(
      'SELECT id FROM blog_posts WHERE id = $1 AND vendor_id = $2',
      [postId, vendorId],
    );
    if (!existing.rowCount) {
      throw new ForbiddenException('Cannot attach media to this post');
    }

    const id = uuidv4();
    await this.db.query(
      `
      INSERT INTO blog_media_embeds (id, post_id, provider, url)
      VALUES ($1, $2, $3, $4)
      `,
      [id, postId, provider ?? 'upload', url],
    );

    return { id, url, provider: provider ?? 'upload' };
  }

  async subscribeToAuthor(userId: string, vendorId: string) {
    await this.ensureTables();

    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    const vendor = await this.vendorsService.findOne(vendorId);
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    const existing = await this.db.query(
      `
      SELECT id FROM blog_subscriptions
      WHERE user_id = $1 AND vendor_id = $2 AND is_global = false
      LIMIT 1
      `,
      [userId, vendorId],
    );
    if (existing.rowCount && existing.rows[0]) {
      return existing.rows[0];
    }

    const id = uuidv4();
    const result = await this.db.query(
      `
      INSERT INTO blog_subscriptions (id, user_id, vendor_id, is_global)
      VALUES ($1, $2, $3, false)
      RETURNING id
      `,
      [id, userId, vendorId],
    );
    return result.rows[0];
  }

  async subscribeToGlobal(userId: string) {
    await this.ensureTables();

    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const existing = await this.db.query(
      `
      SELECT id FROM blog_subscriptions
      WHERE user_id = $1 AND is_global = true
      LIMIT 1
      `,
      [userId],
    );
    if (existing.rowCount && existing.rows[0]) {
      return existing.rows[0];
    }

    const id = uuidv4();
    const result = await this.db.query(
      `
      INSERT INTO blog_subscriptions (id, user_id, is_global)
      VALUES ($1, $2, true)
      RETURNING id
      `,
      [id, userId],
    );
    return result.rows[0];
  }
}

