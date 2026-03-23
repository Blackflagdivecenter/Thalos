import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '@/src/db/supabase';

// ── Profile type ──────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  displayName: string | null;
  role: 'diver' | 'instructor';
  certLevel: string | null;
  certAgency: string | null;
  phone: string | null;
  avatarUrl: string | null;
  instructorNumber: string | null;
}

interface ProfileRow {
  id: string;
  display_name: string | null;
  role: 'diver' | 'instructor';
  cert_level: string | null;
  cert_agency: string | null;
  phone: string | null;
  avatar_url: string | null;
  instructor_number: string | null;
}

function rowToProfile(r: ProfileRow): UserProfile {
  return {
    id: r.id,
    displayName: r.display_name,
    role: r.role ?? 'diver',
    certLevel: r.cert_level,
    certAgency: r.cert_agency,
    phone: r.phone,
    avatarUrl: r.avatar_url,
    instructorNumber: r.instructor_number,
  };
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    name: string,
    role: 'diver' | 'instructor',
  ) => Promise<string | null>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<Omit<UserProfile, 'id'>>) => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: false,
  initialized: false,

  // ── Initialize — check for existing session ──────────────────────────────

  initialize: async () => {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;
    set({ session, user, initialized: true });
    if (user) await get().loadProfile();

    // Listen for auth state changes (token refresh, sign out from another tab)
    supabase.auth.onAuthStateChange((_event, newSession) => {
      const newUser = newSession?.user ?? null;
      set({ session: newSession, user: newUser });
      if (newUser) get().loadProfile();
      else set({ profile: null });
    });
  },

  // ── Sign In ──────────────────────────────────────────────────────────────

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return error.message;
      set({ user: data.user, session: data.session });
      await get().loadProfile();
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // ── Sign Up ──────────────────────────────────────────────────────────────

  signUp: async (email, password, name, role) => {
    set({ loading: true });
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name, role },
          emailRedirectTo: 'thalos://auth/confirm',
        },
      });
      if (error) return error.message;
      // Profile created by DB trigger (handle_new_user)
      if (data.session) {
        set({ user: data.user, session: data.session });
        await get().loadProfile();
      }
      return null;
    } finally {
      set({ loading: false });
    }
  },

  // ── Sign Out ─────────────────────────────────────────────────────────────

  signOut: async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null });
  },

  // ── Load Profile ─────────────────────────────────────────────────────────

  loadProfile: async () => {
    const { user } = get();
    if (!user) return;
    const supabase = getSupabase();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) set({ profile: rowToProfile(data as ProfileRow) });
  },

  // ── Update Profile ───────────────────────────────────────────────────────

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return 'Not signed in';
    const supabase = getSupabase();
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.displayName,
        // role is intentionally excluded — set at signup only
        cert_level: updates.certLevel,
        cert_agency: updates.certAgency,
        phone: updates.phone,
        instructor_number: updates.instructorNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    if (error) return error.message;
    await get().loadProfile();
    return null;
  },
}));
