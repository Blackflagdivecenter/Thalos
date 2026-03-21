import React, { useState } from 'react';
import {
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
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/src/ui/components/Card';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { DisclaimerText } from '@/src/ui/components/DisclaimerText';

const BAR_TO_PSI = 14.5038;

const MODES = [
  { id: 'build',  label: 'Empty Tank' },
  { id: 'topoff', label: 'Top Off'    },
] as const;
type ModeId = typeof MODES[number]['id'];

function parseN(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}
function fmt(n: number, dec = 0): string { return n.toFixed(dec); }
function gasLabel(o2pct: number): string {
  if (Math.abs(o2pct - 100) < 0.5) return 'Pure O₂';
  if (Math.abs(o2pct - 21) < 0.5)  return 'Air';
  return `EAN${fmt(o2pct, 0)}`;
}

// ── Build from Empty ──────────────────────────────────────────────────────────
interface BuildResult {
  pO2: number;
  pHe: number;
  pTopoff: number;
  finalO2: number;
  finalHe: number;
  finalN2: number;
}

function calcBuild(fO2: number, fHe: number, P: number, fO2Top: number): BuildResult | null {
  if (P <= 0 || fO2 + fHe > 1 || fO2 < 0 || fHe < 0) return null;
  if (fO2Top <= 0 || fO2Top >= 1) return null;
  const pHe = fHe * P;
  const pO2 = (fO2 * P - (P - pHe) * fO2Top) / (1 - fO2Top);
  if (pO2 < -0.01) return null;
  const clampedPO2 = Math.max(0, pO2);
  const pTopoff = P - clampedPO2 - pHe;
  if (pTopoff < 0) return null;
  const finalO2 = (clampedPO2 + pTopoff * fO2Top) / P * 100;
  const finalHe = pHe / P * 100;
  const finalN2 = 100 - finalO2 - finalHe;
  return { pO2: clampedPO2, pHe, pTopoff, finalO2, finalHe, finalN2 };
}

// ── Two-Gas Solver ────────────────────────────────────────────────────────────
interface TwoGasResult {
  pA: number;
  pB: number;
  richIsA: boolean;
  cumAfterRich: number;
  resultO2: number;
  resultN2: number;
}

function calcTwoGasBlend(
  p1: number, fO2_1: number,
  pFinal: number, fO2_target: number,
  fO2A: number, fO2B: number,
): TwoGasResult | null {
  if (pFinal <= p1 || p1 < 0 || pFinal <= 0) return null;
  if ([fO2_1, fO2_target, fO2A, fO2B].some(v => v < 0 || v > 100)) return null;
  if (Math.abs(fO2A - fO2B) < 0.5) return null;

  const f1 = fO2_1 / 100, fT = fO2_target / 100;
  const fA = fO2A / 100, fB = fO2B / 100;

  const pA = (pFinal * (fT - fB) - p1 * (f1 - fB)) / (fA - fB);
  const pB = pFinal - p1 - pA;

  if (pA < -0.5 || pB < -0.5) return null;

  const clampA = Math.max(0, pA);
  const clampB = Math.max(0, pB);
  const richIsA = fO2A >= fO2B;
  const cumAfterRich = p1 + (richIsA ? clampA : clampB);
  const resultO2 = (p1 * f1 + clampA * fA + clampB * fB) / pFinal * 100;

  return { pA: clampA, pB: clampB, richIsA, cumAfterRich, resultO2, resultN2: 100 - resultO2 };
}

// ── Auto Bleed Pressure Finder ────────────────────────────────────────────────
// Finds the MAXIMUM pressure remaining after bleeding (= minimum bleed) such that
// a two-gas top-off from (pBleed, fO2_1) → (pFinal, fO2_target) is feasible.
//
// Derivation: for the blend equations
//   pA = [pFinal*(fT-fLow) - pBleed*(f1-fLow)] / (fHigh-fLow)
//   pB = [pFinal*(fHigh-fT) - pBleed*(fHigh-f1)] / (fHigh-fLow)
// Upper bound from pA ≥ 0 (active when f1 > fLow):
//   pBleed ≤ pFinal*(fT-fLow)/(f1-fLow)          … B1
// Upper bound from pB ≥ 0 (active when fHigh > f1):
//   pBleed ≤ pFinal*(fHigh-fT)/(fHigh-f1)        … B2
// Optimal pBleed = min(B1, B2) — bleed as little as possible.
function findBleedPressure(
  p1: number, fO2_1: number,
  pFinal: number, fO2_target: number,
  fO2A: number, fO2B: number,
): number | null {
  const f1    = fO2_1     / 100;
  const fT    = fO2_target / 100;
  const fHigh = Math.max(fO2A, fO2B) / 100;
  const fLow  = Math.min(fO2A, fO2B) / 100;

  if (fHigh - fLow < 0.005) return null;
  // Target must lie between the two available gases
  if (fT < fLow - 0.001 || fT > fHigh + 0.001) return null;

  let maxPBleed = Infinity;

  // B1: upper bound from pA ≥ 0, active when f1 > fLow
  if (f1 - fLow > 0.001) {
    const b1 = pFinal * (fT - fLow) / (f1 - fLow);
    if (b1 > 0) maxPBleed = Math.min(maxPBleed, b1);
  }

  // B2: upper bound from pB ≥ 0, active when fHigh > f1
  if (fHigh - f1 > 0.001) {
    const b2 = pFinal * (fHigh - fT) / (fHigh - f1);
    if (b2 > 0) maxPBleed = Math.min(maxPBleed, b2);
  }

  if (!isFinite(maxPBleed) || maxPBleed <= 0) return null;
  // If maxPBleed >= p1 the blend should already be feasible without bleeding
  if (maxPBleed >= p1 - 0.1) return null;

  // Apply a small safety margin below the boundary
  const pBleed = maxPBleed - Math.max(0.5, maxPBleed * 0.01);
  return pBleed > 0.5 ? pBleed : null;
}

function twoGasError(fO2_target: number, fO2A: number, fO2B: number): string {
  if (Math.abs(fO2A - fO2B) < 0.5) return 'Enter two different gases.';
  const lo = Math.min(fO2A, fO2B);
  const hi = Math.max(fO2A, fO2B);
  if (fO2_target > hi) return `Target O₂ (${fO2_target}%) exceeds both available gases. Use a richer gas supply.`;
  if (fO2_target < lo) return `Target O₂ (${fO2_target}%) is below both available gases. Use a leaner gas supply.`;
  return 'Check that target pressure is greater than current pressure and all values are valid.';
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function GasBlendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [useMetric, setUseMetric] = useState(true);
  const imp = !useMetric;
  const pUnit = imp ? 'PSI' : 'bar';

  const [mode, setMode] = useState<ModeId>('build');

  // Build from Empty
  const [bO2,    setBO2]    = useState('');
  const [bHe,    setBHe]    = useState('');
  const [bPres,  setBPres]  = useState('');
  const [bO2Top, setBO2Top] = useState('21');

  // Top-Off to Target
  const [tP1,     setTP1]     = useState('');
  const [tO2cur,  setTO2cur]  = useState('');
  const [tO2tgt,  setTO2tgt]  = useState('');
  const [tPFinal, setTPFinal] = useState('');
  const [tGasA,   setTGasA]   = useState('40');
  const [tGasB,   setTGasB]   = useState('21');

  function toBar(s: string): number | null {
    const n = parseN(s);
    return n != null ? (imp ? n / BAR_TO_PSI : n) : null;
  }
  function fromBar(b: number): string {
    return imp ? fmt(b * BAR_TO_PSI) : fmt(b);
  }
  function disp(b: number): string { return `${fromBar(b)} ${pUnit}`; }

  // ── Build result ──────────────────────────────────────────────────────────
  const bPresB  = toBar(bPres);
  const bO2N    = parseN(bO2)    ?? 0;
  const bHeN    = parseN(bHe)    ?? 0;
  const bO2TopN = parseN(bO2Top) ?? 21;
  const buildResult = bPresB != null && bO2 !== ''
    ? calcBuild(bO2N / 100, bHeN / 100, bPresB, bO2TopN / 100)
    : null;

  // ── Top-Off inputs ────────────────────────────────────────────────────────
  const tP1B    = toBar(tP1);
  const tPFinB  = toBar(tPFinal);
  const tO2curN = parseN(tO2cur) ?? 0;
  const tO2tgtN = parseN(tO2tgt) ?? 0;
  const tGasAN  = parseN(tGasA)  ?? 40;
  const tGasBN  = parseN(tGasB)  ?? 21;

  const topHasInputs = tO2cur !== '' && tO2tgt !== '' && tGasA !== '' && tGasB !== ''
    && tP1 !== '' && tPFinal !== '';

  // Try direct blend first
  const topResult = topHasInputs && tP1B != null && tPFinB != null
    ? calcTwoGasBlend(tP1B, tO2curN, tPFinB, tO2tgtN, tGasAN, tGasBN)
    : null;

  // If direct blend fails, check if we just need to bleed to target pressure
  // (same O2%, tank overfilled)
  const justBleed = topResult == null && topHasInputs
    && tP1B != null && tPFinB != null
    && tP1B > tPFinB
    && Math.abs(tO2curN - tO2tgtN) < 0.5;

  // If neither direct blend nor justBleed, find the optimal bleed pressure
  const autoBleedP = (!justBleed && topResult == null && topHasInputs
    && tP1B != null && tPFinB != null)
    ? findBleedPressure(tP1B, tO2curN, tPFinB, tO2tgtN, tGasAN, tGasBN)
    : null;

  const autoBleedResult = autoBleedP != null && tPFinB != null
    ? calcTwoGasBlend(autoBleedP, tO2curN, tPFinB, tO2tgtN, tGasAN, tGasBN)
    : null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Gas Blending</Text>
        <View style={styles.headerBtn} />
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

          {/* ── Build from Empty ── */}
          {mode === 'build' && <>
            <SL label="Target Mix" />
            <Card variant="input">
              <F label="O₂ %" value={bO2} onChange={setBO2} placeholder="32" />
              <D />
              <F label="He % (0 for nitrox)" value={bHe} onChange={setBHe} placeholder="0" />
              <D />
              <F label={`Fill Pressure (${pUnit})`} value={bPres} onChange={setBPres}
                 placeholder={imp ? '3000' : '200'} />
            </Card>

            <SL label="Top-Off Gas" />
            <Card variant="input">
              <F label="Top-Off Gas O₂ % (21 = air, 32 = EAN32, etc.)"
                 value={bO2Top} onChange={setBO2Top} placeholder="21" />
            </Card>

            <SL label="Fill Instructions" />
            {buildResult != null ? (() => {
              const cumO2He = buildResult.pO2 + buildResult.pHe;
              let stepNum = 1;
              return (
                <Card variant="result">
                  <Step num={stepNum++} label="Add pure O₂"
                    value={buildResult.pO2 > 0.01 ? `Fill to ${disp(buildResult.pO2)}` : 'Skip — not needed'}
                    note="Start with empty tank" />
                  {buildResult.pHe > 0 && (
                    <Step num={stepNum++} label="Add He"
                      value={`Fill to ${disp(cumO2He)}`}
                      note="Cumulative" />
                  )}
                  <Step num={stepNum} label={`Add ${bO2TopN}% O₂ gas (${gasLabel(bO2TopN)})`}
                    value={`Fill to ${bPres} ${pUnit}`}
                    note={`Final: O₂ ${fmt(buildResult.finalO2, 1)}% · He ${fmt(buildResult.finalHe, 1)}% · N₂ ${fmt(buildResult.finalN2, 1)}%`} />
                </Card>
              );
            })() : bO2 !== '' ? (
              <Card><Text style={sub.emptyText}>
                Check values — top-off gas O₂% must be less than target O₂%, and O₂ + He ≤ 100%.
              </Text></Card>
            ) : (
              <Card><Text style={sub.emptyText}>Enter target O₂ %, He %, fill pressure, and top-off gas O₂%.</Text></Card>
            )}
          </>}

          {/* ── Top-Off to Target ── */}
          {mode === 'topoff' && <>
            <SL label="Current Tank" />
            <Card variant="input">
              <F label={`Current Pressure (${pUnit})`} value={tP1} onChange={setTP1}
                 placeholder={imp ? '1500' : '100'} />
              <D />
              <F label="Current O₂ %" value={tO2cur} onChange={setTO2cur} placeholder="23" />
            </Card>

            <SL label="Target" />
            <Card variant="input">
              <F label="Target O₂ %" value={tO2tgt} onChange={setTO2tgt} placeholder="34" />
              <D />
              <F label={`Target Pressure (${pUnit})`} value={tPFinal} onChange={setTPFinal}
                 placeholder={imp ? '3000' : '200'} />
            </Card>

            <SL label="Available Gases" />
            <Card variant="input">
              <F label="Gas 1 O₂ % (e.g. 40 for EAN40)" value={tGasA} onChange={setTGasA} placeholder="40" />
              <D />
              <F label="Gas 2 O₂ % (e.g. 21 for air)"   value={tGasB} onChange={setTGasB} placeholder="21" />
            </Card>

            <SL label="Blend Instructions" />

            {/* Case 1: Direct top-off works */}
            {topResult != null && (() => {
              const { pA, pB, richIsA, cumAfterRich } = topResult;
              const richO2 = richIsA ? tGasAN : tGasBN;
              const leanO2 = richIsA ? tGasBN : tGasAN;
              const richP  = richIsA ? pA : pB;
              const leanP  = richIsA ? pB : pA;
              return (
                <Card variant="result">
                  {richP > 0.01 && (
                    <Step num={1}
                      label={`Add ${gasLabel(richO2)} (${richO2}% O₂)`}
                      value={`Fill to ${disp(cumAfterRich)}`}
                      note={`Adds ${disp(richP)}`} />
                  )}
                  {leanP > 0.01 && (
                    <Step num={richP > 0.01 ? 2 : 1}
                      label={`Add ${gasLabel(leanO2)} (${leanO2}% O₂)`}
                      value={`Fill to ${disp(tPFinB!)}`}
                      note={`Adds ${disp(leanP)}`} />
                  )}
                  <FinalBadge o2={topResult.resultO2} n2={topResult.resultN2} />
                </Card>
              );
            })()}

            {/* Case 2: Just bleed to target pressure (O₂ already correct) */}
            {justBleed && tP1B != null && tPFinB != null && (
              <Card variant="result">
                <BleedBanner reason="Tank pressure exceeds target — bleed to target pressure." />
                <Step num={1}
                  label="Bleed tank to target pressure"
                  value={`Release to ${disp(tPFinB)}`}
                  note={`Current: ${disp(tP1B)} → release ${disp(tP1B - tPFinB)}`} />
                <View style={sub.finalRow}>
                  <View style={[sub.finalBadge, { flex: 1 }]}>
                    <Text style={sub.finalLabel}>Result</Text>
                    <Text style={sub.finalValue}>{tO2tgtN}% O₂ at {disp(tPFinB)}</Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Case 3: Bleed & blend required */}
            {!topResult && !justBleed && autoBleedResult != null && autoBleedP != null
              && tP1B != null && tPFinB != null && (() => {
              const { pA, pB, richIsA, cumAfterRich } = autoBleedResult;
              const richO2 = richIsA ? tGasAN : tGasBN;
              const leanO2 = richIsA ? tGasBN : tGasAN;
              const richP  = richIsA ? pA : pB;
              const leanP  = richIsA ? pB : pA;
              const bleedFrom = disp(tP1B);
              const bleedTo   = disp(autoBleedP);
              const bleedAmt  = disp(tP1B - autoBleedP);
              let step = 2;
              return (
                <Card variant="result">
                  <BleedBanner reason={`Current O₂ (${tO2curN}%) is too high to reach target (${tO2tgtN}%) by top-off alone. Bleed first, then fill.`} />
                  <Step num={1}
                    label="Bleed tank"
                    value={`Release to ${bleedTo}`}
                    note={`From ${bleedFrom} — release ${bleedAmt} of gas`} />
                  {richP > 0.01 && (
                    <Step num={step++}
                      label={`Add ${gasLabel(richO2)} (${richO2}% O₂)`}
                      value={`Fill to ${disp(cumAfterRich)}`}
                      note={`Adds ${disp(richP)}`} />
                  )}
                  {leanP > 0.01 && (
                    <Step num={step}
                      label={`Add ${gasLabel(leanO2)} (${leanO2}% O₂)`}
                      value={`Fill to ${disp(tPFinB)}`}
                      note={`Adds ${disp(leanP)}`} />
                  )}
                  <FinalBadge o2={autoBleedResult.resultO2} n2={autoBleedResult.resultN2} />
                </Card>
              );
            })()}

            {/* Case 4: No solution possible */}
            {topResult == null && !justBleed && autoBleedResult == null && topHasInputs && (
              <Card><Text style={sub.emptyText}>
                {twoGasError(tO2tgtN, tGasAN, tGasBN)}
              </Text></Card>
            )}

            {/* Empty state */}
            {!topHasInputs && (
              <Card><Text style={sub.emptyText}>
                Enter current tank, target O₂ %, and both available gases.{'\n'}
                Example: current 23% · target 34% · Gas 1 = 40% · Gas 2 = 21% (air)
              </Text></Card>
            )}
          </>}

          <DisclaimerText />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SegPicker<T>({ options, selected, onSelect }: {
  options: { v: T; l: string }[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={sp.container}>
      {options.map((o) => (
        <Pressable key={String(o.v)} style={[sp.option, selected === o.v && sp.optionActive]} onPress={() => onSelect(o.v)}>
          <Text style={[sp.label, selected === o.v && sp.labelActive]}>{o.l}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function BleedBanner({ reason }: { reason: string }) {
  return (
    <View style={sub.bleedBanner}>
      <Ionicons name="warning-outline" size={15} color="#FF9500" />
      <Text style={sub.bleedBannerText}>{reason}</Text>
    </View>
  );
}

function SL({ label }: { label: string }) {
  return <Text style={sub.label}>{label}</Text>;
}
function D() { return <View style={sub.divider} />; }
function F({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <View style={sub.field}>
      <Text style={sub.fieldLabel}>{label}</Text>
      <TextInput
        style={sub.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType="decimal-pad"
      />
    </View>
  );
}
function Step({
  num, label, value, note,
}: { num: number; label: string; value: string; note?: string }) {
  return (
    <View style={sub.step}>
      <View style={sub.stepNum}>
        <Text style={sub.stepNumText}>{num}</Text>
      </View>
      <View style={sub.stepBody}>
        <Text style={sub.stepLabel}>{label}</Text>
        <Text style={sub.stepValue}>{value}</Text>
        {note ? <Text style={sub.stepNote}>{note}</Text> : null}
      </View>
    </View>
  );
}
function FinalBadge({ o2, n2 }: { o2: number; n2: number }) {
  return (
    <View style={sub.finalRow}>
      <View style={sub.finalBadge}>
        <Text style={sub.finalLabel}>O₂</Text>
        <Text style={sub.finalValue}>{fmt(o2, 1)}%</Text>
      </View>
      <View style={sub.finalBadge}>
        <Text style={sub.finalLabel}>N₂</Text>
        <Text style={sub.finalValue}>{fmt(n2, 1)}%</Text>
      </View>
      <View style={[sub.finalBadge, { flex: 1 }]}>
        <Text style={sub.finalLabel}>Result</Text>
        <Text style={sub.finalValue}>{gasLabel(parseFloat(fmt(o2, 1)))}</Text>
      </View>
    </View>
  );
}

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
  label: { ...Typography.footnote, fontWeight: '500' as const, color: Colors.textSecondary },
  labelActive: { fontWeight: '700' as const, color: Colors.text },
});

const sub = StyleSheet.create({
  label: {
    ...Typography.footnote, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, marginHorizontal: 2,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  field: { paddingVertical: Spacing.xs },
  fieldLabel: { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 3 },
  input: { ...Typography.body, color: Colors.text, paddingVertical: Spacing.xs, minHeight: 36 },
  emptyText: {
    ...Typography.subhead, color: Colors.textSecondary,
    textAlign: 'center', paddingVertical: Spacing.lg, lineHeight: 22,
  },

  // Bleed banner
  bleedBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: 'rgba(255,149,0,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,149,0,0.25)',
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  bleedBannerText: {
    ...Typography.caption1, color: '#CC7700', flex: 1, lineHeight: 17,
  },

  // Steps
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.md },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.accentBlue, alignItems: 'center', justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: { ...Typography.subhead, fontWeight: '700', color: Colors.white },
  stepBody: { flex: 1 },
  stepLabel: { ...Typography.caption1, color: Colors.textSecondary },
  stepValue: { ...Typography.headline, color: Colors.accentBlue },
  stepNote: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },

  // Final badge
  finalRow: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md,
    paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  finalBadge: {
    backgroundColor: Colors.background, borderRadius: 8,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, alignItems: 'center',
  },
  finalLabel: { ...Typography.caption2, color: Colors.textSecondary, marginBottom: 2 },
  finalValue: { ...Typography.subhead, fontWeight: '700', color: Colors.accentBlue },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { ...Typography.headline, color: Colors.text, flex: 1, textAlign: 'center' },
  headerBack: { ...Typography.body, color: Colors.accentBlue },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
});
