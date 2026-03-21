import React, { useMemo, useState } from 'react';
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
import Svg, { Path, Polyline, Line, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/src/ui/components/Card';
import { SliderWithInput } from '@/src/ui/components/SliderWithInput';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { DisclaimerText } from '@/src/ui/components/DisclaimerText';
import { CylinderPicker } from '@/src/ui/components/CylinderPicker';
import { Cylinder, DEFAULT_CYLINDER } from '@/src/data/cylinders';

// ── ZHL-16C Bühlmann coefficients (16 compartments) ───────────────────────────
const N2_HT = [5, 8, 12.5, 18.5, 27, 38.3, 54.3, 77, 109, 146, 187, 239, 305, 390, 498, 635];
const HE_HT = [1.88, 3.02, 4.72, 6.99, 10.21, 14.48, 20.53, 29.11, 41.20, 55.19, 70.69, 90.34, 115.29, 147.42, 188.24, 240.03];
const N2_A  = [1.2599, 1.0000, 0.8618, 0.7562, 0.6200, 0.5043, 0.4410, 0.4000, 0.3750, 0.3500, 0.3295, 0.3065, 0.2835, 0.2610, 0.2480, 0.2327];
const N2_B  = [0.5050, 0.6514, 0.7222, 0.7825, 0.8126, 0.8434, 0.8693, 0.8910, 0.9092, 0.9222, 0.9319, 0.9403, 0.9477, 0.9544, 0.9602, 0.9653];
const HE_A  = [1.7424, 1.3830, 1.1919, 1.0458, 0.9220, 0.8205, 0.7305, 0.6502, 0.5950, 0.5545, 0.5333, 0.5189, 0.5181, 0.5176, 0.5172, 0.5119];
const HE_B  = [0.4245, 0.5747, 0.6527, 0.7223, 0.7582, 0.7957, 0.8279, 0.8553, 0.8757, 0.8903, 0.8997, 0.9073, 0.9122, 0.9171, 0.9217, 0.9267];

const PH2O        = 0.0627;
const P_SURF      = 1.01325;
const ASCENT_RATE = 9;
const DESCENT_RATE  = 18;
const STOP_INTERVAL = 3;

// ── Presets ────────────────────────────────────────────────────────────────────
const GF_PRESETS = [
  { label: 'Conservative', lo: 30, hi: 70 },
  { label: 'Moderate',     lo: 40, hi: 85 },
  { label: 'Default',      lo: 50, hi: 90 },
  { label: 'Aggressive',   lo: 65, hi: 95 },
] as const;

const GAS_PRESETS = [
  { label: 'Air',      o2: 21, he: 0  },
  { label: 'EAN32',    o2: 32, he: 0  },
  { label: 'EAN36',    o2: 36, he: 0  },
  { label: 'EAN50',    o2: 50, he: 0  },
  { label: '18/45 Tx', o2: 18, he: 45 },
  { label: '21/35 Tx', o2: 21, he: 35 },
] as const;


// ── Interfaces ─────────────────────────────────────────────────────────────────
/** Internal algo gas representation */
interface GasSpec { fO2: number; fHe: number; fN2: number; }
/** UI state gas entry */
interface GasEntry { o2Pct: number; hePct: number; }

// ── Physics helpers ────────────────────────────────────────────────────────────
function cnsRate(pO2: number): number {
  if (pO2 < 0.5) return 0;
  const table: [number, number][] = [
    [0.6, 720], [0.7, 570], [0.8, 450], [0.9, 360],
    [1.0, 300], [1.1, 240], [1.2, 210], [1.3, 180],
    [1.4, 150], [1.5, 120], [Infinity, 45],
  ];
  for (const [thresh, limit] of table) {
    if (pO2 <= thresh) return 100 / limit;
  }
  return 100 / 45;
}

function otuRate(pO2: number): number {
  return pO2 <= 0.5 ? 0 : Math.pow((pO2 - 0.5) / 0.5, 5 / 6);
}

function gasDensity(fO2: number, fHe: number, pAmbBar: number): number {
  const fN2 = Math.max(0, 1 - fO2 - fHe);
  return pAmbBar * (fO2 * 32 + fN2 * 28 + fHe * 4) / 24.04;
}

// ── Compartment model ─────────────────────────────────────────────────────────
interface Comp { pN2: number; pHe: number; }

function initComps(fN2: number, fHe: number): Comp[] {
  const pN2 = (P_SURF - PH2O) * fN2;
  const pHe = (P_SURF - PH2O) * fHe;
  return Array.from({ length: 16 }, () => ({ pN2, pHe }));
}

function stepComps(comps: Comp[], pAlvN2: number, pAlvHe: number, dt: number): Comp[] {
  return comps.map((c, i) => ({
    pN2: c.pN2 + (pAlvN2 - c.pN2) * (1 - Math.exp(-Math.LN2 * dt / N2_HT[i])),
    pHe: c.pHe + (pAlvHe - c.pHe) * (1 - Math.exp(-Math.LN2 * dt / HE_HT[i])),
  }));
}

function ceilingM(comps: Comp[], gf: number, mPerBar: number): number {
  let maxP = P_SURF;
  for (let i = 0; i < 16; i++) {
    const pT = comps[i].pN2 + comps[i].pHe;
    if (pT <= 0) continue;
    const a = (comps[i].pN2 * N2_A[i] + comps[i].pHe * HE_A[i]) / pT;
    const b = (comps[i].pN2 * N2_B[i] + comps[i].pHe * HE_B[i]) / pT;
    const cP = (pT - a * gf) / (gf / b + 1 - gf);
    if (cP > maxP) maxP = cP;
  }
  return Math.max(0, (maxP - P_SURF) * mPerBar);
}

// ── Gas selection & MOD ────────────────────────────────────────────────────────
/** At a given depth, pick the richest gas whose ppO2 ≤ 1.6 bar. */
function selectGasIdx(gases: GasSpec[], depthM: number, mPerBar: number): number {
  const pAmb = P_SURF + depthM / mPerBar;
  let best = 0;
  for (let i = 1; i < gases.length; i++) {
    if (pAmb * gases[i].fO2 <= 1.6 && gases[i].fO2 > gases[best].fO2) {
      best = i;
    }
  }
  return best;
}

/** Maximum operating depth (metres) for a given fO2 and ppO2 limit. */
function gasModM(fO2: number, ppO2Limit = 1.4): number {
  if (fO2 <= 0) return 0;
  return Math.round(((ppO2Limit / fO2) - 1) * 10);
}

// ── Main decompression algorithm ──────────────────────────────────────────────
export interface DecoStop  { depth: number; time: number; gasIdx: number; }
export interface DecoResult {
  stops:           DecoStop[];
  gasLiters:       number[];    // surface-equivalent litres consumed per gas
  gasMaxPpO2:      number[];    // max ppO2 seen per gas
  ndlRemainingMin: number | null;
  totalDecoMin:    number;
  totalAscentMin:  number;
  cns:             number;
  otu:             number;
  density:         number;
  firstStopM:      number;
  requiresDeco:    boolean;
  descentMin:      number;
}

function computeDeco(
  depthM: number, bottomMin: number,
  gases: GasSpec[],
  gfLo: number, gfHi: number,
  saltwater: boolean, ccr: boolean, setpoint: number,
  sacLpm: number,
): DecoResult {
  const mPerBar = saltwater ? 10.0 : 10.3;
  const barPerM = 1 / mPerBar;

  // Always initialise with air-saturated tissues (diver surfaced on air)
  let comps = initComps(0.79, 0);
  let cns = 0, otu = 0, totalDecoMin = 0, totalAscentMin = 0, firstStopM = 0;
  const gasLiters:  number[] = gases.map(() => 0);
  const gasMaxPpO2: number[] = gases.map(() => 0);

  function alvAtGas(d: number, g: GasSpec) {
    const pAmb = P_SURF + d * barPerM;
    if (ccr && (g.fN2 + g.fHe) > 0) {
      const sp     = Math.min(setpoint, pAmb - PH2O);
      const rem    = Math.max(0, pAmb - PH2O - sp);
      const dilSum = g.fN2 + g.fHe;
      return { pO2: sp, pAlvN2: rem * g.fN2 / dilSum, pAlvHe: rem * g.fHe / dilSum, pAmb };
    }
    return {
      pO2:    (pAmb - PH2O) * g.fO2,
      pAlvN2: (pAmb - PH2O) * g.fN2,
      pAlvHe: (pAmb - PH2O) * g.fHe,
      pAmb,
    };
  }

  // Traverse a depth segment, optionally locking the gas index.
  // If fixedGasIdx is undefined, uses gas-switching logic (OC ascent).
  function simSeg(fromM: number, toM: number, rateM: number, fixedGasIdx?: number): number {
    if (fromM === toM) return 0;
    const totalT = Math.abs(toM - fromM) / rateM;
    let e = 0;
    while (e < totalT - 1e-9) {
      const dt = Math.min(0.5, totalT - e);
      const d  = fromM + (toM - fromM) * (e + dt / 2) / totalT;
      const gIdx = (fixedGasIdx !== undefined || ccr)
        ? (fixedGasIdx ?? 0)
        : selectGasIdx(gases, d, mPerBar);
      const { pO2, pAlvN2, pAlvHe, pAmb } = alvAtGas(d, gases[gIdx]);
      comps = stepComps(comps, pAlvN2, pAlvHe, dt);
      cns  += cnsRate(pO2) * dt;
      otu  += otuRate(pO2) * dt;
      gasLiters[gIdx]  += sacLpm * pAmb * dt;
      gasMaxPpO2[gIdx]  = Math.max(gasMaxPpO2[gIdx], pO2);
      e += dt;
    }
    return totalT;
  }

  // Descent: always bottom gas (index 0)
  const descentMin = simSeg(0, depthM, DESCENT_RATE, 0);

  // Bottom phase: always bottom gas
  const bot = alvAtGas(depthM, gases[0]);
  for (let t = 0; t < bottomMin; t++) {
    comps = stepComps(comps, bot.pAlvN2, bot.pAlvHe, 1);
    cns  += cnsRate(bot.pO2);
    otu  += otuRate(bot.pO2);
    gasLiters[0]  += sacLpm * bot.pAmb;
    gasMaxPpO2[0]  = Math.max(gasMaxPpO2[0], bot.pO2);
  }

  const density = gasDensity(gases[0].fO2, gases[0].fHe, P_SURF + depthM * barPerM);

  // NDL check
  let ndlExtra = 0;
  {
    let cc = comps.map(c => ({ ...c }));
    while (ndlExtra < 999) {
      cc = stepComps(cc, bot.pAlvN2, bot.pAlvHe, 1);
      if (ceilingM(cc, gfHi, mPerBar) > 0) break;
      ndlExtra++;
    }
  }

  const requiresDeco = ceilingM(comps, gfHi, mPerBar) > 0;
  const stopMap: Record<number, { time: number; gasIdx: number }> = {};

  if (requiresDeco) {
    let cur = depthM;
    const getGF = (d: number): number => {
      if (firstStopM <= 0) return gfLo;
      if (d <= 0) return gfHi;
      return gfHi + (gfLo - gfHi) * Math.min(d / firstStopM, 1);
    };
    while (cur > 0.001 && totalDecoMin < 2000) {
      const next = cur <= STOP_INTERVAL ? 0 : Math.floor((cur - 0.001) / STOP_INTERVAL) * STOP_INTERVAL;
      const gf   = getGF(next);
      const ceil = ceilingM(comps, gf, mPerBar);
      if (ceil <= next) {
        // Ascend to next stop — gas switching active for OC
        totalAscentMin += simSeg(cur, next, ASCENT_RATE);
        cur = next;
      } else {
        if (firstStopM <= 0) firstStopM = cur;
        const gIdx = ccr ? 0 : selectGasIdx(gases, cur, mPerBar);
        const s = alvAtGas(cur, gases[gIdx]);
        comps = stepComps(comps, s.pAlvN2, s.pAlvHe, 1);
        cns  += cnsRate(s.pO2);
        otu  += otuRate(s.pO2);
        totalDecoMin++;
        gasLiters[gIdx]  += sacLpm * s.pAmb;
        gasMaxPpO2[gIdx]  = Math.max(gasMaxPpO2[gIdx], s.pO2);
        if (stopMap[cur]) {
          stopMap[cur].time += 1;
        } else {
          stopMap[cur] = { time: 1, gasIdx: gIdx };
        }
      }
    }
  } else {
    // NDL dive: ascend with gas switching (deco gases can be used to off-gas faster)
    totalAscentMin = simSeg(depthM, 0, ASCENT_RATE);
  }

  const stops: DecoStop[] = Object.entries(stopMap)
    .map(([d, v]) => ({ depth: Number(d), time: v.time, gasIdx: v.gasIdx }))
    .sort((a, b) => b.depth - a.depth);

  return {
    stops, gasLiters, gasMaxPpO2,
    ndlRemainingMin: requiresDeco ? null : ndlExtra,
    totalDecoMin,
    totalAscentMin: Math.round(totalAscentMin),
    cns:    Math.min(999, cns),
    otu:    Math.round(otu),
    density,
    firstStopM,
    requiresDeco,
    descentMin: Math.round(descentMin),
  };
}

// ── Utilities ──────────────────────────────────────────────────────────────────
const FT_TO_M = 0.3048;

function fmtDepthM(m: number, metric: boolean): string {
  return metric ? `${m} m` : `${Math.round(m / FT_TO_M)} ft`;
}

function gasLabel(g: GasEntry): string {
  if (g.o2Pct === 21 && g.hePct === 0) return 'Air';
  if (g.hePct === 0) return `EAN${g.o2Pct}`;
  return `${g.o2Pct}/${g.hePct} Tx`;
}

// ── Screen ─────────────────────────────────────────────────────────────────────
type ModeId = 'oc' | 'ccr';

export default function DecoPlanner() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [useMetric, setUseMetric] = useState(true);
  const imp = !useMetric;

  const [mode, setMode]             = useState<ModeId>('oc');
  const [depthM, setDepthM]         = useState(30);
  const [bottomTime, setBottomTime] = useState(30);
  const [saltwater, setSaltwater]   = useState(true);
  const [setpoint, setSetpoint]     = useState(1.3);
  const [gfLo, setGfLo]             = useState(50);
  const [gfHi, setGfHi]             = useState(90);
  const [sacLpm, setSacLpm]         = useState(18);
  const [cylinder, setCylinder]     = useState<Cylinder>(DEFAULT_CYLINDER);
  const [gases, setGases]           = useState<GasEntry[]>([{ o2Pct: 21, hePct: 0 }]);
  const [calculated, setCalculated] = useState(false);

  const mPerBar    = saltwater ? 10.0 : 10.3;
  const depthDisplay = imp ? Math.round(depthM / FT_TO_M / 5) * 5 : depthM;
  const fmtDepth   = (m: number) => fmtDepthM(m, useMetric);

  const validGases = gases.every(g => g.o2Pct / 100 + g.hePct / 100 <= 1.0 && g.o2Pct >= 5);
  const canCalculate = validGases && gfLo <= gfHi && depthM > 0 && bottomTime > 0;

  function handleDepthChange(v: number) {
    setDepthM(imp ? v * FT_TO_M : v);
    setCalculated(false);
  }

  function updateGas(idx: number, o2Pct: number, hePct: number) {
    setGases(prev => prev.map((g, i) => i === idx ? { o2Pct, hePct } : g));
    setCalculated(false);
  }

  function addGas() {
    if (gases.length >= 4) return;
    setGases(prev => [...prev, { o2Pct: 50, hePct: 0 }]);
    setCalculated(false);
  }

  function removeGas(idx: number) {
    if (idx === 0) return;
    setGases(prev => prev.filter((_, i) => i !== idx));
    setCalculated(false);
  }

  function selectGFPreset(lo: number, hi: number) {
    setGfLo(lo); setGfHi(hi); setCalculated(false);
  }

  const result = useMemo<DecoResult | null>(() => {
    if (!calculated || !canCalculate) return null;
    const specs: GasSpec[] = gases.map(g => ({
      fO2: g.o2Pct / 100,
      fHe: g.hePct / 100,
      fN2: Math.max(0, 1 - g.o2Pct / 100 - g.hePct / 100),
    }));
    return computeDeco(depthM, bottomTime, specs, gfLo / 100, gfHi / 100, saltwater, mode === 'ccr', setpoint, sacLpm);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculated, depthM, bottomTime, gfLo, gfHi, saltwater, mode, setpoint, sacLpm, cylinder, canCalculate]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Deco Planner</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Metric / Imperial */}
          <SegPicker
            options={[{ v: true, l: 'Metric' }, { v: false, l: 'Imperial' }]}
            selected={useMetric}
            onSelect={(v) => { setUseMetric(v); setCalculated(false); }}
          />

          {/* Disclaimer */}
          <Card>
            <Text style={s.disclaimer}>
              Planning reference only. Bühlmann ZHL-16C with gradient factors. Not a substitute for certified deco training. Validate with a qualified instructor.
            </Text>
          </Card>

          {/* Mode: OC / CCR */}
          <SL label="Mode" />
          <SegPicker
            options={[{ v: 'oc' as ModeId, l: 'Open Circuit' }, { v: 'ccr' as ModeId, l: 'CCR Rebreather' }]}
            selected={mode}
            onSelect={(v) => { setMode(v); setCalculated(false); }}
          />

          {/* Dive Profile */}
          <SL label="Dive Profile" />
          <Card variant="input">
            <SliderWithInput
              label="Max Depth"
              value={depthDisplay}
              min={imp ? 10 : 3}
              max={imp ? 330 : 100}
              step={imp ? 5 : 1}
              suffix={imp ? 'ft' : 'm'}
              decimals={0}
              onChange={handleDepthChange}
            />
            <View style={s.divider} />
            <SliderWithInput
              label="Bottom Time"
              value={bottomTime}
              min={1}
              max={360}
              step={1}
              suffix="min"
              decimals={0}
              onChange={(v) => { setBottomTime(Math.round(v)); setCalculated(false); }}
            />
            <View style={s.divider} />
            <View style={s.waterRow}>
              <Text style={s.waterLabel}>Water Type</Text>
              <View style={s.waterBtns}>
                <WaterBtn label="Salt"  selected={saltwater}   onPress={() => { setSaltwater(true);  setCalculated(false); }} />
                <WaterBtn label="Fresh" selected={!saltwater}  onPress={() => { setSaltwater(false); setCalculated(false); }} />
              </View>
            </View>
          </Card>

          {/* Gas Configuration */}
          <SL label={mode === 'ccr' ? 'Diluent Gas' : 'Gas Configuration'} />
          {mode === 'ccr' ? (
            <GasCard
              entry={gases[0]}
              index={0}
              isBottomGas
              depthM={depthM}
              mPerBar={mPerBar}
              metric={useMetric}
              fmtDepth={fmtDepth}
              onChangeO2={(o2) => updateGas(0, o2, gases[0].hePct)}
              onChangeHe={(he) => updateGas(0, gases[0].o2Pct, he)}
              onRemove={() => {}}
            />
          ) : (
            <>
              {gases.map((g, i) => (
                <GasCard
                  key={i}
                  entry={g}
                  index={i}
                  isBottomGas={i === 0}
                  depthM={depthM}
                  mPerBar={mPerBar}
                  metric={useMetric}
                  fmtDepth={fmtDepth}
                  onChangeO2={(o2) => updateGas(i, o2, g.hePct)}
                  onChangeHe={(he) => updateGas(i, g.o2Pct, he)}
                  onRemove={() => removeGas(i)}
                />
              ))}
              {gases.length < 4 && (
                <Pressable style={s.addGasBtn} onPress={addGas}>
                  <Text style={s.addGasBtnText}>+ Add Deco Gas</Text>
                </Pressable>
              )}
            </>
          )}

          {/* CCR Setpoint */}
          {mode === 'ccr' && (
            <>
              <SL label="CCR Setpoint" />
              <Card variant="input">
                <SliderWithInput
                  label="ppO₂ Setpoint"
                  value={setpoint}
                  min={0.5}
                  max={1.6}
                  step={0.05}
                  suffix="bar"
                  decimals={2}
                  onChange={(v) => { setSetpoint(v); setCalculated(false); }}
                />
              </Card>
            </>
          )}

          {/* Gas Consumption */}
          {mode === 'oc' && (
            <>
              <SL label="Gas Consumption" />
              <Card variant="input">
                <SliderWithInput
                  label="SAC Rate"
                  value={sacLpm}
                  min={8}
                  max={30}
                  step={1}
                  suffix="L/min"
                  decimals={0}
                  onChange={(v) => { setSacLpm(Math.round(v)); setCalculated(false); }}
                />
                <View style={s.divider} />
                <CylinderPicker
                  label="Cylinder"
                  value={cylinder}
                  onChange={(c) => { setCylinder(c); setCalculated(false); }}
                />
              </Card>
            </>
          )}

          {/* Gradient Factors */}
          <SL label="Gradient Factors" />
          <Card variant="input">
            <View style={s.pillRow}>
              {GF_PRESETS.map(p => {
                const active = gfLo === p.lo && gfHi === p.hi;
                return (
                  <Pressable key={p.label} style={[s.pill, active && s.pillActive]}
                    onPress={() => selectGFPreset(p.lo, p.hi)}>
                    <Text style={[s.pillText, active && s.pillTextActive]}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={s.divider} />
            <SliderWithInput
              label="GF Low"
              value={gfLo}
              min={10} max={100} step={5} suffix="%" decimals={0}
              onChange={(v) => { setGfLo(Math.round(v)); setCalculated(false); }}
            />
            <View style={s.divider} />
            <SliderWithInput
              label="GF High"
              value={gfHi}
              min={10} max={100} step={5} suffix="%" decimals={0}
              onChange={(v) => { setGfHi(Math.round(v)); setCalculated(false); }}
            />
            {gfLo > gfHi && <Text style={s.validationWarn}>GF Low must be ≤ GF High</Text>}
            <Text style={s.gfHint}>{gfLo}/{gfHi}</Text>
          </Card>

          {/* Calculate Button */}
          <Pressable
            style={[s.calcBtn, !canCalculate && s.calcBtnDisabled]}
            onPress={() => { if (canCalculate) setCalculated(true); }}
            disabled={!canCalculate}
          >
            <Text style={s.calcBtnText}>Calculate</Text>
          </Pressable>

          {/* ── Results ── */}
          {result != null && (
            <>
              {/* Profile Chart */}
              <SL label="Dive Profile" />
              <Card>
                <ProfileChart result={result} depthM={depthM} bottomMin={bottomTime} fmtDepth={fmtDepth} />
              </Card>

              {/* Summary */}
              <SL label="Summary" />
              <Card variant="result">
                <View style={s.statRow}>
                  <StatBox
                    label={result.requiresDeco ? 'First Stop' : 'NDL Remaining'}
                    value={result.requiresDeco ? fmtDepth(result.firstStopM) : `${result.ndlRemainingMin ?? 0} min`}
                  />
                  <StatBox label="Total Deco"  value={result.requiresDeco ? `${result.totalDecoMin} min` : 'None'} />
                  <StatBox label="Ascent Time" value={`${result.totalAscentMin} min`} />
                </View>
                <View style={s.divider} />
                {result.requiresDeco ? (
                  <Text style={s.decoAlert}>Decompression dive — stops required</Text>
                ) : (
                  <Text style={s.ndlGood}>No deco stops · {result.ndlRemainingMin} min NDL remaining</Text>
                )}
              </Card>

              {/* Deco Table */}
              {result.requiresDeco && result.stops.length > 0 && (
                <>
                  <SL label="Decompression Schedule" />
                  <Card>
                    <View style={s.tableHeader}>
                      <Text style={[s.tableDepth, s.tableHead]}>Depth</Text>
                      <Text style={[s.tableGas,   s.tableHead]}>Gas</Text>
                      <Text style={[s.tableStop,  s.tableHead]}>Stop</Text>
                      <Text style={[s.tableRun,   s.tableHead]}>Run†</Text>
                    </View>
                    {result.stops.map((stop, idx) => {
                      const runTime = result.stops.slice(0, idx + 1).reduce((a, x) => a + x.time, 0);
                      const gName   = stop.gasIdx < gases.length ? gasLabel(gases[stop.gasIdx]) : 'Air';
                      const isDecoGas = stop.gasIdx > 0;
                      return (
                        <View key={stop.depth} style={[s.tableRow, idx % 2 === 1 && s.tableRowAlt]}>
                          <Text style={s.tableDepth}>{fmtDepth(stop.depth)}</Text>
                          <Text style={[s.tableGas, { color: isDecoGas ? '#30D158' : Colors.warning }]}>{gName}</Text>
                          <Text style={s.tableStop}>{stop.time} min</Text>
                          <Text style={s.tableRun}>{runTime} min</Text>
                        </View>
                      );
                    })}
                    <Text style={s.tableNote}>† Cumulative deco time from first stop</Text>
                  </Card>
                </>
              )}

              {/* Gas Plan */}
              {mode === 'oc' && (
                <>
                  <SL label="Gas Plan" />
                  <Card>
                    <View style={s.tableHeader}>
                      <Text style={[s.tableGasName, s.tableHead]}>Gas</Text>
                      <Text style={[s.tableGasCol,  s.tableHead]}>Litres</Text>
                      <Text style={[s.tableGasCol,  s.tableHead]}>Bar</Text>
                      <Text style={[s.tableGasCol,  s.tableHead]}>Max pO₂</Text>
                    </View>
                    {gases.map((g, i) => {
                      const litres  = Math.round(result.gasLiters[i]);
                      const bar     = Math.round(litres / cylinder.internalVolL);
                      const maxPpO2 = (result.gasMaxPpO2[i] ?? 0).toFixed(2);
                      if (litres === 0) return null;
                      return (
                        <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
                          <Text style={s.tableGasName}>{gasLabel(g)}</Text>
                          <Text style={s.tableGasCol}>{litres} L</Text>
                          <Text style={[s.tableGasCol, bar > 200 && s.warnText]}>{bar} bar</Text>
                          <Text style={[s.tableGasCol, parseFloat(maxPpO2) > 1.4 && s.warnText]}>{maxPpO2}</Text>
                        </View>
                      );
                    })}
                    <Text style={s.tableNote}>SAC {sacLpm} L/min · {cylinder.name} ({cylinder.internalVolL.toFixed(1)}L) · surface-equivalent volumes</Text>
                  </Card>
                </>
              )}

              {/* O₂ Toxicity & Gas Density */}
              <SL label="O₂ Toxicity & Gas Density" />
              <Card>
                <ToxRow label="CNS Oxygen"    value={`${result.cns.toFixed(1)}%`}        hint="Single-dive limit: 100%"       warn={result.cns >= 80}      danger={result.cns >= 100} />
                <View style={s.divider} />
                <ToxRow label="Pulmonary OTU" value={`${result.otu} OTU`}                 hint="Daily limit: 300–600 OTU"      warn={result.otu >= 300}     danger={result.otu >= 600} />
                <View style={s.divider} />
                <ToxRow label="Gas Density"   value={`${result.density.toFixed(2)} g/L`}  hint="Caution >5.2 g/L, limit >6.2 g/L" warn={result.density >= 5.2} danger={result.density >= 6.2} />
              </Card>
            </>
          )}

          <DisclaimerText />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── GasCard sub-component ──────────────────────────────────────────────────────
function GasCard({
  entry, index, isBottomGas, depthM, mPerBar, metric,
  fmtDepth, onChangeO2, onChangeHe, onRemove,
}: {
  entry:       GasEntry;
  index:       number;
  isBottomGas: boolean;
  depthM:      number;
  mPerBar:     number;
  metric:      boolean;
  fmtDepth:    (m: number) => string;
  onChangeO2:  (v: number) => void;
  onChangeHe:  (v: number) => void;
  onRemove:    () => void;
}) {
  const fO2        = entry.o2Pct / 100;
  const fHe        = entry.hePct / 100;
  const pAmb       = P_SURF + depthM / mPerBar;
  const ppO2Depth  = pAmb * fO2;
  const modAt14    = gasModM(fO2, 1.4);
  const modAt16    = gasModM(fO2, 1.6);
  const invalidMix = fO2 + fHe > 1.0 || fO2 < 0.05;

  const title = isBottomGas ? 'Bottom Gas' : `Deco Gas ${index}`;

  return (
    <View style={s.gasCardWrap}>
      <Card variant="input">
        {/* Header row */}
        <View style={s.gasCardHeader}>
          <Text style={s.gasCardTitle}>{title}</Text>
          {!isBottomGas && (
            <Pressable onPress={onRemove} style={s.gasRemoveBtn}>
              <Text style={s.gasRemoveText}>Remove</Text>
            </Pressable>
          )}
        </View>
        {/* Preset pills */}
        <View style={s.pillRow}>
          {GAS_PRESETS.map(p => {
            const active = entry.o2Pct === p.o2 && entry.hePct === p.he;
            return (
              <Pressable key={p.label} style={[s.pill, active && s.pillActive]}
                onPress={() => { onChangeO2(p.o2); onChangeHe(p.he); }}>
                <Text style={[s.pillText, active && s.pillTextActive]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={s.divider} />
        <SliderWithInput
          label="O₂"
          value={entry.o2Pct}
          min={isBottomGas ? 5 : 21}
          max={100}
          step={1}
          suffix="%"
          decimals={0}
          onChange={(v) => onChangeO2(Math.round(v))}
        />
        <View style={s.divider} />
        <SliderWithInput
          label="He"
          value={entry.hePct}
          min={0}
          max={Math.min(80, 100 - entry.o2Pct)}
          step={1}
          suffix="%"
          decimals={0}
          onChange={(v) => onChangeHe(Math.round(v))}
        />
        {/* Info chips */}
        <View style={s.gasInfoRow}>
          {isBottomGas ? (
            <>
              <GasInfoChip label="pO₂ at depth" value={`${ppO2Depth.toFixed(2)} bar`} warn={ppO2Depth > 1.4} />
              <GasInfoChip label="MOD (1.4)"    value={fmtDepth(modAt14)} />
            </>
          ) : (
            <>
              <GasInfoChip label="MOD (1.6)" value={fmtDepth(modAt16)} />
              <GasInfoChip label="pO₂ @MOD"  value="1.60 bar" />
            </>
          )}
          {invalidMix && <GasInfoChip label="⚠" value="Invalid mix" warn />}
        </View>
      </Card>
    </View>
  );
}

// ── Profile Chart ──────────────────────────────────────────────────────────────
function ProfileChart({
  result, depthM, bottomMin, fmtDepth,
}: {
  result: DecoResult; depthM: number; bottomMin: number;
  fmtDepth: (m: number) => string;
}) {
  const W = 300, H = 160;
  const ML = 36, MR = 8, MT = 10, MB = 24;
  const PW = W - ML - MR, PH = H - MT - MB;

  const pts: { t: number; d: number }[] = [];
  let tNow = 0;

  pts.push({ t: 0, d: 0 });
  const descentT = depthM / DESCENT_RATE;
  tNow += descentT;
  pts.push({ t: tNow, d: depthM });
  tNow += bottomMin;
  pts.push({ t: tNow, d: depthM });

  if (result.requiresDeco && result.stops.length > 0) {
    let curD = depthM;
    const firstStop = result.stops[0];
    tNow += (curD - firstStop.depth) / ASCENT_RATE;
    pts.push({ t: tNow, d: firstStop.depth });
    curD = firstStop.depth;
    for (let i = 0; i < result.stops.length; i++) {
      const stop = result.stops[i];
      if (stop.depth < curD) {
        tNow += (curD - stop.depth) / ASCENT_RATE;
        pts.push({ t: tNow, d: stop.depth });
        curD = stop.depth;
      }
      pts.push({ t: tNow, d: stop.depth });
      tNow += stop.time;
      pts.push({ t: tNow, d: stop.depth });
    }
    tNow += curD / ASCENT_RATE;
  } else {
    tNow += depthM / ASCENT_RATE;
  }
  pts.push({ t: tNow, d: 0 });

  const totalT = tNow || 1;
  const maxD   = depthM || 1;

  function tx(t: number) { return ML + (t / totalT) * PW; }
  function ty(d: number) { return MT + (d / maxD) * PH; }

  const polyPts = pts.map(p => `${tx(p.t)},${ty(p.d)}`).join(' ');
  const fillPts = [
    `${tx(0)},${ty(0)}`,
    ...pts.map(p => `${tx(p.t)},${ty(p.d)}`),
    `${tx(totalT)},${ty(0)}`,
  ].join(' ');

  const stopCircles = result.stops.map(st => ({
    cx:     tx(pts.find(p => p.d === st.depth && p.t > descentT + bottomMin)?.t ?? 0),
    cy:     ty(st.depth),
    color:  st.gasIdx === 0 ? '#FF9F0A' : '#30D158',
  }));

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {[0.25, 0.5, 0.75, 1].map(frac => (
        <Line
          key={frac}
          x1={ML} y1={MT + frac * PH}
          x2={ML + PW} y2={MT + frac * PH}
          stroke={Colors.border} strokeWidth={0.5}
        />
      ))}
      <Polyline points={fillPts} fill="#33A7B518" stroke="none" />
      <Polyline
        points={polyPts}
        fill="none"
        stroke={Colors.accentBlue}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {stopCircles.map((c, i) => (
        <Circle key={i} cx={c.cx} cy={c.cy} r={3} fill={c.color} />
      ))}
      <Path d={`M${ML},${MT} L${ML},${MT + PH}`}    stroke={Colors.border} strokeWidth={1} />
      <Path d={`M${ML},${MT + PH} L${ML + PW},${MT + PH}`} stroke={Colors.border} strokeWidth={1} />
    </Svg>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SL({ label }: { label: string }) {
  return <Text style={s.sectionLabel}>{label}</Text>;
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ToxRow({ label, value, hint, warn, danger }: {
  label: string; value: string; hint: string; warn: boolean; danger: boolean;
}) {
  const col = danger ? Colors.emergency : warn ? Colors.warning : Colors.text;
  return (
    <View style={s.toxRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.toxLabel}>{label}</Text>
        <Text style={s.toxHint}>{hint}</Text>
      </View>
      <Text style={[s.toxValue, { color: col }]}>{value}</Text>
    </View>
  );
}

function WaterBtn({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={[s.waterBtn, selected && s.waterBtnActive]} onPress={onPress}>
      <Text style={[s.waterBtnText, selected && s.waterBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

function GasInfoChip({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={[s.gasChip, warn === true && s.gasChipWarn]}>
      <Text style={s.gasChipLabel}>{label}</Text>
      <Text style={[s.gasChipValue, warn === true && s.gasChipWarnText]}>{value}</Text>
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
  optLabel:      { ...Typography.footnote, fontWeight: '500' as const, color: Colors.textSecondary },
  optLabelActive: { fontWeight: '700' as const, color: Colors.text },
});

const s = StyleSheet.create({
  disclaimer: { ...Typography.caption1, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  sectionLabel: {
    ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, marginHorizontal: 2,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.md },

  // Gas pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  pill: {
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  pillActive:     { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + '15' },
  pillText:       { ...Typography.caption1, color: Colors.textSecondary } as TextStyle,
  pillTextActive: { fontWeight: '600' as const, color: Colors.accentBlue },

  // Water / mode selector
  waterRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  waterLabel:     { ...Typography.subhead, color: Colors.textSecondary },
  waterBtns:      { flexDirection: 'row', gap: Spacing.xs },
  waterBtn: {
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  waterBtnActive:     { borderColor: Colors.accentBlue, backgroundColor: Colors.accentBlue + '15' },
  waterBtnText:       { ...Typography.caption1, color: Colors.textSecondary } as TextStyle,
  waterBtnTextActive: { fontWeight: '600' as const, color: Colors.accentBlue },

  // Gas info chips
  gasInfoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.sm },
  gasChip: {
    borderRadius: 8, backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm, paddingVertical: 4, alignItems: 'center',
  },
  gasChipWarn:     { backgroundColor: Colors.emergency + '15' },
  gasChipLabel:    { ...Typography.caption2, color: Colors.textSecondary },
  gasChipValue:    { ...Typography.caption1, fontWeight: '600' as const, color: Colors.text } as TextStyle,
  gasChipWarnText: { color: Colors.emergency },

  // GasCard
  gasCardWrap:   { marginBottom: Spacing.sm },
  gasCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  gasCardTitle:  { ...Typography.subhead, fontWeight: '600' as const, color: Colors.text } as TextStyle,
  gasRemoveBtn:  { paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  gasRemoveText: { ...Typography.caption1, color: Colors.emergency },

  // Add gas button
  addGasBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.accentBlue,
    borderStyle: 'dashed' as const,
    paddingVertical: Spacing.sm, marginTop: Spacing.xs,
  },
  addGasBtnText: { ...Typography.subhead, color: Colors.accentBlue },

  // Validation
  validationWarn: { ...Typography.caption1, color: Colors.emergency, marginTop: Spacing.xs },
  gfHint:         { ...Typography.caption2, color: Colors.textSecondary, textAlign: 'right', marginTop: Spacing.xs },

  // Calculate button
  calcBtn: {
    marginTop: Spacing.xl, backgroundColor: Colors.accentBlue,
    borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center',
  },
  calcBtnDisabled: { opacity: 0.5 },
  calcBtnText:     { ...Typography.headline, color: '#FFF', fontWeight: '700' as const } as TextStyle,

  // Stats
  statRow:   { flexDirection: 'row', justifyContent: 'space-around' },
  statValue: { ...Typography.title3, color: Colors.accentBlue, fontWeight: '700' as const } as TextStyle,
  statLabel: { ...Typography.caption1, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },

  // Alerts
  decoAlert: { ...Typography.footnote, color: Colors.warning,  textAlign: 'center', fontWeight: '600' as const },
  ndlGood:   { ...Typography.footnote, color: Colors.success,  textAlign: 'center', fontWeight: '600' as const },
  warnText:  { color: Colors.warning },

  // Deco table (4-col)
  tableHeader: { flexDirection: 'row', paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableHead:   { fontWeight: '600' as const, color: Colors.textSecondary },
  tableRow:    { flexDirection: 'row', paddingVertical: Spacing.sm },
  tableRowAlt: { backgroundColor: Colors.background },
  tableDepth:  { ...Typography.subhead, color: Colors.text, flex: 1.2, textAlign: 'center' } as TextStyle,
  tableGas:    { ...Typography.subhead, color: Colors.text, flex: 1.5, textAlign: 'center' } as TextStyle,
  tableStop:   { ...Typography.subhead, color: Colors.text, flex: 1,   textAlign: 'center' } as TextStyle,
  tableRun:    { ...Typography.subhead, color: Colors.text, flex: 1,   textAlign: 'center' } as TextStyle,
  tableNote:   { ...Typography.caption2, color: Colors.textSecondary, marginTop: Spacing.sm },

  // Gas plan table
  tableGasName: { ...Typography.subhead, color: Colors.text, flex: 1.5, textAlign: 'center' } as TextStyle,
  tableGasCol:  { ...Typography.subhead, color: Colors.text, flex: 1,   textAlign: 'center' } as TextStyle,

  // Tox
  toxRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.xs },
  toxLabel: { ...Typography.subhead, color: Colors.text },
  toxHint:  { ...Typography.caption1, color: Colors.textSecondary, marginTop: 1 },
  toxValue: { ...Typography.subhead, fontWeight: '600' as const } as TextStyle,
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex:       { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerBtn:   { minWidth: 60 },
  headerTitle: { ...Typography.headline, color: Colors.text, flex: 1, textAlign: 'center' },
  headerBack:  { ...Typography.body, color: Colors.accentBlue },
  scroll:      { flex: 1 },
  content:     { paddingHorizontal: Spacing.lg },
});
