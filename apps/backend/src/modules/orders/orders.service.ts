import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { FraudService } from '../moat/fraud.service';
import { DeliveryService } from '../delivery/delivery.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly fraudService: FraudService,
    private readonly deliveryService: DeliveryService,
  ) {}

  async findAll() {
    const result = await this.db.query(
      'SELECT id, order_number, status, total_amount, created_at FROM orders ORDER BY created_at DESC LIMIT 50',
    );
    return { data: result.rows };
  }

  async findByVendorId(vendorId: string) {
    const result = await this.db.query(
      `SELECT id, order_number, customer_id, status, subtotal, delivery_fee, total_amount, payment_status, delivery_address, rider_id, created_at
       FROM orders WHERE vendor_id = $1 ORDER BY created_at DESC`,
      [vendorId],
    );
    return { data: result.rows };
  }

  async findByCustomerId(customerId: string) {
    const result = await this.db.query(
      `SELECT o.id, o.order_number, o.vendor_id, o.status, o.subtotal, o.delivery_fee, o.total_amount, o.payment_status, o.delivery_address, o.created_at,
        v.business_name AS vendor_name, v.slug AS vendor_slug
       FROM orders o
       LEFT JOIN vendors v ON v.id = o.vendor_id
       WHERE o.customer_id = $1 ORDER BY o.created_at DESC`,
      [customerId],
    );
    return { data: result.rows };
  }

  async findOne(id: string) {
    const result = await this.db.query('SELECT * FROM orders WHERE id = $1', [
      id,
    ]);
    return result.rows[0] ?? null;
  }

  async updateStatus(
    orderId: string,
    status: string,
    opts?: { vendorId?: string; isAdmin?: boolean; cancellationReason?: string },
  ) {
    const order = await this.findOne(orderId);
    if (!order) throw new BadRequestException('Order not found');
    if (opts?.vendorId && order.vendor_id !== opts.vendorId && !opts.isAdmin) {
      throw new BadRequestException('Not your order');
    }
    const valid = ['PENDING', 'PAID', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!valid.includes(status)) throw new BadRequestException('Invalid status');
    const setDeliveredAt = status === 'DELIVERED' ? ', delivered_at = NOW()' : '';
    const setReason = status === 'CANCELLED' && opts?.cancellationReason ? ', cancellation_reason = $3' : '';
    const params = setReason ? [orderId, status, opts!.cancellationReason] : [orderId, status];
    await this.db.query(
      `UPDATE orders SET status = $2${setDeliveredAt}${setReason} WHERE id = $1 RETURNING id, status, delivered_at`,
      params as [string, string, string?],
    );
    return this.findOne(orderId);
  }

  async checkout(
    customerId: string,
    dto: {
      deliveryAddress?: string;
      paymentMethod?: string;
      deliveryState?: string;
      deliveryCity?: string;
      deliveryLga?: string;
      deliveryStreet?: string;
      deliveryLandmark?: string;
      deliveryNotes?: string;
      latitude?: number | null;
      longitude?: number | null;
    },
  ) {
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
    const multiVendor = items.some((i: { vendor_id: string }) => i.vendor_id !== vendorId);
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

    const deliveryAddressText =
      dto.deliveryAddress?.trim() ||
      [dto.deliveryStreet, dto.deliveryLga, dto.deliveryCity, dto.deliveryState]
        .filter(Boolean)
        .join(', ') ||
      'Address not provided';
    const { deliveryFee, distanceKm } = await this.deliveryService.computeDeliveryFee(
      vendorId,
      dto.latitude ?? null,
      dto.longitude ?? null,
      dto.deliveryState ?? null,
    );
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
        delivery_address,
        delivery_state,
        delivery_city,
        delivery_lga,
        delivery_street,
        delivery_landmark,
        delivery_notes,
        latitude,
        longitude,
        delivery_distance_km
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
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16,
        $17
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
        deliveryAddressText,
        dto.deliveryState ?? null,
        dto.deliveryCity ?? null,
        dto.deliveryLga ?? null,
        dto.deliveryStreet ?? null,
        dto.deliveryLandmark ?? null,
        dto.deliveryNotes ?? null,
        dto.latitude ?? null,
        dto.longitude ?? null,
        distanceKm ?? null,
      ],
    );

    // Persist order line items (data moat: customer taste & recommendations)
    for (const item of items) {
      const itemId = uuidv4();
      await this.db.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [itemId, orderId, item.product_id, item.quantity, item.price],
      );
    }

    // Mark cart as checked out and clear items
    await this.db.query(
      'UPDATE carts SET status = $2, updated_at = now() WHERE id = $1',
      [cart.id, 'CHECKED_OUT'],
    );
    await this.db.query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);

    const order = orderResult.rows[0];

    try {
      await this.fraudService.scoreOrder(orderId, customerId, total);
    } catch {
      // don't fail checkout if fraud scoring fails
    }

    // Create payment record based on selected method
    const method = (dto.paymentMethod || 'paystack').toLowerCase();
    const provider =
      method === 'paystack' ? 'paystack' : method === 'bank_transfer' ? 'bank_transfer' : method;

    const paymentId = uuidv4();

    const paymentInsert = await this.db.query(
      `
      INSERT INTO payments (
        id,
        order_id,
        provider,
        provider_reference,
        amount,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        NULL,
        $4,
        $5
      )
      RETURNING *
      `,
      [
        paymentId,
        orderId,
        provider,
        total,
        provider === 'bank_transfer' ? 'pending' : 'initiated',
      ],
    );

    let paystackRedirectUrl: string | null = null;
    let bankTransferInfo: any = null;

    if (provider === 'paystack') {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      const callbackUrl =
        process.env.PAYSTACK_CALLBACK_URL ||
        'https://mummyj2treats.com/paystack/callback';

      if (secret) {
        // Load customer email for Paystack
        const userResult = await this.db.query(
          'SELECT email FROM users WHERE id = $1',
          [customerId],
        );
        const email =
          userResult.rows[0]?.email || 'customer@mummyj2treats.com';

        const initRes = await fetch(
          'https://api.paystack.co/transaction/initialize',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${secret}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              amount: Math.round(total * 100), // kobo
              reference: paymentId,
              callback_url: callbackUrl,
              metadata: {
                orderId,
                customerId,
              },
            }),
          },
        );

        if (initRes.ok) {
          const data = await initRes.json().catch(() => null as any);
          paystackRedirectUrl = data?.data?.authorization_url ?? null;
          const ref = data?.data?.reference ?? null;
          if (ref) {
            await this.db.query(
              'UPDATE payments SET provider_reference = $2 WHERE id = $1',
              [paymentId, ref],
            );
          }
        }
      }
    } else if (provider === 'bank_transfer') {
      // Load vendor bank information (if set) to show to customer
      const vendorResult = await this.db.query(
        `
        SELECT bank_account_name, bank_account_number, bank_bank_name
        FROM vendors
        WHERE id = $1
        `,
        [vendorId],
      );
      const v = vendorResult.rows[0];
      bankTransferInfo = {
        bankAccountName: v?.bank_account_name || null,
        bankAccountNumber: v?.bank_account_number || null,
        bankName: v?.bank_bank_name || null,
      };
    }

    return {
      order,
      payment: paymentInsert.rows[0],
      paystack: paystackRedirectUrl ? { authorizationUrl: paystackRedirectUrl } : null,
      bankTransfer: bankTransferInfo,
    };
  }
}
