/**
 * Home / Dashboard tab — 6 configurable widgets with layout editor.
 */
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThalosLogo } from '@/src/ui/components/ThalosLogo';
import { Radius, Spacing, Typography, type ColorPalette } from '@/src/ui/theme';
import { useColors } from '@/src/hooks/useColors';
import { useDiveStore } from '@/src/stores/diveStore';
import { useSiteStore } from '@/src/stores/siteStore';
import { useUIStore } from '@/src/stores/uiStore';
import { useFeedStore } from '@/src/stores/feedStore';
import { useAuthStore } from '@/src/stores/authStore';
import { DashboardRepository, DEFAULT_WIDGET_ORDER } from '@/src/repositories/DashboardRepository';
import type { DiveWithVersion, DiveShare } from '@/src/models';

const M_TO_FT    = 3.28084;
const BAR_TO_PSI = 14.5038;
const L_TO_CUFT  = 0.0353147;
const dashRepo   = new DashboardRepository();

// ── Widget metadata ────────────────────────────────────────────────────────────

type WidgetId = 'recentDives' | 'stats' | 'gasConsumption' | 'quickActions' | 'emergency' | 'sites' | 'discover' | 'buddyFeed';

const WIDGET_META: Record<WidgetId, { label: string; icon: string }> = {
  recentDives:    { label: 'Recent Dives',     icon: 'time'        },
  buddyFeed:      { label: 'Buddy Activity',   icon: 'people'      },
  stats:          { label: 'Dive Statistics',  icon: 'bar-chart'   },
  gasConsumption: { label: 'Gas Consumption',  icon: 'speedometer' },
  quickActions:   { label: 'Quick Actions',    icon: 'flash'       },
  emergency:      { label: 'Emergency Access', icon: 'medkit'      },
  sites:          { label: 'Nearby Sites',     icon: 'location'    },
  discover:       { label: 'Discover',         icon: 'globe-outline'},
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDepth(m: number | null, imp: boolean): string {
  if (m == null) return '—';
  return imp ? `${(m * M_TO_FT).toFixed(0)} ft` : `${m.toFixed(1)} m`;
}
function fmtBottomTime(minutes: number): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function computeSACStats(dives: DiveWithVersion[]) {
  const valid = dives.filter(d =>
    d.startPressureBar  != null &&
    d.endPressureBar    != null &&
    d.bottomTimeMinutes != null && d.bottomTimeMinutes > 0 &&
    d.maxDepthMeters    != null && d.maxDepthMeters >= 0 &&
    (d.startPressureBar! - d.endPressureBar!) > 0
  );
  if (valid.length === 0) return { averageSAC: 0, averageRMV: null as number | null, diveCount: 0 };
  let sacSum = 0, rmvSum = 0, rmvCount = 0;
  for (const d of valid) {
    const used    = d.startPressureBar! - d.endPressureBar!;
    const ambient = d.maxDepthMeters! / 10 + 1;
    sacSum += (used / d.bottomTimeMinutes!) / ambient;
    if (d.tankSizeLiters != null && d.tankSizeLiters > 0) {
      rmvSum += (used * d.tankSizeLiters / d.bottomTimeMinutes!) / ambient;
      rmvCount++;
    }
  }
  return {
    averageSAC: sacSum / valid.length,
    averageRMV: rmvCount > 0 ? rmvSum / rmvCount : null,
    diveCount: valid.length,
  };
}

// ── Dashboard screen ───────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const { dives, stats, loadDives } = useDiveStore();
  const { sites, loadSites } = useSiteStore();
  const { unitSystem } = useUIStore();
  const { feed, loadFeed, toggleTap } = useFeedStore();
  const authUser = useAuthStore(s => s.user);
  const imp = unitSystem === 'imperial';

  const [widgetOrder, setWidgetOrder]   = useState<WidgetId[]>(DEFAULT_WIDGET_ORDER as WidgetId[]);
  const [hiddenWidgets, setHiddenWidgets] = useState<WidgetId[]>([]);
  const [showEditor, setShowEditor]     = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadDives();
      loadSites();
      if (authUser) loadFeed();
      const cfg = dashRepo.getConfig();
      // Ensure buddyFeed is in the order (migration for existing users)
      let order = cfg.widgetOrder as WidgetId[];
      if (!order.includes('buddyFeed')) {
        order = ['recentDives', 'buddyFeed', ...order.filter(w => w !== 'recentDives')];
      }
      setWidgetOrder(order);
      setHiddenWidgets(cfg.hiddenWidgets as WidgetId[]);
    }, [])
  );

  const recentDives = dives.slice(0, 5);
  const gasStats    = useMemo(() => computeSACStats(dives), [dives]);
  const visible     = (id: WidgetId) => !hiddenWidgets.includes(id);

  function saveConfig(order: WidgetId[], hidden: WidgetId[]) {
    dashRepo.saveConfig(order, hidden);
    setWidgetOrder(order);
    setHiddenWidgets(hidden);
  }
  function moveWidget(id: WidgetId, dir: -1 | 1) {
    const idx  = widgetOrder.indexOf(id);
    const next = [...widgetOrder];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    saveConfig(next, hiddenWidgets);
  }
  function toggleHide(id: WidgetId) {
    const hidden = hiddenWidgets.includes(id)
      ? hiddenWidgets.filter(w => w !== id)
      : [...hiddenWidgets, id];
    saveConfig(widgetOrder, hidden);
  }

  const sacLabel = imp ? `${(gasStats.averageSAC * BAR_TO_PSI).toFixed(1)} psi/min` : `${gasStats.averageSAC.toFixed(1)} bar/min`;
  const rmvLabel = gasStats.averageRMV != null
    ? imp ? `${(gasStats.averageRMV * L_TO_CUFT).toFixed(2)} cuft/min` : `${gasStats.averageRMV.toFixed(1)} L/min`
    : '—';

  const sacDisplayLabel = imp ? 'Avg SAC (psi/min)' : 'Avg SAC (bar/min)';
  const rmvDisplayLabel = imp ? 'Avg RMV (cuft/min)' : 'Avg RMV (L/min)';

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      {/* ── Brand header ──────────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={s.headerRow}>
          {/* Profile button (left) */}
          <Pressable style={s.headerBtn} onPress={() => router.push('/settings')} hitSlop={8}>
            <Ionicons name="person-circle-outline" size={24} color={colors.textSecondary} />
          </Pressable>

          {/* Brand center */}
          <View style={s.brandCenter}>
            <ThalosLogo size={44} variant="dark" />
            <View style={s.brandText}>
              <Text style={[s.brandName, { color: colors.thalosNavy }]}>THALOS</Text>
              <Text style={[s.brandTagline, { color: colors.textSecondary }]}>Your dive companion</Text>
            </View>
          </View>

          {/* Layout editor button (right) */}
          <Pressable style={s.headerBtn} onPress={() => setShowEditor(true)} hitSlop={8}>
            <Ionicons name="options-outline" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* ── Widgets ────────────────────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {widgetOrder.map(id => {
          if (!visible(id)) return null;
          switch (id) {

            case 'stats':
              return (
                <WidgetCard key={id} colors={colors}>
                  <View style={wc.labelRow}>
                    <Ionicons name="bar-chart" size={16} color={colors.text} />
                    <Text style={[wc.label, { color: colors.text }]}>Statistics</Text>
                  </View>
                  <View style={wc.row3}>
                    <StatItem value={String(stats.totalDives)} label="Total Dives" icon="hashtag" colors={colors} />
                    <StatItem value={fmtBottomTime(stats.totalBottomTimeMinutes)} label="Bottom Time" icon="timer" colors={colors} />
                    <StatItem value={fmtDepth(stats.maxDepthMeters, imp)} label="Max Depth" icon="arrow-down" colors={colors} />
                  </View>
                </WidgetCard>
              );

            case 'gasConsumption':
              return (
                <Pressable
                  key={id}
                  style={({ pressed }) => [wc.card, { opacity: pressed ? 0.85 : 1, overflow: 'hidden' as const }]}
                  onPress={() => router.push('/gas-stats')}
                >
                  <BlurView intensity={80} tint="regular" style={wc.blurFill}>
                    <View style={wc.labelRow}>
                      <Ionicons name="pulse" size={16} color={colors.text} />
                      <Text style={[wc.label, { color: colors.text }]}>Gas Consumption</Text>
                      <View style={{ flex: 1 }} />
                      <Ionicons name="chevron-forward" size={14} color={colors.textSecondary} />
                    </View>
                    {gasStats.diveCount === 0 ? (
                      <Text style={[wc.emptyText, { color: colors.textSecondary }]}>
                        No dives with gas data yet
                      </Text>
                    ) : (
                      <View style={wc.row3}>
                        <GasStatItem value={imp ? `${(gasStats.averageSAC * BAR_TO_PSI).toFixed(1)}` : `${gasStats.averageSAC.toFixed(1)}`} label={sacDisplayLabel} icon="speedometer" colors={colors} />
                        <GasStatItem value={gasStats.averageRMV != null ? (imp ? `${(gasStats.averageRMV * L_TO_CUFT).toFixed(2)}` : `${gasStats.averageRMV.toFixed(1)}`) : '—'} label={rmvDisplayLabel} icon="water" colors={colors} />
                        <GasStatItem value={String(gasStats.diveCount)} label="Dives" icon="git-commit" colors={colors} />
                      </View>
                    )}
                  </BlurView>
                </Pressable>
              );

            case 'recentDives':
              return (
                <WidgetCard key={id} colors={colors}>
                  <View style={wc.labelRow}>
                    <Ionicons name="time" size={16} color={colors.text} />
                    <Text style={[wc.label, { color: colors.text }]}>Recent Dives</Text>
                  </View>
                  {recentDives.length === 0 ? (
                    <Text style={[wc.emptyText, { color: colors.textSecondary }]}>
                      No dives logged yet. Tap + in the Logbook to get started.
                    </Text>
                  ) : (
                    recentDives.map((dive, i) => (
                      <React.Fragment key={dive.id}>
                        {i > 0 && <View style={[wc.divider, { backgroundColor: colors.border }]} />}
                        <Pressable
                          style={({ pressed }) => [wc.diveRow, pressed && { opacity: 0.6 }]}
                          onPress={() => router.push(`/logbook/${dive.id}`)}
                        >
                          <Ionicons
                            name={dive.diveType === 'TRAINING' ? 'school' : 'water'}
                            size={20}
                            color={dive.diveType === 'TRAINING' ? '#FF9500' : '#007AFF'}
                          />
                          <View style={wc.diveInfo}>
                            <Text style={[wc.diveTitle, { color: colors.text }]} numberOfLines={1}>
                              #{dive.diveNumber} — {dive.siteName ?? 'Unknown'}
                            </Text>
                            <Text style={[wc.diveMeta, { color: colors.textSecondary }]}>
                              {fmtDate(dive.date)}
                            </Text>
                          </View>
                          {dive.maxDepthMeters != null && (
                            <Text style={[wc.diveDepth, { color: colors.textSecondary }]}>
                              {fmtDepth(dive.maxDepthMeters, imp)}
                            </Text>
                          )}
                        </Pressable>
                      </React.Fragment>
                    ))
                  )}
                </WidgetCard>
              );

            case 'buddyFeed':
              return (
                <WidgetCard key={id} colors={colors}>
                  <View style={wc.labelRow}>
                    <Ionicons name="people" size={16} color={colors.text} />
                    <Text style={[wc.label, { color: colors.text }]}>Buddy Activity</Text>
                    <View style={{ flex: 1 }} />
                    <Pressable onPress={() => router.push('/social/feed')}>
                      <Text style={{ ...Typography.caption1 as any, color: colors.accentBlue, fontWeight: '600' as any }}>See All</Text>
                    </Pressable>
                  </View>
                  {!authUser ? (
                    <Text style={[wc.emptyText, { color: colors.textSecondary }]}>
                      Sign in to see your dive buddies' activity.
                    </Text>
                  ) : feed.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: Spacing.md }}>
                      <Text style={[wc.emptyText, { color: colors.textSecondary, textAlign: 'center' }]}>
                        No buddy activity yet. Find dive buddies to see their dives here!
                      </Text>
                      <Pressable
                        style={{ marginTop: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                        onPress={() => router.push('/logbook/buddies')}
                      >
                        <Ionicons name="person-add" size={14} color={colors.accentBlue} />
                        <Text style={{ ...Typography.caption1 as any, color: colors.accentBlue, fontWeight: '600' as any }}>Find Buddies</Text>
                      </Pressable>
                    </View>
                  ) : (
                    feed.slice(0, 5).map((share: DiveShare, i: number) => (
                      <React.Fragment key={share.id}>
                        {i > 0 && <View style={[wc.divider, { backgroundColor: colors.border }]} />}
                        <View style={bf.row}>
                          <View style={bf.avatar}>
                            <Text style={bf.avatarText}>
                              {(share.userName ?? '?')[0].toUpperCase()}
                            </Text>
                          </View>
                          <View style={bf.info}>
                            <Text style={[bf.name, { color: colors.text }]} numberOfLines={1}>
                              {share.userName ?? 'Diver'}
                            </Text>
                            <Text style={[bf.meta, { color: colors.textSecondary }]} numberOfLines={1}>
                              {share.siteName ?? 'Unknown site'} · {fmtDepth(share.maxDepthM ?? null, imp)}
                            </Text>
                          </View>
                          <Pressable
                            style={bf.tapBtn}
                            onPress={() => toggleTap(share.id)}
                          >
                            <Ionicons
                              name={share.isTapped ? 'hand-left' : 'hand-left-outline'}
                              size={18}
                              color={share.isTapped ? colors.accentBlue : colors.textSecondary}
                            />
                            {(share.tapCount ?? 0) > 0 && (
                              <Text style={[bf.tapCount, { color: share.isTapped ? colors.accentBlue : colors.textSecondary }]}>
                                {share.tapCount}
                              </Text>
                            )}
                          </Pressable>
                        </View>
                      </React.Fragment>
                    ))
                  )}
                </WidgetCard>
              );

            case 'quickActions':
              return (
                <WidgetCard key={id} colors={colors}>
                  <View style={wc.labelRow}>
                    <Ionicons name="flash" size={16} color={colors.text} />
                    <Text style={[wc.label, { color: colors.text }]}>Quick Actions</Text>
                  </View>
                  <View style={wc.actionsRow}>
                    <QuickAction icon="add-circle" label="Log Dive"  color="#007AFF" colors={colors} onPress={() => router.push('/logbook/new')} />
                    <QuickAction icon="location"   label="Sites"     color="#34C759" colors={colors} onPress={() => router.push('/(tabs)/sites')} />
                    <QuickAction icon="briefcase" label="Gear" color="#8E8E93" colors={colors} onPress={() => router.push('/(tabs)/gear')} />
                  </View>
                </WidgetCard>
              );

            case 'emergency':
              return (
                <Pressable
                  key={id}
                  style={({ pressed }) => [wc.emergencyOuter, pressed && { opacity: 0.9 }]}
                  onPress={() => router.push('/emergency')}
                >
                  <LinearGradient
                    colors={['#FF3B30', 'rgba(255,59,48,0.85)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={wc.emergencyGrad}
                  >
                    <Ionicons name="medical" size={28} color="#fff" />
                    <View style={wc.emergencyText}>
                      <Text style={wc.emergencyTitle}>Emergency Mode</Text>
                      <Text style={wc.emergencySub}>
                        Tap for immediate access to emergency info
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
                  </LinearGradient>
                </Pressable>
              );

            case 'sites':
              return (
                <WidgetCard key={id} colors={colors}>
                  <View style={wc.labelRow}>
                    <Ionicons name="map" size={16} color={colors.text} />
                    <Text style={[wc.label, { color: colors.text }]}>Dive Sites</Text>
                  </View>
                  {sites.length === 0 ? (
                    <Text style={[wc.emptyText, { color: colors.textSecondary }]}>
                      No sites saved yet. Add your favorite dive sites in the Sites tab.
                    </Text>
                  ) : (
                    <View style={wc.sitesRow}>
                      <View style={wc.sitesPin}>
                        <Ionicons name="location" size={24} color="#34C759" />
                      </View>
                      <View>
                        <Text style={[wc.sitesCount, { color: colors.text }]}>
                          {sites.length} site{sites.length !== 1 ? 's' : ''} saved
                        </Text>
                        <Text style={[wc.sitesAvail, { color: colors.textSecondary }]}>
                          Available offline
                        </Text>
                      </View>
                    </View>
                  )}
                </WidgetCard>
              );

            case 'discover':
              return (
                <WidgetCard key={id} colors={colors}>
                  <View style={wc.labelRow}>
                    <Ionicons name="globe-outline" size={16} color={colors.text} />
                    <Text style={[wc.label, { color: colors.text }]}>Discover</Text>
                  </View>
                  <Pressable
                    style={({ pressed }) => [s.discoverRow, pressed && { opacity: 0.6 }]}
                    onPress={() => router.push('/discover/classes')}
                  >
                    <Text style={s.discoverIcon}>🎓</Text>
                    <Text style={[s.discoverLabel, { color: colors.text }]}>Find a Class</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.accentBlue} />
                  </Pressable>
                  <View style={[s.discoverDivider, { backgroundColor: colors.border }]} />
                  <Pressable
                    style={({ pressed }) => [s.discoverRow, pressed && { opacity: 0.6 }]}
                    onPress={() => router.push('/discover/trips')}
                  >
                    <Text style={s.discoverIcon}>✈️</Text>
                    <Text style={[s.discoverLabel, { color: colors.text }]}>Find a Trip</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.accentBlue} />
                  </Pressable>
                  <View style={[s.discoverDivider, { backgroundColor: colors.border }]} />
                  <Pressable
                    style={({ pressed }) => [s.discoverRow, pressed && { opacity: 0.6 }]}
                    onPress={() => router.push('/discover/centers')}
                  >
                    <Text style={s.discoverIcon}>🤿</Text>
                    <Text style={[s.discoverLabel, { color: colors.text }]}>Find a Dive Center</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.accentBlue} />
                  </Pressable>
                  <View style={[s.discoverDivider, { backgroundColor: colors.border }]} />
                  <Pressable
                    style={({ pressed }) => [s.discoverRow, pressed && { opacity: 0.6 }]}
                    onPress={() => router.push('/cert-lookup')}
                  >
                    <Text style={s.discoverIcon}>🔍</Text>
                    <Text style={[s.discoverLabel, { color: colors.text }]}>Verify a Certification</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.accentBlue} />
                  </Pressable>
                </WidgetCard>
              );

            default:
              return null;
          }
        })}
      </ScrollView>

      {/* ── Layout Editor Modal ────────────────────────────────────────────── */}
      <Modal
        visible={showEditor}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditor(false)}
      >
        <DashboardLayoutEditor
          widgetOrder={widgetOrder}
          hiddenWidgets={hiddenWidgets}
          colors={colors}
          onMove={moveWidget}
          onToggle={toggleHide}
          onDone={() => setShowEditor(false)}
        />
      </Modal>
    </View>
  );
}

