/** Migration 13 — prereq proof fields on enrollments */
export const MIGRATION_13: string[] = [
  `ALTER TABLE enrollments ADD COLUMN prereq_proof_uri TEXT`,
  `ALTER TABLE enrollments ADD COLUMN prereq_proof_notes TEXT`,
];

/** Migration 12 — certification verification log */
export const MIGRATION_12: string[] = [
  `CREATE TABLE IF NOT EXISTS cert_verifications (
    id          TEXT PRIMARY KEY,
    diver_name  TEXT NOT NULL,
    agency      TEXT NOT NULL,
    cert_level  TEXT,
    cert_number TEXT,
    verified_at TEXT NOT NULL,
    notes       TEXT,
    created_at  TEXT NOT NULL
  )`,
];

/** Migration 11 — activity tags, env conditions, trips, personal certs, marine life */
export const MIGRATION_11: string[] = [
  // Dive version enrichments
  `ALTER TABLE dive_versions ADD COLUMN activity_tags_json TEXT`,
  `ALTER TABLE dive_versions ADD COLUMN visibility_rating INTEGER`,
  `ALTER TABLE dive_versions ADD COLUMN current_rating INTEGER`,
  `ALTER TABLE dive_versions ADD COLUMN wave_rating INTEGER`,

  // Trip grouping
  `CREATE TABLE IF NOT EXISTS trips (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    destination TEXT,
    start_date  TEXT,
    end_date    TEXT,
    notes       TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  )`,
  `ALTER TABLE dives ADD COLUMN trip_id TEXT`,

  // Personal certifications (diver's own cert card storage)
  `CREATE TABLE IF NOT EXISTS personal_certs (
    id          TEXT PRIMARY KEY NOT NULL,
    cert_name   TEXT NOT NULL,
    agency      TEXT,
    cert_number TEXT,
    issued_date TEXT,
    expiry_date TEXT,
    notes       TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  )`,

  // Marine life sightings per dive
  `CREATE TABLE IF NOT EXISTS marine_life_sightings (
    id         TEXT PRIMARY KEY NOT NULL,
    dive_id    TEXT NOT NULL REFERENCES dives(id),
    species    TEXT NOT NULL,
    count      INTEGER,
    notes      TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_marine_life_dive ON marine_life_sightings(dive_id)`,
];

/** Migration 10 — multi-cylinder support on dive versions */
export const MIGRATION_10: string[] = [
  `ALTER TABLE dive_versions ADD COLUMN cylinders_json TEXT`,
];

/** Migration 9 — gear tracking (items, sets, service records) */
export const MIGRATION_9: string[] = [
  `CREATE TABLE IF NOT EXISTS gear_items (
    id                          TEXT PRIMARY KEY NOT NULL,
    name                        TEXT NOT NULL,
    brand                       TEXT,
    model                       TEXT,
    gear_type                   TEXT NOT NULL,
    serial_number               TEXT,
    purchase_date               TEXT,
    notes                       TEXT,
    dive_count                  INTEGER NOT NULL DEFAULT 0,
    dive_count_at_last_service  INTEGER NOT NULL DEFAULT 0,
    last_service_date           TEXT,
    requires_service            INTEGER NOT NULL DEFAULT 1,
    created_at                  TEXT NOT NULL,
    updated_at                  TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS gear_sets (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    diving_type TEXT NOT NULL,
    is_default  INTEGER NOT NULL DEFAULT 0,
    dive_count  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS gear_set_items (
    id           TEXT PRIMARY KEY NOT NULL,
    set_id       TEXT NOT NULL REFERENCES gear_sets(id) ON DELETE CASCADE,
    gear_item_id TEXT NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
    created_at   TEXT NOT NULL,
    UNIQUE(set_id, gear_item_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_gear_set_items_set  ON gear_set_items(set_id)`,
  `CREATE INDEX IF NOT EXISTS idx_gear_set_items_item ON gear_set_items(gear_item_id)`,

  `CREATE TABLE IF NOT EXISTS service_records (
    id                  TEXT PRIMARY KEY NOT NULL,
    gear_item_id        TEXT NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
    service_date        TEXT NOT NULL,
    description         TEXT,
    provider            TEXT,
    cost_cents          INTEGER,
    notes               TEXT,
    dive_count_at_service INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_service_records_item ON service_records(gear_item_id)`,
];

