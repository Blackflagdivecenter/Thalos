-- Thalos — Supabase Setup
-- Run this in your Supabase project's SQL Editor.
-- Creates all tables needed for cloud features (collab + community discovery).

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Buddy Collaboration Tables
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE collab_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_device_id TEXT NOT NULL,
  host_name TEXT,
  site_name TEXT,
  dive_date TEXT,
  depth_max REAL,
  bottom_time INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE TABLE session_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collab_sessions(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  diver_name TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  facebook_handle TEXT,
  twitter_handle TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, device_id)
);

CREATE TABLE session_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES collab_sessions(id) ON DELETE CASCADE,
  uploader_device_id TEXT NOT NULL,
  uploader_name TEXT,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo','video')),
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: link-based access — anyone with the session ID can read/write
ALTER TABLE collab_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read"   ON collab_sessions FOR SELECT USING (true);
CREATE POLICY "public insert" ON collab_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "public read"   ON session_members FOR SELECT USING (true);
CREATE POLICY "public insert" ON session_members FOR INSERT WITH CHECK (true);
CREATE POLICY "public read"   ON session_media FOR SELECT USING (true);
CREATE POLICY "public insert" ON session_media FOR INSERT WITH CHECK (true);

-- NOTE: Create a "collab-media" storage bucket (public) in the Supabase dashboard
-- for session_media file uploads.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Community Discovery Tables
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Classes ──────────────────────────────────────────────────────────────────

CREATE TABLE community_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_code TEXT NOT NULL,
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

CREATE POLICY "public read active"  ON community_classes FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public insert"       ON community_classes FOR INSERT WITH CHECK (true);
CREATE POLICY "owner delete"        ON community_classes FOR DELETE USING (true);

CREATE INDEX idx_classes_active_date ON community_classes (is_active, created_at DESC);

-- ── Trips ────────────────────────────────────────────────────────────────────

CREATE TABLE community_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_code TEXT NOT NULL,
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

CREATE POLICY "public read active"  ON community_trips FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public insert"       ON community_trips FOR INSERT WITH CHECK (true);
CREATE POLICY "owner delete"        ON community_trips FOR DELETE USING (true);

CREATE INDEX idx_trips_active_date ON community_trips (is_active, created_at DESC);

-- ── Dive Centers ─────────────────────────────────────────────────────────────

CREATE TABLE community_dive_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_code TEXT NOT NULL,
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

CREATE POLICY "public read active"  ON community_dive_centers FOR SELECT USING (is_active = TRUE);
CREATE POLICY "public insert"       ON community_dive_centers FOR INSERT WITH CHECK (true);
CREATE POLICY "owner delete"        ON community_dive_centers FOR DELETE USING (true);

CREATE INDEX idx_centers_active_date ON community_dive_centers (is_active, created_at DESC);
