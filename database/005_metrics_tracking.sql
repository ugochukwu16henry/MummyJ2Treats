-- Delivery SLA: when order was delivered (set when status becomes DELIVERED)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- Support tickets for operational metrics
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY,
  subject TEXT,
  body TEXT,
  status VARCHAR CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  order_id UUID REFERENCES orders(id),
  customer_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  closed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Platform metrics (traffic, CAC, CPC, CPA, referral) – one row per period for reporting
CREATE TABLE IF NOT EXISTS platform_metrics (
  id UUID PRIMARY KEY,
  period_date DATE NOT NULL,
  period_type VARCHAR NOT NULL CHECK (period_type IN ('day', 'month')),
  traffic_organic INT DEFAULT 0,
  traffic_paid INT DEFAULT 0,
  cpc NUMERIC(10,2),
  cpa NUMERIC(10,2),
  cac NUMERIC(10,2),
  referral_count INT DEFAULT 0,
  UNIQUE(period_date, period_type)
);
CREATE INDEX IF NOT EXISTS idx_platform_metrics_period ON platform_metrics(period_date, period_type);
