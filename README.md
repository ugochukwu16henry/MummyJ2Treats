# MummyJ2Treats Monorepo

This monorepo uses pnpm workspaces to manage multiple apps and shared packages.

- apps/
  - backend/ # NestJS API
  - frontend/ # Next.js client
- packages/ # Shared code (types, utils, etc.)
- database/ # Migrations and schema

## Product Requirements Document (PRD)

### Product Name

MummyJ2Treats

### Version

1.0 MVP

### Goals

- **Launch working food ordering system**
- **Enable online payments**
- **Capture user delivery location**
- **Allow admin control**
- **Prepare foundation for multi-vendor system**

### User Types

- **Customer**
- **Vendor**
- **Admin**
- **Rider** (future)

### Functional Requirements

- **Customers**
  - Register/login
  - Browse products
  - Add to cart
  - Pay online
  - Share location

- **Vendors**
  - Upload products
  - Manage orders

- **Admin**
  - Manage vendors
  - View analytics
  - Approve products

### Non-Functional Requirements

- **Secure authentication**
- **Scalable architecture**
- **Mobile responsive**
- **SEO optimized**
- **High availability**

### Final Note

You now have:

- **Technical foundation**
- **Business structure**
- **Dev requirements**
- **Investor pitch layout**
- **Product requirements**
