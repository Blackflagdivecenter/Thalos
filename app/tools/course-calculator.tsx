import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/src/ui/components/Card';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { DisclaimerText } from '@/src/ui/components/DisclaimerText';

// ── Helpers ─────────────────────────────────────────────────────────────────
function p(s: string): number {
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) || n < 0 ? 0 : n;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

type InstructorFeeMode = 'perStudent' | 'fixed';

// ── Component ─────────────────────────────────────────────────────────────────
export default function CourseCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Course details ───────────────────────────────────────────────────────────
  const [numStudents,  setNumStudents]  = useState(4);
  const [poolSessions, setPoolSessions] = useState(2);
  const [owDays,       setOwDays]       = useState(2);

  // ── Student materials (per student) ─────────────────────────────────────────
  const [eLearning,    setELearning]    = useState('');
  const [agencyCert,   setAgencyCert]   = useState('');
  const [certCard,     setCertCard]     = useState('');
  const [stuInsurance, setStuInsurance] = useState('');

  // ── Equipment rental (per student, per day in water) ────────────────────────
  const [gearBcd,      setGearBcd]      = useState('');
  const [gearReg,      setGearReg]      = useState('');
  const [gearComputer, setGearComputer] = useState('');
  const [gearSuit,     setGearSuit]     = useState('');
  const [gearMask,     setGearMask]     = useState('');
  const [gearFins,     setGearFins]     = useState('');
  const [gearBooties,  setGearBooties]  = useState('');
  const [gearSnorkel,  setGearSnorkel]  = useState('');

  // ── Gas & fills (per student, per day in water) ──────────────────────────────
  const [gasFill,     setGasFill]     = useState('');
  const [nitroxUpg,   setNitroxUpg]   = useState('');

  // ── Instructor fees ──────────────────────────────────────────────────────────
  const [instrFeeMode, setInstrFeeMode] = useState<InstructorFeeMode>('perStudent');
  const [instrFee,     setInstrFee]     = useState('');

  // ── Student hotel (optional — if instructor books rooms for students) ─────────
  const [stuHotelNights,   setStuHotelNights]   = useState(2);
  const [stuHotelPerNight, setStuHotelPerNight] = useState('');
  const [stuHotelRooms,    setStuHotelRooms]    = useState(2);

  // ── Instructor expenses (spread across students) ─────────────────────────────
  const [instrHotelNights,  setInstrHotelNights]  = useState(2);
  const [instrHotelPerNight, setInstrHotelPerNight] = useState('');
  const [instrGas,          setInstrGas]           = useState('');

  // ── Facility & site (per person per day/session) ─────────────────────────────
  const [poolRentPP,  setPoolRentPP]  = useState('');   // per student per session
  const [owSiteFeePP, setOwSiteFeePP] = useState('');   // per student per OW day
  const [boatPP,      setBoatPP]      = useState('');   // per student per OW day

  // ── Admin & insurance ────────────────────────────────────────────────────────
  const [liabilityPerYear, setLiabilityPerYear] = useState('');  // annual
  const [coursesPerYear,   setCoursesPerYear]   = useState(10);  // for amortization
  const [adminOverhead,    setAdminOverhead]    = useState('');

  // ── Markup ───────────────────────────────────────────────────────────────────
  const [markupPct, setMarkupPct] = useState('20');

  const waterDays = poolSessions + owDays;

  // ── Calculations ─────────────────────────────────────────────────────────────
  const bd = useMemo(() => {
    const ns = numStudents;

    // Student materials
    const materials  = p(eLearning) * ns;
    const certFee    = p(agencyCert) * ns;
    const card       = p(certCard) * ns;
    const insur      = p(stuInsurance) * ns;

    // Equipment rental per student per day
    const gearTotal = (p(gearBcd) + p(gearReg) + p(gearComputer) + p(gearSuit)
                     + p(gearMask) + p(gearFins) + p(gearBooties) + p(gearSnorkel))
                     * ns * waterDays;

    // Gas
    const gas    = p(gasFill)   * ns * waterDays;
    const nitrox = p(nitroxUpg) * ns * waterDays;

    // Instructor fee
    const instrTotal = instrFeeMode === 'perStudent' ? p(instrFee) * ns : p(instrFee);

    // Student hotel (optional block-booking)
    const stuHotel = p(stuHotelPerNight) * stuHotelRooms * stuHotelNights;

    // Instructor expenses spread to students
    const instrHotel = p(instrHotelPerNight) * instrHotelNights;
    const instrGasAmt = p(instrGas);
    const instrExpenses = instrHotel + instrGasAmt;

    // Facility & site (per student per session/day)
    const pool  = p(poolRentPP)  * ns * poolSessions;
    const owSite= p(owSiteFeePP) * ns * owDays;
    const boat  = p(boatPP)      * ns * owDays;

    // Admin & insurance (liability amortized per course)
    const liab  = p(liabilityPerYear) / Math.max(1, coursesPerYear);
    const admin = p(adminOverhead);

    const totalCost = materials + certFee + card + insur
                    + stuHotel
                    + gearTotal + gas + nitrox
                    + instrTotal + instrExpenses
                    + pool + owSite + boat
                    + liab + admin;

    const costPerStu    = ns > 0 ? totalCost / ns : 0;
    const markup        = p(markupPct);
    const retailPerStu  = costPerStu * (1 + markup / 100);
    const totalRetail   = retailPerStu * ns;
    const profit        = totalRetail - totalCost;

    // Gear per student per day breakdown
    const gearPPD = p(gearBcd) + p(gearReg) + p(gearComputer) + p(gearSuit)
                  + p(gearMask) + p(gearFins) + p(gearBooties) + p(gearSnorkel);

    return {
      materials, certFee, card, insur, stuHotel, gearTotal, gas, nitrox,
      instrTotal, instrExpenses, pool, owSite, boat, liab, admin,
      totalCost, costPerStu, markup, retailPerStu, totalRetail, profit,
      gearPPD,
    };
  }, [
    numStudents, poolSessions, owDays, waterDays,
    eLearning, agencyCert, certCard, stuInsurance,
    stuHotelNights, stuHotelPerNight, stuHotelRooms,
    gearBcd, gearReg, gearComputer, gearSuit, gearMask, gearFins, gearBooties, gearSnorkel,
    gasFill, nitroxUpg,
    instrFeeMode, instrFee, instrHotelNights, instrHotelPerNight, instrGas,
    poolRentPP, owSiteFeePP, boatPP,
    liabilityPerYear, coursesPerYear, adminOverhead, markupPct,
  ]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Course Calculator</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Course Details */}
          <SectionLabel label="Course Details" />
          <Card variant="input">
            <CounterRow label="Students" value={numStudents} min={1} max={99} onChange={setNumStudents} />
            <Divider />
            <CounterRow label="Pool / Confined Water Sessions" value={poolSessions} min={0} max={20} onChange={setPoolSessions} />
            <Divider />
            <CounterRow label="Open Water Days" value={owDays} min={0} max={20} onChange={setOwDays} />
          </Card>

          {/* Student Materials */}
          <SectionLabel label="Student Materials (per student)" />
          <Card variant="input">
            <AmountField label="E-Learning / Manual / Workbook" value={eLearning} onChange={setELearning} />
            <Divider />
            <AmountField label="Agency Certification Fee" note="PADI, NAUI, SSI, etc." value={agencyCert} onChange={setAgencyCert} />
            <Divider />
            <AmountField label="Certification Card" value={certCard} onChange={setCertCard} />
            <Divider />
            <AmountField label="Student Dive Insurance" value={stuInsurance} onChange={setStuInsurance} />
          </Card>

          {/* Equipment Rental */}
          <SectionLabel label={`Equipment Rental (per student, per day · ${waterDays} day${waterDays !== 1 ? 's' : ''})`} />
          <Card variant="input">
            <AmountField label="BCD" value={gearBcd} onChange={setGearBcd} />
            <Divider />
            <AmountField label="Regulator" value={gearReg} onChange={setGearReg} />
            <Divider />
            <AmountField label="Dive Computer" value={gearComputer} onChange={setGearComputer} />
            <Divider />
            <AmountField label="Wetsuit / Drysuit" value={gearSuit} onChange={setGearSuit} />
            <Divider />
            <AmountField label="Mask" value={gearMask} onChange={setGearMask} />
            <Divider />
            <AmountField label="Fins" value={gearFins} onChange={setGearFins} />
            <Divider />
            <AmountField label="Booties" value={gearBooties} onChange={setGearBooties} />
            <Divider />
            <AmountField label="Snorkel" value={gearSnorkel} onChange={setGearSnorkel} />
            {bd.gearPPD > 0 && (
              <View style={styles.gearTotal}>
                <Text style={styles.gearTotalLabel}>Total per student / day</Text>
                <Text style={styles.gearTotalValue}>{fmt(bd.gearPPD)}</Text>
              </View>
            )}
          </Card>

          {/* Gas & Fills */}
          <SectionLabel label={`Gas & Fills (per student, per day · ${waterDays} day${waterDays !== 1 ? 's' : ''})`} />
          <Card variant="input">
            <AmountField label="Tank / Gas Fill" value={gasFill} onChange={setGasFill} />
            <Divider />
            <AmountField label="Nitrox Upgrade" note="optional" value={nitroxUpg} onChange={setNitroxUpg} />
          </Card>

          {/* Student Hotel */}
          <SectionLabel label="Student Hotel (optional)" />
          <Card variant="input">
            <AmountField
              label="Cost per Night / Room"
              note="leave $0 if not booking hotel for students"
              value={stuHotelPerNight}
              onChange={setStuHotelPerNight}
            />
            <Divider />
            <CounterRow label="Rooms" value={stuHotelRooms} min={0} max={40} onChange={setStuHotelRooms} />
            <Divider />
            <CounterRow label="Nights" value={stuHotelNights} min={0} max={60} onChange={setStuHotelNights} />
          </Card>

          {/* Instructor Fee */}
          <SectionLabel label="Instructor Fee" />
          <Card variant="input">
            <View style={styles.modeRow}>
              <ModeButton label="Per Student" active={instrFeeMode === 'perStudent'} onPress={() => setInstrFeeMode('perStudent')} />
              <ModeButton label="Fixed Fee"   active={instrFeeMode === 'fixed'}      onPress={() => setInstrFeeMode('fixed')}      />
            </View>
            <View style={{ marginTop: Spacing.sm }}>
              <AmountField
                label={instrFeeMode === 'perStudent' ? 'Fee per Student' : 'Fixed Fee for Course'}
                note={instrFeeMode === 'perStudent' ? 'e.g. $75–$150 per student' : 'flat rate for the course'}
                value={instrFee}
                onChange={setInstrFee}
              />
            </View>
          </Card>

          {/* Instructor Expenses */}
          <SectionLabel label="Instructor Expenses (spread across students)" />
          <Card variant="input">
            <AmountField label="Hotel per Night" value={instrHotelPerNight} onChange={setInstrHotelPerNight} />
            <Divider />
            <CounterRow label="Hotel Nights" value={instrHotelNights} min={0} max={60} onChange={setInstrHotelNights} />
            <Divider />
            <AmountField label="Gas / Fuel" note="instructor's total transport fuel" value={instrGas} onChange={setInstrGas} />
          </Card>

          {/* Facility & Site */}
          <SectionLabel label="Facility & Site (per student)" />
          <Card variant="input">
            <AmountField label="Pool / Facility per Student per Session" value={poolRentPP} onChange={setPoolRentPP} />
            <Divider />
            <AmountField label="Open Water Site Fee per Student per Day" note="dive park, boat launch, permits" value={owSiteFeePP} onChange={setOwSiteFeePP} />
            <Divider />
            <AmountField label="Boat Charter per Student per Day" value={boatPP} onChange={setBoatPP} />
          </Card>

          {/* Admin & Insurance */}
          <SectionLabel label="Admin & Insurance" />
          <Card variant="input">
            <AmountField label="Annual Liability Insurance" note="automatically divided by courses/year" value={liabilityPerYear} onChange={setLiabilityPerYear} />
            <Divider />
            <CounterRow label="Courses You Run per Year" value={coursesPerYear} min={1} max={200} onChange={setCoursesPerYear} />
            {bd.liab > 0 && (
              <View style={styles.amortRow}>
                <Text style={styles.amortLabel}>↳ Per-course share</Text>
                <Text style={styles.amortValue}>{fmt(bd.liab)}</Text>
              </View>
            )}
            <Divider />
            <AmountField label="Admin & Marketing" note="printing, advertising, misc" value={adminOverhead} onChange={setAdminOverhead} />
          </Card>

          {/* Markup */}
          <SectionLabel label="Markup" />
          <Card variant="input">
            <View style={styles.markupRow}>
              <Text style={styles.markupLabel}>Markup Percentage</Text>
              <View style={styles.markupInputWrap}>
                <TextInput
                  style={styles.markupInput}
                  value={markupPct}
                  onChangeText={setMarkupPct}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.textTertiary}
                  placeholder="20"
                />
                <Text style={styles.markupSymbol}>%</Text>
              </View>
            </View>
            <View style={styles.markupPresets}>
              {['0', '10', '15', '20', '25', '30'].map(pct => (
                <Pressable
                  key={pct}
                  onPress={() => setMarkupPct(pct)}
                  style={[styles.markupPreset, markupPct === pct && styles.markupPresetActive]}
                >
                  <Text style={[styles.markupPresetText, markupPct === pct && styles.markupPresetTextActive]}>
                    {pct}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Results */}
          <SectionLabel label="Results" />
          <Card variant="result">
            <View style={styles.resultGrid}>
              <ResultBig label="Cost / Student" value={fmt(bd.costPerStu)} />
              <View style={styles.resultDividerV} />
              <ResultBig label={`Retail / Student (${bd.markup.toFixed(0)}%↑)`} value={fmt(bd.retailPerStu)} accent />
            </View>

            <View style={styles.resultDividerH} />

            <View style={styles.resultGrid}>
              <ResultBig label="Total Course Cost" value={fmt(bd.totalCost)} />
              <View style={styles.resultDividerV} />
              <ResultBig label="Total Retail Revenue" value={fmt(bd.totalRetail)} />
            </View>

            <View style={styles.resultDividerH} />

            <View style={[styles.profitBanner, {
              backgroundColor: bd.profit >= 0 ? Colors.success + '1A' : Colors.emergency + '1A',
            }]}>
              <Text style={styles.profitLabel}>Estimated Profit</Text>
              <Text style={[styles.profitValue, { color: bd.profit >= 0 ? Colors.success : Colors.emergency }]}>
                {fmt(bd.profit)}
              </Text>
            </View>

            <View style={styles.resultDividerH} />

            <Text style={styles.breakdownHeading}>COST BREAKDOWN</Text>
            {bd.materials     > 0 && <BkRow label="Student Materials"        value={bd.materials} />}
            {bd.stuHotel      > 0 && <BkRow label="Student Hotel"           value={bd.stuHotel} />}
            {bd.certFee       > 0 && <BkRow label="Agency Cert Fees"        value={bd.certFee} />}
            {bd.card          > 0 && <BkRow label="Cert Cards"              value={bd.card} />}
            {bd.insur         > 0 && <BkRow label="Student Insurance"       value={bd.insur} />}
            {bd.gearTotal     > 0 && <BkRow label="Equipment Rental"        value={bd.gearTotal} />}
            {bd.gas           > 0 && <BkRow label="Tank / Gas Fills"        value={bd.gas} />}
            {bd.nitrox        > 0 && <BkRow label="Nitrox Upgrades"         value={bd.nitrox} />}
            {bd.instrTotal    > 0 && <BkRow label="Instructor Fee"          value={bd.instrTotal} />}
            {bd.instrExpenses > 0 && <BkRow label="Instructor Expenses"     value={bd.instrExpenses} />}
            {bd.pool          > 0 && <BkRow label="Pool / Facility"         value={bd.pool} />}
            {bd.owSite        > 0 && <BkRow label="Open Water Site Fees"    value={bd.owSite} />}
            {bd.boat          > 0 && <BkRow label="Boat Charter"            value={bd.boat} />}
            {bd.liab          > 0 && <BkRow label="Liability Insurance"     value={bd.liab} />}
            {bd.admin         > 0 && <BkRow label="Admin & Marketing"       value={bd.admin} />}

            <View style={styles.resultDividerH} />

            <Text style={styles.resultNote}>
              {`${numStudents} student${numStudents !== 1 ? 's' : ''} · ${poolSessions} pool session${poolSessions !== 1 ? 's' : ''} · ${owDays} OW day${owDays !== 1 ? 's' : ''} · ${waterDays} total in-water days · Instructor expenses included`}
            </Text>
          </Card>

          <DisclaimerText />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={sub.label}>{label}</Text>;
}

function Divider() {
  return <View style={sub.divider} />;
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[mb.btn, active && mb.btnActive]}>
      <Text style={[mb.text, active && mb.textActive]}>{label}</Text>
    </Pressable>
  );
}

