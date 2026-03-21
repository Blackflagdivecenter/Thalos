import { getDb } from '@/src/db/client';
import {
  Dive,
  DiveVersion,
  DiveWithVersion,
  DiveStats,
  DiveType,
} from '@/src/models';

// Raw row types returned by SQLite (all snake_case, booleans as 0/1)
interface DiveRow {
  id: string;
  dive_number: number;
  dive_type: DiveType;
  current_version_id: string | null;
  is_signed_by_instructor: number;
  is_deleted: number;
  trip_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DiveVersionRow {
  id: string;
  dive_id: string;
  version_number: number;
  created_at: string;
  date: string;
  site_id: string | null;
  site_name: string | null;
  max_depth_meters: number | null;
  bottom_time_minutes: number | null;
  surface_interval_minutes: number | null;
  water_temperature_celsius: number | null;
  visibility: string | null;
  conditions: string | null;
  equipment: string | null;
  notes: string | null;
  start_pressure_bar: number | null;
  end_pressure_bar: number | null;
  gas_type: string | null;
  tank_size_liters: number | null;
  course_name: string | null;
  skills_completed: string | null;
  created_by_user_id: string | null;
  change_description: string | null;
  cylinders_json: string | null;
  activity_tags_json: string | null;
  visibility_rating: number | null;
  current_rating: number | null;
  wave_rating: number | null;
}

type JoinedRow = DiveRow & DiveVersionRow;

function mapJoinedRow(r: JoinedRow): DiveWithVersion {
  return {
    id: r.id,
    diveNumber: r.dive_number,
    diveType: r.dive_type,
    currentVersionId: r.current_version_id,
    isSignedByInstructor: r.is_signed_by_instructor === 1,
    isDeleted: r.is_deleted === 1,
    tripId: r.trip_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    date: r.date,
    siteId: r.site_id,
    siteName: r.site_name,
    maxDepthMeters: r.max_depth_meters,
    bottomTimeMinutes: r.bottom_time_minutes,
    surfaceIntervalMinutes: r.surface_interval_minutes,
    waterTemperatureCelsius: r.water_temperature_celsius,
    visibility: r.visibility,
    conditions: r.conditions,
    equipment: r.equipment,
    notes: r.notes,
    startPressureBar: r.start_pressure_bar,
    endPressureBar: r.end_pressure_bar,
    gasType: r.gas_type,
    tankSizeLiters: r.tank_size_liters,
    courseName: r.course_name,
    skillsCompleted: r.skills_completed,
    changeDescription: r.change_description,
    cylindersJson: r.cylinders_json,
    activityTagsJson: r.activity_tags_json,
    visibilityRating: r.visibility_rating,
    currentRating: r.current_rating,
    waveRating: r.wave_rating,
  };
}

function mapVersionRow(r: DiveVersionRow): DiveVersion {
  return {
    id: r.id,
    diveId: r.dive_id,
    versionNumber: r.version_number,
    createdAt: r.created_at,
    date: r.date,
    siteId: r.site_id,
    siteName: r.site_name,
    maxDepthMeters: r.max_depth_meters,
    bottomTimeMinutes: r.bottom_time_minutes,
    surfaceIntervalMinutes: r.surface_interval_minutes,
    waterTemperatureCelsius: r.water_temperature_celsius,
    visibility: r.visibility,
    conditions: r.conditions,
    equipment: r.equipment,
    notes: r.notes,
    startPressureBar: r.start_pressure_bar,
    endPressureBar: r.end_pressure_bar,
    gasType: r.gas_type,
    tankSizeLiters: r.tank_size_liters,
    courseName: r.course_name,
    skillsCompleted: r.skills_completed,
    createdByUserId: r.created_by_user_id,
    changeDescription: r.change_description,
    cylindersJson: r.cylinders_json,
    activityTagsJson: r.activity_tags_json,
    visibilityRating: r.visibility_rating,
    currentRating: r.current_rating,
    waveRating: r.wave_rating,
  };
}

const JOIN_SQL = `
  SELECT
    d.id, d.dive_number, d.dive_type, d.current_version_id,
    d.is_signed_by_instructor, d.is_deleted, d.trip_id, d.created_at, d.updated_at,
    v.id as v_id, v.dive_id, v.version_number, v.created_at as v_created_at,
    v.date, v.site_id, v.site_name, v.max_depth_meters, v.bottom_time_minutes,
    v.surface_interval_minutes, v.water_temperature_celsius, v.visibility,
    v.conditions, v.equipment, v.notes, v.start_pressure_bar, v.end_pressure_bar,
    v.gas_type, v.tank_size_liters, v.course_name, v.skills_completed,
    v.created_by_user_id, v.change_description, v.cylinders_json,
    v.activity_tags_json, v.visibility_rating, v.current_rating, v.wave_rating
  FROM dives d
  LEFT JOIN dive_versions v ON d.current_version_id = v.id
`;

export class DiveRepository {
  getAllWithVersion(): DiveWithVersion[] {
    const db = getDb();
    const rows = db.getAllSync<JoinedRow>(
      `${JOIN_SQL} WHERE d.is_deleted = 0 ORDER BY v.date DESC, d.dive_number DESC`
    );
    return rows.map(mapJoinedRow);
  }

