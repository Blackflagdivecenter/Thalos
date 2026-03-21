import React, { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useGearStore } from '@/src/stores/gearStore';
import { GEAR_TYPE_MAP, GEAR_CATEGORIES, GEAR_CATEGORY_LABELS } from '@/src/utils/gearUtils';
import type { GearType } from '@/src/models';
import { NO_SERVICE_GEAR_TYPES } from '@/src/models';

// All gear types grouped for the picker
const GROUPED_TYPES: { cat: string; label: string; types: GearType[] }[] = GEAR_CATEGORIES.map(cat => ({
  cat,
  label: GEAR_CATEGORY_LABELS[cat],
  types: (Object.keys(GEAR_TYPE_MAP) as GearType[]).filter(
    t => GEAR_TYPE_MAP[t].category === cat,
  ),
}));

// ── Main ──────────────────────────────────────────────────────────────────────

export default function GearItemNewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { items, createItem, updateItem } = useGearStore();

  // Form state
  const [name,           setName]           = useState('');
  const [brand,          setBrand]          = useState('');
  const [model,          setModel]          = useState('');
  const [gearType,       setGearType]       = useState<GearType>('regulator');
  const [serialNumber,   setSerialNumber]   = useState('');
  const [purchaseDate,   setPurchaseDate]   = useState('');
  const [notes,          setNotes]          = useState('');
  const [reqService,     setReqService]     = useState(true);
  // track whether user manually toggled reqService
  const [serviceManual,  setServiceManual]  = useState(false);

  // Load existing item for edit
  useEffect(() => {
    if (!editId) return;
    const item = items.find(i => i.id === editId);
    if (!item) return;
    setName(item.name);
    setBrand(item.brand ?? '');
    setModel(item.model ?? '');
    setGearType(item.gearType);
    setSerialNumber(item.serialNumber ?? '');
    setPurchaseDate(item.purchaseDate ?? '');
    setNotes(item.notes ?? '');
    setReqService(item.requiresService);
    setServiceManual(true);
  }, [editId]);

  // Auto-derive requiresService from gear type unless manually set
  useEffect(() => {
    if (serviceManual) return;
    setReqService(!NO_SERVICE_GEAR_TYPES.includes(gearType));
  }, [gearType, serviceManual]);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a name for this gear item.');
      return;
    }

    if (editId) {
      updateItem(editId, {
        name:         name.trim(),
        brand:        brand.trim() || null,
        model:        model.trim() || null,
        serialNumber: serialNumber.trim() || null,
        purchaseDate: purchaseDate.trim() || null,
        notes:        notes.trim() || null,
        requiresService: reqService,
      });
    } else {
      createItem({
        name:         name.trim(),
        brand:        brand.trim() || null,
        model:        model.trim() || null,
        gearType,
        serialNumber: serialNumber.trim() || null,
        purchaseDate: purchaseDate.trim() || null,
        notes:        notes.trim() || null,
        requiresService: reqService,
      });
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
        <Text style={styles.title}>{editId ? 'Edit Item' : 'New Gear Item'}</Text>
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
          {/* Basic Info */}
          <SectionLabel label="Item Info" />
          <View style={styles.card}>
            <Field label="Name *" value={name} onChange={setName} placeholder="e.g. Primary Regulator" />
            <Divider />
            <Field label="Brand" value={brand} onChange={setBrand} placeholder="e.g. Scubapro" />
            <Divider />
            <Field label="Model" value={model} onChange={setModel} placeholder="e.g. MK25 EVO" />
          </View>

          {/* Gear Type (only editable on create) */}
          {!editId && (
            <>
              <SectionLabel label="Gear Type" />
              {GROUPED_TYPES.map(({ cat, label: groupLabel, types }) => (
                <View key={cat} style={{ marginBottom: Spacing.sm }}>
                  <Text style={styles.groupLabel}>{groupLabel}</Text>
                  <View style={styles.typeChips}>
                    {types.map(t => {
                      const meta = GEAR_TYPE_MAP[t];
                      const sel  = gearType === t;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => { setGearType(t); setServiceManual(false); }}
                          style={[styles.typeChip, sel && styles.typeChipSel]}
                        >
                          <Ionicons
                            name={meta.icon as any}
                            size={14}
                            color={sel ? Colors.accentBlue : Colors.textSecondary}
                          />
                          <Text style={[styles.typeChipText, sel && styles.typeChipTextSel]}>
                            {meta.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Details */}
          <SectionLabel label="Details" />
          <View style={styles.card}>
            <Field label="Serial Number" value={serialNumber} onChange={setSerialNumber} placeholder="Optional" />
            <Divider />
            <Field label="Purchase Date (YYYY-MM-DD)" value={purchaseDate} onChange={setPurchaseDate} placeholder="e.g. 2023-06-01" keyboardType="numbers-and-punctuation" />
            <Divider />
            <Field label="Notes" value={notes} onChange={setNotes} placeholder="Any notes…" multiline />
          </View>

          {/* Service reminders toggle */}
          <SectionLabel label="Service" />
          <View style={[styles.card, styles.toggleRow]}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Service Reminders</Text>
              <Text style={styles.toggleSub}>
                Alert when 1 year or 100 dives since last service
              </Text>
            </View>
            <Switch
              value={reqService}
              onValueChange={v => { setReqService(v); setServiceManual(true); }}
              trackColor={{ true: Colors.accentBlue }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={sec.label}>{label}</Text>;
}

function Divider() {
  return <View style={sec.divider} />;
}

function Field({
  label, value, onChange, placeholder, keyboardType, multiline,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: TextInput['props']['keyboardType']; multiline?: boolean;
}) {
  return (
    <View style={fld.wrap}>
      <Text style={fld.label}>{label}</Text>
      <TextInput
        style={[fld.input, multiline && fld.multiline]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        scrollEnabled={false}
      />
    </View>
  );
}

const sec = StyleSheet.create({
  label: {
    ...Typography.footnote, color: Colors.textSecondary,
    fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, marginHorizontal: 2,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
});

const fld = StyleSheet.create({
  wrap:      { paddingVertical: Spacing.xs },
  label:     { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 3 },
  input:     { ...Typography.body, color: Colors.text, paddingVertical: Spacing.xs, minHeight: 36 },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.background },
  flex:    { flex: 1 },
  header:  {
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
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  groupLabel: {
    ...Typography.caption1, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 6, marginTop: 2,
  },
  typeChips:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    backgroundColor: 'transparent',
  },
  typeChipSel:     { backgroundColor: Colors.accentBlue + '26', borderColor: Colors.accentBlue },
  typeChipText:    { ...Typography.caption1, color: Colors.textSecondary },
  typeChipTextSel: { color: Colors.accentBlue, fontWeight: '600' as const },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  toggleInfo:  { flex: 1 },
  toggleTitle: { ...Typography.subhead, color: Colors.text, fontWeight: '600' },
  toggleSub:   { ...Typography.footnote, color: Colors.textSecondary, marginTop: 2 },
});
