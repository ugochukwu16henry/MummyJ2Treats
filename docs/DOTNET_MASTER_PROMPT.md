📌 **MASTER PROMPT – .NET BACKEND**

Single-Vendor E-commerce + Rider System for **MummyJ2Treats**

> This document defines the new authoritative backend spec for the .NET 8 system.  
> Frontend: keep existing Next.js app (Vercel). Backend: migrate to ASP.NET Core Web API.

---

## 🔷 Overview

Build a modern, scalable, enterprise-ready **single-vendor e-commerce** web application for a brand called **MummyJ2Treats**.

This is **NOT** a marketplace. It is a **private store** where only the owner sells products. Customers can browse products, place orders, and request delivery. Riders are managed internally.

---

## 🏗 SYSTEM ARCHITECTURE

Use:

- **.NET 8 (ASP.NET Core Web API)**
- **Clean Architecture + DDD**
- **Entity Framework Core**
- **SQL Server or PostgreSQL**
- **JWT Authentication**
- **Role-based authorization**
- **SignalR** for live rider tracking
- **Google Maps API** integration
- **Stripe or Paystack** for payments

---

## 👥 USER ROLES

- **Admin (Owner)**
- **Rider**
- **Customer**

No vendors. No external sellers.

---

## 🛒 CORE FEATURES

### 🏪 Storefront

- Homepage with featured products  
- Category filtering  
- Product detail page  
- Add to cart  
- Checkout  
- Guest checkout option  
- User account dashboard  

### 💳 Payment System

- Bank transfer option, uploading a receipt  
- Secure online payment (Stripe or Paystack)  
- Webhook handling  
- Payment confirmation email  
- Order receipt generation  

### 📦 Order Management

- Order creation  
- Order status tracking  
- Admin can update:
  - Processing
  - Out for delivery
  - Delivered
  - Cancelled

### 🚴 Rider System

- Riders can register  
- Admin approves riders  
- Rider dashboard:
  - See assigned orders
  - Update delivery status
  - Share live location
- Use Google Maps to:
  - Detect customer location (optional manual address entry)
  - Calculate distance
  - Compute delivery fee based on distance
- Admin can:
  - Set delivery price per km
  - Assign riders manually
  - View rider live location

### 📍 Location Logic

Customers can:

- Allow automatic GPS detection  
- OR manually enter address  

Store:

- Latitude & longitude  
- Distance (via Google Distance Matrix API)  
- Delivery fee shown **before** checkout  

### 📝 Blog Section

- Owner-only blog posting  
- Admin approval workflow  
- Video embedding (YouTube, Instagram, TikTok, X)  
- SEO optimized blog pages  
- Subscription option (email capture)  

---

## 🗄 DATABASE STRUCTURE

Tables required:

- **Users**
- **Roles**
- **Products**
- **Categories**
- **Orders**
- **OrderItems**
- **Payments**
- **Riders**
- **DeliveryAssignments**
- **Locations**
- **BlogPosts**
- **BlogMedia**

Conventions:

- **GUID** primary keys  
- Audit columns (CreatedAt, CreatedBy, UpdatedAt, UpdatedBy, etc.)  
- Soft delete flags where appropriate  
- Indexes on frequently queried fields  

---

## 🎨 UI/UX DESIGN REQUIREMENTS (FRONTEND GUIDANCE)

Design should be:

- Minimal  
- Elegant  
- Luxury-modern  
- Mobile-first  
- Clean white background  
- Soft brand colors:
  - **Cream**
  - **Warm brown**
  - **Muted gold accent**

Pages:

- Home  
- Shop  
- Product detail  
- Cart  
- Checkout  
- Order success  
- Rider dashboard  
- Admin dashboard  
- Blog page  
- Blog detail  

Use:

- Rounded corners  
- Soft shadows  
- Smooth transitions  
- Clear CTA buttons  

> Note: The existing Next.js frontend must be updated over time to follow this palette and branding (logo, colors, typography), but deployment stays on Vercel.

---

## 🔐 SECURITY REQUIREMENTS

- HTTPS only  
- JWT with refresh tokens  
- Role-based access control  
- Input validation  
- CSRF protection  
- Secure payment handling  
- Rate limiting  
- Logging with **Serilog**  

---

## 📊 ADMIN DASHBOARD REQUIREMENTS

Admin dashboard must include:

- Total sales  
- Daily revenue  
- Monthly revenue  
- Orders by status  
- Rider performance  
- Delivery metrics  
- Blog analytics  

---

## 🚀 DEPLOYMENT REQUIREMENTS

- Dockerized backend  
- CI/CD via GitHub Actions  
- Hosted on Azure or AWS  
- Environment variables secured  
- Production logging enabled  
- Error monitoring configured  

---

## 📈 SEO REQUIREMENTS (FRONTEND)

- Server-side rendering (Next.js)  
- Meta tags per page  
- Structured data (schema.org)  
- Optimized URLs  
- `sitemap.xml`  
- `robots.txt`  
- Fast loading (Lighthouse 90+)  

---

## 🎯 GOAL

Build a professional, scalable, high-performance e-commerce platform for a single brand owner to:

- Sell products  
- Manage deliveries  
- Track riders live  
- Publish blog content  
- Scale to multiple cities  

System must be **secure**, **modern**, and **production-ready**.

---

## 🔥 CHANGES FROM PREVIOUS MARKETPLACE MODEL

Removed:

- Vendor registration  
- Vendor dashboards  
- Vendor search by state  
- Vendor pricing configuration  

Simplified:

- Only **one** store  
- Only **one** owner  
- Centralized pricing control  

This makes the system:

- ✔ Easier to manage  
- ✔ Easier to scale  
- ✔ Easier to secure  
- ✔ More profitable  

---

## IMPLEMENTATION NOTES FOR BACKEND

- This document replaces the old multi-vendor / NestJS backend spec.  
- New backend will live in `backend-dotnet/` using **ASP.NET Core Web API (.NET 8)**.  
- Follow **Clean Architecture + DDD**:
  - `Domain` (entities, value objects, enums, domain events)
  - `Application` (use cases, DTOs, interfaces)
  - `Infrastructure` (EF Core, persistence, external services)
  - `Api` (presentation, controllers, auth, validation)
- Integrate with the existing Next.js frontend by exposing compatible REST endpoints and JWT auth.

