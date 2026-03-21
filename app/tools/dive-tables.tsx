import React, { useEffect, useRef, useState } from 'react';
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
import { Card } from '@/src/ui/components/Card';
import { SliderWithInput } from '@/src/ui/components/SliderWithInput';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { DisclaimerText } from '@/src/ui/components/DisclaimerText';

// ── NAUI Recreational Dive Planner Tables ─────────────────────────────────────
// Reference only — always verify with current official NAUI materials.

interface T1Row {
  ft: number; m: number; ndl: number;
  entries: { t: number; g: string }[];
}

const TABLE1: T1Row[] = [
  { ft: 40,  m: 12, ndl: 140, entries: [
    {t:10,g:'A'},{t:20,g:'B'},{t:30,g:'C'},{t:45,g:'D'},
    {t:60,g:'E'},{t:75,g:'F'},{t:95,g:'G'},{t:115,g:'H'},
    {t:130,g:'I'},{t:140,g:'J'},
  ]},
  { ft: 50,  m: 15, ndl: 80,  entries: [
    {t:10,g:'A'},{t:15,g:'B'},{t:20,g:'C'},{t:30,g:'D'},
    {t:40,g:'E'},{t:50,g:'F'},{t:60,g:'G'},{t:70,g:'H'},{t:80,g:'I'},
  ]},
  { ft: 60,  m: 18, ndl: 55,  entries: [
    {t:10,g:'A'},{t:15,g:'B'},{t:20,g:'C'},{t:25,g:'D'},
    {t:30,g:'E'},{t:40,g:'F'},{t:50,g:'G'},{t:55,g:'H'},
  ]},
  { ft: 70,  m: 21, ndl: 40,  entries: [
    {t:5,g:'A'},{t:10,g:'B'},{t:15,g:'C'},{t:20,g:'D'},
    {t:25,g:'E'},{t:30,g:'F'},{t:40,g:'G'},
  ]},
  { ft: 80,  m: 24, ndl: 30,  entries: [
    {t:5,g:'A'},{t:10,g:'B'},{t:15,g:'C'},
    {t:20,g:'D'},{t:25,g:'E'},{t:30,g:'F'},
  ]},
  { ft: 90,  m: 27, ndl: 25,  entries: [
    {t:5,g:'A'},{t:10,g:'B'},{t:12,g:'C'},
    {t:15,g:'D'},{t:20,g:'E'},{t:25,g:'F'},
  ]},
  { ft: 100, m: 30, ndl: 20,  entries: [
    {t:5,g:'A'},{t:7,g:'B'},{t:10,g:'C'},{t:15,g:'D'},{t:20,g:'E'},
  ]},
  { ft: 110, m: 33, ndl: 16,  entries: [
    {t:5,g:'A'},{t:8,g:'B'},{t:10,g:'C'},{t:13,g:'D'},{t:16,g:'E'},
  ]},
  { ft: 120, m: 36, ndl: 13,  entries: [
    {t:5,g:'A'},{t:8,g:'B'},{t:10,g:'C'},{t:13,g:'D'},
  ]},
  { ft: 130, m: 39, ndl: 10,  entries: [
    {t:3,g:'A'},{t:5,g:'B'},{t:7,g:'C'},{t:10,g:'D'},
  ]},
  { ft: 140, m: 42, ndl: 8,   entries: [
    {t:3,g:'A'},{t:5,g:'B'},{t:8,g:'C'},
  ]},
];

