import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SliderWithInput } from '@/src/ui/components/SliderWithInput';
import { DisclaimerText } from '@/src/ui/components/DisclaimerText';
import { Chip } from '@/src/ui/components/Chip';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';

const BAR_TO_PSI = 14.5038;
const L_TO_CUFT  = 0.0353147;
const M_TO_FT    = 3.28084;
const FT_TO_M    = 0.3048;

// ── Unit helpers ──────────────────────────────────────────────────────────────
function toBarDisp(bar: number, imp: boolean)  { return imp ? bar * BAR_TO_PSI : bar; }
function fromBarDisp(v: number, imp: boolean)  { return imp ? v / BAR_TO_PSI : v; }
function toTankDisp(L: number, imp: boolean)   { return imp ? L * L_TO_CUFT : L; }
function fromTankDisp(v: number, imp: boolean) { return imp ? v / L_TO_CUFT : v; }
function toDepthDisp(m: number, imp: boolean)  { return imp ? m * M_TO_FT : m; }
function fromDepthDisp(v: number, imp: boolean){ return imp ? v * FT_TO_M : v; }
function fmtBar(bar: number, imp: boolean)     { return imp ? `${Math.round(bar * BAR_TO_PSI)} psi` : `${Math.round(bar)} bar`; }
function fmtVol(L: number, imp: boolean)       { return imp ? `${(L * L_TO_CUFT).toFixed(1)} cuft` : `${Math.round(L)} L`; }

// Gas volume conversion (critical: metric = bar×L, imperial = rated cuft at fill)
function gasVolume(pressureBar: number, tankL: number, fillBar: number, imp: boolean): number {
  if (imp) {
    const tankCuft = tankL * L_TO_CUFT;
    return (pressureBar / fillBar) * tankCuft / L_TO_CUFT;  // returns L
  }
  return pressureBar * tankL;
}
function pressureFromVol(volL: number, tankL: number, fillBar: number, imp: boolean): number {
  if (imp) {
    const tankCuft = tankL * L_TO_CUFT;
    return (volL * L_TO_CUFT / tankCuft) * fillBar;
  }
  return volL / tankL;
}

