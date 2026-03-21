/**
 * Altitude Diving Tool
 *
 * Three modes:
 * 1. TOD — Theoretical Ocean Depth (depth equivalent at altitude)
 * 2. Altitude NDL — No-deco limit adjusted for altitude
 * 3. Flying After Diving — minimum surface interval before flying
 */
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { SliderWithInput } from '@/src/ui/components/SliderWithInput';
import { DisclaimerText } from '@/src/ui/components/DisclaimerText';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';

// ── Constants ──────────────────────────────────────────────────────────────────
const FT_TO_M     = 0.3048;
const M_TO_FT     = 3.28084;
const SEA_LEVEL_P = 1.01325; // bar at sea level

// Atmospheric pressure at altitude (bar), using standard atmosphere model
function atmoBar(altM: number): number {
  return SEA_LEVEL_P * Math.pow(1 - 2.25577e-5 * altM, 5.25588);
}

// TOD: theoretical ocean depth equivalent
// TOD = actualDepth × (P_atmo / P_sea)
function tod(actualDepthM: number, altM: number): number {
  const pa = atmoBar(altM);
  const ata_actual = pa / SEA_LEVEL_P + actualDepthM / 10;
  // TOD is the depth in ocean that gives the same absolute pressure
  return (ata_actual - 1) * 10;
}

// NAUI Table 1 NDLs (ft basis) — same as dive-tables tool
const NDL_TABLE: Array<{ depthFt: number; ndl: number }> = [
  { depthFt: 35,  ndl: 205 },
  { depthFt: 40,  ndl: 130 },
  { depthFt: 50,  ndl: 80  },
  { depthFt: 60,  ndl: 55  },
  { depthFt: 70,  ndl: 45  },
  { depthFt: 80,  ndl: 35  },
  { depthFt: 90,  ndl: 25  },
  { depthFt: 100, ndl: 20  },
  { depthFt: 110, ndl: 15  },
  { depthFt: 120, ndl: 10  },
  { depthFt: 130, ndl: 10  },
];

function getNDL(depthM: number): number | null {
  const depthFt = depthM * M_TO_FT;
  const row = NDL_TABLE.find(r => r.depthFt >= depthFt);
  return row?.ndl ?? null;
}

// Altitude NDL: adjust sea-level NDL using Bühlmann altitude factor
// Factor: P_sea / P_alt (surfaces at lower pressure, more conservative)
function altitudeNDL(seaNDL: number, altM: number, o2Pct: number): number {
  const pa  = atmoBar(altM);
  const adj = (SEA_LEVEL_P / pa) * (1 - o2Pct / 100 * 0.1); // O2 enrichment relaxes slightly
  return Math.max(5, Math.round(seaNDL / adj));
}

// Flying After Diving: DAN/UHMS guidelines
function flyingMinHours(
  maxDepthM: number,
  bottomMin: number,
  repetitive: boolean,
  cabinAltFt: number,
): { minHours: number; consHours: number } {
  const single = bottomMin <= 120 && !repetitive;
  const minH   = single ? 12 : 18;
  const consH  = Math.round(Math.max(minH, (maxDepthM / 10) * 4 + bottomMin / 30));
  return { minHours: minH, consHours: Math.min(consH, 48) };
}

