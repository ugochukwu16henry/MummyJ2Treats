ALTER TABLE vendors
  ADD COLUMN subscription_plan VARCHAR CHECK (subscription_plan IN ('monthly', 'yearly')) DEFAULT 'monthly',
  ADD COLUMN subscription_status VARCHAR CHECK (subscription_status IN ('trial', 'active', 'past_due', 'cancelled')) DEFAULT 'trial',
  ADD COLUMN signup_fee_paid BOOLEAN DEFAULT false,
  ADD COLUMN trial_ends_at TIMESTAMP,
  ADD COLUMN current_period_end TIMESTAMP,
  ADD COLUMN billing_provider VARCHAR CHECK (billing_provider IN ('manual', 'paystack')) DEFAULT 'manual',
  ADD COLUMN bank_account_name VARCHAR,
  ADD COLUMN bank_account_number VARCHAR,
  ADD COLUMN bank_bank_name VARCHAR,
  ADD COLUMN paystack_subaccount_id VARCHAR;

