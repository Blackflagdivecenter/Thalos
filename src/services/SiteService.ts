import { getDb } from '@/src/db/client';
import { SiteRepository } from '@/src/repositories/SiteRepository';
import { EAPRepository } from '@/src/repositories/EAPRepository';
import { AuditService } from './AuditService';
import { Site, EAP, CreateSiteInput } from '@/src/models';
import { generateId, nowISO } from '@/src/utils/uuid';

const siteRepo = new SiteRepository();
const eapRepo = new EAPRepository();
const audit = new AuditService();

export class SiteService {
  getAllSites(): Site[] {
    return siteRepo.getAll();
  }

  getSite(id: string): Site | null {
    return siteRepo.getById(id);
  }

  getEAP(siteId: string): EAP | null {
    return eapRepo.getBySiteId(siteId);
  }

  createSite(input: CreateSiteInput): Site {
    const db = getDb();
    const now = nowISO();
    const siteId = generateId();
    const eapId = generateId();

    db.withTransactionSync(() => {
      siteRepo.insert({ id: siteId, ...input, createdAt: now });
      eapRepo.insert({ id: eapId, siteId, createdAt: now });
    });

    audit.log('SITE_CREATED', siteId, 'site', { name: input.name });

    return siteRepo.getById(siteId)!;
  }

  updateSite(id: string, input: Partial<CreateSiteInput>): Site {
    const now = nowISO();
    siteRepo.update(id, { ...input, updatedAt: now });
    audit.log('SITE_EDITED', id, 'site');
    return siteRepo.getById(id)!;
  }

  updateEAP(siteId: string, fields: Partial<Omit<EAP, 'id' | 'siteId' | 'createdAt'>>): void {
    const now = nowISO();
    eapRepo.update(siteId, fields, now);
    audit.log('EAP_UPDATED', siteId, 'site');
  }

  deleteSite(id: string): void {
    const db = getDb();
    db.withTransactionSync(() => {
      eapRepo.deleteBySiteId(id);
      siteRepo.delete(id);
    });
  }
}
