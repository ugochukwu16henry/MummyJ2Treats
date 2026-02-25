import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RidersService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, dto: {
    phone?: string;
    state: string;
    cities?: string[];
    transportType?: 'bike' | 'car' | 'motorcycle' | 'other';
  }) {
    const existing = await this.db.query('SELECT id FROM riders WHERE user_id = $1', [userId]);
    if (existing.rows[0]) throw new BadRequestException('Rider profile already exists');
    const id = uuidv4();
    await this.db.query(
      `INSERT INTO riders (id, user_id, phone, state, cities, transport_type, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [
        id,
        userId,
        dto.phone ?? null,
        dto.state,
        JSON.stringify(dto.cities ?? []),
        dto.transportType ?? null,
      ],
    );
    return this.findById(id);
  }

  async findById(id: string) {
    const r = await this.db.query(
      `SELECT r.*, u.first_name, u.last_name, u.email
       FROM riders r JOIN users u ON u.id = r.user_id WHERE r.id = $1`,
      [id],
    );
    return r.rows[0] ?? null;
  }

  async findByUserId(userId: string) {
    const r = await this.db.query('SELECT * FROM riders WHERE user_id = $1', [userId]);
    return r.rows[0] ?? null;
  }

  async listByState(state: string, availableOnly = false) {
    let q = `SELECT r.id, r.user_id, r.phone, r.state, r.cities, r.transport_type, r.is_available,
      r.current_latitude, r.current_longitude, r.location_updated_at,
      u.first_name, u.last_name
      FROM riders r JOIN users u ON u.id = r.user_id WHERE r.state = $1`;
    const params: any[] = [state];
    if (availableOnly) {
      q += ' AND r.is_available = true';
    }
    q += ' ORDER BY r.location_updated_at DESC NULLS LAST';
    const result = await this.db.query(q, params);
    return { data: result.rows };
  }

  async listAll(availableOnly = false) {
    let q = `SELECT r.id, r.user_id, r.phone, r.state, r.cities, r.transport_type, r.is_available,
      r.current_latitude, r.current_longitude, r.location_updated_at,
      u.first_name, u.last_name
      FROM riders r JOIN users u ON u.id = r.user_id`;
    const params: any[] = [];
    if (availableOnly) {
      q += ' WHERE r.is_available = true';
    }
    q += ' ORDER BY r.state, r.location_updated_at DESC NULLS LAST';
    const result = await this.db.query(q, params);
    return { data: result.rows };
  }

  async updateProfile(riderId: string, userId: string, dto: {
    phone?: string;
    state?: string;
    cities?: string[];
    transportType?: 'bike' | 'car' | 'motorcycle' | 'other';
    isAvailable?: boolean;
  }) {
    const rider = await this.findByUserId(userId);
    if (!rider || rider.id !== riderId) throw new BadRequestException('Not your rider profile');
    const updates: string[] = [];
    const values: any[] = [riderId];
    let i = 2;
    if (dto.phone !== undefined) { updates.push(`phone = $${i++}`); values.push(dto.phone); }
    if (dto.state !== undefined) { updates.push(`state = $${i++}`); values.push(dto.state); }
    if (dto.cities !== undefined) { updates.push(`cities = $${i++}`); values.push(JSON.stringify(dto.cities)); }
    if (dto.transportType !== undefined) { updates.push(`transport_type = $${i++}`); values.push(dto.transportType); }
    if (dto.isAvailable !== undefined) { updates.push(`is_available = $${i++}`); values.push(dto.isAvailable); }
    if (!updates.length) return this.findById(riderId);
    updates.push(`updated_at = NOW()`);
    await this.db.query(`UPDATE riders SET ${updates.join(', ')} WHERE id = $1`, values);
    return this.findById(riderId);
  }

  async updateLocation(riderId: string, userId: string, lat: number, lng: number, orderId?: string) {
    const rider = await this.findByUserId(userId);
    if (!rider || rider.id !== riderId) throw new BadRequestException('Not your rider profile');
    await this.db.query(
      `UPDATE riders SET current_latitude = $2, current_longitude = $3, location_updated_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [riderId, lat, lng],
    );
    const logId = uuidv4();
    await this.db.query(
      `INSERT INTO rider_location_logs (id, rider_id, order_id, latitude, longitude) VALUES ($1, $2, $3, $4, $5)`,
      [logId, riderId, orderId ?? null, lat, lng],
    );
    return this.findById(riderId);
  }

  async assignToOrder(orderId: string, riderId: string, vendorId?: string, isAdmin?: boolean) {
    const order = await this.db.query('SELECT id, vendor_id FROM orders WHERE id = $1', [orderId]);
    const o = order.rows[0];
    if (!o) throw new BadRequestException('Order not found');
    if (!isAdmin && o.vendor_id !== vendorId) throw new BadRequestException('Not your order');
    await this.db.query(
      'UPDATE orders SET rider_id = $2, rider_assigned_at = NOW() WHERE id = $1',
      [orderId, riderId],
    );
    return this.db.query('SELECT * FROM orders WHERE id = $1', [orderId]).then((r) => r.rows[0]);
  }

  async getLocation(riderId: string) {
    const r = await this.db.query(
      'SELECT current_latitude, current_longitude, location_updated_at FROM riders WHERE id = $1',
      [riderId],
    );
    return r.rows[0] ?? null;
  }

  async getRouteHistory(riderId: string, orderId: string, limit = 200) {
    const r = await this.db.query(
      `SELECT latitude, longitude, created_at FROM rider_location_logs
       WHERE rider_id = $1 AND order_id = $2 ORDER BY created_at ASC LIMIT $3`,
      [riderId, orderId, limit],
    );
    return { data: r.rows };
  }
}
