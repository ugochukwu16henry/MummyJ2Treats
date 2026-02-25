CREATE TABLE carts (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES users(id),
  status VARCHAR CHECK (status IN ('OPEN', 'CHECKED_OUT', 'ABANDONED')) DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_carts_customer_status ON carts(customer_id, status);

CREATE TABLE cart_items (
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  PRIMARY KEY (cart_id, product_id)
);

