# Technical Moat — Build Order & Roadmap

This doc maps the **technical moat** layers to what’s implemented and what’s next.

---

## Layer 1 — Data Moat ✅ Implemented

**Collected / derived:**
- **Vendor reliability:** Fulfillment rate, avg delivery hours, cancellation rate (from orders + `delivered_at`).
- **Customer taste:** Order history per customer → product-level via `order_items`; used for recommendations.
- **Delivery heatmap:** Demand by region (city from `delivery_address`) for admin.

**Built:**
- **Smart Vendor Ranking:** `GET /moat/vendors/ranked` — score by fulfillment, delivery speed, volume.
- **Recommendations:** `GET /moat/recommendations` (public top products), `GET /moat/recommendations/me` (for logged-in customer: same-vendor products + popular).
- **Cached reliability:** `vendor_reliability_scores` table; `POST /admin/reliability/refresh` (admin) to refresh.
- **Delivery heatmap:** `GET /moat/heatmap?days=30` (admin).

**Not yet:** Seasonal trends table, pricing sensitivity, dynamic pricing model (can be added on top of current data).

---

## Layer 2 — Network Effects ✅ Implemented

- **Referrals:** `referral_codes`, `referrals` tables. Customer gets code via `GET /moat/referral/me`; apply with `POST /moat/referral/apply` (e.g. at signup or first order). When referred customer pays, referrer gets 50 loyalty points.
- **Loyalty points:** `loyalty_balances`, `loyalty_transactions`. Earn: 1 point per ₦100 spent (on order PAID); `GET /moat/loyalty/me`, `GET /moat/loyalty/transactions`.
- **Vendor performance bonuses:** `vendor_bonuses` table. Admin: `GET /moat/vendor-bonuses/suggestions?periodDate=`, `POST /moat/vendor-bonuses`. Vendor: `GET /moat/vendor-bonuses`.

---

## Layer 3 — Infrastructure Advantage ✅ Implemented

- **Vendor onboarding:** `vendor_onboarding_steps` (profile, branding, payout, first_product). `GET /moat/onboarding`, `PATCH /moat/onboarding/:stepKey` (vendor).
- **Payout automation:** `payout_runs`, `payout_run_items`. Admin: `POST /moat/payout-runs` (create run for period), `GET /moat/payout-runs`, `PATCH /moat/payout-runs/items/:itemId/paid`.
- **Fraud detection:** Rule-based `risk_score` (0–100) on orders: velocity, amount, failed payments. Set automatically at checkout.
- **Cancellation:** `cancellation_reason` on orders. `PATCH /orders/:id/status` with `{ "status": "CANCELLED", "cancellationReason": "..." }`, or `POST /moat/orders/:orderId/cancel` (policy: no cancel after PREPARING unless admin).

**Multi-city:** City-level analytics already in admin dashboard; scaling is architectural (regions, delivery zones) for later.

---

## Layer 4 — Vertical Integration (Later Stage)

Planned / stub only:
- In-house logistics
- Cloud kitchen partnerships
- Vendor financing
- Bulk ingredient supply

*Implement when unit economics and scale justify.*

---

## Layer 5 — AI Optimization (Future)

Planned:
- Smart order forecasting
- Demand clustering
- Vendor performance prediction
- Automated marketing targeting

*Build on Layer 1 data; add ML jobs and models when data volume supports.*

---

## Founder Build Order (from doc)

1. ✅ Product that works  
2. ✅ Metrics dashboard  
3. Growth engine — referrals & loyalty in place; plug into signup/checkout and campaigns  
4. Unit economics clarity — use admin metrics (GMV, AOV, CAC, LTV)  
5. ✅ Data intelligence — ranking, recommendations, heatmap, reliability  
6. Scalable architecture — multi-city and infra as you grow  
7. Fundraise strategically  

---

## API Summary (Moat)

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /moat/vendors/ranked` | no | Smart vendor ranking |
| `GET /moat/recommendations` | no | Public top products |
| `GET /moat/recommendations/me` | jwt | Personal recommendations |
| `GET /moat/heatmap` | admin | Delivery heatmap |
| `POST /moat/reliability/refresh` | admin | Refresh vendor reliability cache |
| `GET /moat/referral/me` | jwt | My referral code |
| `GET /moat/referral/stats` | jwt | Referral stats |
| `POST /moat/referral/apply` | - | Apply referral (body: userId, code) |
| `GET /moat/loyalty/me` | jwt | Loyalty balance |
| `GET /moat/loyalty/transactions` | jwt | Loyalty history |
| `GET /moat/vendor-bonuses` | vendor/admin | My bonuses |
| `GET /moat/vendor-bonuses/suggestions` | admin | Suggested bonuses |
| `POST /moat/vendor-bonuses` | admin | Create bonus |
| `GET /moat/onboarding` | vendor | Onboarding status |
| `PATCH /moat/onboarding/:stepKey` | vendor | Complete step |
| `GET /moat/payout-runs` | admin | List payout runs |
| `POST /moat/payout-runs` | admin | Create run |
| `PATCH /moat/payout-runs/items/:id/paid` | admin | Mark item paid |
| `POST /moat/orders/:orderId/cancel` | vendor/admin | Cancel with reason (policy enforced) |
