/**
 * FeedService — social feed, dive sharing, Tank Taps, follows.
 */

import { getSupabase } from '@/src/db/supabase';
import { useAuthStore } from '@/src/stores/authStore';
import type { DiveShare, Follow } from '@/src/models';

// ── Row types ────────────────────────────────────────────────────────────────

interface DiveShareRow {
  id: string;
  user_id: string;
  dive_number: number | null;
  date: string | null;
  site_name: string | null;
  max_depth_m: number | null;
  bottom_time_min: number | null;
  gas_type: string | null;
  water_temp_c: number | null;
  visibility: string | null;
  caption: string | null;
  photo_url: string | null;
  activity_tags: string[] | null;
  created_at: string;
  profile?: {
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
  } | null;
  tap_count?: { count: number }[];
}

function mapShare(r: DiveShareRow, isTapped = false): DiveShare {
  return {
    id: r.id,
    userId: r.user_id,
    diveNumber: r.dive_number,
    date: r.date,
    siteName: r.site_name,
    maxDepthM: r.max_depth_m,
    bottomTimeMin: r.bottom_time_min,
    gasType: r.gas_type,
    waterTempC: r.water_temp_c,
    visibility: r.visibility,
    caption: r.caption,
    photoUrl: r.photo_url,
    activityTags: r.activity_tags ?? [],
    createdAt: r.created_at,
    userName: r.profile?.display_name ?? undefined,
    userHandle: r.profile?.handle ?? undefined,
    userAvatarUrl: r.profile?.avatar_url ?? undefined,
    tapCount: r.tap_count?.[0]?.count ?? 0,
    isTapped,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMyId(): string {
  const uid = useAuthStore.getState().user?.id;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const FeedService = {

  // ─── Feed ──────────────────────────────────────────────────────────────────

  /** Get feed: dive shares from followed users + own shares */
  async getFeed(limit = 30, offset = 0): Promise<DiveShare[]> {
    const supabase = getSupabase();
    const uid = getMyId();

    // Get who I follow
    const { data: followData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', uid);
    const followIds = (followData ?? []).map((f: any) => f.following_id);
    const userIds = [uid, ...followIds];

    // Get shares from those users
    const { data, error } = await supabase
      .from('dive_shares')
      .select(`
        *,
        profile:profiles!dive_shares_user_id_fkey(display_name, handle, avatar_url),
        tap_count:tank_taps(count)
      `)
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);

    // Check which ones I've tapped
    const shareIds = (data ?? []).map((d: any) => d.id);
    const { data: myTaps } = await supabase
      .from('tank_taps')
      .select('dive_share_id')
      .eq('tapper_id', uid)
      .in('dive_share_id', shareIds);
    const tappedSet = new Set((myTaps ?? []).map((t: any) => t.dive_share_id));

    return (data ?? []).map((r: any) => mapShare(r, tappedSet.has(r.id)));
  },

  /** Get the global/explore feed (all public shares) */
  async getExploreFeed(limit = 30, offset = 0): Promise<DiveShare[]> {
    const supabase = getSupabase();
    const uid = useAuthStore.getState().user?.id;

    const { data, error } = await supabase
      .from('dive_shares')
      .select(`
        *,
        profile:profiles!dive_shares_user_id_fkey(display_name, handle, avatar_url),
        tap_count:tank_taps(count)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);

    let tappedSet = new Set<string>();
    if (uid) {
      const shareIds = (data ?? []).map((d: any) => d.id);
      const { data: myTaps } = await supabase
        .from('tank_taps')
        .select('dive_share_id')
        .eq('tapper_id', uid)
        .in('dive_share_id', shareIds);
      tappedSet = new Set((myTaps ?? []).map((t: any) => t.dive_share_id));
    }

    return (data ?? []).map((r: any) => mapShare(r, tappedSet.has(r.id)));
  },

  /** Get a user's shared dives */
  async getUserShares(userId: string, limit = 20): Promise<DiveShare[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('dive_shares')
      .select(`
        *,
        profile:profiles!dive_shares_user_id_fkey(display_name, handle, avatar_url),
        tap_count:tank_taps(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapShare(r));
  },

  // ─── Share a Dive ──────────────────────────────────────────────────────────

  /** Share a dive to the social feed */
  async shareDive(input: {
    diveNumber?: number | null;
    date?: string | null;
    siteName?: string | null;
    maxDepthM?: number | null;
    bottomTimeMin?: number | null;
    gasType?: string | null;
    waterTempC?: number | null;
    visibility?: string | null;
    caption?: string | null;
    photoUrl?: string | null;
    activityTags?: string[];
  }): Promise<DiveShare> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { data, error } = await supabase
      .from('dive_shares')
      .insert({
        user_id: uid,
        dive_number: input.diveNumber ?? null,
        date: input.date ?? null,
        site_name: input.siteName ?? null,
        max_depth_m: input.maxDepthM ?? null,
        bottom_time_min: input.bottomTimeMin ?? null,
        gas_type: input.gasType ?? null,
        water_temp_c: input.waterTempC ?? null,
        visibility: input.visibility ?? null,
        caption: input.caption ?? null,
        photo_url: input.photoUrl ?? null,
        activity_tags: input.activityTags ?? [],
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return mapShare(data as any);
  },

  /** Delete a dive share */
  async deleteShare(shareId: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase.from('dive_shares').delete().eq('id', shareId);
    if (error) throw new Error(error.message);
  },

  // ─── Tank Taps ─────────────────────────────────────────────────────────────

  /** Toggle a Tank Tap on a dive share */
  async toggleTap(diveShareId: string): Promise<boolean> {
    const supabase = getSupabase();
    const uid = getMyId();

    // Check if already tapped
    const { data: existing } = await supabase
      .from('tank_taps')
      .select('id')
      .eq('dive_share_id', diveShareId)
      .eq('tapper_id', uid)
      .maybeSingle();

    if (existing) {
      // Untap
      await supabase.from('tank_taps').delete().eq('id', existing.id);
      return false;
    } else {
      // Tap
      await supabase.from('tank_taps').insert({
        dive_share_id: diveShareId,
        tapper_id: uid,
      });

      // Notify the dive owner
      const { data: share } = await supabase
        .from('dive_shares')
        .select('user_id')
        .eq('id', diveShareId)
        .single();

      if (share && share.user_id !== uid) {
        const profile = useAuthStore.getState().profile;
        await supabase.rpc('create_notification', {
          p_user_id: share.user_id,
          p_from_user: uid,
          p_type: 'tank_tap',
          p_title: `${profile?.displayName ?? 'Someone'} tapped your tank! 🤿`,
          p_body: null,
          p_data_json: JSON.stringify({ diveShareId }),
        });
      }

      return true;
    }
  },

  // ─── Follows ───────────────────────────────────────────────────────────────

  /** Follow a user */
  async follow(targetUserId: string): Promise<void> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { error } = await supabase.from('follows').insert({
      follower_id: uid,
      following_id: targetUserId,
    });
    if (error && !error.message.includes('duplicate')) throw new Error(error.message);

    // Notify
    const profile = useAuthStore.getState().profile;
    await supabase.rpc('create_notification', {
      p_user_id: targetUserId,
      p_from_user: uid,
      p_type: 'follow',
      p_title: `${profile?.displayName ?? 'Someone'} started following you`,
      p_body: null,
      p_data_json: null,
    });
  },

  /** Unfollow a user */
  async unfollow(targetUserId: string): Promise<void> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', uid)
      .eq('following_id', targetUserId);
    if (error) throw new Error(error.message);
  },

  /** Check if I follow someone */
  async isFollowing(targetUserId: string): Promise<boolean> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', uid)
      .eq('following_id', targetUserId)
      .maybeSingle();
    return !!data;
  },

  /** Get follower/following counts for a user */
  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    const supabase = getSupabase();
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);
    return { followers: followers ?? 0, following: following ?? 0 };
  },

  /** Search users (for follow / discover) */
  async searchUsers(query: string): Promise<{
    id: string;
    displayName: string | null;
    handle: string | null;
    avatarUrl: string | null;
    role: string;
    totalDives: number;
  }[]> {
    const supabase = getSupabase();
    const q = `%${query.trim()}%`;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, handle, avatar_url, role, total_dives')
      .or(`display_name.ilike.${q},handle.ilike.${q}`)
      .limit(20);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      displayName: r.display_name,
      handle: r.handle,
      avatarUrl: r.avatar_url,
      role: r.role,
      totalDives: r.total_dives ?? 0,
    }));
  },
};