// ── Widget card wrapper ────────────────────────────────────────────────────────

function WidgetCard({ children, colors }: { children: React.ReactNode; colors: ColorPalette }) {
  return (
    <View style={[wc.card, { overflow: 'hidden' as const }]}>
      <BlurView intensity={80} tint="regular" style={wc.blurFill}>
        {children}
      </BlurView>
    </View>
  );
}

const wc = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,   // 16pt per spec
  },
  blurFill: {
    padding: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  label: {
    ...(Typography.headline as TextStyle),
    fontWeight: '600' as TextStyle['fontWeight'],
  },
  row3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyText: {
    ...(Typography.subhead as TextStyle),
    paddingVertical: Spacing.md,
  },
  divider: { height: 1, marginVertical: Spacing.xs },
  // Recent dives
  diveRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xs },
  diveInfo:  { flex: 1 },
  diveTitle: { ...(Typography.subhead as TextStyle), fontWeight: '600' as TextStyle['fontWeight'] },
  diveMeta:  { ...(Typography.caption1 as TextStyle), marginTop: 1 },
  diveDepth: { ...(Typography.caption1 as TextStyle), fontVariant: ['tabular-nums'] } as TextStyle,
  // Quick actions
  actionsRow: { flexDirection: 'row', gap: Spacing.md },
  // Emergency
  emergencyOuter: { borderRadius: Radius.lg, overflow: 'hidden' as const },
  emergencyGrad:  { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  emergencyText:  { flex: 1 },
  emergencyTitle: { ...(Typography.headline as TextStyle), color: '#fff', fontWeight: '700' as TextStyle['fontWeight'] },
  emergencySub:   { ...(Typography.caption1 as TextStyle), color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  // Sites
  sitesRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xs },
  sitesPin:  {},
  sitesCount: { ...(Typography.subhead as TextStyle), fontWeight: '600' as TextStyle['fontWeight'] },
  sitesAvail: { ...(Typography.caption1 as TextStyle), marginTop: 1 },
});

