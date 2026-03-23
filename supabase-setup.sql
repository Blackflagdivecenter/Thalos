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
