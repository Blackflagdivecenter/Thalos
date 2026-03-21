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
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SliderWithInput } from '@/src/ui/components/SliderWithInput';
import { DisclaimerText } from '@/src/ui/components/DisclaimerText';
import { Chip } from '@/src/ui/components/Chip';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';

const M_TO_FT  = 3.28084;
const FT_TO_M  = 0.3048;

// ── He half-times (ZHL-16C) for IBCD ──────────────────────────────────────────
const HE_HT = [1.51, 3.02, 4.72, 6.99, 10.21, 14.48, 20.53, 29.11, 41.20, 55.19, 70.69, 90.34, 115.29, 147.42, 188.24, 240.03];

// ── CNS limits (NOAA) ─────────────────────────────────────────────────────────
function cnsLimit(pp: number): number {
  if (pp <= 0.6)  return 0;
  if (pp <= 0.7)  return 570;
  if (pp <= 0.8)  return 450;
  if (pp <= 0.9)  return 360;
  if (pp <= 1.0)  return 300;
  if (pp <= 1.1)  return 240;
  if (pp <= 1.2)  return 210;
  if (pp <= 1.3)  return 180;
  if (pp <= 1.4)  return 150;
  if (pp <= 1.5)  return 120;
  if (pp <= 1.6)  return 45;
  return 10;
}

// ── Gas helpers ───────────────────────────────────────────────────────────────
function gasDensity(fO2: number, fHe: number, amb: number): number {
  const fN2 = Math.max(0, 1 - fO2 - fHe);
  return (fO2 * 1.429 + fN2 * 1.251 + fHe * 0.179) * amb;
}
function densityColor(d: number): string {
  return d >= 6.2 ? Colors.emergency : d >= 5.2 ? Colors.warning : Colors.success;
}
function gasLabel(o2Pct: number, hePct: number): string {
  const o2 = Math.round(o2Pct), he = Math.round(hePct);
  const n2 = 100 - o2 - he;
  if (he === 0 && o2 === 21)  return 'Air';
  if (he === 0 && o2 === 100) return 'O₂';
  if (he === 0)               return `EAN${o2}`;
  if (n2 < 1)                 return `Heliox ${o2}/${he}`;
  return `Tx ${o2}/${he}`;
}
function bestMixLabel(o2Pct: number, hePct: number): string {
  const o2 = Math.round(o2Pct), he = Math.round(hePct);
  if (he === 0 && o2 === 21) return 'Air (21%)';
  if (he === 0)              return `EANx${o2}`;
  return `Tx ${o2}/${he}`;
}

