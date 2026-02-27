CREATE TABLE testimonials (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  target_type VARCHAR NOT NULL CHECK (target_type IN ('founder','vendor')),
  content TEXT NOT NULL,
  image_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  approved_at TIMESTAMP NULL
);

CREATE INDEX idx_testimonials_target_approved
  ON testimonials (target_type, is_approved, created_at DESC);

CREATE INDEX idx_testimonials_vendor_approved
  ON testimonials (vendor_id, is_approved, created_at DESC);

