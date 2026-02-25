# MummyJ2Treats System Architecture & Database Design

## 🎯 Objective

Define foundation. No coding UI yet.

---

## 1️⃣ System Architecture

**Client:** Next.js (Vercel)
↓
**API:** NestJS (Railway)
↓

- PostgreSQL
- Redis
- Railway Bucket

**Architecture Style:**

- Clean Architecture
- Domain-Driven Design (DDD)
- Modular Monolith
- Event-driven internal handling

---

## 2️⃣ Database Design (Production Ready)

### USERS

```sql
users (
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
-- Indexes:
-- CREATE INDEX idx_users_email ON users(email);
-- CREATE INDEX idx_users_role ON users(role);
```

### VENDORS

```sql
vendors (
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
```

### PRODUCTS

```sql
products (
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
-- Indexes:
-- CREATE INDEX idx_products_vendor_id ON products(vendor_id);
-- CREATE INDEX idx_products_is_active ON products(is_active);
-- CREATE INDEX idx_products_price ON products(price);
```

### CATEGORIES

```sql
categories (
  id UUID PRIMARY KEY,
  name VARCHAR,
  slug VARCHAR UNIQUE,
  parent_id UUID NULL
);
```

### ORDERS

```sql
orders (
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
-- Optimistic locking via version
-- Indexes:
-- CREATE INDEX idx_orders_status ON orders(status);
-- CREATE INDEX idx_orders_customer_id ON orders(customer_id);
```

### PAYMENTS

```sql
payments (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  provider VARCHAR,
  provider_reference VARCHAR UNIQUE,
  amount NUMERIC(10,2),
  status VARCHAR,
  created_at TIMESTAMP DEFAULT now()
);
```

---

## Foundation & System Design (Day 1)

### What Is Expected

**Backend Lead:**

- Define Clean Architecture structure
- Create database schema
- Define modules
- Set environment configuration

**Frontend Lead:**

- Set up Next.js project
- Configure Tailwind
- Set design tokens
- Create layout skeleton

### Deliverables

- ✅ Database schema finalized
- ✅ ER relationship validated
- ✅ Backend project initialized
- ✅ Frontend project initialized
- ✅ Environment variables defined

### Acceptance Criteria

- All tables include constraints
- All foreign keys defined
- No raw passwords stored
- UUIDs used as primary keys
- Linting + formatting configured
