/**
 * SAC Rate Tool
 *
 * Mode 1 — Calculate SAC: dive data → SAC rate + RMV
 * Mode 2 — Gas Planning
 *   Sub-mode SAC:     known SAC rate → available bottom time
 *   Sub-mode RMV:     known RMV      → available bottom time
 *   Sub-mode Min Gas: dive plan      → minimum gas volume needed
 *
 * All state stored in metric (bar, metres, litres).
 * Display conversions happen inline via `imp` flag.
 */
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SliderWithInput } from '@/src/ui/components/SliderWithInput';
import { DisclaimerText } from '@/src/ui/components/DisclaimerText';
import { CylinderPicker } from '@/src/ui/components/CylinderPicker';
import { Cylinder, DEFAULT_CYLINDER } from '@/src/data/cylinders';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';

// ── Constants ──────────────────────────────────────────────────────────────────
const BAR_TO_PSI = 14.5038;
const L_TO_CUFT  = 0.0353147;
const FT_TO_M    = 0.3048;

// ── Mode types ─────────────────────────────────────────────────────────────────
type MainMode = 'calc' | 'plan';
type PlanMode = 'sac' | 'rmv' | 'mingas';
type MgBasis  = 'rmv' | 'sac';

type PlanCyl = {
  id:       string;
  cylinder: Cylinder;
  fillBar:  number;
  resBar:   number;
};

