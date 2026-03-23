import { create } from 'zustand';
import { getDb } from '@/src/db/client';
import { nowISO } from '@/src/utils/uuid';
import {
  Student,
  SkillSignoff,
  SkillEnvironment,
  CreateStudentInput,
  InstructorProfile,
  InstructorCourse,
  CourseSession,
  Enrollment,
  Certification,
  InstructorDocument,
  TrainingAcknowledgment,
  CreateCourseInput,
  CreateSessionInput,
  CreateCertificationInput,
  CreateDocumentInput,
  CreateAcknowledgmentInput,
  SkillOverrides,
} from '@/src/models';
import { StudentRepository } from '@/src/repositories/StudentRepository';
import { CourseRepository }     from '@/src/repositories/CourseRepository';
import { InstructorRepository } from '@/src/repositories/InstructorRepository';

const studentRepo    = new StudentRepository();
const courseRepo     = new CourseRepository();
const instructorRepo = new InstructorRepository();

interface InstructorState {
  profile: InstructorProfile | null;

  // Data
  students: Student[];
  courses: InstructorCourse[];

  // Profile
  loadProfile: () => void;
  saveProfile: (name: string, instructorNumber?: string | null, certLevel?: string | null) => void;
  hasProfile: () => boolean;

  // Students
  loadStudents: () => void;
  createStudent: (input: CreateStudentInput) => Student;
  updateStudent: (id: string, input: Partial<CreateStudentInput>) => Student;
  deleteStudent: (id: string) => void;
  getStudent: (id: string) => Student | undefined;

  // Courses
  loadCourses: () => void;
  createCourse: (input: CreateCourseInput) => InstructorCourse;
  updateCourse: (id: string, input: Partial<CreateCourseInput>) => InstructorCourse;
  updateSkillOverrides: (courseId: string, overrides: SkillOverrides) => void;
  deleteCourse: (id: string) => void;
  getCourse: (id: string) => InstructorCourse | undefined;

  // Sessions (loaded on demand)
  getSessions: (courseId: string) => CourseSession[];
  createSession: (input: CreateSessionInput) => CourseSession;
  updateSession: (id: string, input: Partial<Omit<CreateSessionInput, 'courseId' | 'sessionNumber'>>) => CourseSession;
  deleteSession: (id: string) => void;

  // Enrollments (loaded on demand)
  getEnrollments: (courseId: string) => Enrollment[];
  getStudentEnrollments: (studentId: string) => Enrollment[];
  enrollStudent: (studentId: string, courseId: string) => void;
  unenrollStudent: (studentId: string, courseId: string) => void;

  // Signoffs (loaded on-demand per screen)
  getSignoffs: (studentId: string, courseId: string) => SkillSignoff[];
  getSignoffsByCourse: (courseId: string) => SkillSignoff[];
  addSignoff: (studentId: string, courseId: string, skillKey: string, environment: SkillEnvironment, sessionId?: string | null) => void;
  removeSignoff: (studentId: string, courseId: string, skillKey: string, environment: SkillEnvironment) => void;

  // Attendance
  setAttendance: (sessionId: string, studentId: string, attended: boolean) => void;
  getAttendance: (sessionId: string) => import('@/src/models').SessionAttendance[];

  // Certifications
  getCertifications: (studentId: string) => Certification[];
  createCertification: (input: CreateCertificationInput) => Certification;
  deleteCertification: (id: string) => void;

  // Documents
  getDocuments: (studentId: string, courseId?: string | null) => InstructorDocument[];
  getDocumentByType: (studentId: string, courseId: string, docType: string) => InstructorDocument | null;
  createDocument: (input: CreateDocumentInput) => InstructorDocument;
  updateDocument: (id: string, input: Partial<Pick<CreateDocumentInput, 'content' | 'signedAt' | 'signatureData'>> & { reviewedAt?: string | null }) => InstructorDocument;

  // Acknowledgments
  getAcknowledgment: (studentId: string, courseId: string) => TrainingAcknowledgment | null;
  createAcknowledgment: (input: CreateAcknowledgmentInput) => TrainingAcknowledgment;
}