// Table 2 — Surface Interval in MINUTES → new pressure group
const TABLE2: Record<string, { minSI: number; maxSI: number | null; ng: string }[]> = {
  A: [{minSI:0,   maxSI:null, ng:'A'}],
  B: [{minSI:0,   maxSI:40,   ng:'B'},{minSI:40,  maxSI:null, ng:'A'}],
  C: [{minSI:0,   maxSI:60,   ng:'C'},{minSI:60,  maxSI:100, ng:'B'},{minSI:100, maxSI:null, ng:'A'}],
  D: [{minSI:0,   maxSI:60,   ng:'D'},{minSI:60,  maxSI:90,  ng:'C'},{minSI:90,  maxSI:140, ng:'B'},{minSI:140,maxSI:null, ng:'A'}],
  E: [{minSI:0,   maxSI:60,   ng:'E'},{minSI:60,  maxSI:90,  ng:'D'},{minSI:90,  maxSI:120, ng:'C'},{minSI:120,maxSI:180, ng:'B'},{minSI:180,maxSI:null, ng:'A'}],
  F: [{minSI:0,   maxSI:60,   ng:'F'},{minSI:60,  maxSI:90,  ng:'E'},{minSI:90,  maxSI:120, ng:'D'},{minSI:120,maxSI:150, ng:'C'},{minSI:150,maxSI:220, ng:'B'},{minSI:220,maxSI:null,ng:'A'}],
  G: [{minSI:0,   maxSI:60,   ng:'G'},{minSI:60,  maxSI:90,  ng:'F'},{minSI:90,  maxSI:120, ng:'E'},{minSI:120,maxSI:150, ng:'D'},{minSI:150,maxSI:180, ng:'C'},{minSI:180,maxSI:260, ng:'B'},{minSI:260,maxSI:null,ng:'A'}],
  H: [{minSI:0,   maxSI:60,   ng:'H'},{minSI:60,  maxSI:90,  ng:'G'},{minSI:90,  maxSI:120, ng:'F'},{minSI:120,maxSI:150, ng:'E'},{minSI:150,maxSI:180, ng:'D'},{minSI:180,maxSI:220, ng:'C'},{minSI:220,maxSI:320, ng:'B'},{minSI:320,maxSI:null,ng:'A'}],
  I: [{minSI:0,   maxSI:60,   ng:'I'},{minSI:60,  maxSI:90,  ng:'H'},{minSI:90,  maxSI:120, ng:'G'},{minSI:120,maxSI:150, ng:'F'},{minSI:150,maxSI:180, ng:'E'},{minSI:180,maxSI:220, ng:'D'},{minSI:220,maxSI:260, ng:'C'},{minSI:260,maxSI:380, ng:'B'},{minSI:380,maxSI:null,ng:'A'}],
  J: [{minSI:0,   maxSI:60,   ng:'J'},{minSI:60,  maxSI:90,  ng:'I'},{minSI:90,  maxSI:120, ng:'H'},{minSI:120,maxSI:150, ng:'G'},{minSI:150,maxSI:180, ng:'F'},{minSI:180,maxSI:220, ng:'E'},{minSI:220,maxSI:260, ng:'D'},{minSI:260,maxSI:300, ng:'C'},{minSI:300,maxSI:440, ng:'B'},{minSI:440,maxSI:null,ng:'A'}],
  K: [{minSI:0,   maxSI:60,   ng:'K'},{minSI:60,  maxSI:90,  ng:'J'},{minSI:90,  maxSI:120, ng:'I'},{minSI:120,maxSI:150, ng:'H'},{minSI:150,maxSI:180, ng:'G'},{minSI:180,maxSI:220, ng:'F'},{minSI:220,maxSI:260, ng:'E'},{minSI:260,maxSI:300, ng:'D'},{minSI:300,maxSI:340, ng:'C'},{minSI:340,maxSI:500, ng:'B'},{minSI:500,maxSI:null,ng:'A'}],
  L: [{minSI:0,   maxSI:60,   ng:'L'},{minSI:60,  maxSI:90,  ng:'K'},{minSI:90,  maxSI:120, ng:'J'},{minSI:120,maxSI:150, ng:'I'},{minSI:150,maxSI:180, ng:'H'},{minSI:180,maxSI:220, ng:'G'},{minSI:220,maxSI:260, ng:'F'},{minSI:260,maxSI:300, ng:'E'},{minSI:300,maxSI:340, ng:'D'},{minSI:340,maxSI:380, ng:'C'},{minSI:380,maxSI:540, ng:'B'},{minSI:540,maxSI:null,ng:'A'}],
};

