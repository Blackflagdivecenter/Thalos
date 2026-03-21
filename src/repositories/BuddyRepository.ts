import { getDb } from '@/src/db/client';
import { generateId, nowISO, todayISO } from '@/src/utils/uuid';
import type { BuddyProfile, CreateBuddyInput, DiveBuddy } from '@/src/models';

interface BuddyRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cert_level: string | null;
  cert_agency: string | null;
  cert_number: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook_handle: string | null;
  twitter_handle: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface DiveBuddyRow {
  id: string;
  dive_id: string;
  buddy_id: string;
  dive_date: string;
  created_at: string;
}

function rowToBuddy(r: BuddyRow): BuddyProfile {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    certLevel: r.cert_level,
    certAgency: r.cert_agency,
    certNumber: r.cert_number,
    instagram: r.instagram,
    tiktok: r.tiktok,
    facebookHandle: r.facebook_handle,
    twitterHandle: r.twitter_handle,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToDiveBuddy(r: DiveBuddyRow): DiveBuddy {
  return {
    id: r.id,
    diveId: r.dive_id,
    buddyId: r.buddy_id,
    diveDate: r.dive_date,
    createdAt: r.created_at,
  };
}

export const BuddyRepository = {
  create(input: CreateBuddyInput): BuddyProfile {
    const id = generateId();
    const now = nowISO();
    getDb().runSync(
      `INSERT INTO buddy_profiles
         (id, name, email, phone, cert_level, cert_agency, cert_number,
          instagram, tiktok, facebook_handle, twitter_handle, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, input.name,
        input.email ?? null, input.phone ?? null,
        input.certLevel ?? null, input.certAgency ?? null, input.certNumber ?? null,
        input.instagram ?? null, input.tiktok ?? null,
        input.facebookHandle ?? null, input.twitterHandle ?? null,
        input.notes ?? null, now, now,
      ],
    );
    return {
      id, name: input.name,
      email: input.email ?? null, phone: input.phone ?? null,
      certLevel: input.certLevel ?? null, certAgency: input.certAgency ?? null,
      certNumber: input.certNumber ?? null,
      instagram: input.instagram ?? null, tiktok: input.tiktok ?? null,
      facebookHandle: input.facebookHandle ?? null, twitterHandle: input.twitterHandle ?? null,
      notes: input.notes ?? null, createdAt: now, updatedAt: now,
    };
  },

  listAll(): BuddyProfile[] {
    const rows = getDb().getAllSync<BuddyRow>(
      `SELECT * FROM buddy_profiles ORDER BY name ASC`,
    );
    return rows.map(rowToBuddy);
  },

  getById(id: string): BuddyProfile | null {
    const row = getDb().getFirstSync<BuddyRow>(
      `SELECT * FROM buddy_profiles WHERE id = ?`, [id],
    );
    return row ? rowToBuddy(row) : null;
  },

  update(id: string, input: Partial<CreateBuddyInput>): void {
    const now = nowISO();
    getDb().runSync(
      `UPDATE buddy_profiles SET
         name = COALESCE(?, name),
         email = ?,
         phone = ?,
         cert_level = ?,
         cert_agency = ?,
         cert_number = ?,
         instagram = ?,
         tiktok = ?,
         facebook_handle = ?,
         twitter_handle = ?,
         notes = ?,
         updated_at = ?
       WHERE id = ?`,
      [
        input.name ?? null,
        input.email ?? null, input.phone ?? null,
        input.certLevel ?? null, input.certAgency ?? null, input.certNumber ?? null,
        input.instagram ?? null, input.tiktok ?? null,
        input.facebookHandle ?? null, input.twitterHandle ?? null,
        input.notes ?? null, now, id,
      ],
    );
  },

  delete(id: string): void {
    getDb().runSync(`DELETE FROM buddy_profiles WHERE id = ?`, [id]);
  },

  // ── Dive-Buddy junction ────────────────────────────────────────────────────

  getBuddiesForDive(diveId: string): BuddyProfile[] {
    const rows = getDb().getAllSync<BuddyRow>(
      `SELECT bp.* FROM buddy_profiles bp
       JOIN dive_buddies db ON db.buddy_id = bp.id
       WHERE db.dive_id = ?
       ORDER BY bp.name ASC`,
      [diveId],
    );
    return rows.map(rowToBuddy);
  },

  addBuddyToDive(diveId: string, buddyId: string): DiveBuddy {
    const id = generateId();
    const now = nowISO();
    const date = todayISO();
    getDb().runSync(
      `INSERT OR IGNORE INTO dive_buddies (id, dive_id, buddy_id, dive_date, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, diveId, buddyId, date, now],
    );
    const row = getDb().getFirstSync<DiveBuddyRow>(
      `SELECT * FROM dive_buddies WHERE dive_id = ? AND buddy_id = ?`,
      [diveId, buddyId],
    )!;
    return rowToDiveBuddy(row);
  },

  removeBuddyFromDive(diveId: string, buddyId: string): void {
    getDb().runSync(
      `DELETE FROM dive_buddies WHERE dive_id = ? AND buddy_id = ?`,
      [diveId, buddyId],
    );
  },
};
