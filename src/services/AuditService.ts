import { AuditRepository } from '@/src/repositories/AuditRepository';
import { AuditEventType } from '@/src/models';
import { generateId, nowISO } from '@/src/utils/uuid';

const repo = new AuditRepository();

export class AuditService {
  log(
    eventType: AuditEventType,
    entityId?: string | null,
    entityType?: string | null,
    payload?: object | null
  ): void {
    try {
      repo.insert({
        id: generateId(),
        eventType,
        entityId,
        entityType,
        payload,
        createdAt: nowISO(),
      });
    } catch {
      // Audit failures must never crash the app
    }
  }
}
