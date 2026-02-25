import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CartService {
  constructor(private readonly db: DatabaseService) {}

  private async getOrCreateOpenCart(customerId: string) {
    const existing = await this.db.query(
      'SELECT * FROM carts WHERE customer_id = $1 AND status = $2 LIMIT 1',
      [customerId, 'OPEN'],
    );
    if (existing.rows[0]) return existing.rows[0];

    const id = uuidv4();
    const result = await this.db.query(
      `INSERT INTO carts (id, customer_id, status)
       VALUES ($1, $2, 'OPEN')
       RETURNING *`,
      [id, customerId],
    );
    return result.rows[0];
  }

  async getMyCart(customerId: string) {
    const cartResult = await this.db.query(
      'SELECT * FROM carts WHERE customer_id = $1 AND status = $2 LIMIT 1',
      [customerId, 'OPEN'],
    );
    const cart = cartResult.rows[0];
    if (!cart) {
      return { cart: null, items: [], subtotal: 0 };
    }

    const itemsResult = await this.db.query(
      `
      SELECT
        ci.product_id,
        ci.quantity,
        ci.unit_price,
        p.name,
        p.slug,
        p.price,
        v.business_name as vendor_name
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      JOIN vendors v ON v.id = p.vendor_id
      WHERE ci.cart_id = $1
      `,
      [cart.id],
    );

    const items = itemsResult.rows.map((row) => ({
      productId: row.product_id,
      name: row.name,
      slug: row.slug,
      vendorName: row.vendor_name,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unit_price),
      lineTotal: Number(row.unit_price) * Number(row.quantity),
    }));

    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

    return { cart, items, subtotal };
  }

  async addItem(customerId: string, dto: { productId: string; quantity: number }) {
    if (!dto.quantity || dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }
    const cart = await this.getOrCreateOpenCart(customerId);

    // Get latest product price and ensure product is active
    const productResult = await this.db.query(
      'SELECT id, price, is_active FROM products WHERE id = $1',
      [dto.productId],
    );
    const product = productResult.rows[0];
    if (!product || !product.is_active) {
      throw new BadRequestException('Product is not available');
    }

    // Upsert cart item
    const existingItemResult = await this.db.query(
      'SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2',
      [cart.id, dto.productId],
    );
    const existing = existingItemResult.rows[0];
    const newQty = existing ? Number(existing.quantity) + dto.quantity : dto.quantity;

    if (existing) {
      await this.db.query(
        `
        UPDATE cart_items
        SET quantity = $3, unit_price = $4
        WHERE cart_id = $1 AND product_id = $2
        `,
        [cart.id, dto.productId, newQty, product.price],
      );
    } else {
      await this.db.query(
        `
        INSERT INTO cart_items (cart_id, product_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
        `,
        [cart.id, dto.productId, newQty, product.price],
      );
    }

    return this.getMyCart(customerId);
  }

  async updateItem(customerId: string, productId: string, quantity: number) {
    if (!quantity || quantity < 0) {
      throw new BadRequestException('Quantity must be zero or greater');
    }
    const cartResult = await this.db.query(
      'SELECT * FROM carts WHERE customer_id = $1 AND status = $2 LIMIT 1',
      [customerId, 'OPEN'],
    );
    const cart = cartResult.rows[0];
    if (!cart) {
      return { cart: null, items: [], subtotal: 0 };
    }

    if (quantity === 0) {
      await this.db.query(
        'DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cart.id, productId],
      );
    } else {
      await this.db.query(
        'UPDATE cart_items SET quantity = $3 WHERE cart_id = $1 AND product_id = $2',
        [cart.id, productId, quantity],
      );
    }

    return this.getMyCart(customerId);
  }
}