// Table 3 — Residual Nitrogen Times (minutes) by group × depth (ft)
const TABLE3: Record<string, Record<number, number>> = {
  A: {40:10,50:8, 60:7, 70:6, 80:5, 90:4,  100:4,  110:3, 120:3, 130:2, 140:2},
  B: {40:18,50:15,60:12,70:10,80:9, 90:7,  100:6,  110:6, 120:5, 130:4, 140:4},
  C: {40:30,50:25,60:20,70:17,80:14,90:12, 100:10, 110:9, 120:8, 130:7, 140:6},
  D: {40:44,50:37,60:30,70:25,80:21,90:17, 100:14, 110:13,120:11,130:9, 140:8},
  E: {40:61,50:51,60:41,70:34,80:28,90:23, 100:20, 110:17,120:15,130:13,140:11},
  F: {40:80,50:68,60:55,70:46,80:37,90:31, 100:27, 110:23,120:20,130:17,140:15},
  G: {40:102,50:87,60:70,70:58,80:48,90:40,100:34, 110:30,120:26,130:22,140:19},
  H: {40:126,50:108,60:87,70:72,80:60,90:50,100:43,110:37,120:33,130:28,140:24},
  I: {40:139,50:120,60:100,70:84,80:70,90:61,100:52,110:46,120:40,130:35,140:30},
  J: {40:140,50:133,60:113,70:96,80:81,90:72,100:61,110:55,120:48,130:42,140:36},
  K: {40:140,50:140,60:126,70:109,80:93,90:83,100:70,110:63,120:57,130:50,140:43},
  L: {40:140,50:140,60:140,70:130,80:113,90:98,100:84,110:76,120:67,130:60,140:51},
};

const DEPTHS = TABLE1.map(r => ({ ft: r.ft, m: r.m }));

// ── Lookup helpers ─────────────────────────────────────────────────────────────

function getGroupForDive(depthFt: number, timMin: number): string | null {
  const row = TABLE1.find(r => r.ft >= depthFt);
  if (!row || timMin < 1 || timMin > row.ndl) return null;
  const entry = row.entries.find(e => timMin <= e.t);
  return entry?.g ?? null;
}

function getGroupAfterSI(startGroup: string, siMin: number): string | null {
  const rows = TABLE2[startGroup];
  if (!rows) return null;
  for (const r of rows) {
    if (siMin >= r.minSI && (r.maxSI === null || siMin < r.maxSI)) return r.ng;
  }
  return null;
}

function getRNT(group: string, depthFt: number): number | null {
  return TABLE3[group]?.[depthFt] ?? null;
}

// ── Screen ─────────────────────────────────────────────────────────────────────

const FT_TO_M = 0.3048;
const ITEM_H  = 50;
const WHEEL_PAD = 2; // items above/below center

