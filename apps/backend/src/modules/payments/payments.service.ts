import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import Tesseract from 'tesseract.js';

@Injectable()
export class PaymentsService {
  constructor(private readonly db: DatabaseService) {}

  async handleBankTransferReceipt(paymentId: string, filePath: string) {
    // Save receipt path
    await this.db.query(
      'UPDATE payments SET receipt_url = $2 WHERE id = $1',
      [paymentId, filePath],
    );

    // Load order total
    const result = await this.db.query(
      `
      SELECT p.id, p.provider, p.status, o.id as order_id, o.total_amount
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
      const ocr = await Tesseract.recognize(filePath, 'eng');
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
    }

    return {
      updated: true,
      autoVerified: matchesTotal,
      ocrAmount,
      expectedAmount: total,
    };
  }
}