function CounterRow({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <View style={cr.row}>
      <Text style={cr.label}>{label}</Text>
      <View style={cr.controls}>
        <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={[cr.btn, value <= min && cr.btnDisabled]} hitSlop={8}>
          <Text style={[cr.btnText, value <= min && cr.btnTextDisabled]}>−</Text>
        </Pressable>
        <Text style={cr.value}>{value}</Text>
        <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={[cr.btn, value >= max && cr.btnDisabled]} hitSlop={8}>
          <Text style={[cr.btnText, value >= max && cr.btnTextDisabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MiniCounter({ value, min, max, onChange }: {
  value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <View style={mc.row}>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={[mc.btn, value <= min && mc.btnDisabled]} hitSlop={8}>
        <Text style={[mc.btnText, value <= min && mc.btnTextDisabled]}>−</Text>
      </Pressable>
      <Text style={mc.value}>{value}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={[mc.btn, value >= max && mc.btnDisabled]} hitSlop={8}>
        <Text style={[mc.btnText, value >= max && mc.btnTextDisabled]}>+</Text>
      </Pressable>
    </View>
  );
}

function AmountField({ label, note, value, onChange, style }: {
  label: string; note?: string; value: string; onChange: (v: string) => void; style?: object;
}) {
  return (
    <View style={[af.container, style]}>
      <View style={af.labelRow}>
        <Text style={af.label}>{label}</Text>
        {note && <Text style={af.note}>{note}</Text>}
      </View>
      <View style={af.inputRow}>
        <Text style={af.dollar}>$</Text>
        <TextInput
          style={af.input}
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={Colors.textTertiary}
        />
      </View>
    </View>
  );
}

function ResultBig({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={rb.container}>
      <Text style={rb.label}>{label}</Text>
      <Text style={[rb.value, accent && rb.valueAccent]}>{value}</Text>
    </View>
  );
}

function BkRow({ label, value }: { label: string; value: number }) {
  if (value === 0) return null;
  return (
    <View style={bk.row}>
      <Text style={bk.label}>{label}</Text>
      <Text style={bk.value}>{fmtShort(value)}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const sub = StyleSheet.create({
  label: {
    ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, marginHorizontal: 2,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.sm },
});

const mb = StyleSheet.create({
  btn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  btnActive: { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  text: { ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary } as TextStyle,
  textActive: { color: '#fff' },
});

const cr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  label: { ...Typography.body, color: Colors.text, flex: 1 } as TextStyle,
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  btn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: Colors.accentBlue, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { borderColor: Colors.border },
  btnText: { fontSize: 20, lineHeight: 24, fontWeight: '500' as const, color: Colors.accentBlue },
  btnTextDisabled: { color: Colors.border },
  value: { ...Typography.title3, fontWeight: '700' as const, color: Colors.text, minWidth: 28, textAlign: 'center', fontVariant: ['tabular-nums'] } as TextStyle,
});

const mc = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  btn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: Colors.accentBlue, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { borderColor: Colors.border },
  btnText: { fontSize: 18, lineHeight: 22, fontWeight: '500' as const, color: Colors.accentBlue },
  btnTextDisabled: { color: Colors.border },
  value: { ...Typography.subhead, fontWeight: '700' as const, color: Colors.text, minWidth: 22, textAlign: 'center', fontVariant: ['tabular-nums'] } as TextStyle,
});

const af = StyleSheet.create({
  container: { paddingVertical: Spacing.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  label: { ...Typography.body, color: Colors.text, flex: 1 } as TextStyle,
  note: { ...Typography.caption1, color: Colors.textSecondary } as TextStyle,
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dollar: { ...Typography.title3, color: Colors.textSecondary, fontWeight: '500' as const } as TextStyle,
  input: { flex: 1, ...Typography.title3, fontWeight: '600' as const, color: Colors.text, paddingVertical: Spacing.xs, fontVariant: ['tabular-nums'] } as TextStyle,
});

const rb = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  label: { ...Typography.caption1, color: Colors.textSecondary, textAlign: 'center', marginBottom: 4 } as TextStyle,
  value: { ...Typography.subhead, fontWeight: '700' as const, color: Colors.text, textAlign: 'center', fontVariant: ['tabular-nums'] } as TextStyle,
  valueAccent: { color: Colors.accentBlue, fontSize: 17 },
});

const bk = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  label: { ...Typography.footnote, color: Colors.textSecondary, flex: 1 } as TextStyle,
  value: { ...Typography.footnote, fontWeight: '600' as const, color: Colors.text, fontVariant: ['tabular-nums'] } as TextStyle,
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
  headerTitle: { ...Typography.headline, color: Colors.text, flex: 1, textAlign: 'center' } as TextStyle,
  headerBack: { ...Typography.body, color: Colors.accentBlue } as TextStyle,
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },

  // Gear total summary row
  gearTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.sm, paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
  },
  gearTotalLabel: { ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary } as TextStyle,
  gearTotalValue: { ...Typography.subhead, fontWeight: '700' as const, color: Colors.accentBlue, fontVariant: ['tabular-nums'] } as TextStyle,

  // Amortization inline note
  amortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.xs, paddingLeft: Spacing.md },
  amortLabel: { ...Typography.caption1, color: Colors.textSecondary } as TextStyle,
  amortValue: { ...Typography.caption1, fontWeight: '700' as const, color: Colors.accentBlue, fontVariant: ['tabular-nums'] } as TextStyle,

  // Instructor fee mode
  modeRow: { flexDirection: 'row', gap: Spacing.sm },

  // Markup
  markupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  markupLabel: { ...Typography.body, color: Colors.text, flex: 1 } as TextStyle,
  markupInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  markupInput: { ...Typography.title3, fontWeight: '700' as const, color: Colors.text, minWidth: 60, textAlign: 'right', paddingVertical: Spacing.xs, fontVariant: ['tabular-nums'] } as TextStyle,
  markupSymbol: { ...Typography.title3, fontWeight: '700' as const, color: Colors.accentBlue } as TextStyle,
  markupPresets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  markupPreset: { borderRadius: 99, paddingHorizontal: Spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  markupPresetActive: { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  markupPresetText: { ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary } as TextStyle,
  markupPresetTextActive: { color: '#fff' },

  // Results
  resultGrid: { flexDirection: 'row', alignItems: 'stretch', gap: Spacing.sm },
  resultDividerV: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  resultDividerH: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.md },
  profitBanner: { borderRadius: Radius.sm, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  profitLabel: { ...Typography.subhead, fontWeight: '600' as const, color: Colors.text } as TextStyle,
  profitValue: { fontSize: 22, fontWeight: '800' as const, fontVariant: ['tabular-nums'] } as TextStyle,
  breakdownHeading: { ...Typography.caption2, fontWeight: '700' as const, color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.xs } as TextStyle,
  resultNote: { ...Typography.caption2, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 } as TextStyle,
});
