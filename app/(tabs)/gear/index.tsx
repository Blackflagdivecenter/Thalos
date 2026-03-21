import React, { useEffect } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useGearStore } from '@/src/stores/gearStore';
import { getServiceStatus, GEAR_TYPE_MAP, DIVING_TYPE_LABELS, GEAR_CATEGORIES, GEAR_CATEGORY_LABELS } from '@/src/utils/gearUtils';
import type { GearItem, GearSetWithItems } from '@/src/models';

// ── Helpers ────────────────────────────────────────────────────────────────────

function serviceColor(item: GearItem): string | null {
  if (!item.requiresService) return null;
  const s = getServiceStatus(item);
  if (s.isDue)     return Colors.emergency;
  if (s.isWarning) return '#FF9500';
  return null;
}

function setHasServiceAlert(gs: GearSetWithItems): boolean {
  return gs.items.some(item => {
    if (!item.requiresService) return false;
    const s = getServiceStatus(item);
    return s.isDue || s.isWarning;
  });
}

function itemsDueInSet(gs: GearSetWithItems): GearItem[] {
  return gs.items.filter(item => {
    if (!item.requiresService) return false;
    const s = getServiceStatus(item);
    return s.isDue || s.isWarning;
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ServiceAlertBanner({ items }: { items: GearItem[] }) {
  if (items.length === 0) return null;
  const overdue = items.filter(i => getServiceStatus(i).isDue);
  const warning = items.filter(i => !getServiceStatus(i).isDue && getServiceStatus(i).isWarning);
  const lines: string[] = [];
  if (overdue.length > 0) lines.push(`🔴 Overdue: ${overdue.map(i => i.name).join(', ')}`);
  if (warning.length > 0) lines.push(`🟠 Due soon: ${warning.map(i => i.name).join(', ')}`);
  return (
    <View style={banner.root}>
      <Text style={banner.title}>Service Attention Needed</Text>
      {lines.map((l, i) => <Text key={i} style={banner.line}>{l}</Text>)}
    </View>
  );
}

const banner = StyleSheet.create({
  root: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: '#FF950018',
    borderWidth: 1,
    borderColor: '#FF9500',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  title: { ...Typography.subhead, color: '#FF9500', fontWeight: '700', marginBottom: 4 },
  line:  { ...Typography.footnote, color: Colors.text, lineHeight: 20 },
});

function SetCard({ gs, onPress }: { gs: GearSetWithItems; onPress: () => void }) {
  const hasAlert = setHasServiceAlert(gs);
  return (
    <Pressable onPress={onPress} style={sc.card}>
      <View style={sc.header}>
        <View style={sc.headerLeft}>
          <Text style={sc.name}>{gs.name}</Text>
          <View style={sc.pills}>
            <View style={sc.typePill}>
              <Text style={sc.typeText}>{DIVING_TYPE_LABELS[gs.divingType]}</Text>
            </View>
            {gs.isDefault && (
              <View style={sc.defaultPill}>
                <Text style={sc.defaultText}>DEFAULT</Text>
              </View>
            )}
          </View>
        </View>
        {hasAlert && (
          <Ionicons name="warning-outline" size={20} color="#FF9500" />
        )}
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} style={{ marginLeft: 4 }} />
      </View>
      <View style={sc.stats}>
        <Text style={sc.stat}>{gs.items.length} item{gs.items.length !== 1 ? 's' : ''}</Text>
        <Text style={sc.dot}>·</Text>
        <Text style={sc.stat}>{gs.diveCount} dive{gs.diveCount !== 1 ? 's' : ''}</Text>
      </View>
    </Pressable>
  );
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header:     { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  headerLeft: { flex: 1 },
  name:       { ...Typography.headline, color: Colors.text, marginBottom: 4 },
  pills:      { flexDirection: 'row', gap: 6 },
  typePill: {
    borderWidth: 1, borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlue + '26',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
  },
  typeText:  { ...Typography.caption1, color: Colors.accentBlue, fontWeight: '600' },
  defaultPill: {
    borderWidth: 1, borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlue + '26',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
  },
  defaultText: { ...Typography.caption1, color: Colors.accentBlue, fontWeight: '700', letterSpacing: 0.5 },
  stats:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  stat:     { ...Typography.footnote, color: Colors.textSecondary },
  dot:      { ...Typography.footnote, color: Colors.textTertiary },
});

function ItemRow({ item, onPress }: { item: GearItem; onPress: () => void }) {
  const color = serviceColor(item);
  const meta  = GEAR_TYPE_MAP[item.gearType];
  return (
    <Pressable onPress={onPress} style={ir.row}>
      <View style={ir.iconWrap}>
        <Ionicons name={meta.icon as any} size={18} color={Colors.accentBlue} />
      </View>
      <View style={ir.info}>
        <Text style={ir.name}>{item.name}</Text>
        <Text style={ir.sub}>
          {[item.brand, item.model].filter(Boolean).join(' · ') || meta.label}
          {' · '}
          {item.diveCount} dives
        </Text>
      </View>
      {color && <View style={[ir.dot, { backgroundColor: color }]} />}
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

const ir = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 34, height: 34,
    borderRadius: 17,
    backgroundColor: Colors.accentBlue + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  info:  { flex: 1 },
  name:  { ...Typography.subhead, color: Colors.text },
  sub:   { ...Typography.footnote, color: Colors.textSecondary, marginTop: 1 },
  dot:   { width: 8, height: 8, borderRadius: 4 },
});

// ── Main screen ────────────────────────────────────────────────────────────────

export default function GearHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, sets, loadGear } = useGearStore();

  useEffect(() => { loadGear(); }, []);

  // All items due for service (across all items, not just those in sets)
  const allDueItems = items.filter(item => {
    if (!item.requiresService) return false;
    const s = getServiceStatus(item);
    return s.isDue || s.isWarning;
  });

  // Group items by category
  const byCategory = GEAR_CATEGORIES.map(cat => ({
    cat,
    label: GEAR_CATEGORY_LABELS[cat],
    items: items.filter(i => GEAR_TYPE_MAP[i.gearType].category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>MY GEAR</Text>
        <Pressable
          onPress={() => router.push('/gear/set/new')}
          style={styles.newSetBtn}
        >
          <Ionicons name="add" size={16} color={Colors.accentBlue} />
          <Text style={styles.newSetText}>New Set</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Service alert banner */}
        <ServiceAlertBanner items={allDueItems} />

        {/* Gear Sets section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GEAR SETS</Text>
          {sets.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="layers-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No gear sets yet</Text>
              <Pressable onPress={() => router.push('/gear/set/new')} style={styles.emptyBtn}>
                <Text style={styles.emptyBtnText}>Create First Set</Text>
              </Pressable>
            </View>
          ) : (
            sets.map(gs => (
              <SetCard
                key={gs.id}
                gs={gs}
                onPress={() => router.push({ pathname: '/gear/set/[id]', params: { id: gs.id } })}
              />
            ))
          )}
        </View>

        {/* All Gear Items section grouped by category */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>ALL ITEMS</Text>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="briefcase-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No gear items yet</Text>
            </View>
          ) : (
            byCategory.map(({ cat, label, items: catItems }) => (
              <View key={cat} style={styles.categoryGroup}>
                <Text style={styles.categoryLabel}>{label}</Text>
                <View style={styles.categoryCard}>
                  {catItems.map((item, idx) => (
                    <View key={item.id}>
                      <ItemRow
                        item={item}
                        onPress={() => router.push({ pathname: '/gear/item/[id]', params: { id: item.id } })}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB — Add Gear Item */}
      <Pressable
        onPress={() => router.push('/gear/item/new')}
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  newSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentBlue + '18',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  newSetText: { ...Typography.subhead, color: Colors.accentBlue, fontWeight: '600' },
  scroll:  { flex: 1 },
  content: { paddingVertical: Spacing.md },
  section: { marginTop: Spacing.md, paddingHorizontal: Spacing.lg },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    ...Typography.footnote,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  emptyBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  emptyBtnText: { ...Typography.subhead, color: '#FFF', fontWeight: '600' },
  categoryGroup: { marginBottom: Spacing.md },
  categoryLabel: {
    ...Typography.caption1,
    color: Colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  categoryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});
