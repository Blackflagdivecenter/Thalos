-- Thalos — Supabase Setup
-- Run this in your Supabase project's SQL Editor.
-- Safe to run even if collab tables already exist — uses IF NOT EXISTS throughout.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. User Profiles
--    Auto-created when a user signs up via the handle_new_user() trigger.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'diver' CHECK (role IN ('diver', 'instructor')),
  cert_level TEXT,
  cert_agency TEXT,
  phone TEXT,
  avatar_url TEXT,
  instructor_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON profiles FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Users can update own profile'
  ) THEN
    -- WITH CHECK ensures users cannot change their own role (set at signup only)
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Instructors visible to authenticated users'
  ) THEN
    CREATE POLICY "Instructors visible to authenticated users"
      ON profiles FOR SELECT USING (
        role = 'instructor' AND auth.uid() IS NOT NULL
      );
  END IF;
END $$;

-- Auto-create profile row on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'diver')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Community Discovery Tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Classes ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claim_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  title TEXT NOT NULL,
  agency TEXT,
  cert_level TEXT,
  instructor_name TEXT,
  dive_center_name TEXT,
  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  start_date TEXT,
  end_date TEXT,
  price_usd NUMERIC,
  max_students INTEGER,
  spots_remaining INTEGER,
  description TEXT,
  prerequisites TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE community_classes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_classes' AND policyname='Anyone can read active classes') THEN
    CREATE POLICY "Anyone can read active classes" ON community_classes FOR SELECT USING (is_active = TRUE);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_classes' AND policyname='Authenticated users can post classes') THEN
    CREATE POLICY "Authenticated users can post classes" ON community_classes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_classes' AND policyname='Owner can update own class') THEN
    CREATE POLICY "Owner can update own class" ON community_classes FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_classes' AND policyname='Owner can delete own class') THEN
    CREATE POLICY "Owner can delete own class" ON community_classes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_classes_active ON community_classes (is_active, created_at DESC);

-- ── Trips ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claim_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  organizer_name TEXT,
  organizer_type TEXT,
  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  start_date TEXT,
  end_date TEXT,
  price_usd NUMERIC,
  spots_total INTEGER,
  spots_remaining INTEGER,
  description TEXT,
  includes TEXT,
  required_cert TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE community_trips ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_trips' AND policyname='Anyone can read active trips') THEN
    CREATE POLICY "Anyone can read active trips" ON community_trips FOR SELECT USING (is_active = TRUE);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_trips' AND policyname='Authenticated users can post trips') THEN
    CREATE POLICY "Authenticated users can post trips" ON community_trips FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_trips' AND policyname='Owner can update own trip') THEN
    CREATE POLICY "Owner can update own trip" ON community_trips FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_trips' AND policyname='Owner can delete own trip') THEN
    CREATE POLICY "Owner can delete own trip" ON community_trips FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_trips_active ON community_trips (is_active, created_at DESC);

-- ── Dive Centers ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_dive_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claim_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state_region TEXT,
  country TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  brands_sold_json TEXT,
  brands_serviced_json TEXT,
  agencies_json TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE community_dive_centers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_dive_centers' AND policyname='Anyone can read active centers') THEN
    CREATE POLICY "Anyone can read active centers" ON community_dive_centers FOR SELECT USING (is_active = TRUE);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_dive_centers' AND policyname='Authenticated users can post centers') THEN
    CREATE POLICY "Authenticated users can post centers" ON community_dive_centers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_dive_centers' AND policyname='Owner can update own center') THEN
    CREATE POLICY "Owner can update own center" ON community_dive_centers FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='community_dive_centers' AND policyname='Owner can delete own center') THEN
    CREATE POLICY "Owner can delete own center" ON community_dive_centers FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_centers_active ON community_dive_centers (is_active, created_at DESC);

