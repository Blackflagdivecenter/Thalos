import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadow, Spacing, Typography } from '@/src/ui/theme';
import { MediaRepository } from '@/src/repositories/MediaRepository';
import { generateId } from '@/src/utils/uuid';
import type { DiveMedia } from '@/src/models';

const { width: SCREEN_W } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_W - Spacing.lg * 2 - Spacing.sm * 2) / 3;

// ── Lightbox ───────────────────────────────────────────────────────────────────

function Lightbox({ media, onClose, onDelete }: {
  media: DiveMedia; onClose: () => void; onDelete: () => void;
}) {
  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={lb.root}>
        <Image source={{ uri: media.uri }} style={lb.image} resizeMode="contain" />
        {media.caption ? (
          <View style={lb.captionBar}>
            <Text style={lb.caption}>{media.caption}</Text>
          </View>
        ) : null}
        <View style={lb.toolbar}>
          <Pressable onPress={onDelete} style={lb.deleteBtn}>
            <Text style={lb.deleteText}>🗑  Delete</Text>
          </Pressable>
          <Pressable onPress={onClose} style={lb.closeBtn}>
            <Text style={lb.closeText}>✕  Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const lb = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  image: { flex: 1 },
  captionBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  caption: { ...Typography.body, color: '#FFF', textAlign: 'center' },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  deleteBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.emergency,
  },
  deleteText: { ...Typography.body, color: Colors.emergency },
  closeBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  closeText: { ...Typography.body, color: '#FFF' },
});

// ── Caption modal (photos only) ────────────────────────────────────────────────