export default function DivePlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [useMetric, setUseMetric] = useState(false);

  // First dive
  const [depthIdx1, setDepthIdx1] = useState(2);       // 60 ft default
  const [bottomTime1, setBottomTime1] = useState(20);
  const [isRepetitive, setIsRepetitive] = useState(false);

  // Surface interval
  const [siMin, setSiMin] = useState(60);

  // Second dive
  const [depthIdx2, setDepthIdx2] = useState(2);
  const [bottomTime2, setBottomTime2] = useState(20);

  // Computed
  const depth1   = TABLE1[depthIdx1];
  const depth2   = TABLE1[depthIdx2];
  const group1   = getGroupForDive(depth1.ft, bottomTime1);
  const postSI   = (isRepetitive && group1) ? getGroupAfterSI(group1, siMin) : null;
  const rnt      = postSI ? getRNT(postSI, depth2.ft) : null;
  const dive2NDL = depth2.ndl;
  const andl     = rnt != null ? Math.max(0, dive2NDL - rnt) : null;
  const group2   = (isRepetitive && postSI && andl != null && andl > 0)
    ? getGroupForDive(depth2.ft, bottomTime2) : null;

  // Clamp bottom times when depth or NDL changes
  const ndl1 = depth1.ndl;
  const ndl2 = andl != null ? andl : depth2.ndl;
  const safeTime1 = Math.min(bottomTime1, ndl1);
  const safeTime2 = Math.min(bottomTime2, ndl2);

  function depthLabel(d: { ft: number; m: number }) {
    return useMetric ? `${d.m} m` : `${d.ft} ft`;
  }

  function siLabel(min: number) {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Dive Planner</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Metric / Imperial */}
        <SegPicker
          options={[{ v: false, l: 'Imperial (ft)' }, { v: true, l: 'Metric (m)' }]}
          selected={useMetric}
          onSelect={setUseMetric}
        />

        {/* Warning */}
        <Card>
          <Text style={sub.warning}>
            Reference only — values are approximate. Always verify with current official dive table materials and complete certified training before diving.
          </Text>
        </Card>

        {/* ── First Dive ── */}
        <SL label="First Dive — Depth" />
        <Card variant="input">
          <DepthWheel
            selectedIndex={depthIdx1}
            onSelect={(i) => {
              setDepthIdx1(i);
              setBottomTime1(Math.min(bottomTime1, TABLE1[i].ndl));
            }}
            label={depthLabel}
          />
        </Card>

        <SL label={`Bottom Time  ·  NDL ${ndl1} min`} />
        <Card variant="input">
          <SliderWithInput
            label="Bottom time"
            value={safeTime1}
            min={1}
            max={ndl1}
            step={1}
            suffix="min"
            decimals={0}
            onChange={(v) => setBottomTime1(Math.round(v))}
          />
        </Card>

        {/* First dive result */}
        {group1 ? (
          <Card variant="result">
            <View style={sub.groupResultRow}>
              <View>
                <Text style={sub.groupResultLabel}>Pressure Group</Text>
                <Text style={sub.groupResultSub}>after {safeTime1} min at {depthLabel(depth1)}</Text>
              </View>
              <GroupBadge letter={group1} size="lg" />
            </View>
          </Card>
        ) : (
          safeTime1 >= 1 && (
            <Card>
              <Text style={sub.emptyText}>Exceeds NDL for this depth.</Text>
            </Card>
          )
        )}

        {/* ── Repetitive Dive Toggle ── */}
        <Pressable
          style={[sub.toggleBtn, isRepetitive && sub.toggleBtnActive]}
          onPress={() => setIsRepetitive(v => !v)}
        >
          <Text style={[sub.toggleText, isRepetitive && sub.toggleTextActive]}>
            {isRepetitive ? '✓  Repetitive Dive On' : '+ Plan a Repetitive Dive'}
          </Text>
        </Pressable>

        {isRepetitive && group1 && (<>
          {/* ── Surface Interval ── */}
          <SL label="Surface Interval" />
          <Card variant="input">
            <SliderWithInput
              label="Surface interval"
              value={siMin}
              min={0}
              max={600}
              step={5}
              suffix="min"
              decimals={0}
              onChange={(v) => setSiMin(Math.round(v))}
            />
            <Text style={sub.siDisplay}>{siLabel(siMin)}</Text>
          </Card>

          {postSI && (
            <Card variant="result">
              <View style={sub.groupResultRow}>
                <View>
                  <Text style={sub.groupResultLabel}>Group after Surface Interval</Text>
                  <Text style={sub.groupResultSub}>{siLabel(siMin)} on surface</Text>
                </View>
                <GroupBadge letter={postSI} size="lg" />
              </View>
            </Card>
          )}

          {/* ── Second Dive ── */}
          <SL label="Second Dive — Depth" />
          <Card variant="input">
            <DepthWheel
              selectedIndex={depthIdx2}
              onSelect={(i) => {
                setDepthIdx2(i);
              }}
              label={depthLabel}
            />
          </Card>

          {postSI && rnt != null && andl != null && (<>
            <SL label={`Bottom Time  ·  Adjusted NDL ${andl} min`} />
            {andl > 0 ? (
              <Card variant="input">
                <SliderWithInput
                  label="Bottom time"
                  value={safeTime2}
                  min={1}
                  max={andl}
                  step={1}
                  suffix="min"
                  decimals={0}
                  onChange={(v) => setBottomTime2(Math.round(v))}
                />
              </Card>
            ) : (
              <Card>
                <Text style={sub.emptyText}>
                  RNT ({rnt} min) ≥ Table NDL ({dive2NDL} min) at this depth.{'\n'}
                  Choose a shallower depth or extend your surface interval.
                </Text>
              </Card>
            )}

            {/* Second dive result card */}
            {andl > 0 && (
              <Card variant="result">
                <View style={sub.statRow}>
                  <StatBox label="RNT"           value={`${rnt} min`} />
                  <StatBox label="Table NDL"     value={`${dive2NDL} min`} />
                  <StatBox label="Adjusted NDL"  value={`${andl} min`} warn={andl <= 5} />
                </View>
                <View style={sub.divider} />
                <View style={sub.groupResultRow}>
                  <View>
                    <Text style={sub.groupResultLabel}>Pressure Group</Text>
                    <Text style={sub.groupResultSub}>
                      after {safeTime2} min at {depthLabel(depth2)}
                    </Text>
                  </View>
                  {group2
                    ? <GroupBadge letter={group2} size="lg" />
                    : <Text style={sub.emptyText}>—</Text>
                  }
                </View>
              </Card>
            )}
          </>)}
        </>)}

        <DisclaimerText />
      </ScrollView>
    </View>
  );
}

// ── Wheel Picker ───────────────────────────────────────────────────────────────

