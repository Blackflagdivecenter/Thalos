import { getSupabase } from '@/src/db/supabase';
import { useAuthStore } from '@/src/stores/authStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ClassEnrollment {
  id: string;
  classId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  enrolledAt: string;
}

export interface CommunityClass {
  id: string;
  title: string;
  agency: string | null;
  certLevel: string | null;
  instructorName: string | null;
  diveCenterName: string | null;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  startDate: string | null;
  endDate: string | null;
  priceUsd: number | null;
  maxStudents: number | null;
  spotsRemaining: number | null;
  description: string | null;
  prerequisites: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
}

export interface CommunityTrip {
  id: string;
  title: string;
  destination: string;
  organizerName: string | null;
  organizerType: string | null;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  startDate: string | null;
  endDate: string | null;
  priceUsd: number | null;
  spotsTotal: number | null;
  spotsRemaining: number | null;
  description: string | null;
  includes: string | null;
  requiredCert: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
}

export interface CommunityDiveCenter {
  id: string;
  name: string;
  type: string;
  address: string | null;
  city: string | null;
  stateRegion: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  latitude: number | null;
  longitude: number | null;
  brandsSold: string[];
  brandsServiced: string[];
  agencies: string[];
  description: string | null;
  createdAt: string;
}

// ── Row types (snake_case from Supabase) ──────────────────────────────────────

interface ClassRow {
  id: string; title: string; agency: string | null; cert_level: string | null;
  instructor_name: string | null; dive_center_name: string | null;
  location_text: string | null; latitude: number | null; longitude: number | null;
  start_date: string | null; end_date: string | null;
  price_usd: number | null; max_students: number | null; spots_remaining: number | null;
  description: string | null; prerequisites: string | null;
  contact_email: string | null; contact_phone: string | null; created_at: string;
}

interface TripRow {
  id: string; title: string; destination: string;
  organizer_name: string | null; organizer_type: string | null;
  location_text: string | null; latitude: number | null; longitude: number | null;
  start_date: string | null; end_date: string | null;
  price_usd: number | null; spots_total: number | null; spots_remaining: number | null;
  description: string | null; includes: string | null; required_cert: string | null;
  contact_email: string | null; contact_phone: string | null; created_at: string;
}

interface EnrollmentRow {
  id: string;
  class_id: string;
  student_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  enrolled_at: string;
  profiles?: { display_name: string | null } | null;
  auth_users_email?: string | null;
}

interface CenterRow {
  id: string; name: string; type: string;
  address: string | null; city: string | null; state_region: string | null; country: string | null;
  phone: string | null; email: string | null; website: string | null;
  latitude: number | null; longitude: number | null;
  brands_sold_json: string | null; brands_serviced_json: string | null; agencies_json: string | null;
  description: string | null; created_at: string;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function rowToClass(r: ClassRow): CommunityClass {
  return {
    id: r.id, title: r.title, agency: r.agency, certLevel: r.cert_level,
    instructorName: r.instructor_name, diveCenterName: r.dive_center_name,
    locationText: r.location_text, latitude: r.latitude, longitude: r.longitude,
    startDate: r.start_date, endDate: r.end_date,
    priceUsd: r.price_usd, maxStudents: r.max_students, spotsRemaining: r.spots_remaining,
    description: r.description, prerequisites: r.prerequisites,
    contactEmail: r.contact_email, contactPhone: r.contact_phone, createdAt: r.created_at,
  };
}

function rowToTrip(r: TripRow): CommunityTrip {
  return {
    id: r.id, title: r.title, destination: r.destination,
    organizerName: r.organizer_name, organizerType: r.organizer_type,
    locationText: r.location_text, latitude: r.latitude, longitude: r.longitude,
    startDate: r.start_date, endDate: r.end_date,
    priceUsd: r.price_usd, spotsTotal: r.spots_total, spotsRemaining: r.spots_remaining,
    description: r.description, includes: r.includes, requiredCert: r.required_cert,
    contactEmail: r.contact_email, contactPhone: r.contact_phone, createdAt: r.created_at,
  };
}

function rowToCenter(r: CenterRow): CommunityDiveCenter {
  let brandsSold: string[] = [];
  let brandsServiced: string[] = [];
  let agencies: string[] = [];
  try { if (r.brands_sold_json) brandsSold = JSON.parse(r.brands_sold_json); } catch {}
  try { if (r.brands_serviced_json) brandsServiced = JSON.parse(r.brands_serviced_json); } catch {}
  try { if (r.agencies_json) agencies = JSON.parse(r.agencies_json); } catch {}
  return {
    id: r.id, name: r.name, type: r.type,
    address: r.address, city: r.city, stateRegion: r.state_region, country: r.country,
    phone: r.phone, email: r.email, website: r.website,
    latitude: r.latitude, longitude: r.longitude,
    brandsSold, brandsServiced, agencies,
    description: r.description, createdAt: r.created_at,
  };
}

// ── Haversine ─────────────────────────────────────────────────────────────────

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Service ───────────────────────────────────────────────────────────────────

export class CommunityService {

