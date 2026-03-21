import { getDb } from '@/src/db/client';
import { nowISO } from '@/src/utils/uuid';
import { InstructorProfile } from '@/src/models';

function rowToProfile(r: Record<string, unknown>): InstructorProfile {
  return {
    id:               r.id as string,
    name:             (r.name as string) ?? '',
    instructorNumber: (r.instructor_number as string | null) ?? null,
    certLevel:        (r.cert_level as string | null) ?? null,
    updatedAt:        r.updated_at as string,
  };
}

export class InstructorRepository {
  getProfile(): InstructorProfile | null {
    const row = getDb().getFirstSync<Record<string, unknown>>(
      `SELECT * FROM instructor_profile WHERE id='default'`,
    );
    return row ? rowToProfile(row) : null;
  }

  saveProfile(name: string, instructorNumber?: string | null, certLevel?: string | null): InstructorProfile {
    const db  = getDb();
    const now = nowISO();
    db.runSync(
      `INSERT INTO instructor_profile (id,name,instructor_number,cert_level,updated_at)
       VALUES ('default',?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, instructor_number=excluded.instructor_number,
         cert_level=excluded.cert_level, updated_at=excluded.updated_at`,
      [name, instructorNumber ?? null, certLevel ?? null, now],
    );
    return rowToProfile(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM instructor_profile WHERE id='default'`,
    )!);
  }
}
