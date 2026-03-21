import { getDb } from '@/src/db/client';
import { generateId, nowISO } from '@/src/utils/uuid';
import type { DiveMedia } from '@/src/models';

interface MediaRow {
  id: string;
  dive_id: string;
  uri: string;
  media_type: string;
  caption: string | null;
  created_at: string;
}

function rowToMedia(r: MediaRow): DiveMedia {
  return {
    id: r.id,
    diveId: r.dive_id,
    uri: r.uri,
    mediaType: r.media_type as DiveMedia['mediaType'],
    caption: r.caption,
    createdAt: r.created_at,
  };
}

export const MediaRepository = {
  /** Generic add — stores any mediaType ('photo' | 'video'). */
  addMedia(
    diveId: string,
    uri: string,
    mediaType: DiveMedia['mediaType'],
    caption?: string | null,
  ): DiveMedia {
    const id = generateId();
    const now = nowISO();
    getDb().runSync(
      `INSERT INTO dive_media (id, dive_id, uri, media_type, caption, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, diveId, uri, mediaType, caption ?? null, now],
    );
    return { id, diveId, uri, mediaType, caption: caption ?? null, createdAt: now };
  },

  /** Convenience wrapper — kept for backwards-compat. */
  addPhoto(diveId: string, uri: string, caption?: string | null): DiveMedia {
    return MediaRepository.addMedia(diveId, uri, 'photo', caption);
  },

  listForDive(diveId: string): DiveMedia[] {
    const rows = getDb().getAllSync<MediaRow>(
      `SELECT * FROM dive_media WHERE dive_id = ? ORDER BY created_at ASC`,
      [diveId],
    );
    return rows.map(rowToMedia);
  },

  delete(id: string): void {
    getDb().runSync(`DELETE FROM dive_media WHERE id = ?`, [id]);
  },
};
