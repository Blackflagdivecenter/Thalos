import { getDb } from '@/src/db/client';
import { generateId, nowISO } from '@/src/utils/uuid';
import { NO_SERVICE_GEAR_TYPES } from '@/src/models';
import type {
  GearItem, GearSet, GearSetWithItems, ServiceRecord,
  CreateGearItemInput, UpdateGearItemInput,
  CreateGearSetInput, UpdateGearSetInput,
  CreateServiceRecordInput,
} from '@/src/models';

// ── Row types (snake_case from SQLite) ────────────────────────────────────────

interface GearItemRow {
  id: string; name: string; brand: string | null; model: string | null;
  gear_type: string; serial_number: string | null; purchase_date: string | null;
  notes: string | null; dive_count: number; dive_count_at_last_service: number;
  last_service_date: string | null; requires_service: number;
  created_at: string; updated_at: string;
}

interface GearSetRow {
  id: string; name: string; diving_type: string; is_default: number;
  dive_count: number; created_at: string; updated_at: string;
}

interface ServiceRecordRow {
  id: string; gear_item_id: string; service_date: string;
  description: string | null; provider: string | null; cost_cents: number | null;
  notes: string | null; dive_count_at_service: number; created_at: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function rowToItem(r: GearItemRow): GearItem {
  return {
    id: r.id, name: r.name, brand: r.brand, model: r.model,
    gearType: r.gear_type as GearItem['gearType'],
    serialNumber: r.serial_number, purchaseDate: r.purchase_date,
    notes: r.notes, diveCount: r.dive_count,
    diveCountAtLastService: r.dive_count_at_last_service,
    lastServiceDate: r.last_service_date,
    requiresService: r.requires_service === 1,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function rowToSet(r: GearSetRow): GearSet {
  return {
    id: r.id, name: r.name,
    divingType: r.diving_type as GearSet['divingType'],
    isDefault: r.is_default === 1,
    diveCount: r.dive_count,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function rowToServiceRecord(r: ServiceRecordRow): ServiceRecord {
  return {
    id: r.id, gearItemId: r.gear_item_id, serviceDate: r.service_date,
    description: r.description, provider: r.provider, costCents: r.cost_cents,
    notes: r.notes, diveCountAtService: r.dive_count_at_service, createdAt: r.created_at,
  };
}

// ── Repository ────────────────────────────────────────────────────────────────

export const GearRepository = {

  // ── Gear Items ──────────────────────────────────────────────────────────────

  createItem(input: CreateGearItemInput): GearItem {
    const db  = getDb();
    const id  = generateId();
    const now = nowISO();
    // auto-derive requiresService from type unless caller explicitly sets it
    const reqService = input.requiresService !== undefined
      ? input.requiresService
      : !NO_SERVICE_GEAR_TYPES.includes(input.gearType);

    db.runSync(
      `INSERT INTO gear_items
        (id, name, brand, model, gear_type, serial_number, purchase_date,
         notes, dive_count, dive_count_at_last_service, last_service_date,
         requires_service, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, ?, ?)`,
      [id, input.name, input.brand ?? null, input.model ?? null,
       input.gearType, input.serialNumber ?? null, input.purchaseDate ?? null,
       input.notes ?? null, reqService ? 1 : 0, now, now],
    );
    return {
      id, name: input.name, brand: input.brand ?? null, model: input.model ?? null,
      gearType: input.gearType, serialNumber: input.serialNumber ?? null,
      purchaseDate: input.purchaseDate ?? null, notes: input.notes ?? null,
      diveCount: 0, diveCountAtLastService: 0, lastServiceDate: null,
      requiresService: reqService, createdAt: now, updatedAt: now,
    };
  },

  updateItem(id: string, input: UpdateGearItemInput): void {
    // Load existing to merge — avoids passing undefined to SQLite
    const existing = GearRepository.getItem(id);
    if (!existing) return;
    const now = nowISO();
    getDb().runSync(
      `UPDATE gear_items SET
        name             = ?,
        brand            = ?,
        model            = ?,
        serial_number    = ?,
        purchase_date    = ?,
        notes            = ?,
        requires_service = ?,
        updated_at       = ?
       WHERE id = ?`,
      [
        input.name             !== undefined ? input.name             : existing.name,
        input.brand            !== undefined ? (input.brand ?? null)          : existing.brand,
        input.model            !== undefined ? (input.model ?? null)          : existing.model,
        input.serialNumber     !== undefined ? (input.serialNumber ?? null)   : existing.serialNumber,
        input.purchaseDate     !== undefined ? (input.purchaseDate ?? null)   : existing.purchaseDate,
        input.notes            !== undefined ? (input.notes ?? null)          : existing.notes,
        input.requiresService  !== undefined ? (input.requiresService ? 1 : 0) : (existing.requiresService ? 1 : 0),
        now, id,
      ],
    );
  },

  deleteItem(id: string): void {
    getDb().runSync(`DELETE FROM gear_items WHERE id = ?`, [id]);
  },

  getItem(id: string): GearItem | null {
    const row = getDb().getFirstSync<GearItemRow>(
      `SELECT * FROM gear_items WHERE id = ?`, [id],
    );
    return row ? rowToItem(row) : null;
  },

  listItems(): GearItem[] {
    const rows = getDb().getAllSync<GearItemRow>(
      `SELECT * FROM gear_items ORDER BY name ASC`,
    );
    return rows.map(rowToItem);
  },

  // ── Gear Sets ───────────────────────────────────────────────────────────────

  createSet(input: CreateGearSetInput): GearSet {
    const db  = getDb();
    const id  = generateId();
    const now = nowISO();
    const isDefault = input.isDefault ? 1 : 0;

    if (isDefault) {
      db.runSync(
        `UPDATE gear_sets SET is_default = 0, updated_at = ? WHERE diving_type = ?`,
        [now, input.divingType],
      );
    }

    db.runSync(
      `INSERT INTO gear_sets (id, name, diving_type, is_default, dive_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [id, input.name, input.divingType, isDefault, now, now],
    );
    return {
      id, name: input.name, divingType: input.divingType,
      isDefault: Boolean(isDefault), diveCount: 0, createdAt: now, updatedAt: now,
    };
  },

  updateSet(id: string, input: UpdateGearSetInput): void {
    const db  = getDb();
    const now = nowISO();
    if (input.isDefault) {
      // Get current diving type for this set to clear others
      const row = db.getFirstSync<{ diving_type: string }>(
        `SELECT diving_type FROM gear_sets WHERE id = ?`, [id],
      );
      if (row) {
        db.runSync(
          `UPDATE gear_sets SET is_default = 0, updated_at = ?
           WHERE diving_type = ? AND id != ?`,
          [now, row.diving_type, id],
        );
      }
    }
    db.runSync(
      `UPDATE gear_sets SET
        name        = COALESCE(?, name),
        diving_type = COALESCE(?, diving_type),
        is_default  = COALESCE(?, is_default),
        updated_at  = ?
       WHERE id = ?`,
      [
        input.name       ?? null,
        input.divingType ?? null,
        input.isDefault !== undefined ? (input.isDefault ? 1 : 0) : null,
        now, id,
      ],
    );
  },

  deleteSet(id: string): void {
    getDb().runSync(`DELETE FROM gear_sets WHERE id = ?`, [id]);
  },

  _buildSetWithItems(setRow: GearSetRow): GearSetWithItems {
    const itemRows = getDb().getAllSync<GearItemRow>(
      `SELECT gi.* FROM gear_items gi
       JOIN gear_set_items gsi ON gsi.gear_item_id = gi.id
       WHERE gsi.set_id = ?
       ORDER BY gi.name ASC`,
      [setRow.id],
    );
    return { ...rowToSet(setRow), items: itemRows.map(rowToItem) };
  },

  getSetWithItems(id: string): GearSetWithItems | null {
    const row = getDb().getFirstSync<GearSetRow>(
      `SELECT * FROM gear_sets WHERE id = ?`, [id],
    );
    return row ? GearRepository._buildSetWithItems(row) : null;
  },

  listSetsWithItems(): GearSetWithItems[] {
    const rows = getDb().getAllSync<GearSetRow>(
      `SELECT * FROM gear_sets ORDER BY name ASC`,
    );
    return rows.map(r => GearRepository._buildSetWithItems(r));
  },

  getDefaultSet(divingType: GearSet['divingType']): GearSetWithItems | null {
    const row = getDb().getFirstSync<GearSetRow>(
      `SELECT * FROM gear_sets WHERE diving_type = ? AND is_default = 1 LIMIT 1`,
      [divingType],
    );
    return row ? GearRepository._buildSetWithItems(row) : null;
  },

  // ── Set ↔ Item membership ───────────────────────────────────────────────────

  addItemToSet(setId: string, itemId: string): void {
    const id  = generateId();
    const now = nowISO();
    try {
      getDb().runSync(
        `INSERT OR IGNORE INTO gear_set_items (id, set_id, gear_item_id, created_at)
         VALUES (?, ?, ?, ?)`,
        [id, setId, itemId, now],
      );
    } catch {
      // UNIQUE constraint — already in set, silently ignore
    }
  },

  removeItemFromSet(setId: string, itemId: string): void {
    getDb().runSync(
      `DELETE FROM gear_set_items WHERE set_id = ? AND gear_item_id = ?`,
      [setId, itemId],
    );
  },

  // ── Dive count increment ────────────────────────────────────────────────────

  /** Called after a dive is logged. Increments the set + all items in it by 1. */
  logDivesOnSet(setId: string): void {
    const db  = getDb();
    const now = nowISO();

    db.withTransactionSync(() => {
      // Increment gear set
      db.runSync(
        `UPDATE gear_sets SET dive_count = dive_count + 1, updated_at = ? WHERE id = ?`,
        [now, setId],
      );
      // Increment all items belonging to the set
      db.runSync(
        `UPDATE gear_items SET dive_count = dive_count + 1, updated_at = ?
         WHERE id IN (
           SELECT gear_item_id FROM gear_set_items WHERE set_id = ?
         )`,
        [now, setId],
      );
    });
  },

  // ── Service records ─────────────────────────────────────────────────────────

  addServiceRecord(input: CreateServiceRecordInput): ServiceRecord {
    const db  = getDb();
    const id  = generateId();
    const now = nowISO();

    // Snapshot current dive count for this item
    const itemRow = db.getFirstSync<{ dive_count: number }>(
      `SELECT dive_count FROM gear_items WHERE id = ?`, [input.gearItemId],
    );
    const diveCountAtService = itemRow?.dive_count ?? 0;

    db.withTransactionSync(() => {
      db.runSync(
        `INSERT INTO service_records
          (id, gear_item_id, service_date, description, provider,
           cost_cents, notes, dive_count_at_service, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, input.gearItemId, input.serviceDate,
         input.description ?? null, input.provider ?? null,
         input.costCents ?? null, input.notes ?? null,
         diveCountAtService, now],
      );

      // Update item's last service fields
      db.runSync(
        `UPDATE gear_items
         SET last_service_date           = ?,
             dive_count_at_last_service  = ?,
             updated_at                  = ?
         WHERE id = ?`,
        [input.serviceDate, diveCountAtService, now, input.gearItemId],
      );
    });

    return {
      id, gearItemId: input.gearItemId, serviceDate: input.serviceDate,
      description: input.description ?? null, provider: input.provider ?? null,
      costCents: input.costCents ?? null, notes: input.notes ?? null,
      diveCountAtService, createdAt: now,
    };
  },

  getServiceHistory(gearItemId: string): ServiceRecord[] {
    const rows = getDb().getAllSync<ServiceRecordRow>(
      `SELECT * FROM service_records
       WHERE gear_item_id = ?
       ORDER BY service_date DESC, created_at DESC`,
      [gearItemId],
    );
    return rows.map(rowToServiceRecord);
  },
};
