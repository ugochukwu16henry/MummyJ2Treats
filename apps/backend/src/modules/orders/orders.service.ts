import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const result = await this.db.query(
      'SELECT id, order_number, status, total_amount, created_at FROM orders ORDER BY created_at DESC LIMIT 50',
    );
    return { data: result.rows };
  }

  async findOne(id: string) {
    const result = await this.db.query('SELECT * FROM orders WHERE id = $1', [
      id,
    ]);
    return result.rows[0] ?? null;
  }

  async checkout(customerId: string, dto: { deliveryAddress: string }) {
    // Load open cart and items
    const cartResult = await this.db.query(
      'SELECT * FROM carts WHERE customer_id = $1 AND status = $2 LIMIT 1',
      [customerId, 'OPEN'],
    );
    const cart = cartResult.rows[0];
    if (!cart) {
      throw new BadRequestException('No open cart');
    }

    const itemsResult = await this.db.query(
      `
      SELECT
        ci.product_id,
        ci.quantity,
        p.price,
        p.stock,
        p.vendor_id
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.cart_id = $1
      `,
      [cart.id],
    );
    const items = itemsResult.rows;
    if (!items.length) {
      throw new BadRequestException('Cannot checkout empty cart');
    }

    // Enforce single-vendor cart for now
    const vendorId = items[0].vendor_id;
    const multiVendor = items.some((i) => i.vendor_id !== vendorId);
    if (multiVendor) {
      throw new BadRequestException(
        'Cart contains items from multiple vendors (not supported yet)',
      );
    }

    // Check stock and compute totals
    let subtotal = 0;
    for (const item of items) {
      const qty = Number(item.quantity);
      const price = Number(item.price);
      if (Number(item.stock) < qty) {
        throw new BadRequestException(
          'Product is out of stock or quantity too high',
        );
      }
      subtotal += qty * price;
    }

    const deliveryFee = 0; // placeholder
    const total = subtotal + deliveryFee;

    // Optimistic stock update: decrement per product with stock check
    for (const item of items) {
      const qty = Number(item.quantity);
      const update = await this.db.query(
        `
        UPDATE products
        SET stock = stock - $1
        WHERE id = $2 AND stock >= $1
        RETURNING id
        `,
        [qty, item.product_id],
      );
      if (update.rowCount === 0) {
        throw new BadRequestException(
          'Product stock changed, please refresh your cart',
        );
      }
    }

    const orderId = uuidv4();
    const orderNumber = `MJ2-${Date.now()}`;

    const orderResult = await this.db.query(
      `
      INSERT INTO orders (
        id,
        order_number,
        customer_id,
        vendor_id,
        status,
        subtotal,
        delivery_fee,
        commission_amount,
        total_amount,
        payment_status,
        delivery_address
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'PENDING',
        $5,
        $6,
        0,
        $7,
        'UNPAID',
        $8
      )
      RETURNING *
      `,
      [
        orderId,
        orderNumber,
        customerId,
        vendorId,
        subtotal,
        deliveryFee,
        total,
        dto.deliveryAddress,
      ],
    );

    // Mark cart as checked out and clear items
    await this.db.query(
      'UPDATE carts SET status = $2, updated_at = now() WHERE id = $1',
      [cart.id, 'CHECKED_OUT'],
    );
    await this.db.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);

    return orderResult.rows[0];
  }
}