/** Migration 8 — social handles on buddy profiles + dive_buddies junction */
export const MIGRATION_8: string[] = [
  `ALTER TABLE buddy_profiles ADD COLUMN tiktok TEXT`,
  `ALTER TABLE buddy_profiles ADD COLUMN facebook_handle TEXT`,
  `ALTER TABLE buddy_profiles ADD COLUMN twitter_handle TEXT`,
  `CREATE TABLE IF NOT EXISTS dive_buddies (
    id         TEXT PRIMARY KEY NOT NULL,
    dive_id    TEXT NOT NULL REFERENCES dives(id),
    buddy_id   TEXT NOT NULL REFERENCES buddy_profiles(id),
    dive_date  TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(dive_id, buddy_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_dive_buddies_dive  ON dive_buddies(dive_id)`,
  `CREATE INDEX IF NOT EXISTS idx_dive_buddies_buddy ON dive_buddies(buddy_id)`,
];

/** Migration 7 — per-course skill overrides (custom order + custom skills) */
export const MIGRATION_7: string[] = [
  `ALTER TABLE instructor_courses ADD COLUMN skill_overrides TEXT`,
];

/** Migration 6 — student fields + document reviewed_at */
export const MIGRATION_6: string[] = [
  `ALTER TABLE instructor_students ADD COLUMN student_id TEXT`,
  `ALTER TABLE instructor_students ADD COLUMN dob TEXT`,
  `ALTER TABLE documents ADD COLUMN reviewed_at TEXT`,
  `ALTER TABLE documents ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`,
];

