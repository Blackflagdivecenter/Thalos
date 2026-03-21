import { getDb } from '@/src/db/client';
import { PersonalCert, CreatePersonalCertInput } from '@/src/models';
import { generateId, nowISO } from '@/src/utils/uuid';

interface CertRow {
  id: string;
  cert_name: string;
  agency: string | null;
  cert_number: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(r: CertRow): PersonalCert {
  return {
    id: r.id,
    certName: r.cert_name,
    agency: r.agency,
    certNumber: r.cert_number,
    issuedDate: r.issued_date,
    expiryDate: r.expiry_date,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class PersonalCertRepository {
  getAll(): PersonalCert[] {
    const db = getDb();
    const rows = db.getAllSync<CertRow>(
      'SELECT * FROM personal_certs ORDER BY issued_date DESC, created_at DESC'
    );
    return rows.map(mapRow);
  }

  getById(id: string): PersonalCert | null {
    const db = getDb();
    const row = db.getFirstSync<CertRow>('SELECT * FROM personal_certs WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  }

  create(input: CreatePersonalCertInput): PersonalCert {
    const db = getDb();
    const id = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT INTO personal_certs (id, cert_name, agency, cert_number, issued_date, expiry_date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.certName, input.agency ?? null, input.certNumber ?? null,
       input.issuedDate ?? null, input.expiryDate ?? null, input.notes ?? null, now, now]
    );
    return this.getById(id)!;
  }

  update(id: string, input: Partial<CreatePersonalCertInput>): PersonalCert {
    const db = getDb();
    const now = nowISO();
    const existing = this.getById(id);
    if (!existing) throw new Error(`PersonalCert ${id} not found`);
    db.runSync(
      `UPDATE personal_certs SET cert_name = ?, agency = ?, cert_number = ?, issued_date = ?, expiry_date = ?, notes = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.certName ?? existing.certName,
        input.agency !== undefined ? input.agency : existing.agency,
        input.certNumber !== undefined ? input.certNumber : existing.certNumber,
        input.issuedDate !== undefined ? input.issuedDate : existing.issuedDate,
        input.expiryDate !== undefined ? input.expiryDate : existing.expiryDate,
        input.notes !== undefined ? input.notes : existing.notes,
        now, id,
      ]
    );
    return this.getById(id)!;
  }

  delete(id: string): void {
    const db = getDb();
    db.runSync('DELETE FROM personal_certs WHERE id = ?', [id]);
  }
}
