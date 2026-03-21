import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CYLINDERS,
  Cylinder,
  CylinderCategory,
  cylVolLabel,
} from '@/src/data/cylinders';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';

interface Props {
  value:    Cylinder | null;
  onChange: (c: Cylinder) => void;
  label?:   string;
}

export function CylinderPicker({ value, onChange, label }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger */}
      <View>
        {label != null && <Text style={s.label}>{label}</Text>}
        <Pressable style={s.trigger} onPress={() => setOpen(true)}>
          {value == null ? (
            <Text style={s.placeholder}>Select cylinder…</Text>
          ) : (
            <View style={s.triggerInner}>
              <View style={s.triggerLeft}>
                <Text style={s.triggerName}>{value.name}</Text>
                <Text style={s.triggerSub}>{value.brand ?? ''}</Text>
              </View>
              <View style={s.triggerRight}>
                <Text style={s.triggerVol}>{cylVolLabel(value)}</Text>
                <Text style={s.triggerPres}>{value.workPressBar} bar</Text>
              </View>
            </View>
          )}
          <Text style={s.chevron}>›</Text>
        </Pressable>
      </View>

      {/* Modal */}
      <PickerModal
        visible={open}
        selected={value}
        onSelect={(c) => { onChange(c); setOpen(false); }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function PickerModal({
  visible, selected, onSelect, onClose,
}: {
  visible:  boolean;
  selected: Cylinder | null;
  onSelect: (c: Cylinder) => void;
  onClose:  () => void;
}) {
  const insets = useSafeAreaInsets();
  const [query, setQuery]     = useState('');
  const [cat,   setCat]       = useState<CylinderCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CYLINDERS.filter(c => {
      const matchCat = cat === 'all' || c.category === cat;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.brand ?? '').toLowerCase().includes(q)
      );
    });
  }, [query, cat]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[m.container, { paddingTop: insets.top + Spacing.sm }]}>
        {/* Header */}
        <View style={m.header}>
          <Text style={m.title}>Select Cylinder</Text>
          <Pressable onPress={onClose} style={m.closeBtn}>
            <Text style={m.closeText}>✕</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={m.searchWrap}>
          <TextInput
            style={m.search}
            placeholder="Search cylinders…"
            placeholderTextColor={Colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Category filter */}
        <FlatList
          data={CATEGORY_ORDER}
          keyExtractor={k => k}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={m.catRow}
          renderItem={({ item: k }) => (
            <Pressable
              style={[m.catChip, cat === k && m.catChipActive]}
              onPress={() => setCat(k)}
            >
              <Text style={[m.catLabel, cat === k && m.catLabelActive]}>
                {CATEGORY_LABELS[k]}
              </Text>
            </Pressable>
          )}
        />

        {/* Cylinder list */}
        <FlatList
          data={filtered}
          keyExtractor={c => c.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxxl }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={m.empty}>No cylinders match "{query}"</Text>
          }
          renderItem={({ item: c }) => {
            const sel = selected?.id === c.id;
            return (
              <Pressable
                style={[m.row, sel && m.rowSelected]}
                onPress={() => onSelect(c)}
              >
                <View style={m.rowLeft}>
                  <Text style={[m.rowName, sel && m.rowNameSel]}>{c.name}</Text>
                  {c.brand != null && (
                    <Text style={m.rowBrand}>{c.brand} · {configLabel(c)}</Text>
                  )}
                </View>
                <View style={m.rowRight}>
                  <Text style={[m.rowVol, sel && m.rowVolSel]}>{cylVolLabel(c)}</Text>
                  <Text style={m.rowPres}>{c.workPressBar} bar · {c.material}</Text>
                </View>
                {sel && <Text style={m.check}>✓</Text>}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

function configLabel(c: Cylinder): string {
  if (c.configuration === 'sidemount-pair') return 'Sidemount pair';
  if (c.configuration === 'doubles')        return 'Manifolded twins';
  return 'Single';
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  label: {
    ...Typography.footnote as TextStyle,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(120,120,128,0.12)' : Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  triggerInner: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  triggerLeft:  { flex: 1 },
  triggerRight: { alignItems: 'flex-end' },
  triggerName:  { ...Typography.subhead as TextStyle, color: Colors.text, fontWeight: '600' as const },
  triggerSub:   { ...Typography.caption2 as TextStyle, color: Colors.textSecondary, marginTop: 1 },
  triggerVol:   { ...Typography.caption1 as TextStyle, color: Colors.accentBlue, fontWeight: '600' as const },
  triggerPres:  { ...Typography.caption2 as TextStyle, color: Colors.textSecondary, marginTop: 1 },
  placeholder:  { ...Typography.subhead as TextStyle, color: Colors.textSecondary, flex: 1 },
  chevron: {
    ...Typography.title3 as TextStyle,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    lineHeight: 22,
  },
});

const m = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  title:    { ...Typography.headline as TextStyle, color: Colors.text },
  closeBtn: { padding: Spacing.sm },
  closeText: { ...Typography.body as TextStyle, color: Colors.textSecondary, fontSize: 18 },

  searchWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  search: {
    backgroundColor: Platform.OS === 'ios' ? 'rgba(120,120,128,0.12)' : Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body as TextStyle,
    color: Colors.text,
    height: 40,
  },

  catRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.xs, alignItems: 'center' },
  catChip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'center',
  },
  catChipActive: { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + '18' },
  catLabel:      { ...Typography.caption1 as TextStyle, color: Colors.textSecondary },
  catLabelActive: { fontWeight: '600' as const, color: Colors.accentBlue },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowSelected: { backgroundColor: Colors.accentBlue + '0C' },
  rowLeft:     { flex: 1 },
  rowRight:    { alignItems: 'flex-end', marginLeft: Spacing.sm },
  rowName:     { ...Typography.subhead as TextStyle, color: Colors.text, fontWeight: '500' as const },
  rowNameSel:  { fontWeight: '700' as const, color: Colors.accentBlue },
  rowBrand:    { ...Typography.caption2 as TextStyle, color: Colors.textSecondary, marginTop: 2 },
  rowVol:      { ...Typography.caption1 as TextStyle, color: Colors.textSecondary, fontWeight: '500' as const },
  rowVolSel:   { color: Colors.accentBlue, fontWeight: '600' as const },
  rowPres:     { ...Typography.caption2 as TextStyle, color: Colors.textSecondary, marginTop: 2 },
  check:       { ...Typography.subhead as TextStyle, color: Colors.accentBlue, marginLeft: Spacing.sm },

  empty: {
    ...Typography.body as TextStyle,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: Spacing.xxxl,
  },
});
