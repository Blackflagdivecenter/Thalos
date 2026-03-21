/**
 * CollabService — Supabase-backed buddy collaboration.
 * All methods are async and require the user to have configured Supabase
 * (EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY in .env).
 */
import { readAsStringAsync, downloadAsync, Paths } from 'expo-file-system';
import { getSupabase } from '@/src/db/supabase';
import { MediaRepository } from '@/src/repositories/MediaRepository';
import { generateId } from '@/src/utils/uuid';
import type { CollabSession, CollabMember, CollabMedia } from '@/src/models';

// ── Row types (Supabase snake_case) ───────────────────────────────────────────

interface SessionRow {
  id: string;
  host_device_id: string;
  host_name: string | null;
  site_name: string | null;
  dive_date: string | null;
  depth_max: number | null;
  bottom_time: number | null;
  created_at: string;
  expires_at: string;
}

interface MemberRow {
  id: string;
  session_id: string;
  device_id: string;
  diver_name: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  facebook_handle: string | null;
  twitter_handle: string | null;
  joined_at: string;
}

interface MediaRow {
  id: string;
  session_id: string;
  uploader_device_id: string;
  uploader_name: string | null;
  storage_path: string;
  media_type: string;
  caption: string | null;
  created_at: string;
}

// ── Mappers ────────────────────────────────────────────────────────────────────

function rowToSession(r: SessionRow): CollabSession {
  return {
    id: r.id, hostDeviceId: r.host_device_id, hostName: r.host_name,
    siteName: r.site_name, diveDate: r.dive_date,
    depthMax: r.depth_max, bottomTime: r.bottom_time,
    createdAt: r.created_at, expiresAt: r.expires_at,
  };
}

function rowToMember(r: MemberRow): CollabMember {
  return {
    id: r.id, sessionId: r.session_id, deviceId: r.device_id,
    diverName: r.diver_name, instagramHandle: r.instagram_handle,
    tiktokHandle: r.tiktok_handle, facebookHandle: r.facebook_handle,
    twitterHandle: r.twitter_handle, joinedAt: r.joined_at,
  };
}

function rowToMedia(r: MediaRow): CollabMedia {
  const sb = getSupabase();
  const { data } = sb.storage.from('collab-media').getPublicUrl(r.storage_path);
  return {
    id: r.id, sessionId: r.session_id,
    uploaderDeviceId: r.uploader_device_id, uploaderName: r.uploader_name,
    storagePath: r.storage_path, publicUrl: data?.publicUrl ?? null,
    mediaType: r.media_type as 'photo' | 'video',
    caption: r.caption, createdAt: r.created_at,
  };
}

// ── Service ────────────────────────────────────────────────────────────────────

export const CollabService = {

  async createSession(info: {
    deviceId: string;
    hostName: string | null;
    siteName: string | null;
    diveDate: string | null;
    depthMax: number | null;
    bottomTime: number | null;
  }): Promise<CollabSession> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('collab_sessions')
      .insert({
        host_device_id: info.deviceId,
        host_name: info.hostName,
        site_name: info.siteName,
        dive_date: info.diveDate,
        depth_max: info.depthMax,
        bottom_time: info.bottomTime,
      })
      .select()
      .single();
    if (error) throw error;
    return rowToSession(data as SessionRow);
  },

  async joinSession(
    sessionId: string,
    deviceId: string,
    diverName: string | null,
    handles: {
      instagram?: string | null;
      tiktok?: string | null;
      facebook?: string | null;
      twitter?: string | null;
    },
  ): Promise<CollabMember> {
    const sb = getSupabase();
    // Upsert — same device can re-join without duplicate
    const { data, error } = await sb
      .from('session_members')
      .upsert({
        session_id: sessionId,
        device_id: deviceId,
        diver_name: diverName,
        instagram_handle: handles.instagram ?? null,
        tiktok_handle: handles.tiktok ?? null,
        facebook_handle: handles.facebook ?? null,
        twitter_handle: handles.twitter ?? null,
      }, { onConflict: 'session_id,device_id' })
      .select()
      .single();
    if (error) throw error;
    return rowToMember(data as MemberRow);
  },

  async getSession(sessionId: string): Promise<CollabSession> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('collab_sessions')
      .select()
      .eq('id', sessionId)
      .single();
    if (error) throw error;
    return rowToSession(data as SessionRow);
  },

  async getMembers(sessionId: string): Promise<CollabMember[]> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('session_members')
      .select()
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true });
    if (error) throw error;
    return (data as MemberRow[]).map(rowToMember);
  },

  async getMedia(sessionId: string): Promise<CollabMedia[]> {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('session_media')
      .select()
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as MediaRow[]).map(rowToMedia);
  },

  /** Upload a local file:// URI to Supabase Storage and insert a session_media row. */
  async uploadMedia(
    sessionId: string,
    localUri: string,
    mediaType: 'photo' | 'video',
    caption: string | null,
    deviceId: string,
    uploaderName: string | null,
    precomputedBase64?: string,
  ): Promise<CollabMedia> {
    const sb = getSupabase();

    // Use pre-computed base64 if provided (avoids ph:// URI issues on iOS), else read from URI
    const b64 = precomputedBase64 ?? await readAsStringAsync(localUri, {
      encoding: 'base64' as const,
    });
    const binaryStr = atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const ext = mediaType === 'video' ? 'mp4' : 'jpg';
    const path = `${sessionId}/${generateId()}.${ext}`;
    const contentType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';

    const { error: uploadError } = await sb.storage
      .from('collab-media')
      .upload(path, bytes, { contentType, upsert: false });
    if (uploadError) throw uploadError;

    const { data, error: insertError } = await sb
      .from('session_media')
      .insert({
        session_id: sessionId,
        uploader_device_id: deviceId,
        uploader_name: uploaderName,
        storage_path: path,
        media_type: mediaType,
        caption,
      })
      .select()
      .single();
    if (insertError) throw insertError;

    return rowToMedia(data as MediaRow);
  },

  /** Download a Supabase storage path to the local cache directory. Returns local file:// URI. */
  async downloadMedia(storagePath: string): Promise<string> {
    const sb = getSupabase();
    const { data } = sb.storage.from('collab-media').getPublicUrl(storagePath);
    if (!data?.publicUrl) throw new Error('Could not get public URL for media');

    const filename = storagePath.split('/').pop() ?? 'media';
    const destUri = `${Paths.cache.uri}collab-${filename}`;
    const { uri } = await downloadAsync(data.publicUrl, destUri);
    return uri;
  },

  /** Save a CollabMedia item to the local logbook for a given dive. */
  async saveToLogbook(media: CollabMedia, diveId: string): Promise<void> {
    const localUri = await CollabService.downloadMedia(media.storagePath);
    MediaRepository.addPhoto(diveId, localUri, media.caption);
  },
};