function CaptionModal({ uri, onSave, onCancel }: {
  uri: string; onSave: (caption: string) => void; onCancel: () => void;
}) {
  const [caption, setCaption] = useState('');
  return (
    <Modal visible transparent animationType="slide">
      <View style={cm.overlay}>
        <View style={cm.sheet}>
          <Image source={{ uri }} style={cm.preview} resizeMode="cover" />
          <Text style={cm.label}>Add a caption (optional)</Text>
          <TextInput
            style={cm.input}
            placeholder="e.g. Blue hole at 18m…"
            placeholderTextColor={Colors.textTertiary}
            value={caption}
            onChangeText={setCaption}
            autoFocus
          />
          <View style={cm.btns}>
            <Pressable style={cm.skip} onPress={() => onSave('')}>
              <Text style={cm.skipText}>Skip</Text>
            </Pressable>
            <Pressable style={cm.save} onPress={() => onSave(caption)}>
              <Text style={cm.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  preview: { width: '100%', height: 180, borderRadius: Radius.md, marginBottom: Spacing.md },
  label: { ...Typography.subhead, color: Colors.textSecondary, marginBottom: Spacing.sm },
  input: {
    ...Typography.body,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceSecondary,
    marginBottom: Spacing.md,
  },
  btns: { flexDirection: 'row', gap: Spacing.md },
  skip: {
    flex: 1,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipText: { ...Typography.headline, color: Colors.textSecondary },
  save: {
    flex: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  saveText: { ...Typography.headline, color: '#FFF' },
});

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Derives the file extension from any URI, stripping query strings. */
function extFromUri(uri: string): string {
  const base = uri.split('?')[0];
  return base.split('.').pop()?.toLowerCase() ?? 'jpg';
}

/** Copies a picker asset URI into the app's documents directory.
 *  Uses FileSystem.copyAsync (legacy API) which is properly awaitable
 *  and reliable across all Expo SDK versions. */
async function copyToDocuments(
  srcUri: string,
  mediaType: 'photo' | 'video',
): Promise<string> {
  const ext  = extFromUri(srcUri);
  const name = `dive_${mediaType}_${generateId()}.${ext}`;
  const dest = `${FileSystem.documentDirectory}${name}`;
  await FileSystem.copyAsync({ from: srcUri, to: dest });
  return dest;
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function DiveMediaScreen() {
  const { diveId } = useLocalSearchParams<{ diveId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [photos, setPhotos]           = useState<DiveMedia[]>([]);
  const [lightbox, setLightbox]       = useState<DiveMedia | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null); // URI awaiting caption
  const [saving, setSaving]           = useState(false);

  const load = useCallback(() => {
    if (diveId) setPhotos(MediaRepository.listForDive(diveId));
  }, [diveId]);

  useEffect(() => { load(); }, [load]);

  // ── Add media ──────────────────────────────────────────────────────────────

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      allowsMultipleSelection: false,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    if (asset.type === 'video') {
      await saveMedia(asset.uri, 'video', null);
    } else {
      setPendingPhoto(asset.uri);  // show caption modal
    }
  }

  async function takeFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access in Settings.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    if (asset.type === 'video') {
      await saveMedia(asset.uri, 'video', null);
    } else {
      setPendingPhoto(asset.uri);
    }
  }

  async function saveMedia(
    srcUri: string,
    mediaType: 'photo' | 'video',
    caption: string | null,
  ) {
    if (!diveId) return;
    setSaving(true);
    try {
      const destUri = await copyToDocuments(srcUri, mediaType);
      MediaRepository.addMedia(diveId, destUri, mediaType, caption || null);
      setPendingPhoto(null);
      load();
    } catch (err) {
      Alert.alert(
        'Could not save',
        err instanceof Error ? err.message : 'Failed to save media. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  function deletePhoto(photo: DiveMedia) {
    Alert.alert('Delete?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => { MediaRepository.delete(photo.id); setLightbox(null); load(); },
      },
    ]);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Dive Media</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={takeFromCamera} style={styles.iconBtn}>
            <Ionicons name="camera-outline" size={20} color={Colors.accentBlue} />
          </Pressable>
          <Pressable onPress={pickFromLibrary} style={styles.iconBtn}>
            <Ionicons name="images-outline" size={20} color={Colors.accentBlue} />
          </Pressable>
        </View>
      </View>

      {photos.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="camera-outline" size={52} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No media yet</Text>
          <Text style={styles.emptySub}>
            Add photos or videos from your library or record with your camera.
          </Text>
          <View style={styles.emptyBtns}>
            <Pressable style={styles.emptyBtn} onPress={takeFromCamera}>
              <Ionicons name="camera-outline" size={18} color="#FFF" />
              <Text style={styles.emptyBtnText}>Camera</Text>
            </Pressable>
            <Pressable style={styles.emptyBtn} onPress={pickFromLibrary}>
              <Ionicons name="images-outline" size={18} color="#FFF" />
              <Text style={styles.emptyBtnText}>Library</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={p => p.id}
          numColumns={3}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + Spacing.xl }]}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <Pressable onPress={() => setLightbox(item)} style={styles.thumbWrap}>
              <Image source={{ uri: item.uri }} style={styles.thumb} resizeMode="cover" />
              {item.mediaType === 'video' && (
                <View style={styles.videoOverlay}>
                  <Ionicons name="play" size={16} color="#FFF" />
                </View>
              )}
              {item.caption ? (
                <View style={styles.thumbCaptionBar}>
                  <Text style={styles.thumbCaptionText} numberOfLines={1}>{item.caption}</Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}

      {saving && (
        <View style={styles.savingOverlay}>
          <Text style={styles.savingText}>Saving…</Text>
        </View>
      )}

      {lightbox && (
        <Lightbox
          media={lightbox}
          onClose={() => setLightbox(null)}
          onDelete={() => deletePhoto(lightbox)}
        />
      )}

      {pendingPhoto && (
        <CaptionModal
          uri={pendingPhoto}
          onSave={(cap) => saveMedia(pendingPhoto, 'photo', cap)}
          onCancel={() => setPendingPhoto(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backBtn: { width: 60 },
  backText: { ...Typography.body, color: Colors.accentBlue },
  title: { ...Typography.headline, color: Colors.text },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { padding: Spacing.lg },
  row: { gap: Spacing.sm, marginBottom: Spacing.sm },
  thumbWrap: { position: 'relative' },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceSecondary,
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 24, height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbCaptionBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomLeftRadius: Radius.md,
    borderBottomRightRadius: Radius.md,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  thumbCaptionText: { ...Typography.caption1, color: '#FFF', fontSize: 9 },
  savingOverlay: {
    position: 'absolute',
    bottom: 20, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  savingText: { ...Typography.subhead, color: '#FFF' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl * 2,
  },
  emptyTitle: { ...Typography.title3, color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.sm },
  emptySub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  emptyBtns: { flexDirection: 'row', gap: Spacing.md },
  emptyBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentBlue,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  emptyBtnText: { ...Typography.headline, color: '#FFF' },
});
