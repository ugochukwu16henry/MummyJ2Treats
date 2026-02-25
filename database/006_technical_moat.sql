-- =============================================================================
-- TECHNICAL MOAT: Data, Network Effects, Infrastructure
-- =============================================================================

-- Layer 1 — Data Moat: order line items (for customer taste & recommendations)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- Cached vendor reliability (computed periodically or on-demand)
CREATE TABLE IF NOT EXISTS vendor_reliability_scores (
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  fulfillment_rate NUMERIC(5,4),
  avg_delivery_hours NUMERIC(10,2),
  cancellation_rate NUMERIC(5,4),
  order_count INT DEFAULT 0,
  composite_score NUMERIC(10,4),
  updated_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (vendor_id, period_date)
);
CREATE INDEX IF NOT EXISTS idx_vendor_reliability_period ON vendor_reliability_scores(period_date);

-- Delivery heatmap: aggregate by region (city/lat bucket) for demand mapping
CREATE TABLE IF NOT EXISTS delivery_heatmap (
  id UUID PRIMARY KEY,
  period_date DATE NOT NULL,
  region_key VARCHAR(64) NOT NULL,
  order_count INT DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(period_date, region_key)
);
CREATE INDEX IF NOT EXISTS idx_delivery_heatmap_period ON delivery_heatmap(period_date);

-- Layer 2 — Network Effects: Referrals
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(32) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  reward_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(referred_id)
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);

-- Loyalty points
CREATE TABLE IF NOT EXISTS loyalty_balances (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL DEFAULT 0 CHECK (points >= 0),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  reason VARCHAR(64) NOT NULL,
  order_id UUID REFERENCES orders(id),
  reference_id VARCHAR(64),
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user ON loyalty_transactions(user_id);

-- Vendor performance bonuses
CREATE TABLE IF NOT EXISTS vendor_bonuses (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  period_date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  criteria VARCHAR(128),
  status VARCHAR(32) CHECK (status IN ('pending', 'approved', 'paid')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendor_bonuses_vendor ON vendor_bonuses(vendor_id);

-- Layer 3 — Infrastructure: Vendor onboarding steps
CREATE TABLE IF NOT EXISTS vendor_onboarding_steps (
  id UUID PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  step_key VARCHAR(64) NOT NULL,
  completed_at TIMESTAMP,
  payload JSONB,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(vendor_id, step_key)
);
CREATE INDEX IF NOT EXISTS idx_vendor_onboarding_vendor ON vendor_onboarding_steps(vendor_id);

-- Payout runs (admin-triggered)
CREATE TABLE IF NOT EXISTS payout_runs (
  id UUID PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status VARCHAR(32) CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payout_run_items (
  id UUID PRIMARY KEY,
  payout_run_id UUID NOT NULL REFERENCES payout_runs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(32) CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
  paid_at TIMESTAMP,
  reference VARCHAR(128),
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payout_run_items_run ON payout_run_items(payout_run_id);

-- Fraud / risk: score on order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS risk_score NUMERIC(5,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