  getByIdWithVersion(id: string): DiveWithVersion | null {
    const db = getDb();
    const row = db.getFirstSync<JoinedRow>(
      `${JOIN_SQL} WHERE d.id = ?`,
      [id]
    );
    return row ? mapJoinedRow(row) : null;
  }

  getVersionHistory(diveId: string): DiveVersion[] {
    const db = getDb();
    const rows = db.getAllSync<DiveVersionRow>(
      'SELECT * FROM dive_versions WHERE dive_id = ? ORDER BY version_number DESC',
      [diveId]
    );
    return rows.map(mapVersionRow);
  }

  getStats(): DiveStats {
    const db = getDb();
    const row = db.getFirstSync<{
      total_dives: number;
      total_bottom_time: number | null;
      max_depth: number | null;
    }>(
      `SELECT
         COUNT(*) as total_dives,
         SUM(v.bottom_time_minutes) as total_bottom_time,
         MAX(v.max_depth_meters) as max_depth
       FROM dives d
       LEFT JOIN dive_versions v ON d.current_version_id = v.id
       WHERE d.is_deleted = 0`
    );
    return {
      totalDives: row?.total_dives ?? 0,
      totalBottomTimeMinutes: row?.total_bottom_time ?? 0,
      maxDepthMeters: row?.max_depth ?? null,
    };
  }

  getNextDiveNumber(): number {
    const db = getDb();
    const row = db.getFirstSync<{ max_num: number | null }>(
      'SELECT MAX(dive_number) as max_num FROM dives'
    );
    return (row?.max_num ?? 0) + 1;
  }

  insertDive(params: {
    id: string;
    diveNumber: number;
    diveType: DiveType;
    currentVersionId: string;
    tripId?: string | null;
    createdAt: string;
  }): void {
    const db = getDb();
    db.runSync(
      `INSERT INTO dives
         (id, dive_number, dive_type, current_version_id, trip_id, is_signed_by_instructor, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      [params.id, params.diveNumber, params.diveType, params.currentVersionId, params.tripId ?? null, params.createdAt, params.createdAt]
    );
  }

  insertVersion(params: {
    id: string;
    diveId: string;
    versionNumber: number;
    createdAt: string;
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
    changeDescription?: string | null;
    cylindersJson?: string | null;
    activityTagsJson?: string | null;
    visibilityRating?: number | null;
    currentRating?: number | null;
    waveRating?: number | null;
  }): void {
    const db = getDb();
    db.runSync(
      `INSERT INTO dive_versions
         (id, dive_id, version_number, created_at, date, site_id, site_name,
          max_depth_meters, bottom_time_minutes, surface_interval_minutes,
          water_temperature_celsius, visibility, conditions, equipment, notes,
          start_pressure_bar, end_pressure_bar, gas_type, tank_size_liters,
          course_name, skills_completed, change_description, cylinders_json,
          activity_tags_json, visibility_rating, current_rating, wave_rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.id, params.diveId, params.versionNumber, params.createdAt,
        params.date, params.siteId ?? null, params.siteName ?? null,
        params.maxDepthMeters ?? null, params.bottomTimeMinutes ?? null,
        params.surfaceIntervalMinutes ?? null, params.waterTemperatureCelsius ?? null,
        params.visibility ?? null, params.conditions ?? null, params.equipment ?? null,
        params.notes ?? null, params.startPressureBar ?? null, params.endPressureBar ?? null,
        params.gasType ?? null, params.tankSizeLiters ?? null,
        params.courseName ?? null, params.skillsCompleted ?? null,
        params.changeDescription ?? null, params.cylindersJson ?? null,
        params.activityTagsJson ?? null, params.visibilityRating ?? null,
        params.currentRating ?? null, params.waveRating ?? null,
      ]
    );
  }

  updateCurrentVersion(diveId: string, versionId: string, updatedAt: string): void {
    const db = getDb();
    db.runSync(
      'UPDATE dives SET current_version_id = ?, updated_at = ? WHERE id = ?',
      [versionId, updatedAt, diveId]
    );
  }

  updateTripId(diveId: string, tripId: string | null, updatedAt: string): void {
    const db = getDb();
    db.runSync(
      'UPDATE dives SET trip_id = ?, updated_at = ? WHERE id = ?',
      [tripId, updatedAt, diveId]
    );
  }

  softDelete(diveId: string, updatedAt: string): void {
    const db = getDb();
    db.runSync(
      'UPDATE dives SET is_deleted = 1, updated_at = ? WHERE id = ?',
      [updatedAt, diveId]
    );
  }
}
