-- =============================================================================
-- Smart Rider & Google Mapping System
-- =============================================================================

-- Orders: structured address + keep delivery_address for display
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_state VARCHAR(128);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(128);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_lga VARCHAR(128);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_street VARCHAR(512);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_landmark VARCHAR(256);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_distance_km NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rider_assigned_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_orders_delivery_state ON orders(delivery_state);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_city ON orders(delivery_city);
CREATE INDEX IF NOT EXISTS idx_orders_rider ON orders(rider_id);

-- Vendors: location & delivery coverage/pricing
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS operating_state VARCHAR(128);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS operating_city VARCHAR(128);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS operating_lga VARCHAR(128);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_latitude DOUBLE PRECISION;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_longitude DOUBLE PRECISION;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deliver_outside_state BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS max_delivery_radius_km NUMERIC(8,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS delivery_price_per_km NUMERIC(8,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS delivery_min_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS delivery_fixed_city_rate NUMERIC(10,2);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS inter_state_delivery_fee NUMERIC(10,2);
CREATE INDEX IF NOT EXISTS idx_vendors_state ON vendors(operating_state);
CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(operating_city);

-- Riders (user_id links to users with role 'rider')
CREATE TABLE IF NOT EXISTS riders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(32),
  state VARCHAR(128) NOT NULL,
  cities JSONB DEFAULT '[]',
  transport_type VARCHAR(32) CHECK (transport_type IN ('bike', 'car', 'motorcycle', 'other')),
  is_available BOOLEAN DEFAULT true,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  location_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id)
);
CREATE INDEX IF NOT EXISTS idx_riders_state ON riders(state);
CREATE INDEX IF NOT EXISTS idx_riders_available ON riders(is_available);

-- Rider location history for route/analytics (optional, can prune old rows)
CREATE TABLE IF NOT EXISTS rider_location_logs (
  id UUID PRIMARY KEY,
  rider_id UUID NOT NULL REFERENCES riders(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rider_location_logs_rider ON rider_location_logs(rider_id);
CREATE INDEX IF NOT EXISTS idx_rider_location_logs_created ON rider_location_logs(created_at);

-- FK rider_id on orders (add after riders exists)
DO $$
BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_rider_id_fkey
    FOREIGN KEY (rider_id) REFERENCES riders(id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