// ── Buddy feed styles ──────────────────────────────────────────────────────

const bf = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700' as TextStyle['fontWeight'], color: '#FFF' },
  info: { flex: 1 },
  name: { ...(Typography.subhead as TextStyle), fontWeight: '600' as TextStyle['fontWeight'] },
  meta: { ...(Typography.caption1 as TextStyle), marginTop: 1 },
  tapBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 4, paddingVertical: 4 },
  tapCount: { ...(Typography.caption1 as TextStyle), fontWeight: '600' as TextStyle['fontWeight'], fontVariant: ['tabular-nums'] } as TextStyle,
});

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatItem({ value, label, icon, colors }: { value: string; label: string; icon: string; colors: ColorPalette }) {
  return (
    <View style={si.wrap}>
      <Ionicons name={icon as any} size={12} color="#007AFF" />
      <Text style={[si.value, { color: colors.text }]}>{value}</Text>
      <Text style={[si.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}
const si = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', gap: 3 },
  value: { ...(Typography.title3 as TextStyle), fontWeight: '700' as TextStyle['fontWeight'], fontVariant: ['tabular-nums'] } as TextStyle,
  label: { ...(Typography.caption2 as TextStyle), textAlign: 'center' },
});

function GasStatItem({ value, label, icon, colors }: {
  value: string; label: string; icon: string; colors: ColorPalette;
}) {
  return (
    <View style={gi.wrap}>
      <Ionicons name={icon as any} size={12} color={colors.accentBlue} />
      <Text style={[gi.value, { color: colors.text }]}>{value}</Text>
      <Text style={[gi.label, { color: colors.textSecondary }]} numberOfLines={2}>{label}</Text>
    </View>
  );
}
const gi = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', gap: 3 },
  value: { ...(Typography.title3 as TextStyle), fontWeight: '700' as TextStyle['fontWeight'], fontVariant: ['tabular-nums'] } as TextStyle,
  label: { ...(Typography.caption2 as TextStyle), textAlign: 'center' },
});

