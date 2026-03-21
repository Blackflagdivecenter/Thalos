import { getDb } from '@/src/db/client';
import { Signature, SignerType } from '@/src/models';

interface SignatureRow {
  id: string;
  dive_id: string;
  signer_type: SignerType;
  signer_name: string | null;
  signature_data: string;
  created_at: string;
}

function mapRow(r: SignatureRow): Signature {
  return {
    id: r.id,
    diveId: r.dive_id,
    signerType: r.signer_type,
    signerName: r.signer_name,
    signatureData: r.signature_data,
    createdAt: r.created_at,
  };
}

export class SignatureRepository {
  getByDiveId(diveId: string): Signature[] {
    const db = getDb();
    const rows = db.getAllSync<SignatureRow>(
      'SELECT * FROM signatures WHERE dive_id = ? ORDER BY created_at ASC',
      [diveId]
    );
    return rows.map(mapRow);
  }

  insert(params: {
    id: string;
    diveId: string;
    signerType: SignerType;
    signerName?: string | null;
    signatureData: string;
    createdAt: string;
  }): void {
    const db = getDb();
    db.runSync(
      `INSERT INTO signatures (id, dive_id, signer_type, signer_name, signature_data, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        params.id,
        params.diveId,
        params.signerType,
        params.signerName ?? null,
        params.signatureData,
        params.createdAt,
      ]
    );
  }
}