-- ── Class Enrollments ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES community_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='class_enrollments' AND policyname='Students can read own enrollments') THEN
    CREATE POLICY "Students can read own enrollments" ON class_enrollments FOR SELECT USING (auth.uid() = student_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='class_enrollments' AND policyname='Instructors can read enrollments for their class') THEN
    CREATE POLICY "Instructors can read enrollments for their class"
      ON class_enrollments FOR SELECT USING (
        EXISTS (SELECT 1 FROM community_classes WHERE id = class_id AND user_id = auth.uid())
      );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='class_enrollments' AND policyname='Students can enroll') THEN
    CREATE POLICY "Students can enroll" ON class_enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='class_enrollments' AND policyname='Instructors can update enrollment status') THEN
    CREATE POLICY "Instructors can update enrollment status"
      ON class_enrollments FOR UPDATE USING (
        EXISTS (SELECT 1 FROM community_classes WHERE id = class_id AND user_id = auth.uid())
      );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='class_enrollments' AND policyname='Students can cancel own enrollment') THEN
    CREATE POLICY "Students can cancel own enrollment" ON class_enrollments FOR DELETE USING (auth.uid() = student_id);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Buddy Collaboration Tables (upgrade existing — add user_id columns)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS collab_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_device_id TEXT NOT NULL,
  host_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  host_name TEXT,
  site_name TEXT,
  dive_date TEXT,
  depth_max REAL,
  bottom_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Add user_id columns to existing collab tables if they don't exist
ALTER TABLE collab_sessions
  ADD COLUMN IF NOT EXISTS host_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS session_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collab_sessions(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  diver_name TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  facebook_handle TEXT,
  twitter_handle TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, device_id)
);

ALTER TABLE session_members
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS session_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collab_sessions(id) ON DELETE CASCADE,
  uploader_device_id TEXT NOT NULL,
  uploader_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploader_name TEXT,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo','video')),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE session_media
  ADD COLUMN IF NOT EXISTS uploader_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE collab_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_media   ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='collab_sessions' AND policyname='public read') THEN
    CREATE POLICY "public read"   ON collab_sessions FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='collab_sessions' AND policyname='public insert') THEN
    CREATE POLICY "public insert" ON collab_sessions FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='session_members' AND policyname='public read') THEN
    CREATE POLICY "public read"   ON session_members FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='session_members' AND policyname='public insert') THEN
    CREATE POLICY "public insert" ON session_members FOR INSERT WITH CHECK (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='session_media' AND policyname='public read') THEN
    CREATE POLICY "public read"   ON session_media FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='session_media' AND policyname='public insert') THEN
    CREATE POLICY "public insert" ON session_media FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- NOTE: Create a "collab-media" storage bucket (public) in the Supabase
-- dashboard for session_media file uploads.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Connected Accounts — Profile Enhancements
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS handle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_dives INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Unique index on handle (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_handle ON profiles (handle) WHERE handle IS NOT NULL;

-- Allow any authenticated user to search profiles (for student search, social)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Authenticated can search profiles') THEN
    CREATE POLICY "Authenticated can search profiles"
      ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Trigger inserts: also need insert policy for handle_new_user trigger
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Trigger can insert profiles') THEN
    CREATE POLICY "Trigger can insert profiles" ON profiles FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Update handle_new_user to include handle generation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'diver')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. Connected Instructor — Courses (Cloud Mirror)
--    Instructor pushes course metadata to Supabase so students can see it.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS instructor_courses_cloud (
  id              UUID PRIMARY KEY,
  instructor_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  level           TEXT NOT NULL,
  template_id     TEXT,
  status          TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning','active','completed','cancelled')),
  location        TEXT,
  start_date      TEXT,
  end_date        TEXT,
  max_students    INT DEFAULT 8,
  skill_list_json TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE instructor_courses_cloud ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='instructor_courses_cloud' AND policyname='Instructors manage own courses') THEN
    CREATE POLICY "Instructors manage own courses"
      ON instructor_courses_cloud FOR ALL USING (instructor_id = auth.uid());
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_courses_cloud_instructor ON instructor_courses_cloud (instructor_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. Connected Enrollments
--    Instructor enrolls a Thalos user into a course.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS connected_enrollments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id       UUID NOT NULL REFERENCES instructor_courses_cloud(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instructor_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','withdrawn')),
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id)
);

