import { getDb } from '@/src/db/client';
import { generateId, nowISO } from '@/src/utils/uuid';
import {
  InstructorCourse,
  InstructorCourseSkill,
  SkillSignoff,
  SkillEnvironment,
  CourseSession,
  Enrollment,
  SessionAttendance,
  Certification,
  InstructorDocument,
  TrainingAcknowledgment,
  CreateCourseInput,
  CreateSessionInput,
  CreateCertificationInput,
  CreateDocumentInput,
  CreateAcknowledgmentInput,
  CourseStatus,
  SkillOverrides,
} from '@/src/models';

// ── Row mappers ──────────────────────────────────────────────────────────────

function rowToCourse(r: Record<string, unknown>): InstructorCourse {
  let skillOverrides: SkillOverrides | null = null;
  if (r.skill_overrides) {
    try { skillOverrides = JSON.parse(r.skill_overrides as string) as SkillOverrides; } catch { /* ignore */ }
  }
  return {
    id:             r.id as string,
    name:           r.name as string,
    level:          r.level as string,
    description:    (r.description as string | null) ?? null,
    templateId:     (r.template_id as string | null) ?? null,
    status:         ((r.status as string) ?? 'planning') as CourseStatus,
    location:       (r.location as string | null) ?? null,
    startDate:      (r.start_date as string | null) ?? null,
    endDate:        (r.end_date as string | null) ?? null,
    maxStudents:    (r.max_students as number | null) ?? 8,
    skillOverrides,
    createdAt:      r.created_at as string,
    updatedAt:      r.updated_at as string,
  };
}

function rowToSkill(r: Record<string, unknown>): InstructorCourseSkill {
  return {
    id:         r.id as string,
    courseId:   r.course_id as string,
    skillName:  r.skill_name as string,
    skillOrder: r.skill_order as number,
    createdAt:  r.created_at as string,
  };
}

function rowToSignoff(r: Record<string, unknown>): SkillSignoff {
  return {
    id:          r.id as string,
    studentId:   r.student_id as string,
    courseId:    r.course_id as string,
    skillKey:    r.skill_key as string,
    environment: ((r.environment as string) ?? 'open_water') as SkillEnvironment,
    sessionId:   (r.session_id as string | null) ?? null,
    signedAt:    r.signed_at as string,
    notes:       (r.notes as string | null) ?? null,
    createdAt:   r.created_at as string,
  };
}

function rowToSession(r: Record<string, unknown>): CourseSession {
  return {
    id:            r.id as string,
    courseId:      r.course_id as string,
    sessionNumber: r.session_number as number,
    sessionType:   (r.session_type as CourseSession['sessionType']) ?? 'classroom',
    date:          (r.date as string | null) ?? null,
    topic:         (r.topic as string | null) ?? null,
    notes:         (r.notes as string | null) ?? null,
    createdAt:     r.created_at as string,
    updatedAt:     r.updated_at as string,
  };
}

function rowToEnrollment(r: Record<string, unknown>): Enrollment {
  return {
    id:               r.id as string,
    studentId:        r.student_id as string,
    courseId:         r.course_id as string,
    enrolledAt:       r.enrolled_at as string,
    status:           (r.status as Enrollment['status']) ?? 'active',
    prereqProofUri:   (r.prereq_proof_uri as string | null) ?? null,
    prereqProofNotes: (r.prereq_proof_notes as string | null) ?? null,
  };
}

function rowToAttendance(r: Record<string, unknown>): SessionAttendance {
  return {
    id:        r.id as string,
    sessionId: r.session_id as string,
    studentId: r.student_id as string,
    attended:  r.attended === 1 || r.attended === true,
  };
}

function rowToCert(r: Record<string, unknown>): Certification {
  return {
    id:          r.id as string,
    studentId:   r.student_id as string,
    courseId:    (r.course_id as string | null) ?? null,
    certLevel:   r.cert_level as string,
    certAgency:  (r.cert_agency as string | null) ?? null,
    certNumber:  (r.cert_number as string | null) ?? null,
    issuedDate:  r.issued_date as string,
    notes:       (r.notes as string | null) ?? null,
    createdAt:   r.created_at as string,
  };
}

function rowToDoc(r: Record<string, unknown>): InstructorDocument {
  return {
    id:            r.id as string,
    studentId:     (r.student_id as string | null) ?? null,
    courseId:      (r.course_id as string | null) ?? null,
    docType:       r.doc_type as string,
    title:         r.title as string,
    content:       (r.content as string | null) ?? null,
    signedAt:      (r.signed_at as string | null) ?? null,
    signatureData: (r.signature_data as string | null) ?? null,
    reviewedAt:    (r.reviewed_at as string | null) ?? null,
    updatedAt:     (r.updated_at as string) ?? '',
    createdAt:     r.created_at as string,
  };
}

