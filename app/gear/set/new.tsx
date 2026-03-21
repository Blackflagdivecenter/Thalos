import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useGearStore } from '@/src/stores/gearStore';
import { DIVING_TYPE_LABELS } from '@/src/utils/gearUtils';
import type { DivingType } from '@/src/models';

const DIVING_TYPES: DivingType[] = ['recreational', 'sidemount', 'doubles', 'tech', 'freediving', 'cave'];

export default function GearSetNewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { sets, createSet, updateSet } = useGearStore();

  const [name,       setName]       = useState('');
  const [divingType, setDivingType] = useState<DivingType>('recreational');
  const [isDefault,  setIsDefault]  = useState(false);

  useEffect(() => {
    if (!editId) return;
    const gs = sets.find(s => s.id === editId);
    if (!gs) return;
    setName(gs.name);
    setDivingType(gs.divingType);
    setIsDefault(gs.isDefault);
  }, [editId]);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name for this gear set.');
      return;
    }
    if (editId) {
      updateSet(editId, { name: name.trim(), divingType, isDefault });
    } else {
      createSet({ name: name.trim(), divingType, isDefault });
    }
    router.back();
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>{editId ? 'Edit Set' : 'New Gear Set'}</Text>
        <Pressable onPress={handleSave} style={styles.headerBtn}>
          <Text style={styles.save}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Name */}
          <SectionLabel label="Set Name" />
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rec Setup, Sidemount Config"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
          </View>

          {/* Diving Type */}
          <SectionLabel label="Diving Type" />
          <View style={styles.chipGrid}>
            {DIVING_TYPES.map(dt => {
              const sel = divingType === dt;
              return (
                <Pressable
                  key={dt}
                  onPress={() => setDivingType(dt)}
                  style={[styles.chip, sel && styles.chipSel]}
                >
                  <Text style={[styles.chipText, sel && styles.chipTextSel]}>
                    {DIVING_TYPE_LABELS[dt]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Default toggle */}
          <SectionLabel label="Default" />
          <View style={[styles.card, styles.toggleRow]}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Default set for {DIVING_TYPE_LABELS[divingType]}</Text>
              <Text style={styles.toggleSub}>
                Pre-selects this set when logging dives of this type.
                Replaces any existing default for this diving type.
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ true: Colors.accentBlue }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={sec.label}>{label}</Text>
  );
}

const sec = StyleSheet.create({
  label: {
    ...Typography.footnote, color: Colors.textSecondary,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, marginHorizontal: 2,
  },
});

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  flex:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerBtn: { minWidth: 60 },
  title:     { ...Typography.headline, color: Colors.text },
  cancel:    { ...Typography.body, color: Colors.textSecondary },
  save:      { ...Typography.body, fontWeight: '600', color: Colors.accentBlue, textAlign: 'right' },
  scroll:    { flex: 1 },
  content:   { paddingHorizontal: Spacing.lg },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  fieldLabel: { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 4 },
  input: {
    ...Typography.body, color: Colors.text,
    paddingVertical: Spacing.xs, minHeight: 36,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    backgroundColor: 'transparent',
  },
  chipSel:     { backgroundColor: Colors.accentBlue + '26', borderColor: Colors.accentBlue },
  chipText:    { ...Typography.caption1, color: Colors.textSecondary },
  chipTextSel: { color: Colors.accentBlue, fontWeight: '600' as const },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  toggleInfo: { flex: 1, marginRight: Spacing.md },
  toggleTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
  toggleSub:   { ...Typography.footnote, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
});
