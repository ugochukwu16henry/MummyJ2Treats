import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const result = await this.db.query('SELECT id, first_name, last_name, email, role, is_active FROM users');
    return { data: result.rows };
  }

  async findOne(id: string) {
    const result = await this.db.query('SELECT id, first_name, last_name, email, role, is_active FROM users WHERE id = $1', [id]);
    return result.rows[0] ?? null;
  }

  async update(id: string, dto: Record<string, unknown>) {
    const fields = Object.keys(dto);
    if (!fields.length) {
      const existing = await this.findOne(id);
      return existing;
    }

    const setClauses = fields.map((field, index) => `${field} = $${index + 2}`);
    const values = fields.map((field) => dto[field]);

    const result = await this.db.query(
      `UPDATE users SET ${setClauses.join(', ')}, updated_at = now() WHERE id = $1 RETURNING id, first_name, last_name, email, role, is_active`,
      [id, ...values],
    );
    return result.rows[0] ?? null;
  }

  async findByEmail(email: string) {
    const result = await this.db.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ?? null;
  }

  async createUser(params: {
    role: 'admin' | 'vendor' | 'customer' | 'rider';
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passwordHash: string;
  }) {
    const id = uuidv4();
    const result = await this.db.query(
      `INSERT INTO users (id, role, first_name, last_name, email, phone, password_hash, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, role, first_name, last_name, email, phone, is_active`,
      [id, params.role, params.firstName, params.lastName, params.email, params.phone ?? null, params.passwordHash],
    );
    return result.rows[0];
  }
}
