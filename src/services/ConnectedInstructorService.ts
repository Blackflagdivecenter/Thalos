/**
 * ConnectedInstructorService — dual-write logic for linked students.
 *
 * When an instructor enrolls a Thalos user (not a local-only student),
 * writes go to both local SQLite (offline resilience) AND Supabase
 * (so the student can see their enrollment, paperwork requests, skill
 * progress, and certifications on their own device).
 */

import { getSupabase } from '@/src/db/supabase';
import { useAuthStore } from '@/src/stores/authStore';
import type {
  CloudCourse,
  ConnectedEnrollment,
  PaperworkSubmission,
  PaperworkDocType,
  PaperworkRequest,
  CloudSkillSignoff,
  CloudCertification,
} from '@/src/models';
import type { UserProfile } from '@/src/stores/authStore';

// ── Row types (snake_case from Supabase) ─────────────────────────────────────

interface CourseRow {
  id: string;
  instructor_id: string;
  name: string;
  level: string;
  template_id: string | null;
  status: string;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  max_students: number;
  skill_list_json: string | null;
  created_at: string;
  updated_at: string;
}

interface EnrollmentRow {
  id: string;
  course_id: string;
  student_id: string;
  instructor_id: string;
  status: string;
  enrolled_at: string;
  created_at: string;
}