// ── Modes ─────────────────────────────────────────────────────────────────────
type ModeId = 'tod' | 'ndl' | 'flying';
const MODES: { id: ModeId; label: string }[] = [
  { id: 'tod',    label: 'TOD'         },
  { id: 'ndl',    label: 'Altitude NDL'},
  { id: 'flying', label: 'Flying After'},
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AltitudeDivingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [useMetric, setUseMetric] = useState(true);
  const imp = !useMetric;

  const [mode, setMode] = useState<ModeId>('tod');

  // TOD state (metric stored)
  const [todAltM,   setTodAltM]   = useState(1000);
  const [todDepthM, setTodDepthM] = useState(20);

  // NDL state
  const [ndlAltM,   setNdlAltM]   = useState(1000);
  const [ndlDepthM, setNdlDepthM] = useState(20);
  const [ndlO2,     setNdlO2]     = useState(21);

  // Flying state
  const [flyDepthM,    setFlyDepthM]    = useState(30);
  const [flyTimeMin,   setFlyTimeMin]   = useState(45);
  const [flyRepetitive, setFlyRep]      = useState(false);
  const [flyCabinFt,   setFlyCabinFt]  = useState(6000);

  const dUnit = imp ? 'ft' : 'm';

  // TOD results
  const todResult = (() => {
    const todM = tod(todDepthM, todAltM);
    const pa   = atmoBar(todAltM);
    const ratio = pa / SEA_LEVEL_P;
    return { todM, pa, ratio };
  })();

  // NDL results
  const ndlResult = (() => {
    const seaNDL = getNDL(ndlDepthM);
    if (seaNDL == null) return null;
    const altNDL = altitudeNDL(seaNDL, ndlAltM, ndlO2);
    return { seaNDL, altNDL, reduced: altNDL < seaNDL };
  })();

  // Flying results
  const flyResult = flyingMinHours(flyDepthM, flyTimeMin, flyRepetitive, flyCabinFt);

  function fmtDepth(m: number): string {
    return imp ? `${Math.round(m * M_TO_FT)} ft` : `${Math.round(m)} m`;
  }

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={s.headerBtn}>
          <Text style={s.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Altitude Diving</Text>
        <View style={s.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Unit picker */}
          <SegPicker
            options={[{ v: true, l: 'Metric' }, { v: false, l: 'Imperial' }]}
            selected={useMetric}
            onSelect={setUseMetric}
          />

          {/* Mode picker */}
          <SegPicker
            options={MODES.map(m => ({ v: m.id as ModeId, l: m.label }))}
            selected={mode}
            onSelect={setMode}
          />

          {/* ══════════════════════════════════════════
              MODE 1 — TOD
          ══════════════════════════════════════════ */}
          {mode === 'tod' && (
            <>
              <InputCard>
                <SliderWithInput
                  label={`Altitude (${dUnit})`}
                  value={imp ? todAltM * M_TO_FT : todAltM}
                  min={imp ? 0 : 0} max={imp ? 13000 : 4000} step={imp ? 500 : 100}
                  suffix={dUnit} decimals={0}
                  onChange={(d) => setTodAltM(imp ? d * FT_TO_M : d)}
                />
                <CardDivider />
                <SliderWithInput
                  label={`Actual Depth (${dUnit})`}
                  value={imp ? todDepthM * M_TO_FT : todDepthM}
                  min={imp ? 5 : 1} max={imp ? 130 : 40} step={imp ? 5 : 1}
                  suffix={dUnit} decimals={0}
                  onChange={(d) => setTodDepthM(imp ? d * FT_TO_M : d)}
                />
              </InputCard>

              <ResultCard>
                <Text style={r.heading}>Theoretical Ocean Depth</Text>
                <View style={r.dualRow}>
                  <ResultValue
                    value={fmtDepth(todResult.todM)}
                    label="TOD"
                  />
                  <ResultValue
                    value={fmtDepth(todDepthM)}
                    label="Actual Depth"
                  />
                </View>
                <Text style={r.note}>
                  Actual depth of {fmtDepth(todDepthM)} at altitude is equivalent to {fmtDepth(todResult.todM)} at sea level.
                </Text>
                <CardDivider />
                <View style={r.dualRow}>
                  <DetailValue
                    value={`${todResult.pa.toFixed(3)} bar`}
                    label="Atmo Pressure"
                  />
                  <DetailValue
                    value={`${todResult.ratio.toFixed(3)}`}
                    label="Pressure Ratio"
                  />
                </View>
                {todAltM > 3000 && (
                  <Text style={r.warn}>⚠️ Extreme altitude — consult specialised altitude dive tables.</Text>
                )}
              </ResultCard>
            </>
          )}

          {/* ══════════════════════════════════════════
              MODE 2 — Altitude NDL
          ══════════════════════════════════════════ */}
          {mode === 'ndl' && (
            <>
              <InputCard>
                <SliderWithInput
                  label={`Altitude (${dUnit})`}
                  value={imp ? ndlAltM * M_TO_FT : ndlAltM}
                  min={0} max={imp ? 13000 : 4000} step={imp ? 500 : 100}
                  suffix={dUnit} decimals={0}
                  onChange={(d) => setNdlAltM(imp ? d * FT_TO_M : d)}
                />
                <CardDivider />
                <SliderWithInput
                  label={`Actual Depth (${dUnit})`}
                  value={imp ? ndlDepthM * M_TO_FT : ndlDepthM}
                  min={imp ? 5 : 1} max={imp ? 130 : 40} step={imp ? 5 : 1}
                  suffix={dUnit} decimals={0}
                  onChange={(d) => setNdlDepthM(imp ? d * FT_TO_M : d)}
                />
                <CardDivider />
                <SliderWithInput
                  label="O2 %"
                  value={ndlO2}
                  min={21} max={100} step={1}
                  suffix="%" decimals={0}
                  onChange={setNdlO2}
                />
              </InputCard>

              {ndlResult ? (
                <ResultCard>
                  <Text style={r.heading}>No-Decompression Limit</Text>
                  <View style={r.ndlRow}>
                    <View style={r.ndlCol}>
                      <Text style={r.ndlHero}>{ndlResult.altNDL}</Text>
                      <Text style={r.ndlSub}>min at altitude</Text>
                    </View>
                    <View style={r.ndlColSec}>
                      <Text style={r.ndlHeroSec}>{ndlResult.seaNDL}</Text>
                      <Text style={r.ndlSub}>min at sea level</Text>
                    </View>
                  </View>
                  <Text style={[r.note, { color: ndlResult.reduced ? Colors.warning : Colors.success }]}>
                    {ndlResult.reduced
                      ? `NDL reduced by ${ndlResult.seaNDL - ndlResult.altNDL} min at this altitude.`
                      : 'NDL not reduced — dive conservatively.'}
                  </Text>
                </ResultCard>
              ) : (
                <ResultCard>
                  <Text style={r.note}>Depth exceeds table limits. Use a dive computer.</Text>
                </ResultCard>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════
              MODE 3 — Flying After Diving
          ══════════════════════════════════════════ */}
          {mode === 'flying' && (
            <>
              <InputCard>
                <SliderWithInput
                  label={`Max Depth (${dUnit})`}
                  value={imp ? flyDepthM * M_TO_FT : flyDepthM}
                  min={imp ? 5 : 1} max={imp ? 200 : 60} step={imp ? 5 : 1}
                  suffix={dUnit} decimals={0}
                  onChange={(d) => setFlyDepthM(imp ? d * FT_TO_M : d)}
                />
                <CardDivider />
                <SliderWithInput
                  label="Bottom Time"
                  value={flyTimeMin}
                  min={5} max={120} step={5}
                  suffix="min" decimals={0}
                  onChange={setFlyTimeMin}
                />
                <CardDivider />
                <View style={r.toggleRow}>
                  <Text style={r.toggleLabel}>Repetitive / Multi-Day</Text>
                  <Switch
                    value={flyRepetitive}
                    onValueChange={setFlyRep}
                    trackColor={{ false: Colors.border, true: Colors.accentBlue }}
                    thumbColor={Colors.white}
                  />
                </View>
                <CardDivider />
                <SliderWithInput
                  label="Cabin Altitude"
                  value={flyCabinFt}
                  min={2000} max={10000} step={500}
                  suffix="ft" decimals={0}
                  onChange={setFlyCabinFt}
                />
              </InputCard>

              <ResultCard>
                <Text style={r.heading}>Flying After Diving</Text>
                <Text style={r.flyIcon}>✈️</Text>
                <Text style={r.flyHours}>{flyResult.minHours} hours minimum</Text>
                <Text style={r.flySub}>
                  {flyResult.consHours} hours recommended (conservative)
                </Text>
                <CardDivider />
                <DetailRow label="Dive Type" value={flyRepetitive ? 'Repetitive / Multi-Day' : 'Single Dive'} />
                <DetailRow label="Cabin Altitude" value={`${flyCabinFt.toLocaleString()} ft`} />
                <CardDivider />
                <Text style={r.danNote}>
                  Based on DAN/UHMS guidelines. Minimum 12h for single dives, 18h for repetitive or multi-day dives.
                </Text>
              </ResultCard>
            </>
          )}

          <DisclaimerText text="For planning reference only. Always use a dive computer and follow DAN/UHMS altitude recommendations." />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SegPicker<T>({ options, selected, onSelect }: {
  options: { v: T; l: string }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={sp.container}>
      {options.map((o) => (
        <Pressable
          key={String(o.v)}
          style={[sp.option, selected === o.v && sp.optionActive]}
          onPress={() => onSelect(o.v)}
        >
          <Text style={[sp.label, selected === o.v && sp.labelActive]}>{o.l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function InputCard({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'ios') {
    return <BlurView intensity={80} tint="regular" style={c.card}>{children}</BlurView>;
  }
  return <View style={[c.card, c.cardAndroid]}>{children}</View>;
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return <View style={c.result}>{children}</View>;
}

function CardDivider() {
  return <View style={c.divider} />;
}

function ResultValue({ value, label }: { value: string; label: string }) {
  return (
    <View style={r.valueCol}>
      <Text style={r.valueText}>{value}</Text>
      <Text style={r.valueLabel}>{label}</Text>
    </View>
  );
}

function DetailValue({ value, label }: { value: string; label: string }) {
  return (
    <View style={r.valueCol}>
      <Text style={r.detailValue}>{value}</Text>
      <Text style={r.valueLabel}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={r.detailRow}>
      <Text style={r.detailLabel}>{label}</Text>
      <Text style={r.detailRight}>{value}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const sp = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: Colors.border,
    borderRadius: Radius.sm, padding: 2, marginTop: Spacing.lg,
  },
  option: { flex: 1, paddingVertical: Spacing.xs + 2, alignItems: 'center', borderRadius: Radius.sm - 2 },
  optionActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 2, elevation: 2,
  },
  label: { ...Typography.footnote, fontWeight: '500' as const, color: Colors.textSecondary } as TextStyle,
  labelActive: { fontWeight: '700' as const, color: Colors.text } as TextStyle,
});

const c = StyleSheet.create({
  card: { borderRadius: Radius.md, padding: Spacing.lg, overflow: 'hidden', marginTop: Spacing.lg },
  cardAndroid: { backgroundColor: 'rgba(255,255,255,0.92)' },
  result: {
    backgroundColor: Colors.accentBlueLight, borderRadius: Radius.md,
    padding: Spacing.lg, marginTop: Spacing.lg,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
});

const r = StyleSheet.create({
  heading: { ...(Typography.subhead as TextStyle), color: Colors.textSecondary, marginBottom: Spacing.md },
  dualRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  valueCol: { alignItems: 'center', flex: 1 },
  valueText: { ...(Typography.title2 as TextStyle), fontWeight: '700' as const, color: Colors.accentBlue } as TextStyle,
  valueLabel: { ...(Typography.caption2 as TextStyle), color: Colors.textSecondary, marginTop: 2 },
  detailValue: { ...(Typography.caption1 as TextStyle), fontWeight: '600' as const, color: Colors.text } as TextStyle,
  note: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, lineHeight: 18, marginTop: Spacing.sm },
  warn: { ...(Typography.caption1 as TextStyle), color: Colors.warning, marginTop: Spacing.sm } as TextStyle,
  // NDL
  ndlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl, marginBottom: Spacing.sm },
  ndlCol: { alignItems: 'center' },
  ndlColSec: { alignItems: 'center', opacity: 0.7 },
  ndlHero: { fontSize: 40, fontWeight: '700' as const, color: Colors.accentBlue } as TextStyle,
  ndlHeroSec: { fontSize: 40, fontWeight: '700' as const, color: Colors.textSecondary } as TextStyle,
  ndlSub: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  // Flying
  flyIcon: { fontSize: 32, textAlign: 'center', marginBottom: Spacing.xs },
  flyHours: {
    ...(Typography.title2 as TextStyle), fontWeight: '700' as const,
    color: Colors.accentBlue, textAlign: 'center',
  } as TextStyle,
  flySub: { ...(Typography.subhead as TextStyle), color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md },
  danNote: { ...(Typography.caption2 as TextStyle), color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  detailLabel: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },
  detailRight: { ...(Typography.caption1 as TextStyle), fontWeight: '600' as const, color: Colors.text } as TextStyle,
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  toggleLabel: { ...(Typography.subhead as TextStyle), color: Colors.text },
});

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { ...(Typography.headline as TextStyle), color: Colors.text, flex: 1, textAlign: 'center' },
  headerBack: { ...(Typography.body as TextStyle), color: Colors.accentBlue },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
});
