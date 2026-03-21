import { getDb } from '@/src/db/client';
import { AuditEvent, AuditEventType } from '@/src/models';

interface AuditRow {
  id: string;
  event_type: AuditEventType;
  entity_id: string | null;
  entity_type: string | null;
  payload: string | null;
  created_at: string;
}

function mapRow(r: AuditRow): AuditEvent {
  return {
    id: r.id,
    eventType: r.event_type,
    entityId: r.entity_id,
    entityType: r.entity_type,
    payload: r.payload,
    createdAt: r.created_at,
  };
}

export class AuditRepository {
  insert(params: {
    id: string;
    eventType: AuditEventType;
    entityId?: string | null;
    entityType?: string | null;
    payload?: object | null;
    createdAt: string;
  }): void {
    const db = getDb();
    db.runSync(
      `INSERT INTO audit_events (id, event_type, entity_id, entity_type, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.id,
        params.eventType,
        params.entityId ?? null,
        params.entityType ?? null,
        params.payload ? JSON.stringify(params.payload) : null,
        params.createdAt,
      ]
    );
  }

  getRecent(limit = 50): AuditEvent[] {
    const db = getDb();
    const rows = db.getAllSync<AuditRow>(
      'SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows.map(mapRow);
  }
}