type TpMode = 'thirds' | 'rockbottom' | 'gasmatching';

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TurnPressureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [useMetric, setUseMetric] = useState(true);
  const imp = !useMetric;
  const [mode, setMode] = useState<TpMode>('thirds');

  // Rule of Thirds
  const [tStartBar, setTStartBar] = useState(200);
  const [tTankL,    setTTankL]    = useState(12);

  // Rock Bottom
  const [rbDepthM,   setRbDepthM]   = useState(30);
  const [rbRmv,      setRbRmv]      = useState(20);
  const [rbAscRate,  setRbAscRate]  = useState(9);
  const [rbStop,     setRbStop]     = useState(3);
  const [rbProbMin,  setRbProbMin]  = useState(1);
  const [rbBuddies,  setRbBuddies]  = useState(2);
  const [rbTankL,    setRbTankL]    = useState(12);
  const [rbStartBar, setRbStartBar] = useState(200);
  const rbFillBar = 200;

  // Gas Matching
  const [gm1Rmv,   setGm1Rmv]   = useState(18);
  const [gm1TankL, setGm1TankL] = useState(12);
  const [gm1Start, setGm1Start] = useState(200);
  const [gm2Rmv,   setGm2Rmv]   = useState(22);
  const [gm2TankL, setGm2TankL] = useState(11);
  const [gm2Start, setGm2Start] = useState(200);
  const [gmDepthM, setGmDepthM] = useState(25);
  const gmFill = 200;

  // Pressure slider props
  const pMin = imp ? 1500 : 100;
  const pMax = imp ? 4500 : 300;
  const pStp = imp ? 100  : 10;
  const pSfx = imp ? 'psi' : 'bar';
  // Tank slider props
  const tMin = imp ? 40 : 6;
  const tMax = imp ? 120 : 18;
  const tStp = imp ? 5  : 1;
  const tSfx = imp ? 'cuft' : 'L';
  // Depth slider props
  const dMin = imp ? 15  : 5;
  const dMax = imp ? 330 : 100;
  const dStp = imp ? 5   : 1;
  const dSfx = imp ? 'ft' : 'm';

  // ── Rule of Thirds calculations ────────────────────────────────────────────
  const tTurn    = tStartBar * (2 / 3);
  const tReserve = tStartBar * (1 / 3);
  const tUsableL = gasVolume(tStartBar - tReserve, tTankL, 200, imp);

  // ── Rock Bottom calculations ───────────────────────────────────────────────
  const rbAmb      = rbDepthM / 10 + 1;
  const rbStopAmb  = 1.5;  // 5m
  const rbAvgAmb   = (rbAmb + rbStopAmb) / 2;
  const rbStressed = rbRmv * rbBuddies;
  const rbP1 = rbStressed * rbAmb * rbProbMin;
  const rbP2 = rbStressed * rbAvgAmb * ((rbDepthM - 5) / rbAscRate);
  const rbP3 = rbStressed * rbStopAmb * rbStop;
  const rbP4 = rbStressed * ((rbStopAmb + 1) / 2) * (5 / rbAscRate);
  const rbTotalL   = rbP1 + rbP2 + rbP3 + rbP4;
  const rbReserveBar = pressureFromVol(rbTotalL, rbTankL, rbFillBar, imp);
  const rbTurnBar  = rbStartBar - (rbStartBar - rbReserveBar) / 2;
  const rbAscentMin = (rbDepthM - 5) / rbAscRate + rbStop + 5 / rbAscRate;

  // ── Gas Matching calculations ──────────────────────────────────────────────
  const gmAmb = gmDepthM / 10 + 1;
  const gm1Rate = gm1Rmv * gmAmb;
  const gm2Rate = gm2Rmv * gmAmb;
  const gm1TotalL = gasVolume(gm1Start, gm1TankL, gmFill, imp);
  const gm2TotalL = gasVolume(gm2Start, gm2TankL, gmFill, imp);
  const gm1Empty  = gm1TotalL / gm1Rate;
  const gm2Empty  = gm2TotalL / gm2Rate;
  const turnTime  = Math.min(gm1Empty, gm2Empty) * (2 / 3);
  const gm1Consumed = gm1Rate * turnTime;
  const gm2Consumed = gm2Rate * turnTime;
  const gm1PRate = imp ? gm1Rate * gmFill / gm1TotalL : gm1Rate / gm1TankL;
  const gm2PRate = imp ? gm2Rate * gmFill / gm2TotalL : gm2Rate / gm2TankL;
  const gm1TurnBar = Math.max(0, gm1Start - gm1PRate * turnTime);
  const gm2TurnBar = Math.max(0, gm2Start - gm2PRate * turnTime);
  const d1First = gm1Empty < gm2Empty;

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={s.headerBtn}>
          <Text style={s.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Turn Pressure</Text>
        <View style={s.headerBtn} />
      </View>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SegPicker
            options={[{ v: 'metric', l: 'Metric' }, { v: 'imperial', l: 'Imperial' }]}
            selected={useMetric ? 'metric' : 'imperial'}
            onSelect={(v) => setUseMetric(v === 'metric')}
          />

          {/* Mode pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pillRow}>
            {([
              { id: 'thirds',      label: 'Rule of Thirds' },
              { id: 'rockbottom',  label: 'Rock Bottom'    },
              { id: 'gasmatching', label: 'Gas Matching'   },
            ] as const).map((m) => (
              <Chip
                key={m.id}
                label={m.label}
                selected={mode === m.id}
                onPress={() => setMode(m.id)}
              />
            ))}
          </ScrollView>

          {/* ── Rule of Thirds ── */}
          {mode === 'thirds' && (
            <>
              <InputCard>
                <SliderWithInput
                  label="Start Pressure" value={toBarDisp(tStartBar, imp)}
                  min={pMin} max={pMax} step={pStp} suffix={pSfx} decimals={0}
                  onChange={(v) => setTStartBar(fromBarDisp(v, imp))}
                />
                <CD />
                <SliderWithInput
                  label="Tank Size" value={toTankDisp(tTankL, imp)}
                  min={tMin} max={tMax} step={tStp} suffix={tSfx} decimals={0}
                  onChange={(v) => setTTankL(fromTankDisp(v, imp))}
                />
              </InputCard>
              <ResultCard>
                <Text style={r.heading}>Rule of Thirds</Text>
                {/* 3-segment bar */}
                <View style={r.segBar}>
                  <View style={[r.segOut,  { flex: 1 }]}><Text style={r.segLabel}>Out</Text></View>
                  <View style={[r.segBack, { flex: 1 }]}><Text style={r.segLabel}>Back</Text></View>
                  <View style={[r.segRes,  { flex: 1 }]}><Text style={r.segLabel}>Reserve</Text></View>
                </View>
                <View style={r.twoCol}>
                  <ResultValue value={fmtBar(tTurn, imp)}    label="Turn At" />
                  <ResultValue value={fmtBar(tReserve, imp)} label="Reserve" />
                </View>
                <Text style={r.sub}>Usable gas: {fmtVol(tUsableL, imp)}</Text>
                <Text style={r.tertiary}>1/3 out, 1/3 back, 1/3 reserve</Text>
              </ResultCard>
            </>
          )}

          {/* ── Rock Bottom ── */}
          {mode === 'rockbottom' && (
            <>
              <InputCard>
                <SliderWithInput
                  label="Depth" value={toDepthDisp(rbDepthM, imp)}
                  min={dMin} max={dMax} step={dStp} suffix={dSfx} decimals={0}
                  onChange={(v) => setRbDepthM(fromDepthDisp(v, imp))}
                />
                <CD />
                <SliderWithInput label="Stressed RMV" value={rbRmv} min={10} max={40} step={1} suffix="L/min" decimals={0} onChange={setRbRmv} />
                <CD />
                <SliderWithInput label="Ascent Rate" value={rbAscRate} min={3} max={18} step={1} suffix="m/min" decimals={0} onChange={setRbAscRate} />
                <CD />
                <SliderWithInput label="Safety Stop" value={rbStop} min={0} max={5} step={1} suffix="min" decimals={0} onChange={setRbStop} />
                <CD />
                <SliderWithInput label="Problem Solving" value={rbProbMin} min={0} max={5} step={1} suffix="min" decimals={0} onChange={setRbProbMin} />
                <CD />
                <SliderWithInput label="Sharing With" value={rbBuddies} min={1} max={3} step={1} suffix="divers" decimals={0} onChange={setRbBuddies} />
              </InputCard>
              <InputCard>
                <SliderWithInput
                  label="Tank Size" value={toTankDisp(rbTankL, imp)}
                  min={tMin} max={tMax} step={tStp} suffix={tSfx} decimals={0}
                  onChange={(v) => setRbTankL(fromTankDisp(v, imp))}
                />
                <CD />
                <SliderWithInput
                  label="Start Pressure" value={toBarDisp(rbStartBar, imp)}
                  min={pMin} max={pMax} step={pStp} suffix={pSfx} decimals={0}
                  onChange={(v) => setRbStartBar(fromBarDisp(v, imp))}
                />
              </InputCard>
              <ResultCard>
                <Text style={r.heading}>Rock Bottom Calculation</Text>
                <View style={r.twoCol}>
                  <ResultValue value={fmtBar(rbReserveBar, imp)} label="Min Reserve" />
                  <ResultValue value={fmtBar(rbTurnBar, imp)}    label="Turn At" />
                </View>
                <CD />
                <Text style={r.bkHeader}>Gas Reserve Breakdown</Text>
                <BkRow label="Problem solving at depth"     value={fmtVol(rbP1, imp)} bold={false} />
                <BkRow label="Ascent to safety stop"        value={fmtVol(rbP2, imp)} bold={false} />
                <BkRow label={`Safety stop (${rbStop} min)`} value={fmtVol(rbP3, imp)} bold={false} />
                <BkRow label="Final ascent to surface"      value={fmtVol(rbP4, imp)} bold={false} />
                <CD />
                <BkRow label="Total reserve needed" value={fmtVol(rbTotalL, imp)} bold />
                <Text style={r.sub}>Total ascent time: {rbAscentMin.toFixed(1)} min</Text>
                {rbReserveBar > rbStartBar * 0.5 && (
                  <View style={r.warnRow}>
                    <Ionicons name="warning" size={13} color={Colors.warning} />
                    <Text style={[r.warnText, { color: Colors.warning }]}>
                      Reserve exceeds 50% of fill — consider a larger tank
                    </Text>
                  </View>
                )}
              </ResultCard>
            </>
          )}

          {/* ── Gas Matching ── */}
          {mode === 'gasmatching' && (
            <>
              <InputCard>
                <Text style={r.bkHeader}>Diver 1</Text>
                <SliderWithInput label="RMV" value={gm1Rmv} min={8} max={35} step={1} suffix="L/min" decimals={0} onChange={setGm1Rmv} />
                <CD />
                <SliderWithInput
                  label="Tank Size" value={toTankDisp(gm1TankL, imp)}
                  min={tMin} max={tMax} step={tStp} suffix={tSfx} decimals={0}
                  onChange={(v) => setGm1TankL(fromTankDisp(v, imp))}
                />
                <CD />
                <SliderWithInput
                  label="Start Pressure" value={toBarDisp(gm1Start, imp)}
                  min={pMin} max={pMax} step={pStp} suffix={pSfx} decimals={0}
                  onChange={(v) => setGm1Start(fromBarDisp(v, imp))}
                />
              </InputCard>
              <InputCard>
                <Text style={r.bkHeader}>Diver 2</Text>
                <SliderWithInput label="RMV" value={gm2Rmv} min={8} max={35} step={1} suffix="L/min" decimals={0} onChange={setGm2Rmv} />
                <CD />
                <SliderWithInput
                  label="Tank Size" value={toTankDisp(gm2TankL, imp)}
                  min={tMin} max={tMax} step={tStp} suffix={tSfx} decimals={0}
                  onChange={(v) => setGm2TankL(fromTankDisp(v, imp))}
                />
                <CD />
                <SliderWithInput
                  label="Start Pressure" value={toBarDisp(gm2Start, imp)}
                  min={pMin} max={pMax} step={pStp} suffix={pSfx} decimals={0}
                  onChange={(v) => setGm2Start(fromBarDisp(v, imp))}
                />
              </InputCard>
              <InputCard>
                <SliderWithInput
                  label="Dive Depth" value={toDepthDisp(gmDepthM, imp)}
                  min={dMin} max={dMax} step={dStp} suffix={dSfx} decimals={0}
                  onChange={(v) => setGmDepthM(fromDepthDisp(v, imp))}
                />
              </InputCard>
              <ResultCard>
                <Text style={r.heading}>Gas Matching</Text>
                <View style={r.gmWhoRow}>
                  <Ionicons name="people" size={18} color={Colors.accentBlue} />
                  <Text style={r.gmWho}>Diver {d1First ? 1 : 2} runs out first</Text>
                </View>
                <Text style={r.gmTurn}>Turn at {Math.floor(turnTime)} min</Text>
                <CD />
                <View style={r.gmDivers}>
                  <View style={r.gmDiverCol}>
                    <Text style={r.gmDiverTitle}>Diver 1</Text>
                    <ResultValue value={fmtBar(gm1TurnBar, imp)} label="Turn At" />
                    <Text style={r.gmGasMin}>{Math.floor(gm1Empty)} min gas</Text>
                  </View>
                  <View style={r.gmDivider} />
                  <View style={r.gmDiverCol}>
                    <Text style={r.gmDiverTitle}>Diver 2</Text>
                    <ResultValue value={fmtBar(gm2TurnBar, imp)} label="Turn At" />
                    <Text style={r.gmGasMin}>{Math.floor(gm2Empty)} min gas</Text>
                  </View>
                </View>
              </ResultCard>
            </>
          )}

          <DisclaimerText text="For planning reference only. Always follow your training agency's gas management protocols." />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SegPicker({ options, selected, onSelect }: {
  options: { v: string; l: string }[]; selected: string; onSelect: (v: string) => void;
}) {
  return (
    <View style={sp.container}>
      {options.map((o) => (
        <Pressable key={o.v} style={[sp.option, selected === o.v && sp.optActive]} onPress={() => onSelect(o.v)}>
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

function CD() {
  return <View style={c.divider} />;
}

function ResultValue({ value, label }: { value: string; label: string }) {
  return (
    <View style={r.valCol}>
      <Text style={r.valNum}>{value}</Text>
      <Text style={r.valLabel}>{label}</Text>
    </View>
  );
}

function BkRow({ label, value, bold }: { label: string; value: string; bold: boolean }) {
  return (
    <View style={r.bkRow}>
      <Text style={[r.bkLabel, bold && r.bkLabelBold]}>{label}</Text>
      <Text style={[r.bkVal, bold && r.bkValBold]}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const sp = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: Colors.border, borderRadius: Radius.sm, padding: 2 },
  option: { flex: 1, paddingVertical: Spacing.xs + 2, alignItems: 'center', borderRadius: Radius.sm - 2 },
  optActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 2, elevation: 2,
  },
  label: { ...(Typography.footnote as TextStyle), fontWeight: '500' as const, color: Colors.textSecondary },
  labelActive: { fontWeight: '700' as const, color: Colors.text },
});

const c = StyleSheet.create({
  card: { borderRadius: Radius.md, padding: Spacing.lg, overflow: 'hidden' },
  cardAndroid: { backgroundColor: 'rgba(255,255,255,0.92)' },
  result: { backgroundColor: Colors.accentBlueLight, borderRadius: Radius.md, padding: Spacing.lg },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
});

const r = StyleSheet.create({
  heading: { ...(Typography.subhead as TextStyle), color: Colors.textSecondary, marginBottom: Spacing.md },
  twoCol: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
  valCol: { alignItems: 'center', gap: 2 },
  valNum: { ...(Typography.title3 as TextStyle), color: Colors.accentBlue, fontVariant: ['tabular-nums'] } as TextStyle,
  valLabel: { ...(Typography.caption2 as TextStyle), color: Colors.textSecondary },
  sub: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  tertiary: { ...(Typography.caption2 as TextStyle), color: Colors.textTertiary, textAlign: 'center', marginTop: 2 } as TextStyle,
  // Segment bar
  segBar: { flexDirection: 'row', height: 28, borderRadius: 6, overflow: 'hidden', marginBottom: Spacing.md },
  segOut:  { backgroundColor: 'rgba(52,199,89,0.6)',   alignItems: 'center', justifyContent: 'center' },
  segBack: { backgroundColor: 'rgba(255,204,0,0.6)',   alignItems: 'center', justifyContent: 'center' },
  segRes:  { backgroundColor: 'rgba(255,59,48,0.4)',   alignItems: 'center', justifyContent: 'center' },
  segLabel: { ...(Typography.caption2 as TextStyle), fontWeight: '700' as const, color: Colors.text },
  // Rock bottom breakdown
  bkHeader: { ...(Typography.caption1 as TextStyle), fontWeight: '700' as const, color: Colors.textSecondary, marginBottom: Spacing.xs },
  bkRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  bkLabel: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, flex: 1 },
  bkLabelBold: { fontWeight: '700' as const, color: Colors.text },
  bkVal: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, fontVariant: ['tabular-nums'] } as TextStyle,
  bkValBold: { fontWeight: '700' as const, color: Colors.text } as TextStyle,
  warnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: Spacing.sm },
  warnText: { ...(Typography.caption1 as TextStyle), flex: 1 },
  // Gas matching
  gmWhoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  gmWho: { ...(Typography.subhead as TextStyle), fontWeight: '700' as const, color: Colors.text },
  gmTurn: { ...(Typography.title2 as TextStyle), color: Colors.accentBlue, textAlign: 'center', marginBottom: Spacing.sm, fontVariant: ['tabular-nums'] } as TextStyle,
  gmDivers: { flexDirection: 'row', alignItems: 'stretch' },
  gmDiverCol: { flex: 1, alignItems: 'center', gap: 4 },
  gmDivider: { width: 1, backgroundColor: Colors.border, height: 60, alignSelf: 'center' as any },
  gmDiverTitle: { ...(Typography.caption1 as TextStyle), fontWeight: '700' as const, color: Colors.text },
  gmGasMin: { ...(Typography.caption2 as TextStyle), color: Colors.textSecondary } as TextStyle,
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
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.xl },
  pillRow: { gap: Spacing.xs, paddingHorizontal: 2, paddingBottom: 2 },
});
