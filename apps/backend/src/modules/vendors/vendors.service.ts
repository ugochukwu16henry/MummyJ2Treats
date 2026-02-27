import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class VendorsService {
  private profilesInitialized = false;

  constructor(private readonly db: DatabaseService) {}

  private async ensureProfilesTable() {
    if (this.profilesInitialized) return;
    this.profilesInitialized = true;
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS vendor_profiles (
        id UUID PRIMARY KEY,
        vendor_id UUID UNIQUE REFERENCES vendors(id) ON DELETE CASCADE,
        owner_first_name VARCHAR,
        owner_last_name VARCHAR,
        contact_email VARCHAR,
        contact_phone VARCHAR,
        country VARCHAR,
        state VARCHAR,
        city VARCHAR,
        open_days TEXT,
        open_time VARCHAR,
        close_time VARCHAR,
        has_certificate BOOLEAN,
        certificate_details TEXT,
        profile_image_url TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      );
    `);
  }

  async findAll() {
    const result = await this.db.query(
      `SELECT
        id,
        user_id,
        business_name,
        slug,
        description,
        logo_url,
        banner_url,
        is_verified,
        subscription_status,
        signup_fee_paid,
        trial_ends_at,
        current_period_end
       FROM vendors`,
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

  async updateLocationAndDelivery(vendorId: string, dto: {
    operatingState?: string;
    operatingCity?: string;
    operatingLga?: string;
    vendorLatitude?: number | null;
    vendorLongitude?: number | null;
    deliverOutsideState?: boolean;
    maxDeliveryRadiusKm?: number | null;
    deliveryPricePerKm?: number | null;
    deliveryMinFee?: number | null;
    deliveryFixedCityRate?: number | null;
    interStateDeliveryFee?: number | null;
  }) {
    const fields = [];
    const values: any[] = [vendorId];
    let index = 2;
    if (dto.operatingState !== undefined) { fields.push(`operating_state = $${index++}`); values.push(dto.operatingState); }
    if (dto.operatingCity !== undefined) { fields.push(`operating_city = $${index++}`); values.push(dto.operatingCity); }
    if (dto.operatingLga !== undefined) { fields.push(`operating_lga = $${index++}`); values.push(dto.operatingLga); }
    if (dto.vendorLatitude !== undefined) { fields.push(`vendor_latitude = $${index++}`); values.push(dto.vendorLatitude); }
    if (dto.vendorLongitude !== undefined) { fields.push(`vendor_longitude = $${index++}`); values.push(dto.vendorLongitude); }
    if (dto.deliverOutsideState !== undefined) { fields.push(`deliver_outside_state = $${index++}`); values.push(dto.deliverOutsideState); }
    if (dto.maxDeliveryRadiusKm !== undefined) { fields.push(`max_delivery_radius_km = $${index++}`); values.push(dto.maxDeliveryRadiusKm); }
    if (dto.deliveryPricePerKm !== undefined) { fields.push(`delivery_price_per_km = $${index++}`); values.push(dto.deliveryPricePerKm); }
    if (dto.deliveryMinFee !== undefined) { fields.push(`delivery_min_fee = $${index++}`); values.push(dto.deliveryMinFee); }
    if (dto.deliveryFixedCityRate !== undefined) { fields.push(`delivery_fixed_city_rate = $${index++}`); values.push(dto.deliveryFixedCityRate); }
    if (dto.interStateDeliveryFee !== undefined) { fields.push(`inter_state_delivery_fee = $${index++}`); values.push(dto.interStateDeliveryFee); }
    if (!fields.length) return this.findOne(vendorId);
    const result = await this.db.query(`UPDATE vendors SET ${fields.join(', ')} WHERE id = $1 RETURNING *`, values);
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

  async updateAdminFlags(
    vendorId: string,
    dto: {
      isVerified?: boolean;
      signupFeePaid?: boolean;
      subscriptionStatus?: 'trial' | 'active' | 'paused';
      currentPeriodEnd?: string | null;
      trialEndsAt?: string | null;
      commissionRate?: number;
    },
  ) {
    const fields: string[] = [];
    const values: any[] = [vendorId];
    let index = 2;

    if (dto.isVerified !== undefined) {
      fields.push(`is_verified = $${index}`);
      values.push(dto.isVerified);
      index += 1;
    }
    if (dto.signupFeePaid !== undefined) {
      fields.push(`signup_fee_paid = $${index}`);
      values.push(dto.signupFeePaid);
      index += 1;
    }
    if (dto.subscriptionStatus !== undefined) {
      fields.push(`subscription_status = $${index}`);
      values.push(dto.subscriptionStatus);
      index += 1;
    }
    if (dto.currentPeriodEnd !== undefined) {
      fields.push(`current_period_end = $${index}`);
      values.push(dto.currentPeriodEnd);
      index += 1;
    }
    if (dto.trialEndsAt !== undefined) {
      fields.push(`trial_ends_at = $${index}`);
      values.push(dto.trialEndsAt);
      index += 1;
    }
    if (dto.commissionRate !== undefined) {
      fields.push(`commission_rate = $${index}`);
      values.push(dto.commissionRate);
      index += 1;
    }

    if (!fields.length) {
      return this.findOne(vendorId);
    }

    const result = await this.db.query(
      `UPDATE vendors SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      values,
    );
    return result.rows[0] ?? null;
  }

  async upsertProfileForVendor(
    vendorId: string,
    dto: {
      ownerFirstName?: string;
      ownerLastName?: string;
      contactEmail?: string;
      contactPhone?: string;
      country?: string;
      state?: string;
      city?: string;
      openDays?: string;
      openTime?: string;
      closeTime?: string;
      hasCertificate?: boolean;
      certificateDetails?: string;
    },
  ) {
    await this.ensureProfilesTable();

    const existing = await this.db.query(
      'SELECT id FROM vendor_profiles WHERE vendor_id = $1',
      [vendorId],
    );

    if (existing.rowCount && existing.rows[0]) {
      const id = existing.rows[0].id as string;
      const fields: string[] = [];
      const values: any[] = [id];
      let index = 2;

      if (dto.ownerFirstName !== undefined) {
        fields.push(`owner_first_name = $${index++}`);
        values.push(dto.ownerFirstName);
      }
      if (dto.ownerLastName !== undefined) {
        fields.push(`owner_last_name = $${index++}`);
        values.push(dto.ownerLastName);
      }
      if (dto.contactEmail !== undefined) {
        fields.push(`contact_email = $${index++}`);
        values.push(dto.contactEmail);
      }
      if (dto.contactPhone !== undefined) {
        fields.push(`contact_phone = $${index++}`);
        values.push(dto.contactPhone);
      }
      if (dto.country !== undefined) {
        fields.push(`country = $${index++}`);
        values.push(dto.country);
      }
      if (dto.state !== undefined) {
        fields.push(`state = $${index++}`);
        values.push(dto.state);
      }
      if (dto.city !== undefined) {
        fields.push(`city = $${index++}`);
        values.push(dto.city);
      }
      if (dto.openDays !== undefined) {
        fields.push(`open_days = $${index++}`);
        values.push(dto.openDays);
      }
      if (dto.openTime !== undefined) {
        fields.push(`open_time = $${index++}`);
        values.push(dto.openTime);
      }
      if (dto.closeTime !== undefined) {
        fields.push(`close_time = $${index++}`);
        values.push(dto.closeTime);
      }
      if (dto.hasCertificate !== undefined) {
        fields.push(`has_certificate = $${index++}`);
        values.push(dto.hasCertificate);
      }
      if (dto.certificateDetails !== undefined) {
        fields.push(`certificate_details = $${index++}`);
        values.push(dto.certificateDetails);
      }

      if (fields.length === 0) {
        const current = await this.db.query(
          'SELECT * FROM vendor_profiles WHERE id = $1',
          [id],
        );
        return current.rows[0] ?? null;
      }

      fields.push('updated_at = now()');

      const result = await this.db.query(
        `
        UPDATE vendor_profiles
        SET ${fields.join(', ')}
        WHERE id = $1
        RETURNING *
        `,
        values,
      );
      return result.rows[0] ?? null;
    }

    const id = uuidv4();
    const result = await this.db.query(
      `
      INSERT INTO vendor_profiles (
        id,
        vendor_id,
        owner_first_name,
        owner_last_name,
        contact_email,
        contact_phone,
        country,
        state,
        city,
        open_days,
        open_time,
        close_time,
        has_certificate,
        certificate_details
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14
      )
      RETURNING *
      `,
      [
        id,
        vendorId,
        dto.ownerFirstName ?? null,
        dto.ownerLastName ?? null,
        dto.contactEmail ?? null,
        dto.contactPhone ?? null,
        dto.country ?? null,
        dto.state ?? null,
        dto.city ?? null,
        dto.openDays ?? null,
        dto.openTime ?? null,
        dto.closeTime ?? null,
        dto.hasCertificate ?? null,
        dto.certificateDetails ?? null,
      ],
    );
    return result.rows[0] ?? null;
  }

  async getProfileForVendor(vendorId: string) {
    await this.ensureProfilesTable();
    const result = await this.db.query(
      `
      SELECT *
      FROM vendor_profiles
      WHERE vendor_id = $1
      `,
      [vendorId],
    );
    return result.rows[0] ?? null;
  }

  async updateProfileImage(vendorId: string, url: string) {
    await this.ensureProfilesTable();
    const existing = await this.db.query(
      'SELECT id FROM vendor_profiles WHERE vendor_id = $1',
      [vendorId],
    );
    if (!existing.rowCount || !existing.rows[0]) {
      await this.upsertProfileForVendor(vendorId, {});
      // call again after profile exists
      const created = await this.db.query(
        'SELECT id FROM vendor_profiles WHERE vendor_id = $1',
        [vendorId],
      );
      const idCreated = created.rows[0]?.id as string;
      const resultCreated = await this.db.query(
        `
        UPDATE vendor_profiles
        SET profile_image_url = $1, updated_at = now()
        WHERE id = $2
        RETURNING *
        `,
        [url, idCreated],
      );
      return resultCreated.rows[0] ?? null;
    }
    const id = existing.rows[0].id as string;
    const result = await this.db.query(
      `
      UPDATE vendor_profiles
      SET profile_image_url = $1, updated_at = now()
      WHERE id = $2
      RETURNING *
      `,
      [url, id],
    );
    return result.rows[0] ?? null;
  }

  async ensureFounderVendorForUser(userId: string) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const slugFromEnv =
      process.env.PRIMARY_VENDOR_SLUG ||
      process.env.FOUNDER_VENDOR_SLUG ||
      'mummyj2treats';
    const businessNameFromEnv =
      process.env.FOUNDER_VENDOR_NAME || 'MummyJ2Treats';

    const created = await this.createVendorForUser({
      userId,
      businessName: businessNameFromEnv,
      slug: slugFromEnv,
      description: 'Founder admin store',
      billingProvider: 'manual',
    });

    const now = new Date();
    const future = new Date(now.getTime());
    future.setFullYear(future.getFullYear() + 5);

    await this.updateAdminFlags(created.id, {
      isVerified: true,
      signupFeePaid: true,
      subscriptionStatus: 'active',
      currentPeriodEnd: future.toISOString(),
      trialEndsAt: now.toISOString(),
    });

    const updated = await this.findOne(created.id);
    return updated ?? created;
  }
}
