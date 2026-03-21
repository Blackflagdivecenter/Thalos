import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextStyle, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CompactBrandHeader } from '@/src/ui/components/BrandHeader';
import { Colors, Spacing, Typography } from '@/src/ui/theme';
import { useDiveStore } from '@/src/stores/diveStore';
import { useUIStore } from '@/src/stores/uiStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiveWithVersion, DiveType } from '@/src/models';

const M_TO_FT = 3.28084;

type Filter = 'all' | DiveType;

function formatDepth(m: number | null, imp: boolean): string {
  if (m == null) return '—';
  return imp ? `${(m * M_TO_FT).toFixed(0)} ft` : `${m.toFixed(1)} m`;
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function LogbookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dives, loadDives } = useDiveStore();
  const { unitSystem } = useUIStore();
  const imp = unitSystem === 'imperial';
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => { loadDives(); }, []);

  const filtered = dives.filter((d) =>
    filter === 'all' || d.diveType === filter
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CompactBrandHeader section="Logbook" />

      {/* BLE download banner */}
      <Pressable style={styles.bleBanner} onPress={() => router.push('/logbook/ble-import')}>
        <Ionicons name="bluetooth-outline" size={16} color={Colors.accentBlue} />
        <Text style={styles.bleBannerText}>Download from Dive Computer</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.accentBlue} />
      </Pressable>

      {/* Toolbar: filters + actions */}
      <View style={styles.toolbar}>
        <View style={styles.filterRow}>
          {(['all', 'RECREATIONAL', 'TRAINING'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterLabel, filter === f && styles.filterLabelActive]}>
                {f === 'all' ? 'All Dives' : f === 'RECREATIONAL' ? 'Recreational' : 'Training'}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.toolbarActions}>
          <Pressable
            onPress={() => router.push('/logbook/import-fit')}
            style={styles.iconBtn}
            hitSlop={8}
          >
            <Ionicons name="download-outline" size={20} color={Colors.accentBlue} />
          </Pressable>
          <Pressable onPress={() => router.push('/logbook/new')} style={styles.addBtn}>
            <Ionicons name="add" size={22} color="#FFF" />
          </Pressable>
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={56} color={Colors.textSecondary} style={styles.emptyIconView} />
          <Text style={styles.emptyTitle}>
            {filter === 'all' ? 'No dives logged yet' : `No ${filter.toLowerCase()} dives`}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'all' ? 'Tap + to record your first dive' : 'Try a different filter'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <DiveRow dive={item} imp={imp} onPress={() => router.push(`/logbook/${item.id}`)} />
          )}
        />
      )}
    </View>
  );
}

function DiveRow({ dive, imp, onPress }: { dive: DiveWithVersion; imp: boolean; onPress: () => void }) {
  const isTraining = dive.diveType === 'TRAINING';
  const isLocked = isTraining && dive.isSignedByInstructor;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Type badge circle */}
      <View style={[styles.typeBadge, isTraining ? styles.typeBadgeTrain : styles.typeBadgeRec]}>
        <Ionicons
          name={isTraining ? 'school' : 'water'}
          size={18}
          color={isTraining ? '#FF9500' : Colors.accentBlue}
        />
      </View>

      {/* Main info */}
      <View style={styles.rowMid}>
        <View style={styles.rowTop}>
          <Text style={styles.diveNum}>#{dive.diveNumber}</Text>
          <Text style={styles.diveSite} numberOfLines={1}>{dive.siteName ?? 'Unknown site'}</Text>
        </View>
        <Text style={styles.diveMeta}>
          {formatDate(dive.date)}
          {dive.maxDepthMeters != null ? `  ·  ${formatDepth(dive.maxDepthMeters, imp)}` : ''}
          {dive.bottomTimeMinutes != null ? `  ·  ${dive.bottomTimeMinutes} min` : ''}
        </Text>
      </View>

      {/* Right badges */}
      <View style={styles.rightBadges}>
        {isLocked && (
          <Ionicons name="lock-closed" size={14} color={Colors.textSecondary} style={styles.lockIcon} />
        )}
        {dive.isSignedByInstructor && (
          <View style={styles.signedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
            <Text style={styles.signedText}>Signed</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  filterRow: { flex: 1, flexDirection: 'row', gap: Spacing.sm },
  filterPill: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: 'transparent',
  },
  filterPillActive: {
    borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlue + '26',
  },
  filterLabel: { ...(Typography.caption1 as TextStyle), fontWeight: '500' as TextStyle['fontWeight'], color: Colors.textSecondary },
  filterLabelActive: { color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  toolbarActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center', justifyContent: 'center',
  },
  bleBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  bleBannerText: { ...Typography.footnote as TextStyle, color: Colors.accentBlue, fontWeight: '600', flex: 1 },
  listContent: { paddingBottom: 120 },
  separator: { height: 1, backgroundColor: Colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  pressed: { opacity: 0.6 },
  typeBadge: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  typeBadgeTrain: { backgroundColor: 'rgba(255,149,0,0.15)' },
  typeBadgeRec:   { backgroundColor: 'rgba(0,122,255,0.15)' },
  rowMid: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 3 },
  diveNum: {
    ...(Typography.subhead as TextStyle),
    fontWeight: '700',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  diveSite: { ...(Typography.subhead as TextStyle), color: Colors.text, flex: 1 },
  diveMeta: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  rightBadges: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockIcon: { marginRight: 2 },
  signedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 9999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(52,199,89,0.15)',
  },
  signedText: { ...(Typography.caption2 as TextStyle), fontWeight: '600', color: Colors.success },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xxxl,
  },
  emptyIconView: { marginBottom: Spacing.md },
  emptyTitle: { ...(Typography.title3 as TextStyle), color: Colors.text, marginBottom: Spacing.sm },
  emptySubtitle: { ...(Typography.body as TextStyle), color: Colors.textSecondary, textAlign: 'center' },
});
