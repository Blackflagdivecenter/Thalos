/**
 * NotificationService — in-app notification inbox + push token management.
 */

import { getSupabase } from '@/src/db/supabase';
import { useAuthStore } from '@/src/stores/authStore';
import type { AppNotification } from '@/src/models';

// ── Row type ─────────────────────────────────────────────────────────────────

interface NotificationRow {
  id: string;
  user_id: string;
  from_user_id: string | null;
  type: string;
  title: string;
  body: string | null;
  data_json: string | null;
  is_read: boolean;
  created_at: string;
  from_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

function mapNotification(r: NotificationRow): AppNotification {
  return {
    id: r.id,
    userId: r.user_id,
    fromUserId: r.from_user_id,
    type: r.type as AppNotification['type'],
    title: r.title,
    body: r.body,
    dataJson: r.data_json,
    isRead: r.is_read,
    createdAt: r.created_at,
    fromUserName: r.from_profile?.display_name ?? undefined,
    fromUserAvatarUrl: r.from_profile?.avatar_url ?? undefined,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getMyId(): string {
  const uid = useAuthStore.getState().user?.id;
  if (!uid) throw new Error('Not authenticated');
  return uid;
}

// ── Service ──────────────────────────────────────────────────────────────────

export const NotificationService = {

  /** Fetch notifications for current user (newest first) */
  async getNotifications(limit = 50): Promise<AppNotification[]> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        from_profile:profiles!notifications_from_user_id_fkey(display_name, avatar_url)
      `)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: any) => mapNotification(r));
  },

  /** Get unread count */
  async getUnreadCount(): Promise<number> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('is_read', false);
    if (error) throw new Error(error.message);
    return count ?? 0;
  },

  /** Mark a single notification as read */
  async markRead(notificationId: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw new Error(error.message);
  },

  /** Mark all notifications as read */
  async markAllRead(): Promise<void> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', uid)
      .eq('is_read', false);
    if (error) throw new Error(error.message);
  },

  /** Save the Expo push token to the user's profile */
  async savePushToken(token: string): Promise<void> {
    const supabase = getSupabase();
    const uid = getMyId();
    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', uid);
    if (error) throw new Error(error.message);
  },
};
