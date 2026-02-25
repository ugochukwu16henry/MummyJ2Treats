# Smart Rider & Google Mapping System

## Overview

- **Customer location:** Structured address (State, City, LGA, Street, Landmark, Notes) and/or live GPS via "Use my current location".
- **Distance-based delivery:** Fee from vendor config (price per km, min fee, fixed city rate, inter-state fee). Uses Google Distance Matrix API when `GOOGLE_MAPS_API_KEY` is set; otherwise Haversine.
- **Vendor location & coverage:** Vendors set operating state/city/LGA, lat/lng, max radius, and delivery pricing. Customers can search/filter by location (API supports it).
- **Riders:** Register (role `rider`), set state/cities/transport/availability. Vendors see riders by state and assign to orders. Riders update live location via `PATCH /riders/me/location`.
- **Admin:** `GET /admin/delivery-map` returns vendors, orders (with delivery coords), and riders (current location) for platform-wide visibility.

## Env

- `GOOGLE_MAPS_API_KEY` — optional; for Distance Matrix (distance/duration) and future map embeds.

## APIs

| Endpoint | Auth | Description |
|----------|------|-------------|
| `PATCH /vendors/me/location-and-delivery` | vendor | Set operating state/city/LGA, lat/lng, delivery pricing |
| `POST /orders/checkout` | customer | Accepts deliveryAddress and/or deliveryState, deliveryCity, deliveryLga, deliveryStreet, deliveryLandmark, deliveryNotes, latitude, longitude |
| `POST /riders/register` | rider | Create rider profile (state, phone, cities, transportType) |
| `GET /riders/me` | rider | My profile |
| `PATCH /riders/me` | rider | Update profile (phone, state, cities, transportType, isAvailable) |
| `PATCH /riders/me/location` | rider | Update current lat/lng (and optional orderId for route log) |
| `GET /riders/by-state?state=X&available=true` | vendor/admin | Riders in state |
| `GET /riders` | admin | All riders |
| `PATCH /riders/orders/:orderId/assign` | vendor/admin | Assign rider to order (body: riderId) |
| `GET /riders/:riderId/location` | jwt | Rider current location |
| `GET /riders/:riderId/route/:orderId` | jwt | Route history for order |
| `GET /admin/delivery-map` | admin | Vendors, orders, riders with coordinates |

## Frontend

- **Checkout (cart):** Structured address fields + "Use my current location"; payload includes lat/lng when used.
- **Vendor dashboard:** "Location & delivery" page to set location and delivery pricing; orders list with "Assign rider" dropdown (riders by vendor state).
- **Rider dashboard:** Update my location; register via API (POST /riders/register) after signing up with role rider.
- **Admin:** Delivery map data via GET /admin/delivery-map (use for map UI or analytics).

## Rider registration

1. Create user with role `rider` (e.g. register with `role: "rider"` or admin sets role).
2. Log in as that user and call `POST /riders/register` with `{ state, phone?, cities?, transportType? }`.
3. Rider can then use dashboard to update location and availability.

## Privacy

- Location is only captured when the user clicks "Use my current location" (permission required).
- Manual address remains an option.
- Data stored on order and rider for operations only; use for delivery and analytics only.
