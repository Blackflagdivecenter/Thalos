import { getDb } from '@/src/db/client';
import { CertVerification, CreateCertVerificationInput } from '@/src/models';
import { generateId, nowISO, todayISO } from '@/src/utils/uuid';

type Row = {
  id: string;
  diver_name: string;
  agency: string;
  cert_level: string | null;
  cert_number: string | null;
  verified_at: string;
  notes: string | null;
  created_at: string;
};

function mapRow(r: Row): CertVerification {
  return {
    id:          r.id,
    diverName:   r.diver_name,
    agency:      r.agency,
    certLevel:   r.cert_level,
    certNumber:  r.cert_number,
    verifiedAt:  r.verified_at,
    notes:       r.notes,
    createdAt:   r.created_at,
  };
}

export class CertVerificationRepository {
  getAll(): CertVerification[] {
    const db = getDb();
    const rows = db.getAllSync<Row>(
      'SELECT * FROM cert_verifications ORDER BY verified_at DESC, created_at DESC'
    );
    return rows.map(mapRow);
  }

  search(query: string): CertVerification[] {
    const db = getDb();
    const q = `%${query.toLowerCase()}%`;
    const rows = db.getAllSync<Row>(
      `SELECT * FROM cert_verifications
       WHERE LOWER(diver_name) LIKE ? OR LOWER(agency) LIKE ? OR LOWER(cert_level) LIKE ?
       ORDER BY verified_at DESC, created_at DESC`,
      [q, q, q]
    );
    return rows.map(mapRow);
  }

  create(input: CreateCertVerificationInput): CertVerification {
    const db = getDb();
    const id  = generateId();
    const now = nowISO();
    const verifiedAt = input.verifiedAt ?? todayISO();
    db.runSync(
      `INSERT INTO cert_verifications
         (id, diver_name, agency, cert_level, cert_number, verified_at, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.diverName, input.agency, input.certLevel ?? null,
       input.certNumber ?? null, verifiedAt, input.notes ?? null, now]
    );
    return {
      id,
      diverName:  input.diverName,
      agency:     input.agency,
      certLevel:  input.certLevel ?? null,
      certNumber: input.certNumber ?? null,
      verifiedAt,
      notes:      input.notes ?? null,
      createdAt:  now,
    };
  }

  delete(id: string): void {
    const db = getDb();
    db.runSync('DELETE FROM cert_verifications WHERE id = ?', [id]);
  }
}
