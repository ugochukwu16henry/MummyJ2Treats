import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

/** Layer 3 — Automated vendor onboarding (checklist) */
@Injectable()
export class OnboardingService {
  constructor(private readonly db: DatabaseService) {}

  static readonly STEPS = ['profile', 'branding', 'payout', 'first_product'] as const;

  async getStatus(vendorId: string) {
    const rows = await this.db.query(
      'SELECT step_key, completed_at, payload FROM vendor_onboarding_steps WHERE vendor_id = $1',
      [vendorId],
    );
    const completed = new Set(rows.rows.filter((r: { completed_at: unknown }) => r.completed_at).map((r: { step_key: string }) => r.step_key));
    const steps = OnboardingService.STEPS.map((key) => ({
      key,
      completed: completed.has(key),
      completedAt: rows.rows.find((r: { step_key: string }) => r.step_key === key)?.completed_at ?? null,
    }));
    const allDone = steps.every((s) => s.completed);
    return { steps, complete: allDone };
  }

  async completeStep(vendorId: string, stepKey: string, payload?: Record<string, unknown>) {
    if (!OnboardingService.STEPS.includes(stepKey as any)) {
      return { updated: false };
    }
    const id = uuidv4();
    await this.db.query(
      `INSERT INTO vendor_onboarding_steps (id, vendor_id, step_key, completed_at, payload)
       VALUES ($1, $2, $3, NOW(), $4)
       ON CONFLICT (vendor_id, step_key) DO UPDATE SET completed_at = NOW(), payload = COALESCE(EXCLUDED.payload, vendor_onboarding_steps.payload)`,
      [id, vendorId, stepKey, payload ? JSON.stringify(payload) : null],
    );
    return this.getStatus(vendorId);
  }
}
