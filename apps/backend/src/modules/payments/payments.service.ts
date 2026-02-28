import { Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { LoyaltyService } from '../moat/loyalty.service';
import { ReferralService } from '../moat/referral.service';
import Tesseract from 'tesseract.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly loyalty: LoyaltyService,
    private readonly referral: ReferralService,
  ) {}

  async handleBankTransferReceipt(
    paymentId: string,
    receiptUrl: string,
    bufferForOcr?: Buffer,
  ) {
    await this.db.query(
      'UPDATE payments SET receipt_url = $2 WHERE id = $1',
      [paymentId, receiptUrl],
    );

    const result = await this.db.query(
      `
      SELECT p.id, p.provider, p.status, o.id as order_id, o.customer_id, o.total_amount
      FROM payments p
      JOIN orders o ON o.id = p.order_id
      WHERE p.id = $1
      `,
      [paymentId],
    );
    const row = result.rows[0];
    if (!row || row.provider !== 'bank_transfer') {
      return { updated: false, autoVerified: false };
    }

    let ocrAmount: number | null = null;
    try {
      const ocr = bufferForOcr
        ? await Tesseract.recognize(bufferForOcr, 'eng')
        : await Tesseract.recognize(receiptUrl, 'eng');
      const text = ocr.data.text || '';
      const matches = text.match(
        /([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)/g,
      );
      if (matches && matches.length) {
        const numeric = matches
          .map((m) => Number(m.replace(/,/g, '')))
          .filter((n) => !Number.isNaN(n));
        if (numeric.length) {
          // Choose the largest amount on the receipt
          ocrAmount = Math.max(...numeric);
        }
      }
    } catch (e) {
      // ignore OCR errors; admin can still verify manually
    }

    if (ocrAmount !== null) {
      await this.db.query(
        'UPDATE payments SET ocr_amount = $2 WHERE id = $1',
        [paymentId, ocrAmount],
      );
    }

    const total = Number(row.total_amount);
    const matchesTotal =
      ocrAmount !== null && Math.abs(ocrAmount - total) < 1;

    if (matchesTotal) {
      await this.db.query(
        'UPDATE payments SET status = $2, auto_verified = true WHERE id = $1',
        [paymentId, 'success'],
      );
      await this.db.query(
        `
        UPDATE orders
        SET payment_status = 'PAID', status = 'PAID'
        WHERE id = $1
        `,
        [row.order_id],
      );
      const total = Number(row.total_amount);
      const customerId = row.customer_id;
      if (customerId && total > 0) {
        try {
          await this.loyalty.earnForOrder(customerId, row.order_id, total);
          await this.referral.recordReferredOrder(customerId, row.order_id);
        } catch {
          // don't fail payment flow if loyalty/referral fails
        }
      }
    }

    return {
      updated: true,
      autoVerified: matchesTotal,
      ocrAmount,
      expectedAmount: total,
    };
  }

  /** Verify Paystack webhook signature (HMAC SHA512 of payload with secret) */
  verifyPaystackSignature(payload: string | object, signature: string): boolean {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return false;
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const hash = createHmac('sha512', secret).update(body).digest('hex');
    return hash === signature;
  }

  /** Handle Paystack webhook: on charge.success mark payment and order PAID, trigger loyalty/referral */
  async handlePaystackWebhook(body: { event?: string; data?: { reference?: string } }) {
    if (body.event !== 'charge.success' || !body.data?.reference) {
      return { processed: false };
    }
    const reference = body.data.reference;
    const result = await this.db.query(
      `SELECT p.id AS payment_id, p.order_id, p.status, o.customer_id, o.total_amount
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.provider = 'paystack' AND p.provider_reference = $1`,
      [reference],
    );
    const row = result.rows[0];
    if (!row || row.status === 'success') {
      return { processed: row != null };
    }
    await this.db.query(
      'UPDATE payments SET status = $2 WHERE id = $1',
      [row.payment_id, 'success'],
    );
    await this.db.query(
      `UPDATE orders SET payment_status = 'PAID', status = 'PAID' WHERE id = $1`,
      [row.order_id],
    );
    const total = Number(row.total_amount);
    const customerId = row.customer_id;
    if (customerId && total > 0) {
      try {
        await this.loyalty.earnForOrder(customerId, row.order_id, total);
        await this.referral.recordReferredOrder(customerId, row.order_id);
      } catch {
        // don't fail webhook if loyalty/referral fails
      }
    }
    return { processed: true };
  }
}