const MODES = [
  { id: 'mod',     label: 'MOD'         },
  { id: 'bestmix', label: 'Best Mix'    },
  { id: 'end',     label: 'END'         },
  { id: 'o2exp',   label: 'O₂ Exposure' },
  { id: 'density', label: 'Gas Density' },
  { id: 'ibcd',    label: 'IBCD'        },
] as const;
type ModeId = typeof MODES[number]['id'];

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function GasPlannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [useMetric, setUseMetric] = useState(true);
  const imp = !useMetric;
  const [mode, setMode] = useState<ModeId>('mod');

  // MOD
  const [modO2, setModO2]     = useState(32);
  const [modHe, setModHe]     = useState(0);
  const [modPP, setModPP]     = useState(1.4);
  // Best Mix
  const [bmDepthM, setBmDepthM] = useState(30);
  const [bmPP, setBmPP]         = useState(1.4);
  const [bmTrimix, setBmTrimix] = useState(false);
  const [bmEndM, setBmEndM]     = useState(30);
  const [bmO2Narc, setBmO2Narc] = useState(true);
  // END
  const [endO2, setEndO2]       = useState(21);
  const [endHe, setEndHe]       = useState(35);
  const [endDepthM, setEndDepthM] = useState(40);
  const [endO2Narc, setEndO2Narc] = useState(true);
  // O2 Exposure
  const [o2O2, setO2O2]         = useState(32);
  const [o2DepthM, setO2DepthM] = useState(18);
  const [o2Time, setO2Time]     = useState(45);
  // Density
  const [denO2, setDenO2]       = useState(21);
  const [denHe, setDenHe]       = useState(35);
  const [denDepthM, setDenDepthM] = useState(40);
  // IBCD
  const [preO2, setPreO2]   = useState(18);
  const [preHe, setPreHe]   = useState(45);
  const [postO2, setPostO2] = useState(50);
  const [postHe, setPostHe] = useState(0);
  const [ibcdDepthM, setIbcdDepthM] = useState(21);

  const dMin = imp ? 33  : 10;
  const dMax = imp ? 330 : 100;
  const dStp = imp ? 5   : 1;
  const dSfx = imp ? 'ft' : 'm';
  function toDispD(m: number) { return imp ? Math.round(m * M_TO_FT) : m; }
  function fromDispD(d: number) { return imp ? d * FT_TO_M : d; }

  // ── Calculations ─────────────────────────────────────────────────────────
  // MOD
  const modGasOk  = (modO2 + modHe) <= 100 && modO2 > 0;
  const modDepthM = modGasOk ? (modPP / (modO2 / 100) - 1) * 10 : null;

  // Best Mix
  const bmAmb    = bmDepthM / 10 + 1;
  const bmO2Frac = Math.min(1, bmPP / bmAmb);
  let bmO2 = bmO2Frac * 100, bmHe = 0;
  if (bmTrimix && bmEndM > 0) {
    const endAmb = bmEndM / 10 + 1;
    const targetNarc = 0.79 * endAmb;
    if (bmO2Narc) {
      const narcFrac = targetNarc / bmAmb;
      bmHe = Math.max(0, Math.min(1 - bmO2Frac, 1 - narcFrac)) * 100;
    } else {
      const fN2 = targetNarc / bmAmb;
      bmHe = Math.max(0, Math.min(1 - bmO2Frac, 1 - bmO2Frac - fN2)) * 100;
    }
  }
  bmO2 = Math.round(bmO2 * 10) / 10;
  bmHe = Math.round(bmHe * 10) / 10;
  const bmMOD = bmO2 > 0 ? (modPP / (bmO2 / 100) - 1) * 10 : null;

  // END
  const endGasOk  = (endO2 + endHe) <= 100;
  const endAmb    = endDepthM / 10 + 1;
  const endNarcFrac = endO2Narc ? (100 - endHe) / 100 : (100 - endO2 - endHe) / 100;
  const endM      = endGasOk ? Math.max(0, (endNarcFrac / 0.79 - 1) * 10) : null;
  const endPPO2   = (endO2 / 100) * endAmb;
  const endDensity = endGasOk ? gasDensity(endO2 / 100, endHe / 100, endAmb) : null;

  // O2 Exposure
  const o2Amb  = o2DepthM / 10 + 1;
  const o2PP   = (o2O2 / 100) * o2Amb;
  const o2Lim  = cnsLimit(o2PP);
  const o2CNS  = o2Lim > 0 ? (o2Time / o2Lim) * 100 : (o2PP > 1.6 ? 999 : 0);
  const o2OTU  = o2PP > 0.5 ? o2Time * Math.pow((o2PP - 0.5) / 0.5, 0.83) : 0;

  // Density
  const denGasOk    = (denO2 + denHe) <= 100;
  const denAmb      = denDepthM / 10 + 1;
  const denAtDepth  = denGasOk ? gasDensity(denO2 / 100, denHe / 100, denAmb) : null;
  const denProfile  = denGasOk ? Array.from({ length: 10 }, (_, i) => {
    const dm = Math.round((i + 1) * denDepthM / 10);
    return { depthM: dm, density: gasDensity(denO2 / 100, denHe / 100, dm / 10 + 1) };
  }) : null;

  // IBCD
  const preGasOk  = (preO2 + preHe) <= 100;
  const postGasOk = (postO2 + postHe) <= 100;
  const ibcdOk    = preGasOk && postGasOk;
  const ibcdAmb   = ibcdDepthM / 10 + 1;
  const ibcdRows  = ibcdOk ? HE_HT.map((heHt, i) => {
    const dN2 = ((1 - postO2/100 - postHe/100) - (1 - preO2/100 - preHe/100)) * ibcdAmb;
    const dHe = (postHe/100 - preHe/100) * ibcdAmb;
    const risk = (dHe < 0 && dN2 > 0) ? Math.abs(dHe + dN2) * (1 / heHt) * 100 : 0;
    const safe = !(dHe < -0.5 && dN2 > 0.5 && risk > 2.0);
    return { comp: i + 1, dN2, dHe, risk, safe };
  }) : null;
  const ibcdAllSafe = ibcdRows ? ibcdRows.every(r => r.safe) : true;

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={s.headerBtn}>
          <Text style={s.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>Gas Planner</Text>
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
            {MODES.map((m) => (
              <Chip
                key={m.id}
                label={m.label}
                selected={mode === m.id}
                onPress={() => setMode(m.id)}
              />
            ))}
          </ScrollView>

          {/* ── MOD ── */}
          {mode === 'mod' && (
            <>
              <InputCard>
                <SliderWithInput label="O₂ %" value={modO2} min={1} max={100} step={1} suffix="%" decimals={0} onChange={setModO2} />
                <CD />
                <SliderWithInput label="He %" value={modHe} min={0} max={100} step={1} suffix="%" decimals={0} onChange={setModHe} />
                {(modO2 + modHe) > 100 && <GasWarn />}
                <CD />
                <SliderWithInput label="ppO₂ Limit" value={modPP} min={1.0} max={1.6} step={0.1} decimals={1} onChange={setModPP} />
                <GasLabelRow label={gasLabel(modO2, modHe)} />
              </InputCard>
              {modDepthM != null ? (
                <ResultCard>
                  <Text style={r.heading}>Maximum Operating Depth</Text>
                  <View style={r.twoCol}>
                    <ResultValue
                      value={imp ? `${(modDepthM * M_TO_FT).toFixed(0)}` : modDepthM.toFixed(1)}
                      label={imp ? 'Feet' : 'Meters'}
                    />
                    <ResultValue
                      value={imp ? modDepthM.toFixed(1) : `${(modDepthM * M_TO_FT).toFixed(0)}`}
                      label={imp ? 'Meters' : 'Feet'}
                    />
                  </View>
                  <Text style={r.sub}>{gasLabel(modO2, modHe)} at {modPP} ppO₂</Text>
                  {(modO2 < 16) && (
                    <View style={r.warnRow}>
                      <Ionicons name="warning" size={13} color={Colors.warning} />
                      <Text style={[r.warnText, { color: Colors.warning }]}>
                        Hypoxic — minimum depth (ppO₂ ≥ 0.16):{' '}
                        {imp
                          ? `${((0.16 / (modO2/100) - 1)*10*M_TO_FT).toFixed(0)} ft`
                          : `${((0.16 / (modO2/100) - 1)*10).toFixed(1)} m`}
                      </Text>
                    </View>
                  )}
                </ResultCard>
              ) : <EmptyResult text="Enter O₂ % and ppO₂ limit to calculate MOD." />}
            </>
          )}

          {/* ── Best Mix ── */}
          {mode === 'bestmix' && (
            <>
              <InputCard>
                <SliderWithInput
                  label="Target Depth" value={toDispD(bmDepthM)}
                  min={dMin} max={dMax} step={dStp} suffix={dSfx} decimals={0}
                  onChange={(d) => setBmDepthM(fromDispD(d))}
                />
                <CD />
                <SliderWithInput label="ppO₂ Limit" value={bmPP} min={1.0} max={1.6} step={0.1} decimals={1} onChange={setBmPP} />
                <CD />
                <View style={r.toggleRow}>
                  <Text style={r.toggleLabel}>Include Trimix</Text>
                  <Switch value={bmTrimix} onValueChange={setBmTrimix} trackColor={{ false: Colors.border, true: Colors.accentBlue }} />
                </View>
                {bmTrimix && (
                  <>
                    <CD />
                    <SliderWithInput
                      label="Target END" value={toDispD(bmEndM)}
                      min={dMin} max={dMax} step={dStp} suffix={dSfx} decimals={0}
                      onChange={(d) => setBmEndM(fromDispD(d))}
                    />
                    <CD />
                    <View style={r.toggleRow}>
                      <Text style={r.toggleLabel}>O₂ is narcotic</Text>
                      <Switch value={bmO2Narc} onValueChange={setBmO2Narc} trackColor={{ false: Colors.border, true: Colors.accentBlue }} />
                    </View>
                  </>
                )}
              </InputCard>
              {bmDepthM > 0 && (
                <ResultCard>
                  <Text style={r.heading}>Optimal Gas Mix</Text>
                  <Text style={r.bigGas}>{bestMixLabel(bmO2, bmHe)}</Text>
                  <Text style={r.mixDetail}>
                    {bmHe > 0
                      ? `O₂: ${bmO2.toFixed(1)}%  He: ${bmHe.toFixed(1)}%  N₂: ${(100 - bmO2 - bmHe).toFixed(1)}%`
                      : `${bmO2.toFixed(1)}% O₂`}
                  </Text>
                  {bmMOD != null && (
                    <Text style={r.sub}>
                      MOD at this mix: {bmMOD.toFixed(1)} m ({(bmMOD * M_TO_FT).toFixed(0)} ft)
                    </Text>
                  )}
                </ResultCard>
              )}
            </>
          )}

          {/* ── END ── */}
          {mode === 'end' && (
            <>
              <InputCard>
                <SliderWithInput label="O₂ %" value={endO2} min={1} max={100} step={1} suffix="%" decimals={0} onChange={setEndO2} />
                <CD />
                <SliderWithInput label="He %" value={endHe} min={0} max={100} step={1} suffix="%" decimals={0} onChange={setEndHe} />
                {!endGasOk && <GasWarn />}
                <CD />
                <SliderWithInput
                  label="Actual Depth" value={toDispD(endDepthM)}
                  min={dMin} max={imp ? 500 : 150} step={dStp} suffix={dSfx} decimals={0}
                  onChange={(d) => setEndDepthM(fromDispD(d))}
                />
                <CD />
                <View style={r.toggleRow}>
                  <Text style={r.toggleLabel}>O₂ is narcotic</Text>
                  <Switch value={endO2Narc} onValueChange={setEndO2Narc} trackColor={{ false: Colors.border, true: Colors.accentBlue }} />
                </View>
                <GasLabelRow label={gasLabel(endO2, endHe)} />
              </InputCard>
              {endM != null ? (
                <ResultCard>
                  <Text style={r.heading}>Equivalent Narcotic Depth</Text>
                  <View style={r.twoCol}>
                    <ResultValue value={imp ? `${(endM * M_TO_FT).toFixed(0)}` : endM.toFixed(1)} label={imp ? 'Feet' : 'Meters'} />
                    <ResultValue value={imp ? endM.toFixed(1) : `${(endM * M_TO_FT).toFixed(0)}`} label={imp ? 'Meters' : 'Feet'} />
                  </View>
                  {endM < endDepthM * 0.9 ? (
                    <Text style={[r.sub, { color: Colors.success }]}>
                      {imp
                        ? `${((endDepthM - endM) * M_TO_FT).toFixed(0)} ft narcotic reduction`
                        : `${(endDepthM - endM).toFixed(1)} m narcotic reduction`}
                    </Text>
                  ) : (
                    <Text style={r.sub}>Minimal narcotic benefit at this mix/depth</Text>
                  )}
                  <CD />
                  <View style={r.twoCol}>
                    <ResultValue value={endPPO2.toFixed(2)} label="ppO₂" />
                    {endDensity != null && <ResultValue value={`${endDensity.toFixed(1)}`} label="g/L" />}
                  </View>
                  {endPPO2 > 1.6 && <WarnLabel text="ppO₂ exceeds 1.6 — beyond safe limits" color={Colors.emergency} />}
                  {endDensity != null && endDensity > 6.2 && <WarnLabel text="Gas density above 5.2 g/L — WOB concern" color={Colors.emergency} />}
                  {endDensity != null && endDensity > 5.2 && endDensity <= 6.2 && <WarnLabel text="Gas density above 5.2 g/L — WOB concern" color={Colors.warning} />}
                </ResultCard>
              ) : <EmptyResult text="Enter O₂ %, He %, and depth." />}
            </>
          )}

          {/* ── O2 Exposure ── */}
          {mode === 'o2exp' && (
            <>
              <InputCard>
                <SliderWithInput label="O₂ %" value={o2O2} min={21} max={100} step={1} suffix="%" decimals={0} onChange={setO2O2} />
                <CD />
                <SliderWithInput
                  label="Depth" value={toDispD(o2DepthM)}
                  min={imp ? 15 : 5} max={imp ? 330 : 100} step={dStp} suffix={dSfx} decimals={0}
                  onChange={(d) => setO2DepthM(fromDispD(d))}
                />
                <CD />
                <SliderWithInput label="Time" value={o2Time} min={5} max={180} step={5} suffix="min" decimals={0} onChange={setO2Time} />
              </InputCard>
              <ResultCard>
                <Text style={r.heading}>Oxygen Exposure</Text>
                <View style={r.twoCol}>
                  <ResultValue value={o2PP.toFixed(2)} label="ppO₂" />
                  <ResultValue value={`${o2CNS.toFixed(0)}%`} label="CNS" />
                  <ResultValue value={o2OTU.toFixed(0)} label="OTU" />
                </View>
                {o2PP > 1.6 && <WarnLabel text="ppO₂ exceeds 1.6 — extreme risk of oxygen toxicity" color={Colors.emergency} />}
                {o2CNS > 100 && <WarnLabel text="CNS exceeds 100% — high risk of oxygen toxicity seizure" color={Colors.warning} />}
                {o2CNS > 75 && o2CNS <= 100 && <WarnLabel text="CNS above 75% — approaching oxygen toxicity limits" color={Colors.warning} />}
              </ResultCard>
            </>
          )}

          {/* ── Gas Density ── */}
          {mode === 'density' && (
            <>
              <InputCard>
                <SliderWithInput label="O₂ %" value={denO2} min={1} max={100} step={1} suffix="%" decimals={0} onChange={setDenO2} />
                <CD />
                <SliderWithInput label="He %" value={denHe} min={0} max={100} step={1} suffix="%" decimals={0} onChange={setDenHe} />
                {!denGasOk && <GasWarn />}
                <CD />
                <SliderWithInput
                  label="Depth" value={toDispD(denDepthM)}
                  min={dMin} max={imp ? 500 : 150} step={dStp} suffix={dSfx} decimals={0}
                  onChange={(d) => setDenDepthM(fromDispD(d))}
                />
                <GasLabelRow label={gasLabel(denO2, denHe)} />
              </InputCard>
              {denAtDepth != null ? (
                <ResultCard>
                  <Text style={r.heading}>Gas Density at Depth</Text>
                  <Text style={[r.bigDensity, { color: densityColor(denAtDepth) }]}>
                    {denAtDepth.toFixed(2)} g/L
                  </Text>
                  <Text style={[r.sub, { color: densityColor(denAtDepth) }]}>
                    {denAtDepth >= 6.2
                      ? 'Above 6.2 g/L — high risk of hypercapnia and CO₂ toxicity'
                      : denAtDepth >= 5.2
                        ? 'Above 5.2 g/L — increased WOB and CO₂ retention risk'
                        : 'Within recommended limits'}
                  </Text>
                  <CD />
                  <Text style={r.profileHeader}>Density by Depth</Text>
                  {denProfile?.map(({ depthM: dm, density }) => (
                    <View key={dm} style={r.profileRow}>
                      <Text style={r.profileDepth}>{imp ? `${Math.round(dm * M_TO_FT)} ft` : `${dm} m`}</Text>
                      <View style={r.barContainer}>
                        <View style={[r.bar, { width: Math.min(100, (density / 8) * 100), backgroundColor: densityColor(density) }]} />
                      </View>
                      <Text style={[r.profileVal, { color: densityColor(density) }]}>{density.toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={r.legendRow}>
                    <LegendDot color={Colors.success}   label="< 5.2 Safe" />
                    <LegendDot color={Colors.warning}   label="5.2–6.2 Caution" />
                    <LegendDot color={Colors.emergency} label="> 6.2 Danger" />
                  </View>
                </ResultCard>
              ) : <EmptyResult text="Enter O₂ %, He %, and depth." />}
            </>
          )}

          {/* ── IBCD ── */}
          {mode === 'ibcd' && (
            <>
              <InputCard>
                <Text style={r.subHeader}>Gas Before Switch</Text>
                <SliderWithInput label="O₂ %" value={preO2} min={1} max={100} step={1} suffix="%" decimals={0} onChange={setPreO2} />
                <CD />
                <SliderWithInput label="He %" value={preHe} min={0} max={100} step={1} suffix="%" decimals={0} onChange={setPreHe} />
                {!preGasOk && <GasWarn />}
                <GasLabelRow label={gasLabel(preO2, preHe)} />
                <CD />
                <Text style={r.subHeader}>Gas After Switch</Text>
                <SliderWithInput label="O₂ %" value={postO2} min={1} max={100} step={1} suffix="%" decimals={0} onChange={setPostO2} />
                <CD />
                <SliderWithInput label="He %" value={postHe} min={0} max={100} step={1} suffix="%" decimals={0} onChange={setPostHe} />
                {!postGasOk && <GasWarn />}
                <GasLabelRow label={gasLabel(postO2, postHe)} />
                <CD />
                <SliderWithInput
                  label="Switch Depth" value={toDispD(ibcdDepthM)}
                  min={imp ? 15 : 5} max={imp ? 330 : 100} step={dStp} suffix={dSfx} decimals={0}
                  onChange={(d) => setIbcdDepthM(fromDispD(d))}
                />
              </InputCard>
              {ibcdOk && ibcdRows ? (
                <ResultCard>
                  <Text style={r.heading}>IBCD Analysis</Text>
                  <View style={r.ibcdStatus}>
                    <Ionicons
                      name={ibcdAllSafe ? 'shield-checkmark' : 'warning'}
                      size={22}
                      color={ibcdAllSafe ? Colors.success : Colors.emergency}
                    />
                    <Text style={[r.ibcdStatusText, { color: ibcdAllSafe ? Colors.success : Colors.emergency }]}>
                      {ibcdAllSafe ? 'Safe' : 'Risk Detected'}
                    </Text>
                  </View>
                  <Text style={r.sub}>
                    {ibcdAllSafe
                      ? 'Gas switch appears safe — no significant counter-diffusion risk'
                      : `${ibcdRows.filter(r2 => !r2.safe).length} compartment(s) show counter-diffusion risk`}
                  </Text>
                  <CD />
                  <View style={r.ibcdHeaderRow}>
                    <Text style={[r.ibcdHdr, { width: 28 }]}>Cmp</Text>
                    <Text style={[r.ibcdHdr, { width: 55, textAlign: 'right' }]}>ΔppN₂</Text>
                    <Text style={[r.ibcdHdr, { width: 55, textAlign: 'right' }]}>ΔppHe</Text>
                    <Text style={[r.ibcdHdr, { width: 44, textAlign: 'right' }]}>Risk</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={[r.ibcdHdr, { width: 36, textAlign: 'center' }]}>Status</Text>
                  </View>
                  {ibcdRows.map((row) => (
                    <View key={row.comp} style={r.ibcdRow}>
                      <Text style={[r.ibcdCell, { width: 28 }]}>{row.comp}</Text>
                      <Text style={[r.ibcdCell, { width: 55, textAlign: 'right', color: row.dN2 > 0 ? Colors.warning : Colors.textSecondary }]}>
                        {(row.dN2 >= 0 ? '+' : '') + row.dN2.toFixed(2)}
                      </Text>
                      <Text style={[r.ibcdCell, { width: 55, textAlign: 'right', color: row.dHe < 0 ? Colors.accentBlue : Colors.textSecondary }]}>
                        {(row.dHe >= 0 ? '+' : '') + row.dHe.toFixed(2)}
                      </Text>
                      <Text style={[r.ibcdCell, { width: 44, textAlign: 'right' }]}>{row.risk.toFixed(1)}</Text>
                      <View style={{ flex: 1 }} />
                      <View style={{ width: 36, alignItems: 'center' }}>
                        <Ionicons
                          name={row.safe ? 'checkmark-circle' : 'close-circle'}
                          size={14}
                          color={row.safe ? Colors.success : Colors.emergency}
                        />
                      </View>
                    </View>
                  ))}
                </ResultCard>
              ) : <EmptyResult text="Enter both gas mixes and switch depth." />}
            </>
          )}

          <DisclaimerText text="For planning reference only. Always use a dive computer and follow your training." />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SegPicker({ options, selected, onSelect }: {
  options: { v: string; l: string }[];
  selected: string;
  onSelect: (v: string) => void;
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

function EmptyResult({ text }: { text: string }) {
  return <View style={c.result}><Text style={c.emptyText}>{text}</Text></View>;
}

function CD() {
  return <View style={c.divider} />;
}

function GasLabelRow({ label }: { label: string }) {
  return (
    <View style={r.gasRow}>
      <Ionicons name="radio-button-on" size={13} color={Colors.accentBlue} />
      <Text style={r.gasRowLabel}>{label}</Text>
    </View>
  );
}

function GasWarn() {
  return (
    <View style={r.gasWarnRow}>
      <Ionicons name="warning" size={13} color={Colors.emergency} />
      <Text style={r.gasWarnText}>O₂ + He cannot exceed 100%</Text>
    </View>
  );
}

function WarnLabel({ text, color }: { text: string; color: string }) {
  return (
    <View style={r.warnRow}>
      <Ionicons name="warning" size={13} color={color} />
      <Text style={[r.warnText, { color }]}>{text}</Text>
    </View>
  );
}

function ResultValue({ value, label }: { value: string; label: string }) {
  return (
    <View style={r.valCol}>
      <Text style={r.valNum}>{value}</Text>
      <Text style={r.valLabel}>{label}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={r.legendItem}>
      <View style={[r.dot, { backgroundColor: color }]} />
      <Text style={r.dotLabel}>{label}</Text>
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
  emptyText: { ...(Typography.subhead as TextStyle), color: Colors.textSecondary, textAlign: 'center' },
});

const r = StyleSheet.create({
  heading: { ...(Typography.subhead as TextStyle), color: Colors.textSecondary, marginBottom: Spacing.md },
  twoCol: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', marginBottom: Spacing.md },
  valCol: { alignItems: 'center', gap: 2 },
  valNum: { ...(Typography.title2 as TextStyle), color: Colors.accentBlue, fontVariant: ['tabular-nums'] } as TextStyle,
  valLabel: { ...(Typography.caption2 as TextStyle), color: Colors.textSecondary },
  sub: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  bigGas: {
    fontSize: 36, fontWeight: '700' as const, color: Colors.accentBlue,
    textAlign: 'center', marginBottom: 4,
  } as TextStyle,
  mixDetail: { ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center', marginBottom: 4 },
  bigDensity: {
    fontSize: 40, fontWeight: '700' as const, textAlign: 'center',
    fontVariant: ['tabular-nums'], marginBottom: 4,
  } as TextStyle,
  profileHeader: { ...(Typography.caption1 as TextStyle), fontWeight: '700' as const, color: Colors.textSecondary, marginBottom: 4 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  profileDepth: { ...(Typography.caption2 as TextStyle), color: Colors.textSecondary, width: 44, fontVariant: ['tabular-nums'] } as TextStyle,
  barContainer: { width: 100, alignItems: 'flex-end', marginHorizontal: Spacing.sm },
  bar: { height: 12, borderRadius: 2 },
  profileVal: { ...(Typography.caption2 as TextStyle), width: 40, textAlign: 'right', fontVariant: ['tabular-nums'] } as TextStyle,
  legendRow: { flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.sm, justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotLabel: { ...(Typography.caption2 as TextStyle), color: Colors.textSecondary },
  gasRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  gasRowLabel: { ...(Typography.caption1 as TextStyle), fontWeight: '700' as const, color: Colors.accentBlue },
  gasWarnRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  gasWarnText: { ...(Typography.caption1 as TextStyle), color: Colors.emergency },
  warnRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, marginTop: Spacing.xs },
  warnText: { ...(Typography.caption1 as TextStyle), flex: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  toggleLabel: { ...(Typography.subhead as TextStyle), color: Colors.text },
  subHeader: { ...(Typography.caption1 as TextStyle), fontWeight: '700' as const, color: Colors.textSecondary, marginBottom: Spacing.xs },
  ibcdStatus: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xs },
  ibcdStatusText: { ...(Typography.title3 as TextStyle), fontWeight: '700' as const },
  ibcdHeaderRow: { flexDirection: 'row', paddingBottom: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: 2 },
  ibcdHdr: { ...(Typography.caption2 as TextStyle), fontWeight: '700' as const, color: Colors.textSecondary } as TextStyle,
  ibcdRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  ibcdCell: { ...(Typography.caption2 as TextStyle), fontVariant: ['tabular-nums'] } as TextStyle,
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
