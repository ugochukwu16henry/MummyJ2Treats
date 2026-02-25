-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY,
  role VARCHAR CHECK(role IN ('admin','vendor','customer','rider')),
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- VENDORS TABLE
CREATE TABLE vendors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  business_name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  commission_rate NUMERIC(5,2),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- PRODUCTS TABLE
CREATE TABLE products (
  id UUID PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK(price >= 0),
  stock INT CHECK(stock >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_products_vendor_id ON products(vendor_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_price ON products(price);

-- CATEGORIES TABLE
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR,
  slug VARCHAR UNIQUE,
  parent_id UUID NULL
);

-- ORDERS TABLE
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_number VARCHAR UNIQUE,
  customer_id UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  status VARCHAR CHECK(status IN ('PENDING','PAID','PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED')),
  subtotal NUMERIC(10,2),
  delivery_fee NUMERIC(10,2),
  commission_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  payment_status VARCHAR,
  delivery_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP DEFAULT now(),
  version INT DEFAULT 0
);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);

-- PAYMENTS TABLE
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  provider VARCHAR,
  provider_reference VARCHAR UNIQUE,
  amount NUMERIC(10,2),
  status VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);
