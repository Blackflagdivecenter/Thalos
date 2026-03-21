import { getDb } from '@/src/db/client';
import { Site } from '@/src/models';

interface SiteRow {
  id: string;
  name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  max_depth_meters: number | null;
  description: string | null;
  conditions: string | null;
  access_notes: string | null;
  is_cached_offline: number;
  last_cached_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(r: SiteRow): Site {
  return {
    id: r.id,
    name: r.name,
    location: r.location,
    latitude: r.latitude,
    longitude: r.longitude,
    maxDepthMeters: r.max_depth_meters,
    description: r.description,
    conditions: r.conditions,
    accessNotes: r.access_notes,
    isCachedOffline: r.is_cached_offline === 1,
    lastCachedAt: r.last_cached_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class SiteRepository {
  getAll(): Site[] {
    const db = getDb();
    const rows = db.getAllSync<SiteRow>(
      'SELECT * FROM dive_sites ORDER BY name ASC'
    );
    return rows.map(mapRow);
  }

  getById(id: string): Site | null {
    const db = getDb();
    const row = db.getFirstSync<SiteRow>(
      'SELECT * FROM dive_sites WHERE id = ?',
      [id]
    );
    return row ? mapRow(row) : null;
  }

  insert(params: {
    id: string;
    name: string;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    maxDepthMeters?: number | null;
    description?: string | null;
    conditions?: string | null;
    accessNotes?: string | null;
    createdAt: string;
  }): void {
    const db = getDb();
    db.runSync(
      `INSERT INTO dive_sites
         (id, name, location, latitude, longitude, max_depth_meters,
          description, conditions, access_notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.id, params.name, params.location ?? null,
        params.latitude ?? null, params.longitude ?? null,
        params.maxDepthMeters ?? null, params.description ?? null,
        params.conditions ?? null, params.accessNotes ?? null,
        params.createdAt, params.createdAt,
      ]
    );
  }

  update(id: string, params: {
    name?: string;
    location?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    maxDepthMeters?: number | null;
    description?: string | null;
    conditions?: string | null;
    accessNotes?: string | null;
    updatedAt: string;
  }): void {
    const db = getDb();
    db.runSync(
      `UPDATE dive_sites SET
         name = COALESCE(?, name),
         location = ?,
         latitude = ?,
         longitude = ?,
         max_depth_meters = ?,
         description = ?,
         conditions = ?,
         access_notes = ?,
         updated_at = ?
       WHERE id = ?`,
      [
        params.name ?? null, params.location ?? null,
        params.latitude ?? null, params.longitude ?? null,
        params.maxDepthMeters ?? null, params.description ?? null,
        params.conditions ?? null, params.accessNotes ?? null,
        params.updatedAt, id,
      ]
    );
  }

  delete(id: string): void {
    const db = getDb();
    db.runSync('DELETE FROM dive_sites WHERE id = ?', [id]);
  }
}