/** Migration 5 — instructor module expansion (profile, enrollments, sessions, certs, docs) */
export const MIGRATION_5: string[] = [
  // instructor profile (singleton row, id='default')
  `CREATE TABLE IF NOT EXISTS instructor_profile (
    id               TEXT PRIMARY KEY NOT NULL DEFAULT 'default',
    name             TEXT NOT NULL DEFAULT '',
    instructor_number TEXT,
    cert_level       TEXT,
    updated_at       TEXT NOT NULL
  )`,

  // expand instructor_courses
  `ALTER TABLE instructor_courses ADD COLUMN template_id TEXT`,
  `ALTER TABLE instructor_courses ADD COLUMN status TEXT NOT NULL DEFAULT 'planning'`,
  `ALTER TABLE instructor_courses ADD COLUMN location TEXT`,
  `ALTER TABLE instructor_courses ADD COLUMN start_date TEXT`,
  `ALTER TABLE instructor_courses ADD COLUMN end_date TEXT`,
  `ALTER TABLE instructor_courses ADD COLUMN max_students INTEGER DEFAULT 8`,

  // course sessions
  `CREATE TABLE IF NOT EXISTS course_sessions (
    id             TEXT PRIMARY KEY NOT NULL,
    course_id      TEXT NOT NULL REFERENCES instructor_courses(id),
    session_number INTEGER NOT NULL DEFAULT 1,
    session_type   TEXT NOT NULL DEFAULT 'classroom',
    date           TEXT,
    topic          TEXT,
    notes          TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_course ON course_sessions(course_id)`,

  // enrollments
  `CREATE TABLE IF NOT EXISTS enrollments (
    id          TEXT PRIMARY KEY NOT NULL,
    student_id  TEXT NOT NULL REFERENCES instructor_students(id),
    course_id   TEXT NOT NULL REFERENCES instructor_courses(id),
    enrolled_at TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'active'
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_unique
    ON enrollments(student_id, course_id)`,
  `CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id)`,

  // session attendance
  `CREATE TABLE IF NOT EXISTS session_attendance (
    id         TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL REFERENCES course_sessions(id),
    student_id TEXT NOT NULL REFERENCES instructor_students(id),
    attended   INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique
    ON session_attendance(session_id, student_id)`,

  // expand skill_signoffs with environment + session link
  `ALTER TABLE skill_signoffs ADD COLUMN environment TEXT NOT NULL DEFAULT 'open_water'`,
  `ALTER TABLE skill_signoffs ADD COLUMN session_id TEXT`,

  // drop old unique index (was on 3 cols), recreate with environment
  `DROP INDEX IF EXISTS idx_skill_signoffs_unique`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_signoffs_env_unique
    ON skill_signoffs(student_id, course_id, skill_key, environment)`,

  // certifications
  `CREATE TABLE IF NOT EXISTS certifications (
    id           TEXT PRIMARY KEY NOT NULL,
    student_id   TEXT NOT NULL REFERENCES instructor_students(id),
    course_id    TEXT REFERENCES instructor_courses(id),
    cert_level   TEXT NOT NULL,
    cert_agency  TEXT,
    cert_number  TEXT,
    issued_date  TEXT NOT NULL,
    notes        TEXT,
    created_at   TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_certs_student ON certifications(student_id)`,

  // paperwork / documents
  `CREATE TABLE IF NOT EXISTS documents (
    id             TEXT PRIMARY KEY NOT NULL,
    student_id     TEXT REFERENCES instructor_students(id),
    course_id      TEXT REFERENCES instructor_courses(id),
    doc_type       TEXT NOT NULL,
    title          TEXT NOT NULL,
    content        TEXT,
    signed_at      TEXT,
    signature_data TEXT,
    created_at     TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_docs_student ON documents(student_id)`,

  // training acknowledgments
  `CREATE TABLE IF NOT EXISTS training_acknowledgments (
    id               TEXT PRIMARY KEY NOT NULL,
    student_id       TEXT NOT NULL REFERENCES instructor_students(id),
    course_id        TEXT REFERENCES instructor_courses(id),
    acknowledged_at  TEXT NOT NULL,
    signature_data   TEXT,
    created_at       TEXT NOT NULL
  )`,
];

/** Migration 4 — dive media gallery + buddy profiles */
export const MIGRATION_4: string[] = [
  `CREATE TABLE IF NOT EXISTS dive_media (
    id         TEXT PRIMARY KEY NOT NULL,
    dive_id    TEXT NOT NULL REFERENCES dives(id),
    uri        TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'photo',
    caption    TEXT,
    created_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_dive_media_dive ON dive_media(dive_id)`,

  `CREATE TABLE IF NOT EXISTS buddy_profiles (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    cert_level  TEXT,
    cert_agency TEXT,
    cert_number TEXT,
    instagram   TEXT,
    notes       TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  )`,
];

/** Migration 3 — instructor module (students, custom courses, skill sign-offs) */
export const MIGRATION_3: string[] = [
  `CREATE TABLE IF NOT EXISTS instructor_students (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    cert_level  TEXT,
    cert_agency TEXT,
    cert_number TEXT,
    cert_date   TEXT,
    emergency_contact TEXT,
    notes       TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS instructor_courses (
    id          TEXT PRIMARY KEY NOT NULL,
    name        TEXT NOT NULL,
    level       TEXT NOT NULL DEFAULT 'intermediate',
    description TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS instructor_course_skills (
    id          TEXT PRIMARY KEY NOT NULL,
    course_id   TEXT NOT NULL REFERENCES instructor_courses(id),
    skill_name  TEXT NOT NULL,
    skill_order INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS skill_signoffs (
    id          TEXT PRIMARY KEY NOT NULL,
    student_id  TEXT NOT NULL,
    course_id   TEXT NOT NULL,
    skill_key   TEXT NOT NULL,
    signed_at   TEXT NOT NULL,
    notes       TEXT,
    created_at  TEXT NOT NULL
  )`,

  `CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_signoffs_unique
    ON skill_signoffs(student_id, course_id, skill_key)`,

  `CREATE INDEX IF NOT EXISTS idx_skill_signoffs_student
    ON skill_signoffs(student_id)`,
];

/** Migration 2 — app settings (key/value store for user preferences) */
export const MIGRATION_2: string[] = [
  `CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
];

/** Migration 1 — initial schema */
export const MIGRATION_1: string[] = [
  // ── Tables ─────────────────────────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS dives (
    id TEXT PRIMARY KEY NOT NULL,
    dive_number INTEGER NOT NULL,
    dive_type TEXT NOT NULL CHECK(dive_type IN ('TRAINING','RECREATIONAL')),
    current_version_id TEXT,
    is_signed_by_instructor INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS dive_versions (
    id TEXT PRIMARY KEY NOT NULL,
    dive_id TEXT NOT NULL REFERENCES dives(id),
    version_number INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    date TEXT NOT NULL,
    site_id TEXT,
    site_name TEXT,
    max_depth_meters REAL,
    bottom_time_minutes INTEGER,
    surface_interval_minutes INTEGER,
    water_temperature_celsius REAL,
    visibility TEXT,
    conditions TEXT,
    equipment TEXT,
    notes TEXT,
    start_pressure_bar INTEGER,
    end_pressure_bar INTEGER,
    gas_type TEXT,
    tank_size_liters REAL,
    course_name TEXT,
    skills_completed TEXT,
    created_by_user_id TEXT,
    change_description TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS signatures (
    id TEXT PRIMARY KEY NOT NULL,
    dive_id TEXT NOT NULL REFERENCES dives(id),
    signer_type TEXT NOT NULL CHECK(signer_type IN ('INSTRUCTOR','BUDDY')),
    signer_name TEXT,
    signature_data TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS dive_sites (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    latitude REAL,
    longitude REAL,
    max_depth_meters REAL,
    description TEXT,
    conditions TEXT,
    access_notes TEXT,
    is_cached_offline INTEGER NOT NULL DEFAULT 0,
    last_cached_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS emergency_action_plans (
    id TEXT PRIMARY KEY NOT NULL,
    site_id TEXT NOT NULL UNIQUE REFERENCES dive_sites(id),
    nearest_hospital_name TEXT,
    nearest_hospital_address TEXT,
    nearest_hospital_phone TEXT,
    nearest_chamber_name TEXT,
    nearest_chamber_address TEXT,
    nearest_chamber_phone TEXT,
    coast_guard_phone TEXT,
    local_emergency_number TEXT,
    dan_emergency_number TEXT NOT NULL DEFAULT '+1-919-684-9111',
    oxygen_location TEXT,
    first_aid_kit_location TEXT,
    aed_location TEXT,
    evacuation_procedure TEXT,
    nearest_exit_point TEXT,
    vhf_channel TEXT,
    additional_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY NOT NULL,
    event_type TEXT NOT NULL,
    entity_id TEXT,
    entity_type TEXT,
    payload TEXT,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS dashboard_config (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    widget_order TEXT NOT NULL DEFAULT '["stats","recentDives","quickActions","emergency"]',
    hidden_widgets TEXT NOT NULL DEFAULT '[]',
    updated_at TEXT NOT NULL
  )`,

  // ── Indexes ────────────────────────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_dives_not_deleted ON dives(is_deleted)`,
  `CREATE INDEX IF NOT EXISTS idx_dive_versions_dive_id ON dive_versions(dive_id)`,
  `CREATE INDEX IF NOT EXISTS idx_signatures_dive_id ON signatures(dive_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type)`,

  // ── Immutability triggers ─────────────────────────────────────────────────
  `CREATE TRIGGER IF NOT EXISTS prevent_update_dive_versions
    BEFORE UPDATE ON dive_versions
    BEGIN SELECT RAISE(ABORT,'dive_versions is immutable'); END`,

  `CREATE TRIGGER IF NOT EXISTS prevent_delete_dive_versions
    BEFORE DELETE ON dive_versions
    BEGIN SELECT RAISE(ABORT,'dive_versions is immutable'); END`,

  `CREATE TRIGGER IF NOT EXISTS prevent_update_signatures
    BEFORE UPDATE ON signatures
    BEGIN SELECT RAISE(ABORT,'signatures is immutable'); END`,

  `CREATE TRIGGER IF NOT EXISTS prevent_delete_signatures
    BEFORE DELETE ON signatures
    BEGIN SELECT RAISE(ABORT,'signatures is immutable'); END`,

  `CREATE TRIGGER IF NOT EXISTS prevent_update_audit_events
    BEFORE UPDATE ON audit_events
    BEGIN SELECT RAISE(ABORT,'audit_events is immutable'); END`,

  `CREATE TRIGGER IF NOT EXISTS prevent_delete_audit_events
    BEFORE DELETE ON audit_events
    BEGIN SELECT RAISE(ABORT,'audit_events is immutable'); END`,

  // ── Business logic triggers ────────────────────────────────────────────────
  `CREATE TRIGGER IF NOT EXISTS lock_dive_on_instructor_sig
    AFTER INSERT ON signatures
    WHEN NEW.signer_type = 'INSTRUCTOR'
    BEGIN
      UPDATE dives
        SET is_signed_by_instructor = 1, updated_at = NEW.created_at
        WHERE id = NEW.dive_id;
    END`,

  `CREATE TRIGGER IF NOT EXISTS block_edit_locked_training_dive
    BEFORE INSERT ON dive_versions
    BEGIN
      SELECT RAISE(ABORT,'Cannot edit a signed training dive')
        WHERE EXISTS (
          SELECT 1 FROM dives
            WHERE id = NEW.dive_id
              AND dive_type = 'TRAINING'
              AND is_signed_by_instructor = 1
        );
    END`,
];
