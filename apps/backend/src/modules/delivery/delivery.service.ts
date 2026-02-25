import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

/** Distance-based delivery pricing. Uses Google Distance Matrix when API key is set. */
@Injectable()
export class DeliveryService {
  constructor(private readonly db: DatabaseService) {}

  /** Haversine distance in km (fallback when no Google API) */
  private haversineKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /** Call Google Distance Matrix API; returns { distanceKm, durationMinutes } or null */
  private async googleDistance(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ): Promise<{ distanceKm: number; durationMinutes: number } | null> {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return null;
    const url =
      'https://maps.googleapis.com/maps/api/distancematrix/json?' +
      `origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${key}`;
    try {
      const res = await fetch(url);
      const data = (await res.json()) as {
        rows?: Array<{
          elements?: Array<{
            status?: string;
            distance?: { value: number };
            duration?: { value: number };
          }>;
        }>;
      };
      const el = data.rows?.[0]?.elements?.[0];
      if (el?.status !== 'OK' || el.distance == null) return null;
      return {
        distanceKm: el.distance.value / 1000,
        durationMinutes: (el.duration?.value ?? 0) / 60,
      };
    } catch {
      return null;
    }
  }

  /**
   * Compute delivery fee for vendor → customer.
   * Uses vendor's delivery_min_fee, delivery_price_per_km, delivery_fixed_city_rate, inter_state_delivery_fee.
   */
  async computeDeliveryFee(
    vendorId: string,
    customerLat: number | null,
    customerLng: number | null,
    customerState?: string | null,
  ): Promise<{ deliveryFee: number; distanceKm: number | null }> {
    const v = await this.db.query(
      `SELECT vendor_latitude, vendor_longitude, operating_state,
        delivery_min_fee, delivery_price_per_km, delivery_fixed_city_rate,
        inter_state_delivery_fee, max_delivery_radius_km, deliver_outside_state
       FROM vendors WHERE id = $1`,
      [vendorId],
    );
    const row = v.rows[0];
    if (!row) return { deliveryFee: 0, distanceKm: null };

    const minFee = Number(row.delivery_min_fee ?? 0);
    const pricePerKm = Number(row.delivery_price_per_km ?? 0);
    const fixedCityRate = row.delivery_fixed_city_rate != null ? Number(row.delivery_fixed_city_rate) : null;
    const interStateFee = row.inter_state_delivery_fee != null ? Number(row.inter_state_delivery_fee) : null;
    const maxRadius = row.max_delivery_radius_km != null ? Number(row.max_delivery_radius_km) : null;
    const vendorLat = row.vendor_latitude != null ? Number(row.vendor_latitude) : null;
    const vendorLng = row.vendor_longitude != null ? Number(row.vendor_longitude) : null;
    const vendorState = row.operating_state ?? null;

    let distanceKm: number | null = null;

    if (customerLat != null && customerLng != null && vendorLat != null && vendorLng != null) {
      const google = await this.googleDistance(vendorLat, vendorLng, customerLat, customerLng);
      if (google) {
        distanceKm = google.distanceKm;
      } else {
        distanceKm = this.haversineKm(vendorLat, vendorLng, customerLat, customerLng);
      }
      if (maxRadius != null && distanceKm > maxRadius) {
        return { deliveryFee: 0, distanceKm }; // caller may treat as "out of range"
      }
    }

    if (customerState && vendorState && customerState.trim() !== vendorState.trim() && interStateFee != null) {
      return { deliveryFee: interStateFee, distanceKm };
    }

    if (fixedCityRate != null && customerState && vendorState && customerState.trim() === vendorState.trim()) {
      return { deliveryFee: fixedCityRate, distanceKm };
    }

    if (distanceKm != null && pricePerKm > 0) {
      const byDistance = Math.max(minFee, distanceKm * pricePerKm);
      return { deliveryFee: Math.round(byDistance * 100) / 100, distanceKm };
    }

    return { deliveryFee: minFee, distanceKm };
  }
}