interface PaperworkSubmissionRow {
  id: string;
  course_id: string;
  student_id: string;
  doc_type: string;
  content_json: string | null;
  signature_data: string | null;
  signed_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface PaperworkRequestRow {
  id: string;
  course_id: string;
  student_id: string;
  instructor_id: string;
  request_type: string;
  status: string;
  created_at: string;
}

interface SignoffRow {
  id: string;
  course_id: string;
  student_id: string;
  instructor_id: string;
  skill_key: string;
  skill_name: string;
  environment: string;
  signed_at: string;
  created_at: string;
}

interface CertRow {
  id: string;
  student_id: string;
  instructor_id: string;
  course_id: string | null;
  cert_level: string;
  cert_agency: string | null;
  cert_number: string | null;
  issued_date: string;
  notes: string | null;
  created_at: string;
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapCourse(r: CourseRow): CloudCourse {
  return {
    id: r.id,
    instructorId: r.instructor_id,
    name: r.name,
    level: r.level,
    templateId: r.template_id,
    status: r.status as CloudCourse['status'],
    location: r.location,
    startDate: r.start_date,
    endDate: r.end_date,
    maxStudents: r.max_students,
    skillListJson: r.skill_list_json,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapEnrollment(r: EnrollmentRow): ConnectedEnrollment {
  return {
    id: r.id,
    courseId: r.course_id,
    studentId: r.student_id,
    instructorId: r.instructor_id,
    status: r.status as ConnectedEnrollment['status'],
    enrolledAt: r.enrolled_at,
    createdAt: r.created_at,
  };
}

function mapSubmission(r: PaperworkSubmissionRow): PaperworkSubmission {
  return {
    id: r.id,
    courseId: r.course_id,
    studentId: r.student_id,
    docType: r.doc_type as PaperworkDocType,
    contentJson: r.content_json,
    signatureData: r.signature_data,
    signedAt: r.signed_at,
    reviewedAt: r.reviewed_at,
    reviewedBy: r.reviewed_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapRequest(r: PaperworkRequestRow): PaperworkRequest {
  return {
    id: r.id,
    courseId: r.course_id,
    studentId: r.student_id,
    instructorId: r.instructor_id,
    requestType: r.request_type as PaperworkDocType,
    status: r.status as PaperworkRequest['status'],
    createdAt: r.created_at,
  };
}

function mapSignoff(r: SignoffRow): CloudSkillSignoff {
  return {
    id: r.id,
    courseId: r.course_id,
    studentId: r.student_id,
    instructorId: r.instructor_id,
    skillKey: r.skill_key,
    skillName: r.skill_name,
    environment: r.environment,
    signedAt: r.signed_at,
    createdAt: r.created_at,
  };
}

function mapCert(r: CertRow): CloudCertification {
  return {
    id: r.id,
    studentId: r.student_id,
    instructorId: r.instructor_id,
    courseId: r.course_id,
    certLevel: r.cert_level,
    certAgency: r.cert_agency,
    certNumber: r.cert_number,
    issuedDate: r.issued_date,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMyId(): string {
  const uid = useAuthStore.getState().user?.id;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const ConnectedInstructorService = {

  // ─── Search Users ──────────────────────────────────────────────────────────

  /** Search Thalos profiles by name, handle, or email fragment */
  async searchUsers(query: string): Promise<UserProfile[]> {
    const supabase = getSupabase();
    const q = `%${query.trim()}%`;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`display_name.ilike.${q},handle.ilike.${q}`)
      .limit(20);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      displayName: r.display_name,
      role: r.role ?? 'diver',
      certLevel: r.cert_level,
      certAgency: r.cert_agency,
      phone: r.phone,
      avatarUrl: r.avatar_url,
      instructorNumber: r.instructor_number,
    }));
  },

  // ─── Course Cloud Sync ─────────────────────────────────────────────────────

  /** Push a local course to Supabase so students can see it */
  async pushCourse(course: {
    id: string;
    name: string;
    level: string;
    templateId?: string | null;
    status?: string;
    location?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    maxStudents?: number;
    skillListJson?: string | null;
  }): Promise<CloudCourse> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { data, error } = await supabase
      .from('instructor_courses_cloud')
      .upsert({
        id: course.id,
        instructor_id: uid,
        name: course.name,
        level: course.level,
        template_id: course.templateId ?? null,
        status: course.status ?? 'active',
        location: course.location ?? null,
        start_date: course.startDate ?? null,
        end_date: course.endDate ?? null,
        max_students: course.maxStudents ?? 8,
        skill_list_json: course.skillListJson ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapCourse(data as CourseRow);
  },

  /** Get instructor's cloud courses */
  async getMyCourses(): Promise<CloudCourse[]> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { data, error } = await supabase
      .from('instructor_courses_cloud')
      .select('*')
      .eq('instructor_id', uid)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapCourse(r));
  },

  // ─── Enrollments ───────────────────────────────────────────────────────────

  /** Enroll a Thalos user into a cloud course */
  async enrollStudent(courseId: string, studentId: string): Promise<ConnectedEnrollment> {
    const supabase = getSupabase();
    const uid = getMyId();

    // 1. Create enrollment
    const { data, error } = await supabase
      .from('connected_enrollments')
      .insert({
        course_id: courseId,
        student_id: studentId,
        instructor_id: uid,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // 2. Auto-create paperwork requests (liability + medical)
    const docTypes: PaperworkDocType[] = ['liability_release', 'medical_questionnaire'];
    for (const docType of docTypes) {
      await supabase.from('paperwork_requests').insert({
        course_id: courseId,
        student_id: studentId,
        instructor_id: uid,
        request_type: docType,
      });
    }

    // 3. Notify student
    const profile = useAuthStore.getState().profile;
    const { data: courseData } = await supabase
      .from('instructor_courses_cloud')
      .select('name')
      .eq('id', courseId)
      .single();

    await supabase.rpc('create_notification', {
      p_user_id: studentId,
      p_from_user: uid,
      p_type: 'enrollment',
      p_title: `Enrolled in ${courseData?.name ?? 'a course'}`,
      p_body: `${profile?.displayName ?? 'An instructor'} enrolled you. Complete your paperwork to get started.`,
      p_data_json: JSON.stringify({ courseId }),
    });

    return mapEnrollment(data as EnrollmentRow);
  },

  /** Get enrollments for a cloud course */
  async getCourseEnrollments(courseId: string): Promise<ConnectedEnrollment[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('connected_enrollments')
      .select('*, profiles!connected_enrollments_student_id_fkey(display_name, handle, avatar_url)')
      .eq('course_id', courseId)
      .order('enrolled_at');
    if (error) throw new Error(error.message);

    return (data ?? []).map((r: any) => ({
      ...mapEnrollment(r),
      studentName: r.profiles?.display_name ?? null,
      studentHandle: r.profiles?.handle ?? null,
      studentAvatarUrl: r.profiles?.avatar_url ?? null,
    }));
  },

  /** Get courses a student is enrolled in */
  async getMyEnrollments(): Promise<ConnectedEnrollment[]> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { data, error } = await supabase
      .from('connected_enrollments')
      .select(`
        *,
        instructor_courses_cloud!connected_enrollments_course_id_fkey(name, level),
        instructor:profiles!connected_enrollments_instructor_id_fkey(display_name)
      `)
      .eq('student_id', uid)
      .eq('status', 'active')
      .order('enrolled_at', { ascending: false });
    if (error) throw new Error(error.message);

    return (data ?? []).map((r: any) => ({
      ...mapEnrollment(r),
      courseName: r.instructor_courses_cloud?.name ?? null,
      courseLevel: r.instructor_courses_cloud?.level ?? null,
      instructorName: r.instructor?.display_name ?? null,
    }));
  },

  async withdrawStudent(courseId: string, studentId: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('connected_enrollments')
      .update({ status: 'withdrawn' })
      .eq('course_id', courseId)
      .eq('student_id', studentId);
    if (error) throw new Error(error.message);
  },

  // ─── Paperwork ─────────────────────────────────────────────────────────────

  /** Get all paperwork submissions for a course */
  async getCourseSubmissions(courseId: string): Promise<PaperworkSubmission[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('paperwork_submissions')
      .select('*')
      .eq('course_id', courseId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapSubmission(r));
  },

  /** Get paperwork submissions for the current student in a course */
  async getMySubmissions(courseId: string): Promise<PaperworkSubmission[]> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { data, error } = await supabase
      .from('paperwork_submissions')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', uid);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapSubmission(r));
  },

  /** Student submits a completed form */
  async submitPaperwork(
    courseId: string,
    docType: PaperworkDocType,
    contentJson: string,
    signatureData: string,
  ): Promise<PaperworkSubmission> {
    const supabase = getSupabase();
    const uid = getMyId();

    const { data, error } = await supabase
      .from('paperwork_submissions')
      .upsert({
        course_id: courseId,
        student_id: uid,
        doc_type: docType,
        content_json: contentJson,
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Mark the matching request as completed
    await supabase
      .from('paperwork_requests')
      .update({ status: 'completed' })
      .eq('course_id', courseId)
      .eq('student_id', uid)
      .eq('request_type', docType);

    // Notify instructor
    const { data: enrollment } = await supabase
      .from('connected_enrollments')
      .select('instructor_id')
      .eq('course_id', courseId)
      .eq('student_id', uid)
      .single();

    if (enrollment) {
      const profile = useAuthStore.getState().profile;
      const docLabel = docType === 'liability_release' ? 'Liability Release'
        : docType === 'medical_questionnaire' ? 'Medical Questionnaire'
        : 'Training Acknowledgment';

      await supabase.rpc('create_notification', {
        p_user_id: enrollment.instructor_id,
        p_from_user: uid,
        p_type: docType === 'training_acknowledgment' ? 'ack_complete' : 'paperwork_complete',
        p_title: `${profile?.displayName ?? 'A student'} completed ${docLabel}`,
        p_body: null,
        p_data_json: JSON.stringify({ courseId, studentId: uid, docType }),
      });
    }

    return mapSubmission(data as PaperworkSubmissionRow);
  },

  /** Instructor marks a submission as reviewed */
  async reviewSubmission(submissionId: string): Promise<void> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { error } = await supabase
      .from('paperwork_submissions')
      .update({ reviewed_at: new Date().toISOString(), reviewed_by: uid })
      .eq('id', submissionId);
    if (error) throw new Error(error.message);
  },

  /** Get pending paperwork requests for the current student */
  async getMyPendingRequests(): Promise<PaperworkRequest[]> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { data, error } = await supabase
      .from('paperwork_requests')
      .select('*')
      .eq('student_id', uid)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapRequest(r));
  },

  /** Instructor sends training acknowledgment request */
  async requestTrainingAck(courseId: string, studentId: string): Promise<void> {
    const supabase = getSupabase();
    const uid = getMyId();

    await supabase.from('paperwork_requests').insert({
      course_id: courseId,
      student_id: studentId,
      instructor_id: uid,
      request_type: 'training_acknowledgment',
    });

    const profile = useAuthStore.getState().profile;
    await supabase.rpc('create_notification', {
      p_user_id: studentId,
      p_from_user: uid,
      p_type: 'ack_request',
      p_title: 'Training Acknowledgment Required',
      p_body: `${profile?.displayName ?? 'Your instructor'} is requesting your training acknowledgment signature.`,
      p_data_json: JSON.stringify({ courseId }),
    });
  },

  // ─── Skill Sign-Offs ──────────────────────────────────────────────────────

  /** Instructor signs off a skill for a connected student */
  async addSignoff(
    courseId: string,
    studentId: string,
    skillKey: string,
    skillName: string,
    environment: string,
  ): Promise<CloudSkillSignoff> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { data, error } = await supabase
      .from('skill_signoffs_cloud')
      .upsert({
        course_id: courseId,
        student_id: studentId,
        instructor_id: uid,
        skill_key: skillKey,
        skill_name: skillName,
        environment,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapSignoff(data as SignoffRow);
  },

  /** Remove a skill sign-off */
  async removeSignoff(courseId: string, studentId: string, skillKey: string, environment: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('skill_signoffs_cloud')
      .delete()
      .eq('course_id', courseId)
      .eq('student_id', studentId)
      .eq('skill_key', skillKey)
      .eq('environment', environment);
    if (error) throw new Error(error.message);
  },

  /** Get all sign-offs for a student in a course */
  async getStudentSignoffs(courseId: string, studentId: string): Promise<CloudSkillSignoff[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('skill_signoffs_cloud')
      .select('*')
      .eq('course_id', courseId)
      .eq('student_id', studentId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapSignoff(r));
  },

  /** Get all sign-offs for a course (all students) */
  async getCourseSignoffs(courseId: string): Promise<CloudSkillSignoff[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('skill_signoffs_cloud')
      .select('*')
      .eq('course_id', courseId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapSignoff(r));
  },

  // ─── Certifications ───────────────────────────────────────────────────────

  /** Check if a student is ready for certification */
  async checkCertificationReady(courseId: string, studentId: string, totalSkills: number): Promise<{
    ready: boolean;
    skillsComplete: boolean;
    liabilityComplete: boolean;
    medicalComplete: boolean;
    ackComplete: boolean;
    skillCount: number;
  }> {
    const [signoffs, submissions] = await Promise.all([
      this.getStudentSignoffs(courseId, studentId),
      this.getCourseSubmissions(courseId),
    ]);

    const studentSubs = submissions.filter(s => s.studentId === studentId);
    const liability = studentSubs.find(s => s.docType === 'liability_release' && s.signedAt);
    const medical = studentSubs.find(s => s.docType === 'medical_questionnaire' && s.signedAt);
    const ack = studentSubs.find(s => s.docType === 'training_acknowledgment' && s.signedAt);

    const skillsComplete = signoffs.length >= totalSkills;
    const liabilityComplete = !!liability;
    const medicalComplete = !!medical;
    const ackComplete = !!ack;

    return {
      ready: skillsComplete && liabilityComplete && medicalComplete && ackComplete,
      skillsComplete,
      liabilityComplete,
      medicalComplete,
      ackComplete,
      skillCount: signoffs.length,
    };
  },

  /** Issue a certification to a connected student */
  async certifyStudent(input: {
    courseId: string;
    studentId: string;
    certLevel: string;
    certAgency?: string | null;
    certNumber?: string | null;
    notes?: string | null;
  }): Promise<CloudCertification> {
    const supabase = getSupabase();
    const uid = getMyId();

    const { data, error } = await supabase
      .from('certifications_cloud')
      .insert({
        student_id: input.studentId,
        instructor_id: uid,
        course_id: input.courseId,
        cert_level: input.certLevel,
        cert_agency: input.certAgency ?? null,
        cert_number: input.certNumber ?? null,
        issued_date: new Date().toISOString().split('T')[0],
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Mark enrollment as completed
    await supabase
      .from('connected_enrollments')
      .update({ status: 'completed' })
      .eq('course_id', input.courseId)
      .eq('student_id', input.studentId);

    // Notify student
    const profile = useAuthStore.getState().profile;
    await supabase.rpc('create_notification', {
      p_user_id: input.studentId,
      p_from_user: uid,
      p_type: 'certification',
      p_title: `Congratulations! ${input.certLevel} Certified`,
      p_body: `${profile?.displayName ?? 'Your instructor'} has issued your ${input.certLevel} certification.`,
      p_data_json: JSON.stringify({ courseId: input.courseId, certLevel: input.certLevel }),
    });

    return mapCert(data as CertRow);
  },

  /** Get certifications for the current student */
  async getMyCertifications(): Promise<CloudCertification[]> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { data, error } = await supabase
      .from('certifications_cloud')
      .select('*')
      .eq('student_id', uid)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapCert(r));
  },
};
