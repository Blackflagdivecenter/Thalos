/**
 * Collab Session Screen
 *
 * Two entry points:
 *   /collab/session?diveId=X      — host: creates a new session from dive data
 *   /collab/session?sessionId=Y   — guest: joins an existing session
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share as RNShare,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import * as Linking from 'expo-linking';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useDiveStore } from '@/src/stores/diveStore';
import { getDb } from '@/src/db/client';
import { BuddyRepository } from '@/src/repositories/BuddyRepository';
import { CollabService } from '@/src/services/CollabService';
import { isSupabaseConfigured } from '@/src/db/supabase';
import type { CollabSession, CollabMember, CollabMedia, BuddyProfile } from '@/src/models';

// ── Helpers ────────────────────────────────────────────────────────────────────

function getDeviceId(): string {
  const row = getDb().getFirstSync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`, ['device_id'],
  );
  return row?.value ?? 'unknown';
}

function getUserName(): string | null {
  const row = getDb().getFirstSync<{ value: string }>(
    `SELECT value FROM app_settings WHERE key = ?`, ['user_name'],
  );
  return row?.value ?? null;
}

function saveUserName(name: string) {
  getDb().runSync(
    `INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`,
    ['user_name', name],
  );
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
}

function fmtJoin(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ── Join Sheet Modal ───────────────────────────────────────────────────────────

function JoinSheet({
  visible,
  onJoin,
  buddySelf,
}: {
  visible: boolean;
  onJoin: (name: string) => void;
  buddySelf: BuddyProfile | null;
}) {
  const [name, setName] = useState(getUserName() ?? buddySelf?.name ?? '');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={joinStyles.backdrop} />
      <View style={joinStyles.sheet}>
        <View style={joinStyles.handle} />
        <Text style={joinStyles.title}>Join Dive Session</Text>
        <Text style={joinStyles.sub}>Enter your name so your dive buddies can identify you.</Text>
        <TextInput
          style={joinStyles.input}
          placeholder="Your name"
          placeholderTextColor={Colors.textTertiary}
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <Pressable
          style={[joinStyles.btn, !name.trim() && joinStyles.btnDisabled]}
          onPress={() => { if (name.trim()) { saveUserName(name.trim()); onJoin(name.trim()); } }}
          disabled={!name.trim()}
        >
          <Text style={joinStyles.btnText}>Join Session</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const joinStyles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: Spacing.lg, paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  title: { ...(Typography.title3 as TextStyle), color: Colors.text, marginBottom: Spacing.xs },
  sub: { ...(Typography.body as TextStyle), color: Colors.textSecondary, marginBottom: Spacing.lg },
  input: {
    ...(Typography.body as TextStyle), color: Colors.text,
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  btn: {
    backgroundColor: Colors.accentBlue, borderRadius: Radius.full,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { ...(Typography.headline as TextStyle), color: '#FFF' },
});

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function CollabSessionScreen() {
  const { diveId, sessionId: incomingSessionId } = useLocalSearchParams<{ diveId?: string; sessionId?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dives } = useDiveStore();

  const isHost = Boolean(diveId && !incomingSessionId);
  const deviceId = getDeviceId();

  const [session, setSession] = useState<CollabSession | null>(null);
  const [members, setMembers] = useState<CollabMember[]>([]);
  const [media, setMedia] = useState<CollabMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dive = dives.find(d => d.id === diveId);
  const selfBuddy: BuddyProfile | null = null; // could look up by name

  const inviteUrl = session
    ? Linking.createURL('collab', { queryParams: { session: session.id } })
    : null;

  const isAlreadyMember = session
    ? members.some(m => m.deviceId === deviceId)
    : false;

  const refresh = useCallback(async (sid: string) => {
    try {
      const [m, med] = await Promise.all([
        CollabService.getMembers(sid),
        CollabService.getMedia(sid),
      ]);
      setMembers(m);
      setMedia(med);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.');
      setLoading(false);
      return;
    }

    async function init() {
      try {
        if (isHost && dive) {
          // Create new session
          const s = await CollabService.createSession({
            deviceId,
            hostName: getUserName(),
            siteName: dive.siteName,
            diveDate: dive.date,
            depthMax: dive.maxDepthMeters,
            bottomTime: dive.bottomTimeMinutes,
          });
          // Join as host automatically
          await CollabService.joinSession(s.id, deviceId, getUserName(), {});
          setSession(s);
          await refresh(s.id);
        } else if (incomingSessionId) {
          const s = await CollabService.getSession(incomingSessionId);
          setSession(s);
          await refresh(s.id);
          // Show join sheet if not already a member
          const mems = await CollabService.getMembers(s.id);
          if (!mems.some(m => m.deviceId === deviceId)) {
            setShowJoin(true);
          }
        }
        setLoading(false);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load session');
        setLoading(false);
      }
    }
    init();
  }, []);

  // Poll for new members + media every 8 seconds
  useEffect(() => {
    if (!session) return;
    pollRef.current = setInterval(() => refresh(session.id), 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [session, refresh]);

  async function handleJoin(name: string) {
    if (!session) return;
    setShowJoin(false);
    try {
      await CollabService.joinSession(session.id, deviceId, name, {});
      await refresh(session.id);
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to join session');
    }
  }

  async function handleUpload() {
    if (!session) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.85,
      base64: true,
    });
    if (result.canceled || !result.assets.length) return;

    setUploading(true);
    try {
      for (const asset of result.assets) {
        const mt: 'photo' | 'video' = asset.type === 'video' ? 'video' : 'photo';
        await CollabService.uploadMedia(session.id, asset.uri, mt, null, deviceId, getUserName(), asset.base64 ?? undefined);
      }
      await refresh(session.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      Alert.alert('Upload failed', msg);
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveToLogbook(item: CollabMedia) {
    if (!diveId) {
      Alert.alert('No dive', 'Open this session from a dive to save media to your logbook.');
      return;
    }
    setSavingId(item.id);
    try {
      await CollabService.saveToLogbook(item, diveId);
      Alert.alert('Saved!', 'Photo saved to your dive logbook.');
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not save media');
    } finally {
      setSavingId(null);
    }
  }

  function handleShareLink() {
    if (!inviteUrl) return;
    RNShare.share({ message: `Join my dive session on Thalos!\n${inviteUrl}` });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Nav */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.navBack}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>Dive Session</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.accentBlue} />
          <Text style={styles.loadingText}>{isHost ? 'Creating session…' : 'Loading session…'}</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle" size={48} color={Colors.emergency} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          {/* QR + invite */}
          {session && (
            <View style={styles.qrCard}>
              <Text style={styles.qrLabel}>Invite Buddies</Text>
              <Text style={styles.qrSub}>Have your dive buddies scan this QR code to join the session</Text>
              <View style={styles.qrBox}>
                <QRCode value={inviteUrl ?? session.id} size={180} />
              </View>
              <Pressable style={styles.shareLink} onPress={handleShareLink}>
                <Ionicons name="share-outline" size={16} color={Colors.accentBlue} />
                <Text style={styles.shareLinkText}>Share invite link</Text>
              </Pressable>
            </View>
          )}

          {/* Session info */}
          {session && (
            <View style={styles.infoCard}>
              {session.siteName ? (
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={14} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>{session.siteName}</Text>
                </View>
              ) : null}
              {session.diveDate ? (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={14} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>
                    {new Date(session.diveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              ) : null}
              {session.depthMax ? (
                <View style={styles.infoRow}>
                  <Ionicons name="arrow-down" size={14} color={Colors.textSecondary} />
                  <Text style={styles.infoText}>{session.depthMax.toFixed(1)}m · {session.bottomTime ?? '?'} min</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Members */}
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          {members.length === 0 ? (
            <Text style={styles.emptyText}>No one has joined yet. Share the QR code above.</Text>
          ) : (
            <View style={styles.membersCard}>
              {members.map((m, i) => (
                <View key={m.id} style={[styles.memberRow, i < members.length - 1 && styles.memberRowBorder]}>
                  <View style={[styles.memberAvatar, m.deviceId === deviceId && styles.memberAvatarSelf]}>
                    <Text style={styles.memberInitials}>{initials(m.diverName ?? '?')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>
                      {m.diverName ?? 'Unknown'}{m.deviceId === deviceId ? ' (you)' : ''}
                    </Text>
                    <Text style={styles.memberTime}>Joined {fmtJoin(m.joinedAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Upload */}
          <View style={styles.uploadRow}>
            <Pressable
              style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
              onPress={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="cloud-upload" size={20} color="#FFF" />
              )}
              <Text style={styles.uploadBtnText}>{uploading ? 'Uploading…' : 'Upload My Photos/Videos'}</Text>
            </Pressable>
          </View>

          {/* Shared media */}
          <Text style={styles.sectionTitle}>Shared Media ({media.length})</Text>
          {media.length === 0 ? (
            <Text style={styles.emptyText}>No media yet. Be the first to upload!</Text>
          ) : (
            <FlatList
              data={media}
              keyExtractor={m => m.id}
              numColumns={3}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.mediaCell}>
                  {item.publicUrl ? (
                    <Image source={{ uri: item.publicUrl }} style={styles.mediaThumb} />
                  ) : (
                    <View style={[styles.mediaThumb, styles.mediaPlaceholder]}>
                      <Ionicons name="image" size={22} color={Colors.textTertiary} />
                    </View>
                  )}
                  {item.mediaType === 'video' && (
                    <View style={styles.videoTag}>
                      <Ionicons name="play" size={12} color="#FFF" />
                    </View>
                  )}
                  <Text style={styles.mediaUploader} numberOfLines={1}>
                    {item.uploaderName ?? 'Unknown'}
                  </Text>
                  <Pressable
                    style={styles.saveBtn}
                    onPress={() => handleSaveToLogbook(item)}
                    disabled={savingId === item.id}
                  >
                    {savingId === item.id ? (
                      <ActivityIndicator size="small" color={Colors.accentBlue} />
                    ) : (
                      <Ionicons name="download" size={14} color={Colors.accentBlue} />
                    )}
                  </Pressable>
                </View>
              )}
            />
          )}
        </ScrollView>
      )}

      {/* Join sheet for guests */}
      {showJoin && (
        <JoinSheet
          visible={showJoin}
          onJoin={handleJoin}
          buddySelf={selfBuddy}
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  navBack: { width: 44, alignItems: 'flex-start', justifyContent: 'center' },
  navTitle: { ...(Typography.headline as TextStyle), color: Colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl, gap: Spacing.md },
  loadingText: { ...(Typography.body as TextStyle), color: Colors.textSecondary },
  errorText: { ...(Typography.body as TextStyle), color: Colors.emergency, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  // QR card
  qrCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.lg, alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  qrLabel: { ...(Typography.headline as TextStyle), color: Colors.text },
  qrSub: { ...(Typography.footnote as TextStyle), color: Colors.textSecondary, textAlign: 'center' },
  qrBox: {
    padding: Spacing.lg, backgroundColor: '#FFF',
    borderRadius: Radius.md, marginVertical: Spacing.md,
  },
  shareLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: Spacing.sm },
  shareLinkText: { ...(Typography.subhead as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  // Info card
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: Spacing.md, gap: 6, borderWidth: 1, borderColor: Colors.border,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { ...(Typography.footnote as TextStyle), color: Colors.textSecondary },
  // Section titles
  sectionTitle: {
    ...(Typography.subhead as TextStyle), fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.text, marginTop: Spacing.sm,
  },
  emptyText: { ...(Typography.footnote as TextStyle), color: Colors.textTertiary, fontStyle: 'italic' },
  // Members
  membersCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  memberRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  memberAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center', justifyContent: 'center',
  },
  memberAvatarSelf: { backgroundColor: Colors.accentBlue + '20' },
  memberInitials: { ...(Typography.subhead as TextStyle), fontWeight: '700' as TextStyle['fontWeight'], color: Colors.accentBlue },
  memberName: { ...(Typography.subhead as TextStyle), color: Colors.text },
  memberTime: { ...(Typography.caption2 as TextStyle), color: Colors.textTertiary },
  // Upload
  uploadRow: { marginTop: Spacing.xs },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: Colors.accentBlue,
    borderRadius: Radius.full, paddingVertical: Spacing.md,
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { ...(Typography.headline as TextStyle), color: '#FFF' },
  // Media grid
  mediaCell: {
    flex: 1/3, padding: 2,
    position: 'relative',
  },
  mediaThumb: {
    aspectRatio: 1, borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceSecondary,
  },
  mediaPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  videoTag: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 4,
    padding: 3,
  },
  mediaUploader: {
    ...(Typography.caption2 as TextStyle), color: Colors.textSecondary,
    marginTop: 2, paddingHorizontal: 2,
  },
  saveBtn: {
    position: 'absolute', bottom: 20, right: 6,
    backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 10,
    padding: 4,
  },
});
