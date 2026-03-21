export type DiveType = 'TRAINING' | 'RECREATIONAL';
export type SignerType = 'INSTRUCTOR' | 'BUDDY';

/** One cylinder entry in a multi-cylinder dive */
export interface DiveCylinder {
  name: string;          // e.g. "S80 / Luxfer", "Faber 12L"
  internalVolL: number;  // physical water capacity (litres)
  startBar: number | null;
  endBar: number | null;
}

// ─── Dive (event-sourced) ────────────────────────────────────────────────────

export interface Dive {
  id: string;
  diveNumber: number;
  diveType: DiveType;
  currentVersionId: string | null;
  isSignedByInstructor: boolean;
  isDeleted: boolean;
  tripId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiveVersion {
  id: string;
  diveId: string;
  versionNumber: number;
  createdAt: string;
  date: string;
  siteId: string | null;
  siteName: string | null;
  maxDepthMeters: number | null;
  bottomTimeMinutes: number | null;
  surfaceIntervalMinutes: number | null;
  waterTemperatureCelsius: number | null;
  visibility: string | null;
  conditions: string | null;
  equipment: string | null;
  notes: string | null;
  startPressureBar: number | null;
  endPressureBar: number | null;
  gasType: string | null;
  tankSizeLiters: number | null;
  courseName: string | null;
  skillsCompleted: string | null;
  createdByUserId: string | null;
  changeDescription: string | null;
  cylindersJson: string | null;
  activityTagsJson: string | null;
  visibilityRating: number | null;
  currentRating: number | null;
  waveRating: number | null;
}

/** Dive joined with its current version — used for list and detail display */
export interface DiveWithVersion extends Dive {
  date: string;
  siteId: string | null;
  siteName: string | null;
  maxDepthMeters: number | null;
  bottomTimeMinutes: number | null;
  surfaceIntervalMinutes: number | null;
  waterTemperatureCelsius: number | null;
  visibility: string | null;
  conditions: string | null;
  equipment: string | null;
  notes: string | null;
  startPressureBar: number | null;
  endPressureBar: number | null;
  gasType: string | null;
  tankSizeLiters: number | null;
  courseName: string | null;
  skillsCompleted: string | null;
  changeDescription: string | null;
  cylindersJson: string | null;
  activityTagsJson: string | null;
  visibilityRating: number | null;
  currentRating: number | null;
  waveRating: number | null;
  tripId: string | null;
}

export interface Signature {
  id: string;
  diveId: string;
  signerType: SignerType;
  signerName: string | null;
  signatureData: string;
  createdAt: string;
}

// ─── Site & EAP ──────────────────────────────────────────────────────────────

export interface Site {
  id: string;
  name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  maxDepthMeters: number | null;
  description: string | null;
  conditions: string | null;
  accessNotes: string | null;
  isCachedOffline: boolean;
  lastCachedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EAP {
  id: string;
  siteId: string;
  nearestHospitalName: string | null;
  nearestHospitalAddress: string | null;
  nearestHospitalPhone: string | null;
  nearestChamberName: string | null;
  nearestChamberAddress: string | null;
  nearestChamberPhone: string | null;
  coastGuardPhone: string | null;
  localEmergencyNumber: string | null;
  danEmergencyNumber: string;
  oxygenLocation: string | null;
  firstAidKitLocation: string | null;
  aedLocation: string | null;
  evacuationProcedure: string | null;
  nearestExitPoint: string | null;
  vhfChannel: string | null;
  additionalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export type AuditEventType =
  | 'DIVE_CREATED'
  | 'DIVE_EDITED'
  | 'DIVE_VERSION_CREATED'
  | 'DIVE_TYPE_CHANGED'
  | 'DIVE_DELETED'
  | 'INSTRUCTOR_SIGNATURE_APPLIED'
  | 'BUDDY_SIGNATURE_APPLIED'
  | 'SITE_CREATED'
  | 'SITE_EDITED'
  | 'EAP_UPDATED'
  | 'SITE_CACHED'
  | 'EMERGENCY_MODE_ACTIVATED'
  | 'EMERGENCY_MODE_DEACTIVATED';

export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  entityId: string | null;
  entityType: string | null;
  payload: string | null;
  createdAt: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardConfig {
  widgetOrder: string[];
  hiddenWidgets: string[];
  updatedAt: string;
}

// ─── Instructor module ────────────────────────────────────────────────────────

export interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  studentId: string | null;   // school/course enrollment ID
  dob: string | null;         // date of birth ISO
  certLevel: string | null;
  certAgency: string | null;
  certNumber: string | null;
  certDate: string | null;
  emergencyContact: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CourseStatus = 'planning' | 'active' | 'completed' | 'cancelled';

export interface InstructorProfile {
  id: string;
  name: string;
  instructorNumber: string | null;
  certLevel: string | null;
  updatedAt: string;
}

export interface SkillEntry {
  key: string;   // String(templateIndex) for template skills; uuid for custom
  name: string;
}

export interface SkillOverrides {
  knowledge?:  SkillEntry[];
  confined?:   SkillEntry[];
  open_water?: SkillEntry[];
}

export interface InstructorCourse {
  id: string;
  name: string;
  level: string;
  description: string | null;
  templateId: string | null;
  status: CourseStatus;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  maxStudents: number;
  skillOverrides: SkillOverrides | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseSession {
  id: string;
  courseId: string;
  sessionNumber: number;
  sessionType: 'classroom' | 'pool' | 'open_water' | 'other';
  date: string | null;
  topic: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  status: 'active' | 'completed' | 'withdrawn';
  prereqProofUri: string | null;
  prereqProofNotes: string | null;
}

export interface SessionAttendance {
  id: string;
  sessionId: string;
  studentId: string;
  attended: boolean;
}

export interface Certification {
  id: string;
  studentId: string;
  courseId: string | null;
  certLevel: string;
  certAgency: string | null;
  certNumber: string | null;
  issuedDate: string;
  notes: string | null;
  createdAt: string;
}

export interface InstructorDocument {
  id: string;
  studentId: string | null;
  courseId: string | null;
  docType: string;
  title: string;
  content: string | null;
  signedAt: string | null;
  signatureData: string | null;
  reviewedAt: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface TrainingAcknowledgment {
  id: string;
  studentId: string;
  courseId: string | null;
  acknowledgedAt: string;
  signatureData: string | null;
  createdAt: string;
}

export interface InstructorCourseSkill {
  id: string;
  courseId: string;
  skillName: string;
  skillOrder: number;
  createdAt: string;
}

export type SkillEnvironment = 'knowledge' | 'confined' | 'open_water';

export interface SkillSignoff {
  id: string;
  studentId: string;
  courseId: string;
  skillKey: string;   // index string for templates, UUID for custom skills
  environment: SkillEnvironment;
  sessionId: string | null;
  signedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface DiveMedia {
  id: string;
  diveId: string;
  uri: string;
  mediaType: 'photo' | 'video';
  caption: string | null;
  createdAt: string;
}

export interface BuddyProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  certLevel: string | null;
  certAgency: string | null;
  certNumber: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebookHandle: string | null;
  twitterHandle: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBuddyInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  certLevel?: string | null;
  certAgency?: string | null;
  certNumber?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  facebookHandle?: string | null;
  twitterHandle?: string | null;
  notes?: string | null;
}

export interface DiveBuddy {
  id: string;
  diveId: string;
  buddyId: string;
  diveDate: string;
  createdAt: string;
}

export type SocialPlatform = 'instagram' | 'tiktok' | 'facebook' | 'twitter';

export interface CollabSession {
  id: string;
  hostDeviceId: string;
  hostName: string | null;
  siteName: string | null;
  diveDate: string | null;
  depthMax: number | null;
  bottomTime: number | null;
  createdAt: string;
  expiresAt: string;
}

export interface CollabMember {
  id: string;
  sessionId: string;
  deviceId: string;
  diverName: string | null;
  instagramHandle: string | null;
  tiktokHandle: string | null;
  facebookHandle: string | null;
  twitterHandle: string | null;
  joinedAt: string;
}

export interface CollabMedia {
  id: string;
  sessionId: string;
  uploaderDeviceId: string;
  uploaderName: string | null;
  storagePath: string;
  publicUrl: string | null;
  mediaType: 'photo' | 'video';
  caption: string | null;
  createdAt: string;
}

export interface CreateStudentInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  studentId?: string | null;
  dob?: string | null;
  certLevel?: string | null;
  certAgency?: string | null;
  certNumber?: string | null;
  certDate?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
}

export interface CreateDocumentInput {
  studentId: string;
  courseId: string;
  docType: 'liability_release' | 'medical_questionnaire' | 'student_record' | 'training_dive';
  title: string;
  content?: string | null;
  signedAt?: string | null;
  signatureData?: string | null;
}

export interface CreateAcknowledgmentInput {
  studentId: string;
  courseId: string;
  acknowledgedAt: string;
  signatureData?: string | null;
}

export interface CreateCourseInput {
  name: string;
  level: string;
  description?: string | null;
  templateId?: string | null;
  status?: CourseStatus;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  maxStudents?: number;
}

export interface CreateSessionInput {
  courseId: string;
  sessionNumber: number;
  sessionType: CourseSession['sessionType'];
  date?: string | null;
  topic?: string | null;
  notes?: string | null;
}

export interface CreateCertificationInput {
  studentId: string;
  courseId?: string | null;
  certLevel: string;
  certAgency?: string | null;
  certNumber?: string | null;
  issuedDate: string;
  notes?: string | null;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateDiveInput {
  diveType: DiveType;
  date: string;
  siteId?: string | null;
  siteName?: string | null;
  maxDepthMeters?: number | null;
  bottomTimeMinutes?: number | null;
  surfaceIntervalMinutes?: number | null;
  waterTemperatureCelsius?: number | null;
  visibility?: string | null;
  conditions?: string | null;
  equipment?: string | null;
  notes?: string | null;
  startPressureBar?: number | null;
  endPressureBar?: number | null;
  gasType?: string | null;
  tankSizeLiters?: number | null;
  courseName?: string | null;
  skillsCompleted?: string | null;
  cylindersJson?: string | null;
  activityTagsJson?: string | null;
  visibilityRating?: number | null;
  currentRating?: number | null;
  waveRating?: number | null;
  tripId?: string | null;
}

export interface EditDiveInput extends Omit<CreateDiveInput, 'diveType'> {
  changeDescription?: string | null;
}

export interface CreateSiteInput {
  name: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  maxDepthMeters?: number | null;
  description?: string | null;
  conditions?: string | null;
  accessNotes?: string | null;
}

export interface DiveStats {
  totalDives: number;
  totalBottomTimeMinutes: number;
  maxDepthMeters: number | null;
}

// ─── Gear module ──────────────────────────────────────────────────────────────

export type GearType =
  | 'mask' | 'fins' | 'snorkel' | 'boots' | 'wetsuit' | 'drysuit'
  | 'regulator' | 'octopus' | 'bcd' | 'computer' | 'tank'
  | 'light' | 'knife' | 'compass' | 'smb' | 'camera' | 'other';

export type DivingType =
  | 'recreational' | 'sidemount' | 'doubles' | 'tech' | 'freediving' | 'cave';

/** Gear types that do NOT require service reminders (but still track dive counts). */
export const NO_SERVICE_GEAR_TYPES: GearType[] = ['mask', 'fins', 'snorkel', 'boots', 'wetsuit'];

export interface GearItem {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  gearType: GearType;
  serialNumber: string | null;
  purchaseDate: string | null;
  notes: string | null;
  diveCount: number;
  diveCountAtLastService: number;
  lastServiceDate: string | null;
  requiresService: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GearSet {
  id: string;
  name: string;
  divingType: DivingType;
  isDefault: boolean;
  diveCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GearSetWithItems extends GearSet {
  items: GearItem[];
}

export interface ServiceRecord {
  id: string;
  gearItemId: string;
  serviceDate: string;
  description: string | null;
  provider: string | null;
  costCents: number | null;
  notes: string | null;
  diveCountAtService: number;
  createdAt: string;
}

export interface CreateGearItemInput {
  name: string;
  brand?: string | null;
  model?: string | null;
  gearType: GearType;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  notes?: string | null;
  requiresService?: boolean;
}

export interface UpdateGearItemInput {
  name?: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  notes?: string | null;
  requiresService?: boolean;
}

export interface CreateGearSetInput {
  name: string;
  divingType: DivingType;
  isDefault?: boolean;
}

export interface UpdateGearSetInput {
  name?: string;
  divingType?: DivingType;
  isDefault?: boolean;
}

export interface CreateServiceRecordInput {
  gearItemId: string;
  serviceDate: string;
  description?: string | null;
  provider?: string | null;
  costCents?: number | null;
  notes?: string | null;
}

// ─── Trips ────────────────────────────────────────────────────────────────────

export interface Trip {
  id: string;
  name: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  name: string;
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
}

// ─── Personal certifications ─────────────────────────────────────────────────

export interface PersonalCert {
  id: string;
  certName: string;
  agency: string | null;
  certNumber: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonalCertInput {
  certName: string;
  agency?: string | null;
  certNumber?: string | null;
  issuedDate?: string | null;
  expiryDate?: string | null;
  notes?: string | null;
}

// ─── Marine life sightings ────────────────────────────────────────────────────

export interface MarineLifeSighting {
  id: string;
  diveId: string;
  species: string;
  count: number | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateMarineLifeInput {
  diveId: string;
  species: string;
  count?: number | null;
  notes?: string | null;
}

// ─── Certification verification log ───────────────────────────────────────────

export interface CertVerification {
  id: string;
  diverName: string;
  agency: string;
  certLevel: string | null;
  certNumber: string | null;
  verifiedAt: string;   // ISO date string (YYYY-MM-DD)
  notes: string | null;
  createdAt: string;
}

export interface CreateCertVerificationInput {
  diverName: string;
  agency: string;
  certLevel?: string | null;
  certNumber?: string | null;
  verifiedAt: string;
  notes?: string | null;
}
