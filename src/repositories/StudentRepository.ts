import { getDb } from '@/src/db/client';
import { generateId, nowISO } from '@/src/utils/uuid';
import { Student, CreateStudentInput } from '@/src/models';

function rowToStudent(r: Record<string, unknown>): Student {
  return {
    id:               r.id as string,
    name:             r.name as string,
    email:            (r.email as string | null) ?? null,
    phone:            (r.phone as string | null) ?? null,
    studentId:        (r.student_id as string | null) ?? null,
    dob:              (r.dob as string | null) ?? null,
    certLevel:        (r.cert_level as string | null) ?? null,
    certAgency:       (r.cert_agency as string | null) ?? null,
    certNumber:       (r.cert_number as string | null) ?? null,
    certDate:         (r.cert_date as string | null) ?? null,
    emergencyContact: (r.emergency_contact as string | null) ?? null,
    notes:            (r.notes as string | null) ?? null,
    createdAt:        r.created_at as string,
    updatedAt:        r.updated_at as string,
  };
}

export class StudentRepository {
  getAll(): Student[] {
    const db = getDb();
    const rows = db.getAllSync<Record<string, unknown>>(
      `SELECT * FROM instructor_students ORDER BY name ASC`,
    );
    return rows.map(rowToStudent);
  }

  getById(id: string): Student | null {
    const db = getDb();
    const row = db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM instructor_students WHERE id = ?`, [id],
    );
    return row ? rowToStudent(row) : null;
  }

  create(input: CreateStudentInput): Student {
    const db = getDb();
    const id  = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT INTO instructor_students
        (id,name,email,phone,student_id,dob,cert_level,cert_agency,cert_number,cert_date,emergency_contact,notes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, input.name,
        input.email         ?? null,
        input.phone         ?? null,
        input.studentId     ?? null,
        input.dob           ?? null,
        input.certLevel     ?? null,
        input.certAgency    ?? null,
        input.certNumber    ?? null,
        input.certDate      ?? null,
        input.emergencyContact ?? null,
        input.notes         ?? null,
        now, now,
      ],
    );
    return this.getById(id)!;
  }

  update(id: string, input: Partial<CreateStudentInput>): Student {
    const db  = getDb();
    const now = nowISO();
    db.runSync(
      `UPDATE instructor_students SET
        name=COALESCE(?,name), email=?, phone=?, student_id=?, dob=?,
        cert_level=?, cert_agency=?, cert_number=?, cert_date=?,
        emergency_contact=?, notes=?, updated_at=?
       WHERE id=?`,
      [
        input.name         ?? null,
        input.email        ?? null,
        input.phone        ?? null,
        input.studentId    ?? null,
        input.dob          ?? null,
        input.certLevel    ?? null,
        input.certAgency   ?? null,
        input.certNumber   ?? null,
        input.certDate     ?? null,
        input.emergencyContact ?? null,
        input.notes        ?? null,
        now, id,
      ],
    );
    return this.getById(id)!;
  }

  delete(id: string): void {
    const db = getDb();
    db.runSync(`DELETE FROM skill_signoffs WHERE student_id = ?`, [id]);
    db.runSync(`DELETE FROM instructor_students WHERE id = ?`,    [id]);
  }
}