function rowToAck(r: Record<string, unknown>): TrainingAcknowledgment {
  return {
    id:             r.id as string,
    studentId:      r.student_id as string,
    courseId:       (r.course_id as string | null) ?? null,
    acknowledgedAt: r.acknowledged_at as string,
    signatureData:  (r.signature_data as string | null) ?? null,
    createdAt:      r.created_at as string,
  };
}

export class CourseRepository {
  // ── Courses ─────────────────────────────────────────────────────────────────

  getAll(): InstructorCourse[] {
    return getDb().getAllSync<Record<string, unknown>>(
      `SELECT * FROM instructor_courses ORDER BY created_at DESC`,
    ).map(rowToCourse);
  }

  getById(id: string): InstructorCourse | null {
    const row = getDb().getFirstSync<Record<string, unknown>>(
      `SELECT * FROM instructor_courses WHERE id=?`, [id],
    );
    return row ? rowToCourse(row) : null;
  }

  create(input: CreateCourseInput): InstructorCourse {
    const db  = getDb();
    const id  = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT INTO instructor_courses
         (id,name,level,description,template_id,status,location,start_date,end_date,max_students,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, input.name, input.level, input.description ?? null,
        input.templateId ?? null, input.status ?? 'planning',
        input.location ?? null, input.startDate ?? null, input.endDate ?? null,
        input.maxStudents ?? 8, now, now,
      ],
    );
    return rowToCourse(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM instructor_courses WHERE id=?`, [id],
    )!);
  }

  update(id: string, input: Partial<CreateCourseInput>): InstructorCourse {
    const db  = getDb();
    const now = nowISO();
    const sets: string[] = [];
    const vals: (string | number | null)[] = [];
    if (input.name        !== undefined) { sets.push('name=?');         vals.push(input.name); }
    if (input.level       !== undefined) { sets.push('level=?');        vals.push(input.level); }
    if (input.description !== undefined) { sets.push('description=?');  vals.push(input.description ?? null); }
    if (input.templateId  !== undefined) { sets.push('template_id=?');  vals.push(input.templateId ?? null); }
    if (input.status      !== undefined) { sets.push('status=?');       vals.push(input.status); }
    if (input.location    !== undefined) { sets.push('location=?');     vals.push(input.location ?? null); }
    if (input.startDate   !== undefined) { sets.push('start_date=?');   vals.push(input.startDate ?? null); }
    if (input.endDate     !== undefined) { sets.push('end_date=?');     vals.push(input.endDate ?? null); }
    if (input.maxStudents !== undefined) { sets.push('max_students=?'); vals.push(input.maxStudents); }
    sets.push('updated_at=?'); vals.push(now);
    vals.push(id);
    db.runSync(`UPDATE instructor_courses SET ${sets.join(',')} WHERE id=?`, vals);
    return rowToCourse(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM instructor_courses WHERE id=?`, [id],
    )!);
  }

  updateSkillOverrides(courseId: string, overrides: SkillOverrides): InstructorCourse {
    const db = getDb();
    db.runSync(
      `UPDATE instructor_courses SET skill_overrides=?, updated_at=? WHERE id=?`,
      [JSON.stringify(overrides), nowISO(), courseId],
    );
    return rowToCourse(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM instructor_courses WHERE id=?`, [courseId],
    )!);
  }

  delete(id: string): void {
    const db = getDb();
    db.runSync(`DELETE FROM training_acknowledgments WHERE course_id=?`, [id]);
    db.runSync(`DELETE FROM documents WHERE course_id=?`,                [id]);
    db.runSync(`DELETE FROM certifications WHERE course_id=?`,           [id]);
    db.runSync(`DELETE FROM session_attendance WHERE session_id IN (SELECT id FROM course_sessions WHERE course_id=?)`, [id]);
    db.runSync(`DELETE FROM course_sessions WHERE course_id=?`,          [id]);
    db.runSync(`DELETE FROM enrollments WHERE course_id=?`,              [id]);
    db.runSync(`DELETE FROM skill_signoffs WHERE course_id=?`,           [id]);
    db.runSync(`DELETE FROM instructor_course_skills WHERE course_id=?`, [id]);
    db.runSync(`DELETE FROM instructor_courses WHERE id=?`,              [id]);
  }

  // ── Custom course skills ────────────────────────────────────────────────────

  getSkills(courseId: string): InstructorCourseSkill[] {
    return getDb().getAllSync<Record<string, unknown>>(
      `SELECT * FROM instructor_course_skills WHERE course_id=? ORDER BY skill_order ASC`, [courseId],
    ).map(rowToSkill);
  }

  addSkill(courseId: string, skillName: string, order: number): InstructorCourseSkill {
    const db  = getDb();
    const id  = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT INTO instructor_course_skills (id,course_id,skill_name,skill_order,created_at) VALUES (?,?,?,?,?)`,
      [id, courseId, skillName, order, now],
    );
    return rowToSkill(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM instructor_course_skills WHERE id=?`, [id],
    )!);
  }

  removeSkill(skillId: string): void {
    getDb().runSync(`DELETE FROM instructor_course_skills WHERE id=?`, [skillId]);
  }

  // ── Skill sign-offs ─────────────────────────────────────────────────────────

  getSignoffs(studentId: string, courseId: string): SkillSignoff[] {
    return getDb().getAllSync<Record<string, unknown>>(
      `SELECT * FROM skill_signoffs WHERE student_id=? AND course_id=? ORDER BY skill_key, environment`,
      [studentId, courseId],
    ).map(rowToSignoff);
  }

  getSignoffsByStudent(studentId: string): SkillSignoff[] {
    return getDb().getAllSync<Record<string, unknown>>(
      `SELECT * FROM skill_signoffs WHERE student_id=?`, [studentId],
    ).map(rowToSignoff);
  }

  getSignoffsByCourse(courseId: string): SkillSignoff[] {
    return getDb().getAllSync<Record<string, unknown>>(
      `SELECT * FROM skill_signoffs WHERE course_id=?`, [courseId],
    ).map(rowToSignoff);
  }

  addSignoff(
    studentId: string,
    courseId: string,
    skillKey: string,
    environment: SkillEnvironment,
    sessionId?: string | null,
    notes?: string,
  ): SkillSignoff {
    const db  = getDb();
    const id  = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT OR REPLACE INTO skill_signoffs
         (id,student_id,course_id,skill_key,environment,session_id,signed_at,notes,created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, studentId, courseId, skillKey, environment, sessionId ?? null, now, notes ?? null, now],
    );
    return rowToSignoff(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM skill_signoffs WHERE student_id=? AND course_id=? AND skill_key=? AND environment=?`,
      [studentId, courseId, skillKey, environment],
    )!);
  }

  removeSignoff(
    studentId: string,
    courseId: string,
    skillKey: string,
    environment: SkillEnvironment,
  ): void {
    getDb().runSync(
      `DELETE FROM skill_signoffs WHERE student_id=? AND course_id=? AND skill_key=? AND environment=?`,
      [studentId, courseId, skillKey, environment],
    );
  }

  getStudentCourseIds(studentId: string): string[] {
    return getDb().getAllSync<{ course_id: string }>(
      `SELECT DISTINCT course_id FROM skill_signoffs WHERE student_id=?`, [studentId],
    ).map(r => r.course_id);
  }

  // ── Sessions ────────────────────────────────────────────────────────────────

  getSessions(courseId: string): CourseSession[] {
    return getDb().getAllSync<Record<string, unknown>>(
      `SELECT * FROM course_sessions WHERE course_id=? ORDER BY session_number ASC`, [courseId],
    ).map(rowToSession);
  }

  getSessionById(id: string): CourseSession | null {
    const row = getDb().getFirstSync<Record<string, unknown>>(
      `SELECT * FROM course_sessions WHERE id=?`, [id],
    );
    return row ? rowToSession(row) : null;
  }

  createSession(input: CreateSessionInput): CourseSession {
    const db  = getDb();
    const id  = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT INTO course_sessions (id,course_id,session_number,session_type,date,topic,notes,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, input.courseId, input.sessionNumber, input.sessionType,
       input.date ?? null, input.topic ?? null, input.notes ?? null, now, now],
    );
    return rowToSession(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM course_sessions WHERE id=?`, [id],
    )!);
  }

  updateSession(id: string, input: Partial<Omit<CreateSessionInput, 'courseId' | 'sessionNumber'>>): CourseSession {
    const db  = getDb();
    const now = nowISO();
    const sets: string[] = [];
    const vals: (string | number | null)[] = [];
    if (input.sessionType !== undefined) { sets.push('session_type=?'); vals.push(input.sessionType); }
    if (input.date        !== undefined) { sets.push('date=?');         vals.push(input.date ?? null); }
    if (input.topic       !== undefined) { sets.push('topic=?');        vals.push(input.topic ?? null); }
    if (input.notes       !== undefined) { sets.push('notes=?');        vals.push(input.notes ?? null); }
    sets.push('updated_at=?'); vals.push(now);
    vals.push(id);
    db.runSync(`UPDATE course_sessions SET ${sets.join(',')} WHERE id=?`, vals);
    return rowToSession(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM course_sessions WHERE id=?`, [id],
    )!);
  }

  deleteSession(id: string): void {
    const db = getDb();
    db.runSync(`DELETE FROM session_attendance WHERE session_id=?`, [id]);
    db.runSync(`DELETE FROM course_sessions WHERE id=?`, [id]);
  }

  // ── Enrollments ─────────────────────────────────────────────────────────────

  getEnrollments(courseId: string): Enrollment[] {
    return getDb().getAllSync<Record<string, unknown>>(
      `SELECT * FROM enrollments WHERE course_id=? ORDER BY enrolled_at ASC`, [courseId],
    ).map(rowToEnrollment);
  }

  getStudentEnrollments(studentId: string): Enrollment[] {
    return getDb().getAllSync<Record<string, unknown>>(
      `SELECT * FROM enrollments WHERE student_id=? ORDER BY enrolled_at DESC`, [studentId],
    ).map(rowToEnrollment);
  }

  enrollStudent(studentId: string, courseId: string): Enrollment {
    const db  = getDb();
    const id  = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT OR IGNORE INTO enrollments (id,student_id,course_id,enrolled_at,status) VALUES (?,?,?,?,?)`,
      [id, studentId, courseId, now, 'active'],
    );
    return rowToEnrollment(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM enrollments WHERE student_id=? AND course_id=?`, [studentId, courseId],
    )!);
  }

  unenrollStudent(studentId: string, courseId: string): void {
    getDb().runSync(`DELETE FROM enrollments WHERE student_id=? AND course_id=?`, [studentId, courseId]);
  }

  getEnrollment(studentId: string, courseId: string): Enrollment | null {
    const row = getDb().getFirstSync<Record<string, unknown>>(
      `SELECT * FROM enrollments WHERE student_id=? AND course_id=?`, [studentId, courseId],
    );
    return row ? rowToEnrollment(row) : null;
  }

  updateEnrollmentPrereqProof(studentId: string, courseId: string, uri: string | null, notes: string | null): void {
    getDb().runSync(
      `UPDATE enrollments SET prereq_proof_uri=?, prereq_proof_notes=? WHERE student_id=? AND course_id=?`,
      [uri, notes, studentId, courseId],
    );
  }

  // ── Attendance ──────────────────────────────────────────────────────────────

  getAttendance(sessionId: string): SessionAttendance[] {
    return getDb().getAllSync<Record<string, unknown>>(
      `SELECT * FROM session_attendance WHERE session_id=?`, [sessionId],
    ).map(rowToAttendance);
  }

  setAttendance(sessionId: string, studentId: string, attended: boolean): void {
    const id = generateId();
    getDb().runSync(
      `INSERT INTO session_attendance (id,session_id,student_id,attended)
       VALUES (?,?,?,?)
       ON CONFLICT(session_id,student_id) DO UPDATE SET attended=excluded.attended`,
      [id, sessionId, studentId, attended ? 1 : 0],
    );
  }

  // ── Certifications ──────────────────────────────────────────────────────────

  getCertifications(studentId: string): Certification[] {
    return getDb().getAllSync<Record<string, unknown>>(
      `SELECT * FROM certifications WHERE student_id=? ORDER BY issued_date DESC`, [studentId],
    ).map(rowToCert);
  }

  createCertification(input: CreateCertificationInput): Certification {
    const db  = getDb();
    const id  = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT INTO certifications (id,student_id,course_id,cert_level,cert_agency,cert_number,issued_date,notes,created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, input.studentId, input.courseId ?? null, input.certLevel,
       input.certAgency ?? null, input.certNumber ?? null, input.issuedDate, input.notes ?? null, now],
    );
    return rowToCert(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM certifications WHERE id=?`, [id],
    )!);
  }

  deleteCertification(id: string): void {
    getDb().runSync(`DELETE FROM certifications WHERE id=?`, [id]);
  }

  // ── Documents ───────────────────────────────────────────────────────────────

  getDocuments(studentId: string, courseId?: string | null): InstructorDocument[] {
    const db = getDb();
    if (courseId) {
      return db.getAllSync<Record<string, unknown>>(
        `SELECT * FROM documents WHERE student_id=? AND course_id=? ORDER BY created_at DESC`,
        [studentId, courseId],
      ).map(rowToDoc);
    }
    return db.getAllSync<Record<string, unknown>>(
      `SELECT * FROM documents WHERE student_id=? ORDER BY created_at DESC`, [studentId],
    ).map(rowToDoc);
  }

  getDocumentByType(studentId: string, courseId: string, docType: string): InstructorDocument | null {
    const row = getDb().getFirstSync<Record<string, unknown>>(
      `SELECT * FROM documents WHERE student_id=? AND course_id=? AND doc_type=? ORDER BY created_at DESC LIMIT 1`,
      [studentId, courseId, docType],
    );
    return row ? rowToDoc(row) : null;
  }

  createDocument(input: CreateDocumentInput): InstructorDocument {
    const db  = getDb();
    const id  = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT INTO documents (id,student_id,course_id,doc_type,title,content,signed_at,signature_data,reviewed_at,updated_at,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, input.studentId, input.courseId, input.docType, input.title,
       input.content ?? null, input.signedAt ?? null, input.signatureData ?? null, null, now, now],
    );
    return rowToDoc(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM documents WHERE id=?`, [id],
    )!);
  }

  updateDocument(id: string, input: Partial<Pick<CreateDocumentInput, 'content' | 'signedAt' | 'signatureData'>> & { reviewedAt?: string | null }): InstructorDocument {
    const db  = getDb();
    const now = nowISO();
    const sets: string[] = [];
    const vals: (string | null)[] = [];
    if (input.content       !== undefined) { sets.push('content=?');        vals.push(input.content ?? null); }
    if (input.signedAt      !== undefined) { sets.push('signed_at=?');      vals.push(input.signedAt ?? null); }
    if (input.signatureData !== undefined) { sets.push('signature_data=?'); vals.push(input.signatureData ?? null); }
    if (input.reviewedAt    !== undefined) { sets.push('reviewed_at=?');    vals.push(input.reviewedAt ?? null); }
    sets.push('updated_at=?'); vals.push(now);
    vals.push(id);
    db.runSync(`UPDATE documents SET ${sets.join(',')} WHERE id=?`, vals);
    return rowToDoc(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM documents WHERE id=?`, [id],
    )!);
  }

  // kept for backward compatibility
  saveDocument(
    studentId: string,
    courseId: string | null,
    docType: string,
    title: string,
    content?: string,
    signatureData?: string,
  ): InstructorDocument {
    return this.createDocument({
      studentId,
      courseId: courseId ?? '',
      docType: docType as CreateDocumentInput['docType'],
      title,
      content: content ?? null,
      signedAt: signatureData ? nowISO() : null,
      signatureData: signatureData ?? null,
    });
  }

  // ── Acknowledgments ─────────────────────────────────────────────────────────

  getAcknowledgment(studentId: string, courseId: string): TrainingAcknowledgment | null {
    const row = getDb().getFirstSync<Record<string, unknown>>(
      `SELECT * FROM training_acknowledgments WHERE student_id=? AND course_id=? ORDER BY acknowledged_at DESC LIMIT 1`,
      [studentId, courseId],
    );
    return row ? rowToAck(row) : null;
  }

  getAcknowledgments(studentId: string): TrainingAcknowledgment[] {
    return getDb().getAllSync<Record<string, unknown>>(
      `SELECT * FROM training_acknowledgments WHERE student_id=? ORDER BY acknowledged_at DESC`,
      [studentId],
    ).map(rowToAck);
  }

  createAcknowledgment(input: CreateAcknowledgmentInput): TrainingAcknowledgment {
    const db  = getDb();
    const id  = generateId();
    const now = nowISO();
    db.runSync(
      `INSERT INTO training_acknowledgments (id,student_id,course_id,acknowledged_at,signature_data,created_at)
       VALUES (?,?,?,?,?,?)`,
      [id, input.studentId, input.courseId, input.acknowledgedAt, input.signatureData ?? null, now],
    );
    return rowToAck(db.getFirstSync<Record<string, unknown>>(
      `SELECT * FROM training_acknowledgments WHERE id=?`, [id],
    )!);
  }

  // kept for backward compatibility
  addAcknowledgment(
    studentId: string,
    courseId: string | null,
    signatureData?: string,
  ): TrainingAcknowledgment {
    return this.createAcknowledgment({
      studentId,
      courseId: courseId ?? '',
      acknowledgedAt: nowISO(),
      signatureData: signatureData ?? null,
    });
  }
}
