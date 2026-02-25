# Stage 7 — Paystack webhook & customer order history

## Implemented

### 1. Paystack webhook
- **Endpoint:** `POST /payments/webhook/paystack` (no auth).
- **Verification:** `X-Paystack-Signature` is checked with HMAC SHA512 using `PAYSTACK_SECRET_KEY`.
- **On `charge.success`:** Payment and order are set to PAID; loyalty and referral are applied (same as bank-transfer flow).
- **Configure in Paystack Dashboard:** Webhook URL = `https://your-api.com/payments/webhook/paystack`. Paystack will send `charge.success` when a payment completes.

### 2. Customer order history
- **API:** `GET /orders/me` — for **customers** returns their orders (with vendor name/slug); for **vendors/admin** returns vendor orders (unchanged).
- **API:** `GET /orders/me/:id` — returns a single order only if the current user is the customer, the vendor, or admin (otherwise 404).
- **Frontend:**
  - **Dashboard:** Customers see a “My orders →” link.
  - **`/dashboard/orders`:** List of the customer’s orders (number, vendor, status, total, date) with links to detail.
  - **`/dashboard/orders/[id]`:** Order detail (status, payment, date, address, total) using `GET /orders/me/:id`.

## Env

- `PAYSTACK_SECRET_KEY` — required for webhook signature verification.

## Next (later stages)

- Email/SMS on order placed or paid.
- Rider/delivery flow and tracking.
- Refunds and dispute handling.
