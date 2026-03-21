import { getDb } from '@/src/db/client';
import { MarineLifeSighting, CreateMarineLifeInput } from '@/src/models';
import { generateId, nowISO } from '@/src/utils/uuid';

interface SightingRow {
  id: string;
  dive_id: string;
  species: string;
  count: number | null;
  notes: string | null;
  created_at: string;
}

function mapRow(r: SightingRow): MarineLifeSighting {
  return {
    id: r.id,
    diveId: r.dive_id,
    species: r.species,
    count: r.count,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export class MarineLifeRepository {
  getForDive(diveId: string): MarineLifeSighting[] {
    const db = getDb();
    const rows = db.getAllSync<SightingRow>(
      'SELECT * FROM marine_life_sightings WHERE dive_id = ? ORDER BY created_at ASC',
      [diveId]
    );
    return rows.map(mapRow);
  }

  create(input: CreateMarineLifeInput): MarineLifeSighting {
    const db = getDb();
    const id = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT INTO marine_life_sightings (id, dive_id, species, count, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, input.diveId, input.species, input.count ?? null, input.notes ?? null, now]
    );
    const row = db.getFirstSync<SightingRow>(
      'SELECT * FROM marine_life_sightings WHERE id = ?', [id]
    );
    return mapRow(row!);
  }

  delete(id: string): void {
    const db = getDb();
    db.runSync('DELETE FROM marine_life_sightings WHERE id = ?', [id]);
  }
}