function QuickAction({ icon, label, color, colors, onPress }: {
  icon: string; label: string; color: string; colors: ColorPalette; onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [qa.wrap, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={[qa.iconWrap, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[qa.label, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}
const qa = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', gap: 6 },
  iconWrap: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...(Typography.caption2 as TextStyle), fontWeight: '600' as TextStyle['fontWeight'], textAlign: 'center' },
});

// ── Dashboard Layout Editor ────────────────────────────────────────────────────

function DashboardLayoutEditor({
  widgetOrder,
  hiddenWidgets,
  colors,
  onMove,
  onToggle,
  onDone,
}: {
  widgetOrder: WidgetId[];
  hiddenWidgets: WidgetId[];
  colors: ColorPalette;
  onMove: (id: WidgetId, dir: -1 | 1) => void;
  onToggle: (id: WidgetId) => void;
  onDone: () => void;
}) {
  const visible  = widgetOrder.filter(id => !hiddenWidgets.includes(id));
  const hidden   = (Object.keys(WIDGET_META) as WidgetId[]).filter(id => hiddenWidgets.includes(id));

  return (
    <View style={[ed.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[ed.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ width: 60 }} />
        <Text style={[ed.title, { color: colors.text }]}>Customize Dashboard</Text>
        <Pressable onPress={onDone} style={ed.doneBtn}>
          <Text style={[ed.doneText, { color: colors.accentBlue }]}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={ed.content}>

        {/* Visible widgets */}
        <Text style={[ed.sectionLabel, { color: colors.textSecondary }]}>Visible Widgets</Text>
        <View style={[ed.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {visible.map((id, idx) => {
            const meta = WIDGET_META[id];
            return (
              <View key={id}>
                {idx > 0 && <View style={[ed.divider, { backgroundColor: colors.border }]} />}
                <View style={ed.row}>
                  <Ionicons name={meta.icon as any} size={20} color={colors.thalosNavy} style={ed.rowIcon} />
                  <Text style={[ed.rowLabel, { color: colors.text }]}>{meta.label}</Text>
                  <View style={ed.rowActions}>
                    <Pressable
                      style={[ed.arrowBtn, idx === 0 && ed.arrowDisabled]}
                      onPress={() => onMove(id, -1)}
                      disabled={idx === 0}
                    >
                      <Ionicons name="chevron-up" size={16} color={idx === 0 ? colors.textTertiary : colors.thalosNavy} />
                    </Pressable>
                    <Pressable
                      style={[ed.arrowBtn, idx === visible.length - 1 && ed.arrowDisabled]}
                      onPress={() => onMove(id, 1)}
                      disabled={idx === visible.length - 1}
                    >
                      <Ionicons name="chevron-down" size={16} color={idx === visible.length - 1 ? colors.textTertiary : colors.thalosNavy} />
                    </Pressable>
                    <Pressable style={ed.arrowBtn} onPress={() => onToggle(id)}>
                      <Ionicons name="eye-off-outline" size={16} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Hidden widgets */}
        {hidden.length > 0 && (
          <>
            <Text style={[ed.sectionLabel, { color: colors.textSecondary, marginTop: Spacing.xl }]}>
              Hidden Widgets
            </Text>
            <View style={[ed.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {hidden.map((id, idx) => {
                const meta = WIDGET_META[id];
                return (
                  <View key={id}>
                    {idx > 0 && <View style={[ed.divider, { backgroundColor: colors.border }]} />}
                    <View style={ed.row}>
                      <Ionicons name={meta.icon as any} size={20} color={colors.textSecondary} style={ed.rowIcon} />
                      <Text style={[ed.rowLabel, { color: colors.textSecondary }]}>{meta.label}</Text>
                      <Pressable style={ed.arrowBtn} onPress={() => onToggle(id)}>
                        <Ionicons name="eye-outline" size={16} color={colors.thalosNavy} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const ed = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title:   { ...(Typography.headline as TextStyle), fontWeight: '600' as TextStyle['fontWeight'] },
  doneBtn: { paddingVertical: Spacing.xs, minWidth: 60, alignItems: 'flex-end' },
  doneText: { ...(Typography.body as TextStyle), fontWeight: '600' as TextStyle['fontWeight'] },
  content: { padding: Spacing.lg },
  sectionLabel: {
    ...(Typography.footnote as TextStyle),
    fontWeight: '700' as TextStyle['fontWeight'],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  section: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden' as const,
  },
  divider: { height: 1, marginLeft: Spacing.lg + 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  rowIcon:    { width: 28 },
  rowLabel:   { ...(Typography.body as TextStyle), flex: 1 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  arrowBtn:   { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  arrowDisabled: { opacity: 0.3 },
});

// ── Root styles ────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: { padding: Spacing.xs, width: 44, alignItems: 'center' },
  brandCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  brandText:   { justifyContent: 'center' },
  brandName:   {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  } as TextStyle,
  brandTagline: {
    ...(Typography.caption2 as TextStyle),
    letterSpacing: 1.2,
    marginTop: 1,
  },
  scroll:  { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  // Discover widget rows
  discoverRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  discoverIcon: { fontSize: 20 },
  discoverLabel: {
    ...(Typography.subhead as TextStyle),
    flex: 1,
  },
  discoverDivider: { height: 1 },
});
