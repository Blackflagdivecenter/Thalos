/**
 * Gas Consumption Stats — full SAC/RMV trend view.
 * Route: /gas-stats  (pushed from the Gas Consumption dashboard widget)
 */
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { type ColorPalette, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useColors } from '@/src/hooks/useColors';
import { useUIStore } from '@/src/stores/uiStore';
import { useDiveStore } from '@/src/stores/diveStore';
import { DiveWithVersion } from '@/src/models';
import { SVGLineChart, ChartDataPoint } from '@/src/ui/components/SVGLineChart';

// ── Unit constants ─────────────────────────────────────────────────────────────
const BAR_TO_PSI    = 14.5038;
const L_TO_CUFT     = 0.0353147;

// ── Time range ────────────────────────────────────────────────────────────────
type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'All' | 'Custom';
const TIME_RANGES: TimeRange[] = ['1M', '3M', '6M', '1Y', 'All', 'Custom'];

function rangeStart(range: TimeRange, customStart: Date): Date {
  const now = new Date();
  switch (range) {
    case '1M':  { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
    case '3M':  { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d; }
    case '6M':  { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d; }
    case '1Y':  { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    case 'All': { const d = new Date(now); d.setFullYear(d.getFullYear() - 50); return d; }
    case 'Custom': return customStart;
  }
}

// ── Gas data computation ───────────────────────────────────────────────────────
interface GasDataPoint {
  id: string;
  date: Date;
  sacBar: number;        // SAC rate in bar/min at surface
  rmvLMin: number | undefined;  // RMV in L/min at surface (undefined if no tank size)
}

function computeGasPoints(dives: DiveWithVersion[]): GasDataPoint[] {
  const pts: GasDataPoint[] = [];
  for (const d of dives) {
    if (
      d.startPressureBar  == null ||
      d.endPressureBar    == null ||
      d.bottomTimeMinutes == null || d.bottomTimeMinutes <= 0 ||
      d.maxDepthMeters    == null || d.maxDepthMeters < 0
    ) continue;

    const gasUsed = d.startPressureBar - d.endPressureBar;
    if (gasUsed <= 0) continue;

    const ambient = d.maxDepthMeters / 10 + 1;
    const sacBar  = (gasUsed / d.bottomTimeMinutes) / ambient;

    let rmvLMin: number | undefined;
    if (d.tankSizeLiters != null && d.tankSizeLiters > 0) {
      rmvLMin = (gasUsed * d.tankSizeLiters / d.bottomTimeMinutes) / ambient;
    }

    pts.push({ id: d.id, date: new Date(d.date), sacBar, rmvLMin });
  }
  return pts.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function sacTrend(pts: GasDataPoint[]): number | null {
  if (pts.length < 4) return null;
  const half   = Math.floor(pts.length / 2);
  const first  = avg(pts.slice(0, half).map(p => p.sacBar));
  const second = avg(pts.slice(half).map(p => p.sacBar));
  return second - first;
}

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtSAC(sacBar: number, metric: boolean): string {
  if (sacBar <= 0) return '—';
  return metric
    ? sacBar.toFixed(1)
    : (sacBar * BAR_TO_PSI).toFixed(1);
}
function fmtRMV(rmvL: number | null | undefined, metric: boolean): string {
  if (rmvL == null || rmvL <= 0) return '—';
  return metric
    ? rmvL.toFixed(1)
    : (rmvL * L_TO_CUFT).toFixed(2);
}

function fmtTableDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function GasStatsScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const { unitSystem } = useUIStore();
  const metric = unitSystem === 'metric';

  const { dives } = useDiveStore();

  const [selectedRange, setSelectedRange] = useState<TimeRange>('All');
  const [customStart, setCustomStart] = useState<Date>(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3); return d;
  });
  const [customEnd, setCustomEnd] = useState<Date>(new Date());
  const [showSAC, setShowSAC] = useState(true);
  const [chartWidth, setChartWidth] = useState(0);

  // Filter and compute
  const allPoints = useMemo(() => computeGasPoints(dives), [dives]);

  const filteredPoints = useMemo((): GasDataPoint[] => {
    const start = rangeStart(selectedRange, customStart).getTime();
    const end   = selectedRange === 'Custom' ? customEnd.getTime() : Date.now();
    return allPoints.filter(p => {
      const t = p.date.getTime();
      return t >= start && t <= end;
    });
  }, [allPoints, selectedRange, customStart, customEnd]);

  const averageSAC = useMemo(() => avg(filteredPoints.map(p => p.sacBar)), [filteredPoints]);
  const rmvPts     = useMemo(() => filteredPoints.filter(p => p.rmvLMin != null), [filteredPoints]);
  const averageRMV = useMemo(() => rmvPts.length > 0 ? avg(rmvPts.map(p => p.rmvLMin!)) : null, [rmvPts]);
  const trend      = useMemo(() => sacTrend(filteredPoints), [filteredPoints]);

  const sacUnit = metric ? 'bar/min' : 'psi/min';
  const rmvUnit = metric ? 'L/min'   : 'cuft/min';

  // Trend display
  const trendSymbol = trend == null ? '—' : trend < -0.005 ? '↓' : trend > 0.005 ? '↑' : '→';
  const trendLabel  = trend == null ? 'Need more dives' : trend < -0.005 ? 'Improving' : trend > 0.005 ? 'Increasing' : 'Stable';
  const trendColor  = trend == null ? colors.textTertiary : trend < -0.005 ? colors.success : trend > 0.005 ? colors.warning : '#007AFF';
  const trendIcon   = trend == null ? 'remove' : trend < -0.005 ? 'trending-down' : trend > 0.005 ? 'trending-up' : 'remove';

  // Chart data
  const sacChartData: ChartDataPoint[] = filteredPoints.map(p => ({
    id: p.id,
    date: p.date,
    value: metric ? p.sacBar : p.sacBar * BAR_TO_PSI,
  }));
  const rmvChartData: ChartDataPoint[] = rmvPts.map(p => ({
    id: p.id,
    date: p.date,
    value: metric ? p.rmvLMin! : p.rmvLMin! * L_TO_CUFT,
  }));

  const avgDisplay = showSAC
    ? (metric ? averageSAC : averageSAC * BAR_TO_PSI)
    : averageRMV != null
      ? (metric ? averageRMV : averageRMV * L_TO_CUFT)
      : 0;

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>

      {/* Nav bar */}
      <View style={[s.navbar, { paddingTop: insets.top, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.accentBlue} />
          <Text style={[s.backText, { color: colors.accentBlue }]}>Back</Text>
        </Pressable>
        <Text style={[s.navTitle, { color: colors.text }]}>Gas Consumption</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Section: Summary ──────────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>Averages</Text>
          <Text style={[s.sectionCount, { color: colors.textSecondary }]}>
            {filteredPoints.length} dive{filteredPoints.length !== 1 ? 's' : ''} with gas data
          </Text>
        </View>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.summaryRow}>
            <SummaryCard
              title="Avg SAC"
              value={fmtSAC(averageSAC, metric)}
              unit={sacUnit}
              icon="speedometer"
              color={colors.accentBlue}
              colors={colors}
            />
            <View style={[s.vDivider, { backgroundColor: colors.border }]} />
            <SummaryCard
              title="Avg RMV"
              value={fmtRMV(averageRMV, metric)}
              unit={rmvUnit}
              icon="water"
              color="#2AB6BE"
              colors={colors}
            />
            <View style={[s.vDivider, { backgroundColor: colors.border }]} />
            <SummaryCard
              title="Trend"
              value={trendSymbol}
              unit={trendLabel}
              icon={trendIcon as any}
              color={trendColor}
              colors={colors}
            />
          </View>
        </View>

        {/* ── Section: Time Range ───────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, marginTop: Spacing.xl }]}>
          Time Range
        </Text>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Segmented range picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rangeRow}>
            {TIME_RANGES.map(r => (
              <Pressable
                key={r}
                style={[
                  s.rangeChip,
                  { backgroundColor: selectedRange === r ? colors.thalosNavy : colors.systemGray5 },
                ]}
                onPress={() => setSelectedRange(r)}
              >
                <Text style={[
                  s.rangeChipText,
                  { color: selectedRange === r ? '#fff' : colors.textSecondary },
                ]}>
                  {r}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Custom date inputs */}
          {selectedRange === 'Custom' && (
            <View style={s.customDates}>
              <View style={[s.divider, { backgroundColor: colors.border }]} />
              <View style={s.dateRow}>
                <Text style={[s.dateLabel, { color: colors.textSecondary }]}>From</Text>
                <Pressable
                  style={[s.dateInput, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => {/* date picker placeholder */}}
                >
                  <Text style={[s.dateValue, { color: colors.text }]}>
                    {customStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </Pressable>
              </View>
              <View style={s.dateRow}>
                <Text style={[s.dateLabel, { color: colors.textSecondary }]}>To</Text>
                <Pressable
                  style={[s.dateInput, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => {/* date picker placeholder */}}
                >
                  <Text style={[s.dateValue, { color: colors.text }]}>
                    {customEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* ── Section: Chart ────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary, marginTop: Spacing.xl }]}>
          Trend
        </Text>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* SAC / RMV toggle */}
          <View style={s.chartToggleRow}>
            {(['SAC Rate', 'RMV'] as const).map(label => {
              const active = label === 'SAC Rate' ? showSAC : !showSAC;
              return (
                <Pressable
                  key={label}
                  style={[
                    s.chartToggleChip,
                    { backgroundColor: active ? colors.thalosNavy : colors.systemGray5 },
                  ]}
                  onPress={() => setShowSAC(label === 'SAC Rate')}
                >
                  <Text style={[s.chartToggleText, { color: active ? '#fff' : colors.textSecondary }]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Chart area */}
          <View
            style={s.chartArea}
            onLayout={e => setChartWidth(e.nativeEvent.layout.width)}
          >
            {filteredPoints.length === 0 ? (
              // Empty state
              <View style={s.chartEmpty}>
                <Ionicons name="trending-down" size={36} color={colors.textTertiary} />
                <Text style={[s.chartEmptyTitle, { color: colors.textSecondary }]}>
                  No gas data in this range
                </Text>
                <Text style={[s.chartEmptyBody, { color: colors.textTertiary }]}>
                  Log dives with start/end pressures to see your trend.
                </Text>
              </View>
            ) : showSAC ? (
              chartWidth > 0 && (
                <SVGLineChart
                  data={sacChartData}
                  width={chartWidth}
                  height={220}
                  lineColor={colors.accentBlue}
                  avgValue={avgDisplay > 0 ? avgDisplay : undefined}
                  avgLabel={avgDisplay > 0 ? `Avg: ${fmtSAC(averageSAC, metric)}` : undefined}
                  yAxisLabel={sacUnit}
                />
              )
            ) : (
              // RMV chart
              rmvPts.length === 0 ? (
                <View style={s.chartEmpty}>
                  <Ionicons name="warning" size={28} color={colors.warning} />
                  <Text style={[s.chartEmptyTitle, { color: colors.textSecondary }]}>
                    RMV requires tank size data
                  </Text>
                  <Text style={[s.chartEmptyBody, { color: colors.textTertiary }]}>
                    Add cylinder size to your dive logs to see RMV trends.
                  </Text>
                </View>
              ) : (
                chartWidth > 0 && (
                  <SVGLineChart
                    data={rmvChartData}
                    width={chartWidth}
                    height={220}
                    lineColor="#2AB6BE"
                    avgValue={averageRMV != null && avgDisplay > 0 ? avgDisplay : undefined}
                    avgLabel={averageRMV != null ? `Avg: ${fmtRMV(averageRMV, metric)}` : undefined}
                    yAxisLabel={rmvUnit}
                  />
                )
              )
            )}
          </View>
        </View>

        {/* ── Section: Data Table ───────────────────────────────────────── */}
        {filteredPoints.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { color: colors.textSecondary, marginTop: Spacing.xl }]}>
              Dive Log
            </Text>
            <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[...filteredPoints].reverse().map((pt, i) => (
                <View key={pt.id}>
                  {i > 0 && <View style={[s.divider, { backgroundColor: colors.border }]} />}
                  <View style={s.tableRow}>
                    <Text style={[s.tableDate, { color: colors.text }]}>
                      {fmtTableDate(pt.date)}
                    </Text>
                    <View style={s.tableValues}>
                      <Text style={[s.tableValuePrimary, { color: colors.text }]}>
                        SAC: {fmtSAC(pt.sacBar, metric)} {sacUnit}
                      </Text>
                      {pt.rmvLMin != null && (
                        <Text style={[s.tableValueSecondary, { color: colors.textSecondary }]}>
                          RMV: {fmtRMV(pt.rmvLMin, metric)} {rmvUnit}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────

function SummaryCard({
  title, value, unit, icon, color, colors,
}: {
  title: string; value: string; unit: string; icon: string; color: string; colors: ColorPalette;
}) {
  return (
    <View style={sc.wrap}>
      <Ionicons name={icon as any} size={14} color={color} />
      <Text style={[sc.value, { color: colors.text }]}>{value}</Text>
      <Text style={[sc.title, { color: colors.text }]}>{title}</Text>
      <Text style={[sc.unit, { color: colors.textSecondary }]}>{unit}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, gap: 2 },
  value: { ...(Typography.title3 as TextStyle), fontWeight: '700', fontVariant: ['tabular-nums'] } as TextStyle,
  title: { ...(Typography.caption2 as TextStyle), fontWeight: '700' } as TextStyle,
  unit:  { ...(Typography.caption2 as TextStyle) },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1 },
  navbar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 2, minWidth: 70 },
  backText: { ...(Typography.body as TextStyle), fontWeight: '400' },
  navTitle: { flex: 1, ...(Typography.headline as TextStyle), textAlign: 'center' },
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  sectionLabel: { ...(Typography.footnote as TextStyle), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionCount: { ...(Typography.caption1 as TextStyle) },
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  summaryRow: { flexDirection: 'row', paddingVertical: Spacing.sm },
  vDivider:  { width: 1, alignSelf: 'stretch', marginVertical: 8 },
  // Time range picker
  rangeRow:  { flexDirection: 'row', gap: Spacing.xs, padding: Spacing.md },
  rangeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  rangeChipText: { ...(Typography.caption1 as TextStyle), fontWeight: '600' },
  // Custom dates
  customDates: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  dateRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, gap: Spacing.md },
  dateLabel:  { ...(Typography.subhead as TextStyle), width: 40 },
  dateInput:  { flex: 1, borderWidth: 1, borderRadius: Radius.sm, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  dateValue:  { ...(Typography.subhead as TextStyle) },
  divider:    { height: 1 },
  // Chart
  chartToggleRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, paddingBottom: Spacing.xs },
  chartToggleChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  chartToggleText: { ...(Typography.caption1 as TextStyle), fontWeight: '600' },
  chartArea:  { paddingHorizontal: Spacing.xs, paddingBottom: Spacing.sm },
  chartEmpty: { alignItems: 'center', paddingVertical: Spacing.xxxl, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  chartEmptyTitle: { ...(Typography.subhead as TextStyle), textAlign: 'center' },
  chartEmptyBody:  { ...(Typography.caption1 as TextStyle), textAlign: 'center', lineHeight: 18 },
  // Table
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, gap: Spacing.md },
  tableDate: { ...(Typography.subhead as TextStyle), minWidth: 100 },
  tableValues: { flex: 1, alignItems: 'flex-end' },
  tableValuePrimary:   { ...(Typography.caption1 as TextStyle), fontVariant: ['tabular-nums'] } as TextStyle,
  tableValueSecondary: { ...(Typography.caption1 as TextStyle), fontVariant: ['tabular-nums'], marginTop: 2 } as TextStyle,
});
