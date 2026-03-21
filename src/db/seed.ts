import { getDb } from './client';
import { generateId, nowISO } from '@/src/utils/uuid';

/**
 * Seeds 3 dive sites and 3 sample dives for demo/dev purposes.
 * Call this manually — it will no-op if data already exists.
 */
export function seedDatabase(): void {
  const db = getDb();

  const existing = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM dive_sites'
  );
  if (existing && existing.count > 0) return;

  const now = nowISO();

  // ── Sites ─────────────────────────────────────────────────────────────────
  const sites = [
    { id: generateId(), name: 'Blue Heron Bridge', location: 'Riviera Beach, FL', maxDepth: 6 },
    { id: generateId(), name: 'Molasses Reef', location: 'Key Largo, FL', maxDepth: 12 },
    { id: generateId(), name: "Devil's Den", location: 'Williston, FL', maxDepth: 16 },
  ];

  for (const site of sites) {
    db.runSync(
      `INSERT INTO dive_sites (id, name, location, max_depth_meters, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [site.id, site.name, site.location, site.maxDepth, now, now]
    );

    const eapId = generateId();
    db.runSync(
      `INSERT INTO emergency_action_plans
         (id, site_id, dan_emergency_number, created_at, updated_at)
       VALUES (?, ?, '+1-919-684-9111', ?, ?)`,
      [eapId, site.id, now, now]
    );
  }

  // ── Dives ─────────────────────────────────────────────────────────────────
  const dives = [
    {
      diveId: generateId(),
      diveType: 'RECREATIONAL' as const,
      diveNumber: 1,
      date: '2025-01-15',
      siteName: 'Blue Heron Bridge',
      maxDepth: 5.8,
      bottomTime: 45,
      gasType: 'Air',
    },
    {
      diveId: generateId(),
      diveType: 'TRAINING' as const,
      diveNumber: 2,
      date: '2025-02-10',
      siteName: 'Molasses Reef',
      maxDepth: 11.4,
      bottomTime: 38,
      gasType: 'EAN32',
    },
    {
      diveId: generateId(),
      diveType: 'RECREATIONAL' as const,
      diveNumber: 3,
      date: '2025-03-01',
      siteName: "Devil's Den",
      maxDepth: 15.9,
      bottomTime: 52,
      gasType: 'Air',
      notes: 'Night dive — beautiful visibility',
    },
  ];

  for (const d of dives) {
    const versionId = generateId();
    db.runSync(
      `INSERT INTO dives
         (id, dive_number, dive_type, current_version_id, is_signed_by_instructor, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 0, ?, ?)`,
      [d.diveId, d.diveNumber, d.diveType, versionId, now, now]
    );
    db.runSync(
      `INSERT INTO dive_versions
         (id, dive_id, version_number, created_at, date, site_name, max_depth_meters,
          bottom_time_minutes, gas_type, notes)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`,
      [
        versionId, d.diveId, now, d.date, d.siteName,
        d.maxDepth, d.bottomTime, d.gasType, d.notes ?? null,
      ]
    );
  }
}
