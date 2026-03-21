import { getDb } from '@/src/db/client';
import { Trip, CreateTripInput } from '@/src/models';
import { generateId, nowISO } from '@/src/utils/uuid';

interface TripRow {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(r: TripRow): Trip {
  return {
    id: r.id,
    name: r.name,
    destination: r.destination,
    startDate: r.start_date,
    endDate: r.end_date,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class TripRepository {
  getAll(): Trip[] {
    const db = getDb();
    const rows = db.getAllSync<TripRow>(
      'SELECT * FROM trips ORDER BY start_date DESC, created_at DESC'
    );
    return rows.map(mapRow);
  }

  getById(id: string): Trip | null {
    const db = getDb();
    const row = db.getFirstSync<TripRow>('SELECT * FROM trips WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  }

  create(input: CreateTripInput): Trip {
    const db = getDb();
    const id = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT INTO trips (id, name, destination, start_date, end_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.name, input.destination ?? null, input.startDate ?? null,
       input.endDate ?? null, input.notes ?? null, now, now]
    );
    return this.getById(id)!;
  }

  update(id: string, input: Partial<CreateTripInput>): Trip {
    const db = getDb();
    const now = nowISO();
    const existing = this.getById(id);
    if (!existing) throw new Error(`Trip ${id} not found`);
    db.runSync(
      `UPDATE trips SET name = ?, destination = ?, start_date = ?, end_date = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.name ?? existing.name,
        input.destination !== undefined ? input.destination : existing.destination,
        input.startDate !== undefined ? input.startDate : existing.startDate,
        input.endDate !== undefined ? input.endDate : existing.endDate,
        input.notes !== undefined ? input.notes : existing.notes,
        now, id,
      ]
    );
    return this.getById(id)!;
  }

  delete(id: string): void {
    const db = getDb();
    db.runSync('DELETE FROM trips WHERE id = ?', [id]);
  }

  getDiveCount(tripId: string): number {
    const db = getDb();
    const row = db.getFirstSync<{ cnt: number }>(
      'SELECT COUNT(*) as cnt FROM dives WHERE trip_id = ? AND is_deleted = 0',
      [tripId]
    );
    return row?.cnt ?? 0;
  }
}