ALTER TABLE connected_enrollments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='connected_enrollments' AND policyname='Students see own enrollments') THEN
    CREATE POLICY "Students see own enrollments"
      ON connected_enrollments FOR SELECT USING (student_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='connected_enrollments' AND policyname='Instructors manage enrollments for own courses') THEN
    CREATE POLICY "Instructors manage enrollments for own courses"
      ON connected_enrollments FOR ALL USING (instructor_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON connected_enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course  ON connected_enrollments (course_id);

-- Deferred policy: now that connected_enrollments exists, add student read policy on courses
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='instructor_courses_cloud' AND policyname='Enrolled students can read course') THEN
    CREATE POLICY "Enrolled students can read course"
      ON instructor_courses_cloud FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM connected_enrollments ce
          WHERE ce.course_id = instructor_courses_cloud.id
            AND ce.student_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. Paperwork Submissions
--    Students fill forms on their device, data stored in Supabase.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS paperwork_submissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id       UUID NOT NULL REFERENCES instructor_courses_cloud(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type        TEXT NOT NULL
    CHECK (doc_type IN ('liability_release','medical_questionnaire','training_acknowledgment')),
  content_json    TEXT,
  signature_data  TEXT,
  signed_at       TIMESTAMPTZ,
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id, doc_type)
);

