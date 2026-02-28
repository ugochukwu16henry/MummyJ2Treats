import { Injectable, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { VendorsService } from '../vendors/vendors.service';
import { shouldUpdateMediaUrl } from '../../utils/media-preservation';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductsService {
  private extraColumnsEnsured = false;

  constructor(
    private readonly db: DatabaseService,
    private readonly vendorsService: VendorsService,
  ) {}

  private async ensureExtraColumns() {
    if (this.extraColumnsEnsured) return;
    this.extraColumnsEnsured = true;
    await this.db.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS category VARCHAR,
      ADD COLUMN IF NOT EXISTS size_label VARCHAR,
      ADD COLUMN IF NOT EXISTS ingredients TEXT,
      ADD COLUMN IF NOT EXISTS nutritional_info TEXT,
      ADD COLUMN IF NOT EXISTS image_url TEXT;
    `);
  }

  async findAll(params?: {
    vendorSlug?: string;
    minPrice?: number;
    maxPrice?: number;
    category?: string;
    isActiveOnly?: boolean;
    limit?: number;
    offset?: number;
  }) {
    await this.ensureExtraColumns();

    const conditions: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (params?.vendorSlug) {
      conditions.push(`v.slug = $${index++}`);
      values.push(params.vendorSlug);
    }
    if (params?.minPrice !== undefined) {
      conditions.push(`p.price >= $${index++}`);
      values.push(params.minPrice);
    }
    if (params?.maxPrice !== undefined) {
      conditions.push(`p.price <= $${index++}`);
      values.push(params.maxPrice);
    }
    if (params?.category) {
      conditions.push(`LOWER(p.category) = LOWER($${index++})`);
      values.push(params.category);
    }
    if (params?.isActiveOnly !== false) {
      conditions.push(`p.is_active = true`);
    }

    let where = '';
    if (conditions.length) {
      where = `WHERE ${conditions.join(' AND ')}`;
    }

    const limit = params?.limit ?? 20;
    const offset = params?.offset ?? 0;

    const result = await this.db.query(
      `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.stock,
        p.is_active,
        p.category,
        p.size_label,
        p.ingredients,
        p.nutritional_info,
        p.image_url,
        v.id as vendor_id,
        v.business_name as vendor_name,
        v.slug as vendor_slug,
        v.logo_url as vendor_logo_url
      FROM products p
      JOIN vendors v ON v.id = p.vendor_id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${index++} OFFSET $${index}
      `,
      [...values, limit, offset],
    );

    return { data: result.rows };
  }

  async findOne(id: string) {
    await this.ensureExtraColumns();
    const result = await this.db.query(
      `
      SELECT
        p.*,
        v.business_name as vendor_name,
        v.slug as vendor_slug,
        v.logo_url as vendor_logo_url,
        v.banner_url as vendor_banner_url
      FROM products p
      JOIN vendors v ON v.id = p.vendor_id
      WHERE p.id = $1
      `,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findBySlug(slug: string) {
    await this.ensureExtraColumns();
    const result = await this.db.query(
      `
      SELECT
        p.*,
        v.business_name as vendor_name,
        v.slug as vendor_slug,
        v.logo_url as vendor_logo_url,
        v.banner_url as vendor_banner_url
      FROM products p
      JOIN vendors v ON v.id = p.vendor_id
      WHERE p.slug = $1
      `,
      [slug],
    );
    return result.rows[0] ?? null;
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
        'SELECT 1 FROM products WHERE slug = $1 LIMIT 1',
        [candidate],
      );
      if (existing.rowCount === 0) {
        return candidate;
      }
      suffix += 1;
      candidate = `${slugBase}-${suffix}`;
    }
  }

  async createForVendor(vendorId: string, dto: {
    name: string;
    description?: string;
    price: number;
    stock?: number;
    category?: string;
    sizeLabel?: string;
    ingredients?: string;
    nutritionalInfo?: string;
    imageUrl?: string;
  }) {
    await this.ensureExtraColumns();

    // Enforce: unapproved vendor cannot publish
    const vendor = await this.vendorsService.findOne(vendorId);
    const active = vendor && vendor.is_verified
      ? await this.vendorsService.isVendorActive(vendorId)
      : false;
    if (!vendor || !vendor.is_verified || !active) {
      throw new ForbiddenException('Vendor is not approved or active');
    }

    const slug = await this.generateSlug(dto.name);
    const id = uuidv4();

    const result = await this.db.query(
      `
      INSERT INTO products (
        id,
        vendor_id,
        name,
        slug,
        description,
        price,
        stock,
        is_active,
        category,
        size_label,
        ingredients,
        nutritional_info,
        image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11, $12)
      RETURNING *
      `,
      [
        id,
        vendorId,
        dto.name,
        slug,
        dto.description ?? null,
        dto.price,
        dto.stock ?? 0,
        dto.category ?? null,
        dto.sizeLabel ?? null,
        dto.ingredients ?? null,
        dto.nutritionalInfo ?? null,
        dto.imageUrl ?? null,
      ],
    );

    return result.rows[0];
  }

  async updateForVendor(vendorId: string, productId: string, dto: {
    name?: string;
    description?: string;
    price?: number;
    stock?: number;
    isActive?: boolean;
    category?: string;
    sizeLabel?: string;
    ingredients?: string;
    nutritionalInfo?: string;
    imageUrl?: string;
  }) {
    await this.ensureExtraColumns();

    const productResult = await this.db.query(
      'SELECT * FROM products WHERE id = $1 AND vendor_id = $2',
      [productId, vendorId],
    );
    const product = productResult.rows[0];
    if (!product) {
      return null;
    }

    const fields: string[] = [];
    const values: any[] = [productId, vendorId];
    let index = 3;

    if (dto.name !== undefined) {
      fields.push(`name = $${index}`);
      values.push(dto.name);
      index += 1;
    }
    if (dto.description !== undefined) {
      fields.push(`description = $${index}`);
      values.push(dto.description);
      index += 1;
    }
    if (dto.price !== undefined) {
      fields.push(`price = $${index}`);
      values.push(dto.price);
      index += 1;
    }
    if (dto.stock !== undefined) {
      fields.push(`stock = $${index}`);
      values.push(dto.stock);
      index += 1;
    }
    if (dto.isActive !== undefined) {
      fields.push(`is_active = $${index}`);
      values.push(dto.isActive);
      index += 1;
    }

    if (dto.category !== undefined) {
      fields.push(`category = $${index}`);
      values.push(dto.category);
      index += 1;
    }
    if (dto.sizeLabel !== undefined) {
      fields.push(`size_label = $${index}`);
      values.push(dto.sizeLabel);
      index += 1;
    }
    if (dto.ingredients !== undefined) {
      fields.push(`ingredients = $${index}`);
      values.push(dto.ingredients);
      index += 1;
    }
    if (dto.nutritionalInfo !== undefined) {
      fields.push(`nutritional_info = $${index}`);
      values.push(dto.nutritionalInfo);
      index += 1;
    }
    if (shouldUpdateMediaUrl(dto.imageUrl)) {
      fields.push(`image_url = $${index}`);
      values.push(dto.imageUrl);
      index += 1;
    }

    if (!fields.length) {
      return product;
    }

    const result = await this.db.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $1 AND vendor_id = $2 RETURNING *`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async findByVendorSlug(slug: string, limit = 20, offset = 0) {
    await this.ensureExtraColumns();
    const result = await this.db.query(
      `
      SELECT
        p.*,
        v.business_name as vendor_name,
        v.slug as vendor_slug,
        v.logo_url as vendor_logo_url,
        v.banner_url as vendor_banner_url
      FROM products p
      JOIN vendors v ON v.id = p.vendor_id
      WHERE v.slug = $1 AND p.is_active = true
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [slug, limit, offset],
    );
    return { data: result.rows };
  }

  async findByVendorId(vendorId: string, limit = 100, offset = 0) {
    await this.ensureExtraColumns();
    const result = await this.db.query(
      `
      SELECT
        p.*,
        v.business_name as vendor_name,
        v.slug as vendor_slug
      FROM products p
      JOIN vendors v ON v.id = p.vendor_id
      WHERE p.vendor_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [vendorId, limit, offset],
    );
    return { data: result.rows };
  }

  async deleteForVendor(vendorId: string, productId: string): Promise<boolean> {
    await this.ensureExtraColumns();
    const r = await this.db.query(
      'DELETE FROM products WHERE id = $1 AND vendor_id = $2 RETURNING id',
      [productId, vendorId],
    );
    return (r.rowCount ?? 0) > 0;
  }

  async listCategories() {
    await this.ensureExtraColumns();
    const result = await this.db.query(
      `
      SELECT
        TRIM(p.category) AS name,
        COUNT(*) AS product_count
      FROM products p
      WHERE p.is_active = true
        AND p.category IS NOT NULL
        AND TRIM(p.category) <> ''
      GROUP BY TRIM(p.category)
      ORDER BY COUNT(*) DESC, TRIM(p.category) ASC
      `,
    );
    return { data: result.rows };
  }
}