function emptyPlanCyl(): PlanCyl {
  return { id: Math.random().toString(36).slice(2), cylinder: DEFAULT_CYLINDER, fillBar: 200, resBar: 50 };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function assessRMV(rmvLMin: number): { label: string; color: string } {
  if (rmvLMin < 10) return { label: 'Excellent', color: Colors.success };
  if (rmvLMin < 14) return { label: 'Good',      color: Colors.accentBlue };
  if (rmvLMin < 18) return { label: 'Average',   color: Colors.warning };
  return { label: rmvLMin < 23 ? 'High' : 'Very High', color: Colors.emergency };
}

function tankSuggestion(totalGasL: number, imp: boolean): string {
  if (!imp) {
    if (totalGasL <= 2000) return 'A single 10L tank at 200 bar (2,000 L) covers this';
    if (totalGasL <= 2400) return 'A single 12L tank at 200 bar (2,400 L) covers this';
    if (totalGasL <= 3000) return 'A single 15L tank at 200 bar (3,000 L) covers this';
    if (totalGasL <= 4800) return 'A twinset (2×12L) at 200 bar (4,800 L) covers this';
    return 'You may need a twinset or stage bottle for this gas volume';
  }
  const cuft = totalGasL * L_TO_CUFT;
  if (cuft <= 63)  return 'A single AL63 (63 cuft) covers this';
  if (cuft <= 80)  return 'A single AL80 (80 cuft) covers this';
  if (cuft <= 100) return 'A single HP100 (100 cuft) covers this';
  if (cuft <= 120) return 'A single HP120 (120 cuft) covers this';
  if (cuft <= 160) return 'Doubles or a backmount twinset (~160 cuft) covers this';
  return 'You may need doubles or stage bottles for this gas volume';
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function SACScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [useMetric, setUseMetric] = useState(true);
  const imp = !useMetric;

  // Modes
  const [mainMode, setMainMode] = useState<MainMode>('calc');
  const [planMode, setPlanMode] = useState<PlanMode>('sac');
  const [mgBasis,  setMgBasis]  = useState<MgBasis>('rmv');

  // ── Calc SAC state (metric stored) ────────────────────────────────────────
  const [cCylinder, setCCylinder] = useState<Cylinder>(DEFAULT_CYLINDER);
  const [cStartBar, setCStartBar] = useState(200);  // bar
  const [cEndBar,   setCEndBar]   = useState(50);   // bar
  const [cDepthM,   setCDepthM]   = useState(20);   // m
  const [cTimeMin,  setCTimeMin]  = useState(45);   // min (always)

  // ── Plan SAC / RMV shared state (metric stored) ───────────────────────────
  const [pSacBarMin, setPSacBarMin] = useState(1.0);  // bar/min
  const [pRmvLMin,   setPRmvLMin]   = useState(14.0); // L/min
  const [pCyls,      setPCyls]      = useState<PlanCyl[]>([emptyPlanCyl()]);
  const [pDepthM,    setPDepthM]    = useState(20);   // m

  // ── Min Gas state (metric stored) ─────────────────────────────────────────
  const [mgRmvLMin,   setMgRmvLMin]   = useState(14.0); // L/min
  const [mgSacBarMin, setMgSacBarMin] = useState(1.0);  // bar/min
  const [mgBotMin,    setMgBotMin]    = useState(45);   // min
  const [mgDepthM,    setMgDepthM]    = useState(20);   // m
  const [mgResPct,    setMgResPct]    = useState(33);   // %
  const [mgCyls,      setMgCyls]      = useState<PlanCyl[]>([emptyPlanCyl()]);

  // ── Formulas ──────────────────────────────────────────────────────────────

  const calcResult = (() => {
    if (cTimeMin <= 0 || cCylinder.internalVolL <= 0) return null;
    const ata        = cDepthM / 10 + 1;
    const gasUsedBar = cStartBar - cEndBar;
    const sacBarMin  = (gasUsedBar / cTimeMin) / ata;
    const sacPsiMin  = sacBarMin * BAR_TO_PSI;
    const rmvLMin    = sacBarMin * cCylinder.internalVolL;
    const rmvCuftMin = rmvLMin * L_TO_CUFT;
    return {
      sacBarMin, sacPsiMin, rmvLMin, rmvCuftMin,
      gasUsedBar, ata, assessment: assessRMV(rmvLMin),
    };
  })();

  const planSACResult = (() => {
    const ata   = pDepthM / 10 + 1;
    const valid = pCyls.filter(c => c.fillBar > c.resBar);
    if (valid.length === 0) return null;
    const totalGasL   = valid.reduce((s, c) => s + (c.fillBar - c.resBar) * c.cylinder.internalVolL, 0);
    // Convert SAC (bar/min) → RMV (L/min) using first cylinder as reference
    const rmvLMin     = pSacBarMin * pCyls[0].cylinder.internalVolL;
    const consAtDepth = rmvLMin * ata; // L/min at depth
    const bottomTime  = totalGasL / consAtDepth;
    return { bottomTime, totalGasL, consAtDepth, ata, rmvLMin };
  })();

  const planRMVResult = (() => {
    const ata   = pDepthM / 10 + 1;
    const valid = pCyls.filter(c => c.fillBar > c.resBar);
    if (valid.length === 0) return null;
    const totalGasL   = valid.reduce((s, c) => s + (c.fillBar - c.resBar) * c.cylinder.internalVolL, 0);
    const consAtDepth = pRmvLMin * ata; // L/min at depth
    const bottomTime  = totalGasL / consAtDepth;
    return { bottomTime, totalGasL, consAtDepth, ata };
  })();

  const minGasResult = (() => {
    const ata  = mgDepthM / 10 + 1;
    const rate = mgBasis === 'rmv' ? mgRmvLMin : mgSacBarMin * 12.0;
    const diveGasL   = rate * ata * mgBotMin;
    const resFrac    = mgResPct / 100;
    const totalGasL  = diveGasL / (1 - resFrac);
    const resGasL    = totalGasL - diveGasL;
    return {
      totalGasL, diveGasL, resGasL,
      consAtDepth: rate * ata, ata,
      suggestion: tankSuggestion(totalGasL, imp),
    };
  })();

  const mgAvailableL = mgCyls.reduce((s, c) => {
    if (c.fillBar <= c.resBar) return s;
    return s + (c.fillBar - c.resBar) * c.cylinder.internalVolL;
  }, 0);
  const mgAdequate = mgAvailableL > 0 && mgAvailableL >= minGasResult.totalGasL;

  // ── Display helpers ────────────────────────────────────────────────────────
  const pUnit = imp ? 'psi' : 'bar';
  const vUnit = imp ? 'cuft' : 'L';
  const dUnit = imp ? 'ft'  : 'm';

  const fmtP    = (bar: number, d = 0) => imp ? (bar * BAR_TO_PSI).toFixed(d) : bar.toFixed(d);
  const fmtVol  = (L: number)          => imp ? (L * L_TO_CUFT).toFixed(1) : L.toFixed(0);
  const fmtFlow = (Lmin: number)       => imp
    ? `${(Lmin * L_TO_CUFT).toFixed(2)} cuft/min`
    : `${Lmin.toFixed(1)} L/min`;


  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={s.headerBtn}>
          <Text style={s.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={s.headerTitle}>SAC Rate</Text>
        <View style={s.headerBtn} />
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Pickers ── */}
          <SegPicker
            options={[{ v: 'metric', l: 'Metric' }, { v: 'imperial', l: 'Imperial' }]}
            selected={useMetric ? 'metric' : 'imperial'}
            onSelect={(v) => setUseMetric(v === 'metric')}
          />
          <SegPicker
            options={[{ v: 'calc', l: 'Calculate SAC' }, { v: 'plan', l: 'Gas Supply' }]}
            selected={mainMode}
            onSelect={(v) => setMainMode(v as MainMode)}
          />
          {mainMode === 'plan' && (
            <SegPicker
              options={[
                { v: 'sac',    l: 'SAC' },
                { v: 'rmv',    l: 'RMV' },
                { v: 'mingas', l: 'Min Gas' },
              ]}
              selected={planMode}
              onSelect={(v) => setPlanMode(v as PlanMode)}
            />
          )}

          {/* ════════════════════════════════════════════
              MODE 1 — CALCULATE SAC
          ════════════════════════════════════════════ */}
          {mainMode === 'calc' && (
            <>
              <InputCard>
                <CylinderPicker label="Cylinder" value={cCylinder} onChange={setCCylinder} />
                <CardDivider />
                <SliderWithInput
                  label="Start Pressure"
                  value={imp ? cStartBar * BAR_TO_PSI : cStartBar}
                  min={imp ? 1500 : 100} max={imp ? 4500 : 300} step={imp ? 100 : 10}
                  suffix={pUnit} decimals={0}
                  onChange={(d) => setCStartBar(imp ? d / BAR_TO_PSI : d)}
                />
                <CardDivider />
                <SliderWithInput
                  label="End Pressure"
                  value={imp ? cEndBar * BAR_TO_PSI : cEndBar}
                  min={imp ? 150 : 10} max={imp ? 3000 : 200} step={imp ? 100 : 10}
                  suffix={pUnit} decimals={0}
                  onChange={(d) => setCEndBar(imp ? d / BAR_TO_PSI : d)}
                />
                <CardDivider />
                <SliderWithInput
                  label="Depth"
                  value={imp ? cDepthM / FT_TO_M : cDepthM}
                  min={imp ? 15 : 5} max={imp ? 200 : 60} step={imp ? 5 : 1}
                  suffix={dUnit} decimals={0}
                  onChange={(d) => setCDepthM(imp ? d * FT_TO_M : d)}
                />
                <CardDivider />
                <SliderWithInput
                  label="Dive Time"
                  value={cTimeMin}
                  min={5} max={120} step={1}
                  suffix="min" decimals={0}
                  onChange={setCTimeMin}
                />
              </InputCard>

              {calcResult ? (
                <ResultCard>
                  <Text style={r.heading}>Surface Air Consumption</Text>
                  {/* SAC | RMV columns */}
                  <View style={r.mainRow}>
                    <ResultValue
                      value={imp
                        ? calcResult.sacPsiMin.toFixed(1)
                        : calcResult.sacBarMin.toFixed(1)}
                      unit={imp ? 'psi/min' : 'bar/min'}
                      label="SAC"
                    />
                    <View style={r.vDivider} />
                    <ResultValue
                      value={imp
                        ? calcResult.rmvCuftMin.toFixed(2)
                        : calcResult.rmvLMin.toFixed(1)}
                      unit={imp ? 'cuft/min' : 'L/min'}
                      label="RMV"
                    />
                  </View>
                  <AssessmentBadge
                    label={calcResult.assessment.label}
                    color={calcResult.assessment.color}
                  />
                  {/* Detail rows */}
                  <View style={r.details}>
                    <DetailRow label="SAC (bar/min)"    value={calcResult.sacBarMin.toFixed(2)} />
                    <DetailRow label="SAC (psi/min)"    value={calcResult.sacPsiMin.toFixed(1)} />
                    <DetailRow label="RMV (L/min)"      value={calcResult.rmvLMin.toFixed(1)} />
                    <DetailRow label="RMV (cuft/min)"   value={calcResult.rmvCuftMin.toFixed(3)} />
                    <CardDivider />
                    <DetailRow
                      label="Gas Used"
                      value={fmtP(calcResult.gasUsedBar) + ' ' + pUnit}
                    />
                    <DetailRow
                      label="Ambient Pressure"
                      value={calcResult.ata.toFixed(1) + ' ATA'}
                    />
                  </View>
                </ResultCard>
              ) : (
                <EmptyResult text="Fill in all dive data to calculate your SAC rate." />
              )}
            </>
          )}

          {/* ════════════════════════════════════════════
              MODE 2a — GAS SUPPLY: Bottom Time (SAC)
          ════════════════════════════════════════════ */}
          {mainMode === 'plan' && planMode === 'sac' && (
            <>
              <InputCard>
                <SliderWithInput
                  label="Your SAC Rate"
                  value={imp ? pSacBarMin * BAR_TO_PSI : pSacBarMin}
                  min={imp ? 4 : 0.3} max={imp ? 60 : 4.0} step={imp ? 1 : 0.1}
                  suffix={imp ? 'psi/min' : 'bar/min'}
                  decimals={imp ? 0 : 1}
                  onChange={(d) => setPSacBarMin(imp ? d / BAR_TO_PSI : d)}
                />
                <CardDivider />
                <SliderWithInput
                  label="Planned Depth"
                  value={imp ? pDepthM / FT_TO_M : pDepthM}
                  min={imp ? 15 : 5} max={imp ? 200 : 60} step={imp ? 5 : 1}
                  suffix={dUnit} decimals={0}
                  onChange={(d) => setPDepthM(imp ? d * FT_TO_M : d)}
                />
              </InputCard>

              {pCyls.map((entry, idx) => (
                <PlanCylCard
                  key={entry.id}
                  entry={entry}
                  index={idx}
                  canRemove={pCyls.length > 1}
                  imp={imp}
                  pUnit={pUnit}
                  onUpdate={(id, patch) => setPCyls(pCyls.map(c => c.id === id ? { ...c, ...patch } : c))}
                  onRemove={(id) => setPCyls(pCyls.filter(c => c.id !== id))}
                />
              ))}
              {pCyls.length < 4 && (
                <Pressable style={cy.addBtn} onPress={() => setPCyls([...pCyls, emptyPlanCyl()])}>
                  <Text style={cy.addBtnText}>+ Add Cylinder</Text>
                </Pressable>
              )}

              {planSACResult ? (
                <ResultCard>
                  <Text style={r.heading}>Available Bottom Time</Text>
                  <Text style={r.heroValue}>{Math.floor(planSACResult.bottomTime)} min</Text>
                  <View style={r.details}>
                    <DetailRow
                      label="Total Gas Supply"
                      value={fmtVol(planSACResult.totalGasL) + ' ' + vUnit}
                    />
                    <DetailRow
                      label="Consumption at Depth"
                      value={fmtFlow(planSACResult.consAtDepth)}
                    />
                    <DetailRow
                      label="Ambient Pressure"
                      value={planSACResult.ata.toFixed(1) + ' ATA'}
                    />
                  </View>
                  {pCyls.length > 1 && (
                    <Text style={r.sacRefNote}>
                      SAC converted to RMV using {pCyls[0].cylinder.name} ({pCyls[0].cylinder.internalVolL} L ref)
                    </Text>
                  )}
                  {planSACResult.bottomTime < 10 && (
                    <WarningLabel text="Very limited gas — consider adding more cylinders or a shallower depth" />
                  )}
                </ResultCard>
              ) : (
                <EmptyResult text="Reserve must be less than fill pressure on at least one cylinder." />
              )}
            </>
          )}

          {/* ════════════════════════════════════════════
              MODE 2b — GAS SUPPLY: Bottom Time (RMV)
          ════════════════════════════════════════════ */}
          {mainMode === 'plan' && planMode === 'rmv' && (
            <>
              <InputCard>
                <SliderWithInput
                  label="Your RMV"
                  value={imp ? pRmvLMin * L_TO_CUFT : pRmvLMin}
                  min={imp ? 0.15 : 5} max={imp ? 1.1 : 30} step={imp ? 0.01 : 0.5}
                  suffix={imp ? 'cuft/min' : 'L/min'}
                  decimals={imp ? 2 : 1}
                  onChange={(d) => setPRmvLMin(imp ? d / L_TO_CUFT : d)}
                />
                <CardDivider />
                <SliderWithInput
                  label="Planned Depth"
                  value={imp ? pDepthM / FT_TO_M : pDepthM}
                  min={imp ? 15 : 5} max={imp ? 200 : 60} step={imp ? 5 : 1}
                  suffix={dUnit} decimals={0}
                  onChange={(d) => setPDepthM(imp ? d * FT_TO_M : d)}
                />
              </InputCard>

              {pCyls.map((entry, idx) => (
                <PlanCylCard
                  key={entry.id}
                  entry={entry}
                  index={idx}
                  canRemove={pCyls.length > 1}
                  imp={imp}
                  pUnit={pUnit}
                  onUpdate={(id, patch) => setPCyls(pCyls.map(c => c.id === id ? { ...c, ...patch } : c))}
                  onRemove={(id) => setPCyls(pCyls.filter(c => c.id !== id))}
                />
              ))}
              {pCyls.length < 4 && (
                <Pressable style={cy.addBtn} onPress={() => setPCyls([...pCyls, emptyPlanCyl()])}>
                  <Text style={cy.addBtnText}>+ Add Cylinder</Text>
                </Pressable>
              )}

              {planRMVResult ? (
                <ResultCard>
                  <Text style={r.heading}>Available Bottom Time</Text>
                  <Text style={r.heroValue}>{Math.floor(planRMVResult.bottomTime)} min</Text>
                  <View style={r.details}>
                    <DetailRow
                      label="Total Gas Supply"
                      value={fmtVol(planRMVResult.totalGasL) + ' ' + vUnit}
                    />
                    <DetailRow
                      label="Consumption at Depth"
                      value={fmtFlow(planRMVResult.consAtDepth)}
                    />
                    <DetailRow
                      label="Ambient Pressure"
                      value={planRMVResult.ata.toFixed(1) + ' ATA'}
                    />
                  </View>
                  {planRMVResult.bottomTime < 10 && (
                    <WarningLabel text="Very limited gas — consider adding more cylinders or a shallower depth" />
                  )}
                </ResultCard>
              ) : (
                <EmptyResult text="Reserve must be less than fill pressure on at least one cylinder." />
              )}
            </>
          )}

          {/* ════════════════════════════════════════════
              MODE 2c — GAS PLANNING: Min Gas Volume
          ════════════════════════════════════════════ */}
          {mainMode === 'plan' && planMode === 'mingas' && (
            <>
              <InputCard>
                {/* Rate type toggle */}
                <View>
                  <Text style={r.inputSubhead}>Consumption Rate Basis</Text>
                  <SegPicker
                    options={[{ v: 'rmv', l: 'RMV' }, { v: 'sac', l: 'SAC' }]}
                    selected={mgBasis}
                    onSelect={(v) => setMgBasis(v as MgBasis)}
                    compact
                  />
                </View>
                <CardDivider />
                {mgBasis === 'rmv' ? (
                  <SliderWithInput
                    label="Your RMV"
                    value={imp ? mgRmvLMin * L_TO_CUFT : mgRmvLMin}
                    min={imp ? 0.15 : 5} max={imp ? 1.1 : 30} step={imp ? 0.01 : 0.5}
                    suffix={imp ? 'cuft/min' : 'L/min'}
                    decimals={imp ? 2 : 1}
                    onChange={(d) => setMgRmvLMin(imp ? d / L_TO_CUFT : d)}
                  />
                ) : (
                  <SliderWithInput
                    label="Your SAC Rate"
                    value={imp ? mgSacBarMin * BAR_TO_PSI : mgSacBarMin}
                    min={imp ? 4 : 0.3} max={imp ? 60 : 4.0} step={imp ? 1 : 0.1}
                    suffix={imp ? 'psi/min' : 'bar/min'}
                    decimals={imp ? 0 : 1}
                    onChange={(d) => setMgSacBarMin(imp ? d / BAR_TO_PSI : d)}
                  />
                )}
                <CardDivider />
                <SliderWithInput
                  label="Planned Bottom Time"
                  value={mgBotMin}
                  min={5} max={120} step={1}
                  suffix="min" decimals={0}
                  onChange={setMgBotMin}
                />
                <CardDivider />
                <SliderWithInput
                  label="Planned Depth"
                  value={imp ? mgDepthM / FT_TO_M : mgDepthM}
                  min={imp ? 15 : 5} max={imp ? 200 : 60} step={imp ? 5 : 1}
                  suffix={dUnit} decimals={0}
                  onChange={(d) => setMgDepthM(imp ? d * FT_TO_M : d)}
                />
                <CardDivider />
                <SliderWithInput
                  label="Reserve"
                  value={mgResPct}
                  min={10} max={50} step={1}
                  suffix="%" decimals={0}
                  onChange={setMgResPct}
                />
              </InputCard>

              <ResultCard>
                <Text style={r.heading}>Minimum Gas Required</Text>
                <Text style={r.heroValue}>
                  {imp
                    ? (minGasResult.totalGasL * L_TO_CUFT).toFixed(1) + ' cuft'
                    : minGasResult.totalGasL.toFixed(0) + ' L'}
                </Text>
                <Text style={r.heroSub}>
                  total (including {mgResPct}% reserve)
                </Text>
                <View style={r.details}>
                  <DetailRow
                    label="Gas for Dive"
                    value={imp
                      ? (minGasResult.diveGasL * L_TO_CUFT).toFixed(1) + ' cuft'
                      : minGasResult.diveGasL.toFixed(0) + ' L'}
                  />
                  <DetailRow
                    label="Reserve Gas"
                    value={imp
                      ? (minGasResult.resGasL * L_TO_CUFT).toFixed(1) + ' cuft'
                      : minGasResult.resGasL.toFixed(0) + ' L'}
                  />
                  <DetailRow
                    label="Consumption at Depth"
                    value={fmtFlow(minGasResult.consAtDepth)}
                  />
                  <DetailRow
                    label="Ambient Pressure"
                    value={minGasResult.ata.toFixed(1) + ' ATA'}
                  />
                </View>
                <View style={r.dividerLine} />
                <View style={r.suggestionRow}>
                  <Text style={r.cylinderIcon}>⬭</Text>
                  <Text style={r.suggestionText}>{minGasResult.suggestion}</Text>
                </View>
                {minGasResult.totalGasL > 4800 && (
                  <WarningLabel text="Very high gas requirement — consider a shorter dive or shallower depth" />
                )}
              </ResultCard>

              <Text style={r.sectionHead}>Your Gas Supply</Text>
              {mgCyls.map((entry, idx) => (
                <PlanCylCard
                  key={entry.id}
                  entry={entry}
                  index={idx}
                  canRemove={mgCyls.length > 1}
                  imp={imp}
                  pUnit={pUnit}
                  onUpdate={(id, patch) => setMgCyls(mgCyls.map(c => c.id === id ? { ...c, ...patch } : c))}
                  onRemove={(id) => setMgCyls(mgCyls.filter(c => c.id !== id))}
                />
              ))}
              {mgCyls.length < 4 && (
                <Pressable style={cy.addBtn} onPress={() => setMgCyls([...mgCyls, emptyPlanCyl()])}>
                  <Text style={cy.addBtnText}>+ Add Cylinder</Text>
                </Pressable>
              )}

              {mgAvailableL > 0 && (
                <ResultCard>
                  <Text style={r.heading}>Gas Adequacy</Text>
                  <View style={[cy.adequacyRow, { backgroundColor: mgAdequate ? Colors.success + '20' : Colors.emergency + '20' }]}>
                    <Text style={[cy.adequacyIcon, { color: mgAdequate ? Colors.success : Colors.emergency }]}>
                      {mgAdequate ? '✓' : '✗'}
                    </Text>
                    <Text style={[cy.adequacyText, { color: mgAdequate ? Colors.success : Colors.emergency }]}>
                      {mgAdequate ? 'Adequate Gas Supply' : 'Not Enough Gas'}
                    </Text>
                  </View>
                  <View style={r.details}>
                    <DetailRow label="Required"  value={fmtVol(minGasResult.totalGasL) + ' ' + vUnit} />
                    <DetailRow label="Available" value={fmtVol(mgAvailableL) + ' ' + vUnit} />
                    <DetailRow
                      label="Surplus / Deficit"
                      value={(mgAvailableL - minGasResult.totalGasL >= 0 ? '+' : '') +
                        fmtVol(mgAvailableL - minGasResult.totalGasL) + ' ' + vUnit}
                    />
                  </View>
                </ResultCard>
              )}
            </>
          )}

          <DisclaimerText text="For planning reference only. Always carry adequate reserve gas and follow the rule of thirds." />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function PlanCylCard({ entry, index, canRemove, imp, pUnit, onUpdate, onRemove }: {
  entry:     PlanCyl;
  index:     number;
  canRemove: boolean;
  imp:       boolean;
  pUnit:     string;
  onUpdate:  (id: string, patch: Partial<PlanCyl>) => void;
  onRemove:  (id: string) => void;
}) {
  return (
    <InputCard>
      <View style={cy.cylHeader}>
        <Text style={cy.cylTitle}>Cylinder {index + 1}</Text>
        {canRemove && (
          <Pressable onPress={() => onRemove(entry.id)} hitSlop={8}>
            <Text style={cy.removeText}>Remove</Text>
          </Pressable>
        )}
      </View>
      <CylinderPicker value={entry.cylinder} onChange={(c) => onUpdate(entry.id, { cylinder: c })} />
      <CardDivider />
      <SliderWithInput
        label="Fill Pressure"
        value={imp ? entry.fillBar * BAR_TO_PSI : entry.fillBar}
        min={imp ? 2200 : 150} max={imp ? 4500 : 300} step={imp ? 100 : 10}
        suffix={pUnit} decimals={0}
        onChange={(d) => onUpdate(entry.id, { fillBar: imp ? d / BAR_TO_PSI : d })}
      />
      <CardDivider />
      <SliderWithInput
        label="Reserve"
        value={imp ? entry.resBar * BAR_TO_PSI : entry.resBar}
        min={imp ? 145 : 10} max={imp ? 1500 : 100} step={imp ? 50 : 5}
        suffix={pUnit} decimals={0}
        onChange={(d) => onUpdate(entry.id, { resBar: imp ? d / BAR_TO_PSI : d })}
      />
    </InputCard>
  );
}

function SegPicker({
  options, selected, onSelect, compact,
}: {
  options: { v: string; l: string }[];
  selected: string;
  onSelect: (v: string) => void;
  compact?: boolean;
}) {
  return (
    <View style={[sp.container, compact && sp.compactContainer]}>
      {options.map((o) => (
        <Pressable
          key={o.v}
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
    return (
      <BlurView intensity={80} tint="regular" style={c.card}>
        {children}
      </BlurView>
    );
  }
  return <View style={[c.card, c.cardAndroid]}>{children}</View>;
}

function ResultCard({ children }: { children: React.ReactNode }) {
  return <View style={c.result}>{children}</View>;
}

function EmptyResult({ text }: { text: string }) {
  return (
    <View style={c.empty}>
      <Text style={c.emptyText}>{text}</Text>
    </View>
  );
}

function CardDivider() {
  return <View style={c.divider} />;
}

function ResultValue({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <View style={r.valueCol}>
      <View style={r.valueHStack}>
        <Text style={r.valuePrimary}>{value}</Text>
        <Text style={r.valueUnit}>{unit}</Text>
      </View>
      <Text style={r.valueLabel}>{label}</Text>
    </View>
  );
}

function AssessmentBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[r.badge, { backgroundColor: color + '26' }]}>
      <Text style={[r.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={r.detailRow}>
      <Text style={r.detailLabel}>{label}</Text>
      <Text style={r.detailValue}>{value}</Text>
    </View>
  );
}

function WarningLabel({ text }: { text: string }) {
  return (
    <View style={r.warning}>
      <Text style={r.warningIcon}>⚠</Text>
      <Text style={r.warningText}>{text}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

// Segmented picker
const sp = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.border,
    borderRadius: Radius.sm,
    padding: 2,
  },
  compactContainer: { marginTop: Spacing.xs },
  option: {
    flex: 1,
    paddingVertical: Spacing.xs + 2,
    alignItems: 'center',
    borderRadius: Radius.sm - 2,
  },
  optionActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    ...(Typography.footnote as TextStyle),
    fontWeight: '500' as TextStyle['fontWeight'],
    color: Colors.textSecondary,
  },
  labelActive: {
    fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.text,
  },
});

// Cards
const c = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  cardAndroid: { backgroundColor: 'rgba(255,255,255,0.92)' },
  result: {
    backgroundColor: Colors.accentBlueLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  empty: {
    backgroundColor: Colors.accentBlueLight,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  emptyText: {
    ...(Typography.subhead as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

// Result internals
const r = StyleSheet.create({
  heading: {
    ...(Typography.subhead as TextStyle),
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  // SAC / RMV value columns
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  vDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  valueCol: { alignItems: 'center', gap: 2 },
  valueHStack: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  valuePrimary: {
    fontSize: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.accentBlue,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  valueUnit: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.textSecondary,
  },
  valueLabel: {
    ...(Typography.caption2 as TextStyle),
    color: Colors.textSecondary,
  },
  // Assessment badge
  badge: {
    alignSelf: 'center',
    borderRadius: 9999,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    marginBottom: Spacing.md,
  },
  badgeText: {
    ...(Typography.caption1 as TextStyle),
    fontWeight: '700' as TextStyle['fontWeight'],
  },
  // Detail rows
  details: { gap: Spacing.xs },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.textSecondary,
  },
  detailValue: {
    ...(Typography.caption1 as TextStyle),
    fontWeight: '600' as TextStyle['fontWeight'],
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  // Hero (large bottom-time / gas volume)
  heroValue: {
    fontSize: 48,
    fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.accentBlue,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    marginBottom: Spacing.md,
  } as TextStyle,
  heroSub: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  // Min gas extras
  dividerLine: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: 2,
  },
  cylinderIcon: {
    fontSize: 14,
    color: Colors.accentBlue,
    marginTop: 1,
  },
  suggestionText: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.textSecondary,
    flex: 1,
  },
  // Warning
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  warningIcon: { fontSize: 12, color: Colors.warning, marginTop: 2 },
  warningText: {
    ...(Typography.caption1 as TextStyle),
    color: Colors.warning,
    flex: 1,
  },
  // Inline sub-heading (Min Gas basis toggle)
  inputSubhead: {
    ...(Typography.subhead as TextStyle),
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  sectionHead: {
    ...(Typography.footnote as TextStyle),
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },
  sacRefNote: {
    ...(Typography.caption2 as TextStyle),
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: Spacing.sm,
    fontStyle: 'italic' as const,
  },
});

// Cylinder card styles
const cy = StyleSheet.create({
  cylHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  cylTitle: { ...(Typography.subhead as TextStyle), fontWeight: '700' as const, color: Colors.text },
  removeText: { ...(Typography.footnote as TextStyle), color: Colors.emergency, fontWeight: '600' as const },
  addBtn: {
    borderWidth: 1.5, borderColor: Colors.accentBlue, borderStyle: 'dashed',
    borderRadius: Radius.md, paddingVertical: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { ...(Typography.subhead as TextStyle), color: Colors.accentBlue, fontWeight: '600' as const },
  adequacyRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.sm, padding: Spacing.sm, marginBottom: Spacing.md,
  },
  adequacyIcon: { fontSize: 18, fontWeight: '700' as const },
  adequacyText: { ...(Typography.headline as TextStyle), fontWeight: '700' as const },
});

// Screen
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: {
    ...(Typography.headline as TextStyle),
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerBack: {
    ...(Typography.body as TextStyle),
    color: Colors.accentBlue,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.xl,           // 20pt — matches spec VStack(spacing: 20)
  },
});