ALTER TABLE paperwork_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='paperwork_submissions' AND policyname='Students manage own submissions') THEN
    CREATE POLICY "Students manage own submissions"
      ON paperwork_submissions FOR ALL USING (student_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='paperwork_submissions' AND policyname='Instructors read course submissions') THEN
    CREATE POLICY "Instructors read course submissions"
      ON paperwork_submissions FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM instructor_courses_cloud c
          WHERE c.id = paperwork_submissions.course_id
            AND c.instructor_id = auth.uid()
        )
      );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='paperwork_submissions' AND policyname='Instructors can review submissions') THEN
    CREATE POLICY "Instructors can review submissions"
      ON paperwork_submissions FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM instructor_courses_cloud c
          WHERE c.id = paperwork_submissions.course_id
            AND c.instructor_id = auth.uid()
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_paperwork_course_student ON paperwork_submissions (course_id, student_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. Paperwork Requests
--    Instructor requests student to complete a specific form.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS paperwork_requests (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id       UUID NOT NULL REFERENCES instructor_courses_cloud(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instructor_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type    TEXT NOT NULL
    CHECK (request_type IN ('liability_release','medical_questionnaire','training_acknowledgment')),
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE paperwork_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='paperwork_requests' AND policyname='Students see own requests') THEN
    CREATE POLICY "Students see own requests"
      ON paperwork_requests FOR SELECT USING (student_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='paperwork_requests' AND policyname='Students can update own request status') THEN
    CREATE POLICY "Students can update own request status"
      ON paperwork_requests FOR UPDATE USING (student_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='paperwork_requests' AND policyname='Instructors manage requests for own courses') THEN
    CREATE POLICY "Instructors manage requests for own courses"
      ON paperwork_requests FOR ALL USING (instructor_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_requests_student ON paperwork_requests (student_id, status);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. Skill Sign-Offs (Cloud)
--    Instructor writes, student can read their progress.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS skill_signoffs_cloud (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id     UUID NOT NULL REFERENCES instructor_courses_cloud(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_key     TEXT NOT NULL,
  skill_name    TEXT NOT NULL,
  environment   TEXT NOT NULL DEFAULT 'open_water',
  signed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, student_id, skill_key, environment)
);

ALTER TABLE skill_signoffs_cloud ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='skill_signoffs_cloud' AND policyname='Instructors manage signoffs for own courses') THEN
    CREATE POLICY "Instructors manage signoffs for own courses"
      ON skill_signoffs_cloud FOR ALL USING (instructor_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='skill_signoffs_cloud' AND policyname='Students see own signoffs') THEN
    CREATE POLICY "Students see own signoffs"
      ON skill_signoffs_cloud FOR SELECT USING (student_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_signoffs_course_student ON skill_signoffs_cloud (course_id, student_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. Certifications (Cloud)
--     Issued by instructor, visible to student.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS certifications_cloud (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id     UUID REFERENCES instructor_courses_cloud(id) ON DELETE SET NULL,
  cert_level    TEXT NOT NULL,
  cert_agency   TEXT,
  cert_number   TEXT,
  issued_date   TEXT NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE certifications_cloud ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='certifications_cloud' AND policyname='Instructors manage own certifications') THEN
    CREATE POLICY "Instructors manage own certifications"
      ON certifications_cloud FOR ALL USING (instructor_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='certifications_cloud' AND policyname='Students see own certifications') THEN
    CREATE POLICY "Students see own certifications"
      ON certifications_cloud FOR SELECT USING (student_id = auth.uid());
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. Notifications
--     In-app notification inbox for both instructors and students.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type          TEXT NOT NULL,
  title         TEXT NOT NULL,
  body          TEXT,
  data_json     TEXT,
  is_read       BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users see own notifications') THEN
    CREATE POLICY "Users see own notifications"
      ON notifications FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users update own notifications') THEN
    CREATE POLICY "Users update own notifications"
      ON notifications FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Authenticated can create notifications') THEN
    CREATE POLICY "Authenticated can create notifications"
      ON notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. Social Feed — Dive Shares & Tank Taps
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Dive Shares ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dive_shares (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dive_number     INT,
  date            TEXT,
  site_name       TEXT,
  max_depth_m     REAL,
  bottom_time_min INT,
  gas_type        TEXT,
  water_temp_c    REAL,
  visibility      TEXT,
  caption         TEXT,
  photo_url       TEXT,
  activity_tags   TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE dive_shares ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dive_shares' AND policyname='Anyone can read dive shares') THEN
    CREATE POLICY "Anyone can read dive shares"
      ON dive_shares FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dive_shares' AND policyname='Users can share own dives') THEN
    CREATE POLICY "Users can share own dives"
      ON dive_shares FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dive_shares' AND policyname='Users can update own shares') THEN
    CREATE POLICY "Users can update own shares"
      ON dive_shares FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dive_shares' AND policyname='Users can delete own shares') THEN
    CREATE POLICY "Users can delete own shares"
      ON dive_shares FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_dive_shares_user ON dive_shares (user_id, created_at DESC);

-- ── Tank Taps ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tank_taps (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dive_share_id UUID NOT NULL REFERENCES dive_shares(id) ON DELETE CASCADE,
  tapper_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(dive_share_id, tapper_id)
);

ALTER TABLE tank_taps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tank_taps' AND policyname='Anyone can read taps') THEN
    CREATE POLICY "Anyone can read taps"
      ON tank_taps FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tank_taps' AND policyname='Authenticated can tap') THEN
    CREATE POLICY "Authenticated can tap"
      ON tank_taps FOR INSERT WITH CHECK (tapper_id = auth.uid());
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tank_taps' AND policyname='Users can untap own') THEN
    CREATE POLICY "Users can untap own"
      ON tank_taps FOR DELETE USING (tapper_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_taps_share ON tank_taps (dive_share_id);

-- ── Follows ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS follows (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='follows' AND policyname='Anyone can read follows') THEN
    CREATE POLICY "Anyone can read follows"
      ON follows FOR SELECT USING (true);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='follows' AND policyname='Users manage own follows') THEN
    CREATE POLICY "Users manage own follows"
      ON follows FOR ALL USING (follower_id = auth.uid());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_follows_follower  ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows (following_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. Helper Function — Create Notification + (Optional) Push
--     Call: SELECT create_notification(user_id, from_id, type, title, body, data)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id     UUID,
  p_from_user   UUID,
  p_type        TEXT,
  p_title       TEXT,
  p_body        TEXT DEFAULT NULL,
  p_data_json   TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (user_id, from_user_id, type, title, body, data_json)
  VALUES (p_user_id, p_from_user, p_type, p_title, p_body, p_data_json)
  RETURNING id INTO v_id;

  -- Push notification delivery is handled by Supabase Edge Function
  -- triggered via database webhook on notifications table INSERT.
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTES:
-- • Create a "collab-media" storage bucket (public) for session_media uploads.
-- • Create a "dive-photos" storage bucket (public) for dive_shares photo uploads.
-- • Set up a Database Webhook on notifications INSERT → Edge Function "send-push"
--   to deliver Expo push notifications.
-- ═══════════════════════════════════════════════════════════════════════════════
