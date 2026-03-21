import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography, Shadow } from '@/src/ui/theme';
import { BuddyRepository } from '@/src/repositories/BuddyRepository';
import type { BuddyProfile, CreateBuddyInput } from '@/src/models';

// ─── Empty form ────────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateBuddyInput = {
  name: '', email: '', phone: '',
  certLevel: '', certAgency: '', certNumber: '',
  instagram: '', tiktok: '', facebookHandle: '', twitterHandle: '', notes: '',
};

// ─── Buddy Card ────────────────────────────────────────────────────────────────

function BuddyCard({ buddy, onEdit, onDelete }: {
  buddy: BuddyProfile;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = buddy.name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{buddy.name}</Text>
          {buddy.certLevel ? (
            <Text style={styles.cardSub}>{buddy.certLevel}{buddy.certAgency ? ` · ${buddy.certAgency}` : ''}</Text>
          ) : null}
          {buddy.phone ? <Text style={styles.cardContact}>{buddy.phone}</Text> : null}
          {buddy.email ? <Text style={styles.cardContact}>{buddy.email}</Text> : null}
          {buddy.instagram ? <Text style={styles.cardHandle}>@{buddy.instagram}</Text> : null}
        </View>
        <View style={styles.cardActions}>
          <Pressable onPress={onEdit} style={styles.actionBtn}>
            <Text style={styles.actionEdit}>Edit</Text>
          </Pressable>
          <Pressable onPress={onDelete} style={styles.actionBtn}>
            <Text style={styles.actionDelete}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Add / Edit sheet ──────────────────────────────────────────────────────────

function BuddyForm({ initial, onSave, onCancel }: {
  initial: CreateBuddyInput;
  onSave: (input: CreateBuddyInput) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateBuddyInput>(initial);

  function set(key: keyof CreateBuddyInput, val: string) {
    // Strip leading @ from handles
    const cleaned = ['instagram','tiktok','facebookHandle','twitterHandle'].includes(key)
      ? val.replace(/^@+/, '')
      : val;
    setForm(prev => ({ ...prev, [key]: cleaned || null }));
  }

  function handleSave() {
    if (!form.name?.trim()) {
      Alert.alert('Name required', 'Please enter the buddy\'s name.');
      return;
    }
    onSave(form);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.sheet}
    >
      <View style={styles.sheetHandle} />
      <Text style={styles.sheetTitle}>
        {initial.name ? 'Edit Buddy' : 'Add Buddy'}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
        {([
          ['name', 'Name *', 'e.g. Alex Reyes'],
          ['phone', 'Phone', '+1 555 000 0000'],
          ['email', 'Email', 'alex@email.com'],
          ['certLevel', 'Cert Level', 'Open Water, Advanced…'],
          ['certAgency', 'Agency', 'PADI, SSI, NAUI…'],
          ['certNumber', 'Cert Number', 'Optional'],
          ['instagram', 'Instagram', '@handle'],
          ['tiktok', 'TikTok', '@handle'],
          ['facebookHandle', 'Facebook', '@handle or profile name'],
          ['twitterHandle', 'X / Twitter', '@handle'],
          ['notes', 'Notes', 'Any notes about this buddy'],
        ] as [keyof CreateBuddyInput, string, string][]).map(([key, label, placeholder]) => (
          <View key={key} style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>{label}</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder={placeholder}
              placeholderTextColor={Colors.textTertiary}
              value={(form[key] as string) ?? ''}
              onChangeText={v => set(key, v)}
              multiline={key === 'notes'}
              numberOfLines={key === 'notes' ? 3 : 1}
            />
          </View>
        ))}
        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      <View style={styles.sheetBtns}>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function BuddiesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [buddies, setBuddies] = useState<BuddyProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<BuddyProfile | null>(null);

  const loadBuddies = useCallback(() => {
    setBuddies(BuddyRepository.listAll());
  }, []);

  useEffect(() => { loadBuddies(); }, [loadBuddies]);

  function handleSave(input: CreateBuddyInput) {
    if (editTarget) {
      BuddyRepository.update(editTarget.id, input);
    } else {
      BuddyRepository.create(input);
    }
    setShowForm(false);
    setEditTarget(null);
    loadBuddies();
  }

  function handleDelete(buddy: BuddyProfile) {
    Alert.alert(
      'Remove Buddy',
      `Remove ${buddy.name} from your buddy list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => { BuddyRepository.delete(buddy.id); loadBuddies(); },
        },
      ],
    );
  }

  const formInitial = useMemo<CreateBuddyInput>(() =>
    editTarget
      ? {
          name: editTarget.name,
          email: editTarget.email,
          phone: editTarget.phone,
          certLevel: editTarget.certLevel,
          certAgency: editTarget.certAgency,
          certNumber: editTarget.certNumber,
          instagram: editTarget.instagram,
          tiktok: editTarget.tiktok,
          facebookHandle: editTarget.facebookHandle,
          twitterHandle: editTarget.twitterHandle,
          notes: editTarget.notes,
        }
      : EMPTY_FORM,
    [editTarget],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Dive Buddies</Text>
        <Pressable
          onPress={() => { setEditTarget(null); setShowForm(true); }}
          style={styles.addBtn}
        >
          <Text style={styles.addText}>+ Add</Text>
        </Pressable>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {buddies.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🤿</Text>
            <Text style={styles.emptyTitle}>No buddies yet</Text>
            <Text style={styles.emptySub}>
              Add your regular dive buddies to quickly fill them in when logging dives.
            </Text>
            <Pressable
              style={styles.emptyAddBtn}
              onPress={() => { setEditTarget(null); setShowForm(true); }}
            >
              <Text style={styles.emptyAddText}>Add First Buddy</Text>
            </Pressable>
          </View>
        ) : (
          buddies.map(buddy => (
            <BuddyCard
              key={buddy.id}
              buddy={buddy}
              onEdit={() => { setEditTarget(buddy); setShowForm(true); }}
              onDelete={() => handleDelete(buddy)}
            />
          ))
        )}
      </ScrollView>

      {/* Form overlay */}
      {showForm && (
        <View style={styles.overlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => { setShowForm(false); setEditTarget(null); }}
          />
          <BuddyForm
            initial={formInitial}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditTarget(null); }}
          />
        </View>
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
  backBtn: { width: 64 },
  backText: { ...Typography.body, color: Colors.accentBlue },
  title: { ...Typography.headline, color: Colors.text },
  addBtn: { width: 64, alignItems: 'flex-end' },
  addText: { ...Typography.body, color: Colors.accentBlue, fontWeight: '600' },
  list: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...Typography.headline, color: '#FFF' },
  cardInfo: { flex: 1 },
  cardName: { ...Typography.headline, color: Colors.text },
  cardSub: { ...Typography.footnote, color: Colors.accentBlue, marginTop: 1 },
  cardContact: { ...Typography.footnote, color: Colors.textSecondary, marginTop: 1 },
  cardHandle: { ...Typography.footnote, color: Colors.accentBlue, marginTop: 1 },
  cardActions: { gap: 4, alignItems: 'flex-end' },
  actionBtn: { paddingVertical: 2 },
  actionEdit: { ...Typography.footnote, color: Colors.accentBlue, fontWeight: '600' },
  actionDelete: { ...Typography.footnote, color: Colors.emergency },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { ...Typography.title3, color: Colors.text, marginBottom: Spacing.sm },
  emptySub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyAddBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
    ...Shadow.sm,
  },
  emptyAddText: { ...Typography.headline, color: '#FFF' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sheetHandle: {
    width: 40, height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sheetTitle: { ...Typography.title3, color: Colors.text, marginBottom: Spacing.md },
  sheetScroll: { flexGrow: 0 },
  fieldBlock: { marginBottom: Spacing.md },
  fieldLabel: { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 4, fontWeight: '600' },
  fieldInput: {
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  sheetBtns: { flexDirection: 'row', gap: Spacing.md, paddingTop: Spacing.md },
  cancelBtn: {
    flex: 1,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  cancelText: { ...Typography.headline, color: Colors.textSecondary },
  saveBtn: {
    flex: 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    ...Shadow.sm,
  },
  saveText: { ...Typography.headline, color: '#FFF' },
});