function DepthWheel({
  selectedIndex,
  onSelect,
  label,
}: {
  selectedIndex: number;
  onSelect: (i: number) => void;
  label: (d: { ft: number; m: number }) => string;
}) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_H, animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onScrollEnd(e: any) {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.max(0, Math.min(DEPTHS.length - 1, Math.round(y / ITEM_H)));
    onSelect(idx);
  }

  const wheelHeight = ITEM_H * (WHEEL_PAD * 2 + 1);

  return (
    <View style={{ height: wheelHeight, overflow: 'hidden' }}>
      {/* Center highlight */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: WHEEL_PAD * ITEM_H, left: 0, right: 0, height: ITEM_H,
          backgroundColor: Colors.accentBlue + '18',
          borderTopWidth: 1, borderBottomWidth: 1,
          borderColor: Colors.accentBlue + '50',
          borderRadius: 8,
        }}
      />
      <ScrollView
        ref={ref}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        contentContainerStyle={{ paddingVertical: WHEEL_PAD * ITEM_H }}
      >
        {DEPTHS.map((d, i) => (
          <View key={i} style={{ height: ITEM_H, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[wheel.item, i === selectedIndex && wheel.itemSelected]}>
              {label(d)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SL({ label }: { label: string }) {
  return <Text style={sub.sectionLabel}>{label}</Text>;
}

function GroupBadge({ letter, size }: { letter: string; size: 'sm' | 'lg' }) {
  const s = size === 'lg' ? 52 : 32;
  return (
    <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: Colors.accentBlue, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size === 'lg' ? 24 : 15, fontWeight: '700', color: '#FFF' } as TextStyle}>
        {letter}
      </Text>
    </View>
  );
}

function StatBox({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[sub.statValue, warn && sub.statWarn]}>{value}</Text>
      <Text style={sub.statLabel}>{label}</Text>
    </View>
  );
}

function SegPicker<T>({ options, selected, onSelect }: {
  options: { v: T; l: string }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={sp.container}>
      {options.map((o) => (
        <Pressable key={String(o.v)} style={[sp.option, selected === o.v && sp.optionActive]} onPress={() => onSelect(o.v)}>
          <Text style={[sp.optLabel, selected === o.v && sp.optLabelActive]}>{o.l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const wheel = StyleSheet.create({
  item: {
    fontSize: 18, color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  itemSelected: {
    fontWeight: '700', color: Colors.text, fontSize: 20,
  } as TextStyle,
});

const sp = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: Colors.border,
    borderRadius: Radius.sm, padding: 2, marginTop: Spacing.lg,
  },
  option: { flex: 1, paddingVertical: Spacing.xs + 2, alignItems: 'center', borderRadius: Radius.sm - 2 },
  optionActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10, shadowRadius: 2, elevation: 2,
  },
  optLabel: { ...Typography.footnote, fontWeight: '500' as const, color: Colors.textSecondary },
  optLabelActive: { fontWeight: '700' as const, color: Colors.text },
});

const sub = StyleSheet.create({
  sectionLabel: {
    ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, marginHorizontal: 2,
  },
  warning: {
    ...Typography.caption1, color: Colors.textSecondary,
    lineHeight: 18, textAlign: 'center', marginTop: Spacing.md,
  },

  // Group result
  groupResultRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  groupResultLabel: { ...Typography.subhead, fontWeight: '600' as const, color: Colors.text },
  groupResultSub: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2 },

  // SI display
  siDisplay: {
    ...Typography.caption1, color: Colors.textSecondary,
    textAlign: 'right', marginTop: Spacing.xs,
  },

  // Toggle button
  toggleBtn: {
    marginTop: Spacing.xl,
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  toggleBtnActive: {
    borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlue + '10',
  },
  toggleText: { ...Typography.subhead, color: Colors.textSecondary },
  toggleTextActive: { fontWeight: '600' as const, color: Colors.accentBlue },

  // Stats
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statValue: { ...Typography.title3, color: Colors.accentBlue, fontWeight: '700' as const } as TextStyle,
  statWarn: { color: Colors.emergency },
  statLabel: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.md },

  emptyText: {
    ...Typography.subhead, color: Colors.textSecondary,
    textAlign: 'center', paddingVertical: Spacing.md, lineHeight: 22,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { ...Typography.headline, color: Colors.text, flex: 1, textAlign: 'center' },
  headerBack: { ...Typography.body, color: Colors.accentBlue },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
});
