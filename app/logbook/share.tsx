/**
 * /logbook/share?diveId=<id>
 *
 * Two sharing modes:
 *  • "Dive Card"     — branded Thalos stats card (pure design, no photo)
 *  • "Photo + Stats" — user's photo / video thumbnail with stats overlaid
 *                      Strava-style: photo fills frame, dark gradient at
 *                      bottom, key stats + branding burned on top.
 *
 * Both modes: ViewShot captures the rendered preview → JPEG → share sheet.
 * Caption is auto-generated per platform and copied to clipboard.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as ExpoSharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/src/ui/theme';
import { useDiveStore } from '@/src/stores/diveStore';
import { useUIStore } from '@/src/stores/uiStore';
import { MediaRepository } from '@/src/repositories/MediaRepository';
import { BuddyRepository } from '@/src/repositories/BuddyRepository';
import { generateCaption } from '@/src/services/SocialService';
import { DiveShareCard } from '@/src/ui/components/DiveShareCard';
import type { BuddyProfile, DiveMedia, DiveWithVersion, SocialPlatform } from '@/src/models';

// ── Platform config ───────────────────────────────────────────────────────────

interface PlatformCfg {
  id:         SocialPlatform;
  label:      string;
  icon:       keyof typeof Ionicons.glyphMap;
  color:      string;
  charLimit?: number;
}

const PLATFORMS: PlatformCfg[] = [
  { id: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { id: 'tiktok',   label: 'TikTok',    icon: 'musical-notes',  color: '#111111' },
  { id: 'facebook', label: 'Facebook',  icon: 'logo-facebook',  color: '#1877F2' },
  { id: 'twitter',  label: 'X',         icon: 'logo-twitter',   color: '#14171A', charLimit: 280 },
];

// ── Photo + Stats overlay (Strava-style) ─────────────────────────────────────

const M_TO_FT = 3.28084;
function fmtD(m: number | null, imp: boolean) {
  if (m == null) return '';
  return imp ? `${(m * M_TO_FT).toFixed(0)} ft` : `${m.toFixed(1)} m`;
}
function fmtT(c: number | null, imp: boolean) {
  if (c == null) return '';
  return imp ? `${(c * 9 / 5 + 32).toFixed(0)}°F` : `${c.toFixed(1)}°C`;
}

const OVERLAY_SIZE = Dimensions.get('window').width - Spacing.lg * 2;

function PhotoStatsOverlay({
  photo, dive, imp, buddyNames,
}: {
  photo: DiveMedia;
  dive: DiveWithVersion;
  imp: boolean;
  buddyNames: string[];
}) {
  const depth = fmtD(dive.maxDepthMeters, imp);
  const temp  = fmtT(dive.waterTemperatureCelsius, imp);
  const time  = dive.bottomTimeMinutes != null ? `${dive.bottomTimeMinutes} min` : '';
  const gas   = dive.gasType?.toUpperCase() ?? '';
  const site  = dive.siteName ?? 'Open Water';

  const stats = [
    depth && { val: depth,  lbl: 'DEPTH'   },
    time  && { val: time,   lbl: 'TIME'    },
    gas   && { val: gas,    lbl: 'GAS'     },
    temp  && { val: temp,   lbl: 'TEMP'    },
  ].filter(Boolean) as { val: string; lbl: string }[];

  return (
    <View style={ov.card}>
      {/* Photo fills the frame */}
      <Image
        source={{ uri: photo.uri }}
        style={ov.photo}
        resizeMode="cover"
      />

      {/* Cinematic gradient — transparent top → opaque bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.45, 0.72, 1]}
        style={ov.gradient}
      />

      {/* Top branding strip */}
      <View style={ov.topBar}>
        <View style={ov.brandRow}>
          <View style={ov.brandDot} />
          <Text style={ov.brandText}>THALOS</Text>
        </View>
        <View style={ov.diveBadge}>
          <Text style={ov.diveBadgeText}>DIVE #{dive.diveNumber}</Text>
        </View>
      </View>

      {/* Bottom content */}
      <View style={ov.bottom}>
        {/* Site name */}
        <Text style={ov.siteName} numberOfLines={2}>
          {site.toUpperCase()}
        </Text>

        {/* Stats pills row */}
        {stats.length > 0 && (
          <View style={ov.statsRow}>
            {stats.map((st, i) => (
              <React.Fragment key={st.lbl}>
                {i > 0 && <View style={ov.statSep} />}
                <View style={ov.statPill}>
                  <Text style={ov.statVal}>{st.val}</Text>
                  <Text style={ov.statLbl}>{st.lbl}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Footer row: date + buddies */}
        <View style={ov.footerRow}>
          <Text style={ov.dateText}>
            {new Date(dive.date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            }).toUpperCase()}
          </Text>
          {buddyNames.length > 0 && (
            <Text style={ov.buddyText} numberOfLines={1}>
              · with {buddyNames.slice(0, 2).join(', ')}
            </Text>
          )}
        </View>
      </View>

      {/* Bottom accent bar */}
      <View style={ov.accentBar}>
        <View style={[ov.accent, { backgroundColor: '#FA156B', flex: 1 }]} />
        <View style={[ov.accent, { backgroundColor: '#3DBDCB', flex: 2 }]} />
      </View>

      {/* Video badge */}
      {photo.mediaType === 'video' && (
        <View style={ov.videoBadge}>
          <Ionicons name="play" size={10} color="#FFF" />
          <Text style={ov.videoBadgeText}>VIDEO</Text>
        </View>
      )}
    </View>
  );
}

const ov = StyleSheet.create({
  card: {
    width: OVERLAY_SIZE,
    height: OVERLAY_SIZE,
    borderRadius: 16,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  brandDot: {
    width: 5, height: 5, borderRadius: 2.5,
    backgroundColor: '#3DBDCB',
  },
  brandText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 3,
  },
  diveBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  diveBadgeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  // Bottom content
  bottom: {
    position: 'absolute',
    bottom: 28, left: 0, right: 0,
    paddingHorizontal: 18,
  },
  siteName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    marginBottom: 10,
  },
  statPill: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statVal: {
    color: '#3DBDCB',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 19,
  },
  statLbl: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  statSep: {
    width: 1, height: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  buddyText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 9,
    fontWeight: '500',
  },
  accentBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 4,
    flexDirection: 'row',
  },
  accent: { height: '100%' },
  videoBadge: {
    position: 'absolute',
    top: 14, right: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  videoBadgeText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ShareScreen() {
  const { diveId } = useLocalSearchParams<{ diveId: string }>();
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const { dives }  = useDiveStore();
  const { unitSystem } = useUIStore();
  const imp = unitSystem === 'imperial';

  const cardRef = useRef<any>(null);

  const [platform,      setPlatform]      = useState<SocialPlatform>('instagram');
  const [caption,       setCaption]       = useState('');
  const [media,         setMedia]         = useState<DiveMedia[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<DiveMedia | null>(null);
  const [useOwnPhoto,   setUseOwnPhoto]   = useState(false);
  const [buddies,       setBuddies]       = useState<BuddyProfile[]>([]);
  const [sharing,       setSharing]       = useState(false);

  const copiedOpacity = useRef(new Animated.Value(0)).current;
  const [copiedVisible, setCopiedVisible] = useState(false);

  const dive = dives.find(d => d.id === diveId);

  useFocusEffect(useCallback(() => {
    if (!diveId) return;
    const m = MediaRepository.listForDive(diveId);
    const b = BuddyRepository.getBuddiesForDive(diveId);
    setMedia(m);
    setBuddies(b);
    if (m.length > 0) setSelectedPhoto(m[0]);
  }, [diveId]));

  useEffect(() => {
    if (!dive) return;
    setCaption(generateCaption({
      diveNumber:        dive.diveNumber,
      date:              dive.date,
      siteName:          dive.siteName ?? null,
      maxDepthMeters:    dive.maxDepthMeters ?? null,
      bottomTimeMinutes: dive.bottomTimeMinutes ?? null,
      gasType:           dive.gasType ?? null,
      waterTempCelsius:  dive.waterTemperatureCelsius ?? null,
      visibility:        dive.visibility ?? null,
    }, buddies, platform));
  }, [platform, buddies, diveId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ───────────────────────────────────────────────────────────────

  function showCopiedBadge() {
    setCopiedVisible(true);
    Animated.sequence([
      Animated.timing(copiedOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(copiedOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setCopiedVisible(false));
  }

  async function copyCaption() {
    await Clipboard.setStringAsync(caption);
    showCopiedBadge();
  }

  function refreshCaption() {
    if (!dive) return;
    setCaption(generateCaption({
      diveNumber:        dive.diveNumber,
      date:              dive.date,
      siteName:          dive.siteName ?? null,
      maxDepthMeters:    dive.maxDepthMeters ?? null,
      bottomTimeMinutes: dive.bottomTimeMinutes ?? null,
      gasType:           dive.gasType ?? null,
      waterTempCelsius:  dive.waterTemperatureCelsius ?? null,
      visibility:        dive.visibility ?? null,
    }, buddies, platform));
  }

  // ── Share ─────────────────────────────────────────────────────────────────

  async function handleShare() {
    if (!dive) return;
    setSharing(true);
    try {
      await Clipboard.setStringAsync(caption);
      showCopiedBadge();

      // Always capture the ViewShot — works for both Dive Card and
      // Photo+Stats mode (photo rendered as Image inside ViewShot)
      let imageUri: string | null = null;
      try {
        imageUri = (await cardRef.current?.capture?.()) ?? null;
      } catch {
        // capture failed
      }

      const sharingAvailable = await ExpoSharing.isAvailableAsync();

      if (imageUri && sharingAvailable) {
        await ExpoSharing.shareAsync(imageUri, {
          dialogTitle: 'Share your dive',
          mimeType: 'image/jpeg',
          UTI: 'public.jpeg',
        });
      } else {
        await Share.share({ message: caption });
      }
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : '').toLowerCase();
      if (msg.includes('cancel') || msg.includes('dismiss') || msg.includes('activitytype')) return;
      Alert.alert('Share failed', err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSharing(false);
    }
  }

  // ── Early return ──────────────────────────────────────────────────────────

  if (!dive) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Text style={styles.errText}>Dive not found.</Text>
      </View>
    );
  }

  const cfg       = PLATFORMS.find(p => p.id === platform)!;
  const charCount = caption.length;
  const charLimit = cfg.charLimit;
  const charOver  = charLimit != null && charCount > charLimit;

  const showingOverlay = useOwnPhoto && selectedPhoto != null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* Navbar */}
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.navClose} hitSlop={8}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.navTitle}>Share Dive</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Preview (captured by ViewShot) ──────────────────────────── */}
        <View style={styles.previewOuter}>
          <View style={styles.previewShadow}>
            <ViewShot ref={cardRef} options={{ format: 'jpg', quality: 0.95 }}>
              {showingOverlay ? (
                <PhotoStatsOverlay
                  photo={selectedPhoto}
                  dive={dive}
                  imp={imp}
                  buddyNames={buddies.map(b => b.name)}
                />
              ) : (
                <DiveShareCard
                  diveNumber={dive.diveNumber}
                  date={dive.date}
                  siteName={dive.siteName ?? null}
                  maxDepthMeters={dive.maxDepthMeters ?? null}
                  bottomTimeMinutes={dive.bottomTimeMinutes ?? null}
                  gasType={dive.gasType ?? null}
                  waterTempCelsius={dive.waterTemperatureCelsius ?? null}
                  visibility={dive.visibility ?? null}
                  buddyNames={buddies.map(b => b.name)}
                  imperial={imp}
                />
              )}
            </ViewShot>
          </View>
          <Text style={styles.previewHint}>
            {showingOverlay
              ? 'Stats burned into your photo — ready to post'
              : 'Thalos dive card — great for Stories & feeds'}
          </Text>
        </View>

        {/* ── What to share (only if dive has media) ──────────────────── */}
        {media.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>What to share</Text>
            <View style={styles.sourceToggle}>
              <Pressable
                style={[styles.sourceOption, !useOwnPhoto && styles.sourceOptionActive]}
                onPress={() => setUseOwnPhoto(false)}
              >
                <Ionicons
                  name="albums-outline"
                  size={17}
                  color={!useOwnPhoto ? Colors.accentBlue : Colors.textSecondary}
                />
                <Text style={[styles.sourceLabel, !useOwnPhoto && styles.sourceLabelActive]}>
                  Dive Card
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sourceOption, useOwnPhoto && styles.sourceOptionActive]}
                onPress={() => setUseOwnPhoto(true)}
              >
                <Ionicons
                  name="images-outline"
                  size={17}
                  color={useOwnPhoto ? Colors.accentBlue : Colors.textSecondary}
                />
                <Text style={[styles.sourceLabel, useOwnPhoto && styles.sourceLabelActive]}>
                  Photo + Stats
                </Text>
              </Pressable>
            </View>

            {/* Photo picker — shown when "Photo + Stats" is selected */}
            {useOwnPhoto && (
              <FlatList
                data={media}
                keyExtractor={m => m.id}
                numColumns={3}
                scrollEnabled={false}
                style={styles.photoGrid}
                renderItem={({ item }) => {
                  const sel = selectedPhoto?.id === item.id;
                  return (
                    <Pressable
                      style={[styles.photoCell, !sel && styles.photoCellDim]}
                      onPress={() => setSelectedPhoto(item)}
                    >
                      <Image source={{ uri: item.uri }} style={styles.photoThumb} />
                      {item.mediaType === 'video' && (
                        <View style={styles.videoOverlay}>
                          <Ionicons name="play" size={11} color="#FFF" />
                        </View>
                      )}
                      {sel && (
                        <View style={styles.photoCheck}>
                          <Ionicons name="checkmark-circle" size={22} color={cfg.color} />
                        </View>
                      )}
                    </Pressable>
                  );
                }}
              />
            )}
          </>
        )}

        {/* ── Platform picker ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>Platform</Text>
        <View style={styles.platformRow}>
          {PLATFORMS.map(p => {
            const active = platform === p.id;
            return (
              <Pressable
                key={p.id}
                style={[styles.platformChip, active && { backgroundColor: p.color, borderColor: p.color }]}
                onPress={() => setPlatform(p.id)}
              >
                <Ionicons name={p.icon} size={20} color={active ? '#FFF' : Colors.textSecondary} />
                <Text style={[styles.platformLabel, active && styles.platformLabelOn]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Caption ─────────────────────────────────────────────────── */}
        <View style={styles.captionHeader}>
          <Text style={styles.sectionLabel}>Caption</Text>
          <View style={styles.captionActions}>
            <Pressable onPress={refreshCaption} style={styles.iconAction} hitSlop={8}>
              <Ionicons name="refresh-outline" size={18} color={Colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={copyCaption}
              style={[styles.copyBtn, copiedVisible && styles.copyBtnDone]}
            >
              <Animated.View style={{ opacity: copiedOpacity, position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark" size={13} color={Colors.success} />
                <Text style={styles.copyBtnTextDone}>Copied!</Text>
              </Animated.View>
              <Animated.View style={{ opacity: Animated.subtract(1, copiedOpacity), flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="copy-outline" size={13} color={Colors.accentBlue} />
                <Text style={styles.copyBtnText}>Copy</Text>
              </Animated.View>
            </Pressable>
          </View>
        </View>

        <TextInput
          style={[styles.captionInput, charOver && styles.captionInputOver]}
          value={caption}
          onChangeText={setCaption}
          multiline
          placeholder="Write a caption…"
          placeholderTextColor={Colors.textTertiary}
          textAlignVertical="top"
          scrollEnabled={false}
        />

        {charLimit != null && (
          <Text style={[styles.charCount, charOver && styles.charCountOver]}>
            {charCount} / {charLimit}
          </Text>
        )}

        {/* ── Buddy handles ────────────────────────────────────────────── */}
        {buddies.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Tagged</Text>
            <View style={styles.tagsRow}>
              {buddies.map(b => {
                const handle =
                  platform === 'instagram' ? b.instagram
                  : platform === 'tiktok'   ? b.tiktok
                  : platform === 'facebook' ? b.facebookHandle
                  : b.twitterHandle;
                return (
                  <View key={b.id} style={[styles.tagChip, !handle && styles.tagChipEmpty]}>
                    <Text style={[styles.tagText, !handle && styles.tagTextEmpty]}>
                      {handle ? `@${handle}` : `${b.name} — no ${cfg.label} handle`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.hint}>
          Caption is automatically copied when you tap Share — paste it when creating your post.
        </Text>
      </ScrollView>

      {/* Fixed share button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <Pressable
          style={[styles.shareBtn, { backgroundColor: cfg.color }, sharing && styles.shareBtnBusy]}
          onPress={handleShare}
          disabled={sharing}
        >
          <Ionicons name={cfg.icon} size={20} color="#FFF" />
          <Text style={styles.shareBtnText}>
            {sharing ? 'Preparing…' : `Share to ${cfg.label}`}
          </Text>
        </Pressable>
      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  errText: {
    ...(Typography.body as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },

  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  navClose: { width: 44, alignItems: 'flex-start', justifyContent: 'center' },
  navTitle: { ...(Typography.headline as TextStyle), color: Colors.text },

  scroll:  { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm },

  previewOuter:  { alignItems: 'center', marginBottom: Spacing.xs, gap: Spacing.sm },
  previewShadow: {
    alignSelf: 'stretch', borderRadius: 16, ...Shadow.lg,
  },
  previewHint: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  sectionLabel: {
    ...(Typography.caption1 as TextStyle),
    fontWeight: '600' as TextStyle['fontWeight'],
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.md,
    marginBottom: 6,
  },

  // Source toggle
  sourceToggle: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    padding: 3, gap: 3,
  },
  sourceOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: Radius.sm,
  },
  sourceOptionActive: { backgroundColor: Colors.accentBlue + '14' },
  sourceLabel: { ...(Typography.subhead as TextStyle), color: Colors.textSecondary },
  sourceLabelActive: { color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },

  // Photo grid
  photoGrid: { marginTop: Spacing.xs },
  photoCell: { flex: 1 / 3, aspectRatio: 1, padding: 1.5 },
  photoCellDim: { opacity: 0.4 },
  photoThumb: { flex: 1, borderRadius: Radius.sm },
  videoOverlay: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2,
  },
  photoCheck: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 11,
  },

  // Platforms
  platformRow: { flexDirection: 'row', gap: Spacing.sm },
  platformChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface, gap: 3,
  },
  platformLabel: {
    ...(Typography.caption2 as TextStyle),
    color: Colors.textSecondary,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  platformLabelOn: { color: '#FFF' },

  // Caption
  captionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: Spacing.md, marginBottom: 6,
  },
  captionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconAction:     { padding: 4 },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.accentBlue + '14',
    borderRadius: Radius.sm, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.accentBlue + '30',
    minWidth: 72, justifyContent: 'center',
  },
  copyBtnDone: {
    backgroundColor: Colors.success + '14',
    borderColor: Colors.success + '30',
  },
  copyBtnText: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.accentBlue,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  copyBtnTextDone: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.success,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  captionInput: {
    ...(Typography.body as TextStyle),
    color: Colors.text,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, minHeight: 120, lineHeight: 22,
  },
  captionInputOver: { borderColor: Colors.emergency },
  charCount: {
    ...(Typography.caption2 as TextStyle),
    color: Colors.textTertiary, textAlign: 'right', marginTop: 4,
  },
  charCountOver: { color: Colors.emergency },

  // Buddy tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: {
    backgroundColor: Colors.accentBlue + '14', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.accentBlue + '28',
  },
  tagChipEmpty: { backgroundColor: Colors.surfaceSecondary, borderColor: Colors.border },
  tagText: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.accentBlue,
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  tagTextEmpty: { color: Colors.textTertiary },

  hint: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.textTertiary, textAlign: 'center',
    paddingHorizontal: Spacing.xl, marginTop: Spacing.md, lineHeight: 17,
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
  },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderRadius: Radius.full, paddingVertical: Spacing.md + 3,
  },
  shareBtnBusy: { opacity: 0.65 },
  shareBtnText: { ...(Typography.headline as TextStyle), color: '#FFF' },
});