export const useInstructorStore = create<InstructorState>((set, get) => ({
  profile:  null,
  students: [],
  courses:  [],

  // ── Profile ────────────────────────────────────────────────────────────────

  loadProfile: () => {
    try {
      const p = instructorRepo.getProfile();
      set({ profile: p });
    } catch { /* ignore */ }
  },

  saveProfile: (name, instructorNumber, certLevel) => {
    try {
      const p = instructorRepo.saveProfile(name, instructorNumber, certLevel);
      set({ profile: p });
    } catch { /* ignore */ }
  },

  hasProfile: () => {
    const p = get().profile;
    return !!(p && p.name.trim().length > 0);
  },

  // ── Students ────────────────────────────────────────────────────────────────

  loadStudents: () => {
    try {
      set({ students: studentRepo.getAll() });
    } catch { /* ignore */ }
  },

  createStudent: (input) => {
    const student = studentRepo.create(input);
    set(state => ({
      students: [...state.students, student].sort((a, b) => a.name.localeCompare(b.name)),
    }));
    return student;
  },

  updateStudent: (id, input) => {
    const updated = studentRepo.update(id, input);
    set(state => ({ students: state.students.map(s => s.id === id ? updated : s) }));
    return updated;
  },

  deleteStudent: (id) => {
    studentRepo.delete(id);
    set(state => ({ students: state.students.filter(s => s.id !== id) }));
  },

  getStudent: (id) => get().students.find(s => s.id === id),

  // ── Courses ─────────────────────────────────────────────────────────────────

  loadCourses: () => {
    try {
      set({ courses: courseRepo.getAll() });
    } catch { /* ignore */ }
  },

  createCourse: (input) => {
    const course = courseRepo.create(input);
    set(state => ({ courses: [course, ...state.courses] }));
    return course;
  },

  updateCourse: (id, input) => {
    const updated = courseRepo.update(id, input);
    set(state => ({ courses: state.courses.map(c => c.id === id ? updated : c) }));
    return updated;
  },

  updateSkillOverrides: (courseId, overrides) => {
    try {
      const updated = courseRepo.updateSkillOverrides(courseId, overrides);
      set(state => ({ courses: state.courses.map(c => c.id === courseId ? updated : c) }));
    } catch (e) { console.error('updateSkillOverrides failed', e); }
  },

  deleteCourse: (id) => {
    courseRepo.delete(id);
    set(state => ({ courses: state.courses.filter(c => c.id !== id) }));
  },

  getCourse: (id) => get().courses.find(c => c.id === id),

  // ── Sessions ────────────────────────────────────────────────────────────────

  getSessions: (courseId) => {
    try { return courseRepo.getSessions(courseId); } catch { return []; }
  },

  createSession: (input) => courseRepo.createSession(input),

  updateSession: (id, input) => courseRepo.updateSession(id, input),

  deleteSession: (id) => { try { courseRepo.deleteSession(id); } catch { /* ignore */ } },

  // ── Enrollments ─────────────────────────────────────────────────────────────

  getEnrollments: (courseId) => {
    try { return courseRepo.getEnrollments(courseId); } catch { return []; }
  },

  getStudentEnrollments: (studentId) => {
    try { return courseRepo.getStudentEnrollments(studentId); } catch { return []; }
  },

  enrollStudent: (studentId, courseId) => {
    try { courseRepo.enrollStudent(studentId, courseId); } catch { /* ignore */ }
  },

  unenrollStudent: (studentId, courseId) => {
    try { courseRepo.unenrollStudent(studentId, courseId); } catch { /* ignore */ }
  },

  // ── Signoffs ────────────────────────────────────────────────────────────────

  getSignoffs: (studentId, courseId) => {
    try { return courseRepo.getSignoffs(studentId, courseId); } catch { return []; }
  },

  getSignoffsByCourse: (courseId) => {
    try { return courseRepo.getSignoffsByCourse(courseId); } catch { return []; }
  },

  addSignoff: (studentId, courseId, skillKey, environment, sessionId) => {
    try { courseRepo.addSignoff(studentId, courseId, skillKey, environment, sessionId); } catch { /* ignore */ }
  },

  removeSignoff: (studentId, courseId, skillKey, environment) => {
    try { courseRepo.removeSignoff(studentId, courseId, skillKey, environment); } catch { /* ignore */ }
  },

  // ── Attendance ──────────────────────────────────────────────────────────────

  setAttendance: (sessionId, studentId, attended) => {
    try { courseRepo.setAttendance(sessionId, studentId, attended); } catch { /* ignore */ }
  },

  getAttendance: (sessionId) => {
    try { return courseRepo.getAttendance(sessionId); } catch { return []; }
  },

  // ── Certifications ──────────────────────────────────────────────────────────

  getCertifications: (studentId) => {
    try { return courseRepo.getCertifications(studentId); } catch { return []; }
  },

  createCertification: (input) => courseRepo.createCertification(input),

  deleteCertification: (id) => {
    try { courseRepo.deleteCertification(id); } catch { /* ignore */ }
  },

  // ── Documents ───────────────────────────────────────────────────────────────

  getDocuments: (studentId, courseId) => {
    try { return courseRepo.getDocuments(studentId, courseId); } catch { return []; }
  },

  getDocumentByType: (studentId, courseId, docType) => {
    try { return courseRepo.getDocumentByType(studentId, courseId, docType); } catch { return null; }
  },

  createDocument: (input) => courseRepo.createDocument(input),

  updateDocument: (id, input) => courseRepo.updateDocument(id, input),

  // ── Acknowledgments ─────────────────────────────────────────────────────────

  getAcknowledgment: (studentId, courseId) => {
    try { return courseRepo.getAcknowledgment(studentId, courseId); } catch { return null; }
  },

  createAcknowledgment: (input) => courseRepo.createAcknowledgment(input),
}));