  // ── Classes ─────────────────────────────────────────────────────────────────

  async searchClasses(query: string): Promise<CommunityClass[]> {
    const sb = getSupabase();
    const q = query.trim();
    let req = sb.from('community_classes').select('*').eq('is_active', true);
    if (q) {
      req = req.or(
        `title.ilike.%${q}%,agency.ilike.%${q}%,location_text.ilike.%${q}%,instructor_name.ilike.%${q}%,dive_center_name.ilike.%${q}%`
      );
    }
    const { data, error } = await req.order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return (data as ClassRow[]).map(rowToClass);
  }

  async getClassById(id: string): Promise<CommunityClass | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from('community_classes').select('*').eq('id', id).single();
    if (error || !data) return null;
    return rowToClass(data as ClassRow);
  }

  async createClass(
    input: Omit<CommunityClass, 'id' | 'createdAt'>,
    claimCode: string
  ): Promise<CommunityClass> {
    const sb = getSupabase();
    const userId = useAuthStore.getState().user?.id ?? null;
    const { data, error } = await sb.from('community_classes').insert({
      user_id: userId,
      title: input.title, agency: input.agency, cert_level: input.certLevel,
      instructor_name: input.instructorName, dive_center_name: input.diveCenterName,
      location_text: input.locationText, latitude: input.latitude, longitude: input.longitude,
      start_date: input.startDate, end_date: input.endDate,
      price_usd: input.priceUsd, max_students: input.maxStudents, spots_remaining: input.spotsRemaining,
      description: input.description, prerequisites: input.prerequisites,
      contact_email: input.contactEmail, contact_phone: input.contactPhone,
      claim_code: btoa(claimCode),
    }).select().single();
    if (error || !data) throw new Error(error?.message ?? 'Insert failed');
    return rowToClass(data as ClassRow);
  }

  async deleteClass(id: string, claimCode: string): Promise<boolean> {
    const sb = getSupabase();
    const userId = useAuthStore.getState().user?.id;
    // Authenticated owners can delete via RLS (user_id match)
    if (userId) {
      const { error } = await sb.from('community_classes').delete()
        .eq('id', id).eq('user_id', userId);
      if (!error) return true;
    }
    // Fallback: claim code for unauthenticated / legacy posts
    const { data } = await sb.from('community_classes').select('claim_code').eq('id', id).single();
    if (!data) return false;
    if ((data as { claim_code: string }).claim_code !== btoa(claimCode)) return false;
    const { error } = await sb.from('community_classes').delete().eq('id', id);
    return !error;
  }

  // ── Enrollments ──────────────────────────────────────────────────────────────

  async enrollInClass(classId: string): Promise<ClassEnrollment | null> {
    const sb = getSupabase();
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;
    const { data, error } = await sb.from('class_enrollments').insert({
      class_id: classId,
      student_id: userId,
      status: 'pending',
    }).select().single();
    if (error || !data) return null;
    const r = data as EnrollmentRow;
    return {
      id: r.id, classId: r.class_id, studentId: r.student_id,
      studentName: null, studentEmail: null,
      status: r.status, enrolledAt: r.enrolled_at,
    };
  }

  async cancelEnrollment(classId: string): Promise<boolean> {
    const sb = getSupabase();
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return false;
    const { error } = await sb.from('class_enrollments')
      .delete().eq('class_id', classId).eq('student_id', userId);
    return !error;
  }

  async getMyEnrollment(classId: string): Promise<ClassEnrollment | null> {
    const sb = getSupabase();
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;
    const { data, error } = await sb.from('class_enrollments')
      .select('*').eq('class_id', classId).eq('student_id', userId).single();
    if (error || !data) return null;
    const r = data as EnrollmentRow;
    return {
      id: r.id, classId: r.class_id, studentId: r.student_id,
      studentName: null, studentEmail: null,
      status: r.status, enrolledAt: r.enrolled_at,
    };
  }

  async getClassEnrollments(classId: string): Promise<ClassEnrollment[]> {
    const sb = getSupabase();
    const { data, error } = await sb.from('class_enrollments')
      .select('*, profiles(display_name)')
      .eq('class_id', classId)
      .order('enrolled_at', { ascending: true });
    if (error || !data) return [];
    return (data as EnrollmentRow[]).map(r => ({
      id: r.id, classId: r.class_id, studentId: r.student_id,
      studentName: r.profiles?.display_name ?? null,
      studentEmail: null,
      status: r.status, enrolledAt: r.enrolled_at,
    }));
  }

  async updateEnrollmentStatus(
    enrollmentId: string,
    status: 'confirmed' | 'cancelled'
  ): Promise<boolean> {
    const sb = getSupabase();
    const { error } = await sb.from('class_enrollments')
      .update({ status }).eq('id', enrollmentId);
    return !error;
  }

