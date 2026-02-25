import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VendorsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const result = await this.db.query(
      'SELECT id, user_id, business_name, slug, description, logo_url, banner_url, is_verified, subscription_status FROM vendors',
    );
    return { data: result.rows };
  }

  async findOne(id: string) {
    const result = await this.db.query(
      'SELECT * FROM vendors WHERE id = $1',
      [id],
    );
    return result.rows[0] ?? null;
  }

  async findByUserId(userId: string) {
    const result = await this.db.query(
      'SELECT * FROM vendors WHERE user_id = $1',
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async findBySlug(slug: string) {
    const result = await this.db.query(
      'SELECT * FROM vendors WHERE slug = $1',
      [slug],
    );
    return result.rows[0] ?? null;
  }

  async createVendorForUser(params: {
    userId: string;
    businessName: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    subscriptionPlan?: 'monthly' | 'yearly';
    billingProvider?: 'manual' | 'paystack';
  }) {
    const id = uuidv4();
    const now = new Date();
    const trialEnds = new Date(now.getTime());
    trialEnds.setMonth(trialEnds.getMonth() + 1);

    const result = await this.db.query(
      `INSERT INTO vendors (
        id, user_id, business_name, slug, description,
        logo_url, banner_url,
        subscription_plan, subscription_status,
        signup_fee_paid, trial_ends_at, current_period_end,
        billing_provider
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7,
        $8, 'trial',
        false, $9, NULL,
        $10
      )
      RETURNING *`,
      [
        id,
        params.userId,
        params.businessName,
        params.slug,
        params.description ?? null,
        params.logoUrl ?? null,
        params.bannerUrl ?? null,
        params.subscriptionPlan ?? 'monthly',
        trialEnds.toISOString(),
        params.billingProvider ?? 'manual',
      ],
    );

    return result.rows[0];
  }

  async updateBranding(vendorId: string, dto: {
    businessName?: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
  }) {
    const fields = [];
    const values: any[] = [vendorId];
    let index = 2;

    if (dto.businessName !== undefined) {
      fields.push(`business_name = $${index++}`);
      values.push(dto.businessName);
    }
    if (dto.description !== undefined) {
      fields.push(`description = $${index++}`);
      values.push(dto.description);
    }
    if (dto.logoUrl !== undefined) {
      fields.push(`logo_url = $${index++}`);
      values.push(dto.logoUrl);
    }
    if (dto.bannerUrl !== undefined) {
      fields.push(`banner_url = $${index++}`);
      values.push(dto.bannerUrl);
    }

    if (!fields.length) {
      const existing = await this.findOne(vendorId);
      return existing;
    }

    const result = await this.db.query(
      `UPDATE vendors SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async updatePayoutSettings(vendorId: string, dto: {
    billingProvider?: 'manual' | 'paystack';
    bankAccountName?: string;
    bankAccountNumber?: string;
    bankBankName?: string;
    paystackSubaccountId?: string;
  }) {
    const fields = [];
    const values: any[] = [vendorId];
    let index = 2;

    if (dto.billingProvider !== undefined) {
      fields.push(`billing_provider = $${index++}`);
      values.push(dto.billingProvider);
    }
    if (dto.bankAccountName !== undefined) {
      fields.push(`bank_account_name = $${index++}`);
      values.push(dto.bankAccountName);
    }
    if (dto.bankAccountNumber !== undefined) {
      fields.push(`bank_account_number = $${index++}`);
      values.push(dto.bankAccountNumber);
    }
    if (dto.bankBankName !== undefined) {
      fields.push(`bank_bank_name = $${index++}`);
      values.push(dto.bankBankName);
    }
    if (dto.paystackSubaccountId !== undefined) {
      fields.push(`paystack_subaccount_id = $${index++}`);
      values.push(dto.paystackSubaccountId);
    }

    if (!fields.length) {
      const existing = await this.findOne(vendorId);
      return existing;
    }

    const result = await this.db.query(
      `UPDATE vendors SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async isVendorActive(vendorId: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT signup_fee_paid, subscription_status, trial_ends_at, current_period_end
       FROM vendors WHERE id = $1`,
      [vendorId],
    );
    const row = result.rows[0];
    if (!row) return false;

    const now = new Date();

    // Must have paid the one-time signup fee
    if (!row.signup_fee_paid) {
      return false;
    }

    // Trial period: one month after signup (trial_ends_at)
    if (row.subscription_status === 'trial' && row.trial_ends_at) {
      if (new Date(row.trial_ends_at) >= now) {
        return true;
      }
    }

    // Active subscription: monthly/yearly, controlled by current_period_end
    if (row.subscription_status === 'active' && row.current_period_end) {
      if (new Date(row.current_period_end) >= now) {
        return true;
      }
    }

    return false;
  }
}