  // ── Trips ────────────────────────────────────────────────────────────────────

  async searchTrips(query: string): Promise<CommunityTrip[]> {
    const sb = getSupabase();
    const q = query.trim();
    let req = sb.from('community_trips').select('*').eq('is_active', true);
    if (q) {
      req = req.or(
        `title.ilike.%${q}%,destination.ilike.%${q}%,location_text.ilike.%${q}%,organizer_name.ilike.%${q}%`
      );
    }
    const { data, error } = await req.order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return (data as TripRow[]).map(rowToTrip);
  }

  async getTripById(id: string): Promise<CommunityTrip | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from('community_trips').select('*').eq('id', id).single();
    if (error || !data) return null;
    return rowToTrip(data as TripRow);
  }

  async createTrip(
    input: Omit<CommunityTrip, 'id' | 'createdAt'>,
    claimCode: string
  ): Promise<CommunityTrip> {
    const sb = getSupabase();
    const userId = useAuthStore.getState().user?.id ?? null;
    const { data, error } = await sb.from('community_trips').insert({
      user_id: userId,
      title: input.title, destination: input.destination,
      organizer_name: input.organizerName, organizer_type: input.organizerType,
      location_text: input.locationText, latitude: input.latitude, longitude: input.longitude,
      start_date: input.startDate, end_date: input.endDate,
      price_usd: input.priceUsd, spots_total: input.spotsTotal, spots_remaining: input.spotsRemaining,
      description: input.description, includes: input.includes, required_cert: input.requiredCert,
      contact_email: input.contactEmail, contact_phone: input.contactPhone,
      claim_code: btoa(claimCode),
    }).select().single();
    if (error || !data) throw new Error(error?.message ?? 'Insert failed');
    return rowToTrip(data as TripRow);
  }

  async deleteTrip(id: string, claimCode: string): Promise<boolean> {
    const sb = getSupabase();
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      const { error } = await sb.from('community_trips').delete()
        .eq('id', id).eq('user_id', userId);
      if (!error) return true;
    }
    const { data } = await sb.from('community_trips').select('claim_code').eq('id', id).single();
    if (!data) return false;
    if ((data as { claim_code: string }).claim_code !== btoa(claimCode)) return false;
    const { error } = await sb.from('community_trips').delete().eq('id', id);
    return !error;
  }

  // ── Dive Centers ─────────────────────────────────────────────────────────────

  async searchCenters(query: string, agencyFilter?: string): Promise<CommunityDiveCenter[]> {
    const sb = getSupabase();
    const q = query.trim();
    let req = sb.from('community_dive_centers').select('*').eq('is_active', true);
    if (q) {
      req = req.or(
        `name.ilike.%${q}%,city.ilike.%${q}%,state_region.ilike.%${q}%,country.ilike.%${q}%,address.ilike.%${q}%`
      );
    }
    if (agencyFilter && agencyFilter !== 'All') {
      req = req.ilike('agencies_json', `%${agencyFilter}%`);
    }
    const { data, error } = await req.order('created_at', { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return (data as CenterRow[]).map(rowToCenter);
  }

  async getCenterById(id: string): Promise<CommunityDiveCenter | null> {
    const sb = getSupabase();
    const { data, error } = await sb.from('community_dive_centers').select('*').eq('id', id).single();
    if (error || !data) return null;
    return rowToCenter(data as CenterRow);
  }

  async createCenter(
    input: Omit<CommunityDiveCenter, 'id' | 'createdAt'>,
    claimCode: string
  ): Promise<CommunityDiveCenter> {
    const sb = getSupabase();
    const userId = useAuthStore.getState().user?.id ?? null;
    const { data, error } = await sb.from('community_dive_centers').insert({
      user_id: userId,
      name: input.name, type: input.type,
      address: input.address, city: input.city, state_region: input.stateRegion, country: input.country,
      phone: input.phone, email: input.email, website: input.website,
      latitude: input.latitude, longitude: input.longitude,
      brands_sold_json: JSON.stringify(input.brandsSold),
      brands_serviced_json: JSON.stringify(input.brandsServiced),
      agencies_json: JSON.stringify(input.agencies),
      description: input.description,
      claim_code: btoa(claimCode),
    }).select().single();
    if (error || !data) throw new Error(error?.message ?? 'Insert failed');
    return rowToCenter(data as CenterRow);
  }

  async deleteCenter(id: string, claimCode: string): Promise<boolean> {
    const sb = getSupabase();
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      const { error } = await sb.from('community_dive_centers').delete()
        .eq('id', id).eq('user_id', userId);
      if (!error) return true;
    }
    const { data } = await sb.from('community_dive_centers').select('claim_code').eq('id', id).single();
    if (!data) return false;
    if ((data as { claim_code: string }).claim_code !== btoa(claimCode)) return false;
    const { error } = await sb.from('community_dive_centers').delete().eq('id', id);
    return !error;
  }
}

export const communityService = new CommunityService();
