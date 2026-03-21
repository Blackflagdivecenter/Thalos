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
function parseNum(s: string): number {
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) || n < 0 ? 0 : n;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TripCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Trip details ────────────────────────────────────────────────────────────
  const [numCustomers, setNumCustomers] = useState(8);
  const [numLeaders,   setNumLeaders]   = useState(1);
  const [divingDays,   setDivingDays]   = useState(5);
  const [hotelNights,  setHotelNights]  = useState(7);

  // ── Flights ─────────────────────────────────────────────────────────────────
  const [planeTicket, setPlaneTicket] = useState('');

  // ── Hotel ────────────────────────────────────────────────────────────────────
  const [hotelNightRate, setHotelNightRate] = useState('');
  const [hotelRooms,     setHotelRooms]     = useState(4);

  // ── Diving (per person per day) ─────────────────────────────────────────────
  const [diveFeePPD,       setDiveFeePPD]       = useState('');
  const [tankRentalPPD,    setTankRentalPPD]    = useState('');
  const [nitroxUpgradePPD, setNitroxUpgradePPD] = useState('');
  const [equipRentalPPD,   setEquipRentalPPD]   = useState('');

  // ── Other (per person one-time unless noted) ─────────────────────────────────
  const [mealsPPD,        setMealsPPD]        = useState('');
  const [marineParkPP,    setMarineParkPP]    = useState('');
  const [groundTransPP,   setGroundTransPP]   = useState('');
  const [diveInsurancePP, setDiveInsurancePP] = useState('');
  const [gasFuelTotal,    setGasFuelTotal]    = useState('');
  const [tipsTotal,       setTipsTotal]       = useState('');

  // ── Markup ──────────────────────────────────────────────────────────────────
  const [markupPct, setMarkupPct] = useState('20');

  const numAll = numCustomers + numLeaders;

  // ── Calculations ────────────────────────────────────────────────────────────
  const breakdown = useMemo(() => {
    const plane     = parseNum(planeTicket)       * numAll;
    const hotel1    = parseNum(hotelNightRate)    * hotelRooms   * hotelNights;
    const diveFee   = parseNum(diveFeePPD)        * numAll       * divingDays;
    const tankRent  = parseNum(tankRentalPPD)     * numAll       * divingDays;
    const nitrox    = parseNum(nitroxUpgradePPD)  * numAll       * divingDays;
    const equipRent = parseNum(equipRentalPPD)    * numAll       * divingDays;
    const meals     = parseNum(mealsPPD)          * numAll       * divingDays;
    const marinePk  = parseNum(marineParkPP)      * numAll;
    const ground    = parseNum(groundTransPP)     * numAll;
    const insurance = parseNum(diveInsurancePP)   * numAll;
    const gas       = parseNum(gasFuelTotal);
    const tips      = parseNum(tipsTotal);

    const totalCost   = plane + hotel1 + diveFee + tankRent + nitrox
                      + equipRent + meals + marinePk + ground + insurance + gas + tips;

    const costPerCust   = numCustomers > 0 ? totalCost / numCustomers : 0;
    const markup        = parseNum(markupPct);
    const retailPerCust = costPerCust * (1 + markup / 100);
    const totalRetail   = retailPerCust * numCustomers;
    const profit        = totalRetail - totalCost;

    return {
      plane, hotel1, diveFee, tankRent, nitrox, equipRent, meals,
      marinePk, ground, insurance, gas, tips,
      totalCost, costPerCust, markup, retailPerCust, totalRetail, profit,
    };
  }, [
    numCustomers, numLeaders, divingDays, hotelNights,
    planeTicket, hotelNightRate, hotelRooms,
    diveFeePPD, tankRentalPPD, nitroxUpgradePPD, equipRentalPPD,
    mealsPPD, marineParkPP, groundTransPP, diveInsurancePP,
    gasFuelTotal, tipsTotal, markupPct,
  ]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Trip Calculator</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Trip Details */}
          <SectionLabel label="Trip Details" />
          <Card variant="input">
            <CounterRow label="Paying Customers" value={numCustomers} min={1} max={99} onChange={setNumCustomers} />
            <Divider />
            <CounterRow label="Group Leaders (free)" value={numLeaders} min={0} max={20} onChange={setNumLeaders} />
            <Divider />
            <CounterRow label="Days of Diving" value={divingDays} min={1} max={30} onChange={setDivingDays} />
            <Divider />
            <CounterRow label="Hotel Nights" value={hotelNights} min={0} max={60} onChange={setHotelNights} />
          </Card>

          {/* Flights */}
          <SectionLabel label="Flights" />
          <Card variant="input">
            <AmountField
              label="Plane Ticket per Person"
              note="Customers + leaders"
              value={planeTicket}
              onChange={setPlaneTicket}
            />
          </Card>

          {/* Hotel */}
          <SectionLabel label="Hotel" />
          <Card variant="input">
            <View style={styles.hotelRow}>
              <AmountField
                label="Cost per Night / Room"
                note="all rooms, all nights"
                value={hotelNightRate}
                onChange={setHotelNightRate}
                style={styles.hotelAmtField}
              />
              <View style={styles.hotelCounter}>
                <Text style={styles.hotelCounterLabel}>Rooms</Text>
                <MiniCounter value={hotelRooms} min={0} max={40} onChange={setHotelRooms} />
              </View>
            </View>
          </Card>

          {/* Diving */}
          <SectionLabel label="Diving (per person, per day)" />
          <Card variant="input">
            <AmountField label="Dive Fee" value={diveFeePPD} onChange={setDiveFeePPD} />
            <Divider />
            <AmountField label="Tank Rental" value={tankRentalPPD} onChange={setTankRentalPPD} />
            <Divider />
            <AmountField label="Nitrox Upgrade" value={nitroxUpgradePPD} onChange={setNitroxUpgradePPD} />
            <Divider />
            <AmountField label="Equipment Rental" value={equipRentalPPD} onChange={setEquipRentalPPD} />
          </Card>

          {/* Other */}
          <SectionLabel label="Other Expenses" />
          <Card variant="input">
            <AmountField label="Meals / Per Diem" note="per person, per day" value={mealsPPD} onChange={setMealsPPD} />
            <Divider />
            <AmountField label="Marine Park / Entry Fees" note="per person, one-time" value={marineParkPP} onChange={setMarineParkPP} />
            <Divider />
            <AmountField label="Ground Transport" note="per person, one-time" value={groundTransPP} onChange={setGroundTransPP} />
            <Divider />
            <AmountField label="Dive Insurance" note="per person, one-time" value={diveInsurancePP} onChange={setDiveInsurancePP} />
            <Divider />
            <AmountField label="Fuel / Gas" note="total fixed cost" value={gasFuelTotal} onChange={setGasFuelTotal} />
            <Divider />
            <AmountField label="Tips & Gratuity" note="total fixed cost" value={tipsTotal} onChange={setTipsTotal} />
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
            {/* Quick presets */}
            <View style={styles.markupPresets}>
              {['0', '10', '15', '20', '25', '30'].map(p => (
                <Pressable
                  key={p}
                  onPress={() => setMarkupPct(p)}
                  style={[styles.markupPreset, markupPct === p && styles.markupPresetActive]}
                >
                  <Text style={[styles.markupPresetText, markupPct === p && styles.markupPresetTextActive]}>
                    {p}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Results */}
          <SectionLabel label="Results" />
          <Card variant="result">
            {/* Main numbers */}
            <View style={styles.resultGrid}>
              <ResultBig label="Cost / Customer" value={fmt(breakdown.costPerCust)} />
              <View style={styles.resultDividerV} />
              <ResultBig
                label={`Retail / Customer (${breakdown.markup.toFixed(0)}%↑)`}
                value={fmt(breakdown.retailPerCust)}
                accent
              />
            </View>

            <View style={styles.resultDividerH} />

            <View style={styles.resultGrid}>
              <ResultBig label="Total Trip Cost" value={fmt(breakdown.totalCost)} />
              <View style={styles.resultDividerV} />
              <ResultBig label="Total Retail Revenue" value={fmt(breakdown.totalRetail)} />
            </View>

            <View style={styles.resultDividerH} />

            {/* Profit highlight */}
            <View style={[styles.profitBanner, {
              backgroundColor: breakdown.profit >= 0 ? Colors.success + '1A' : Colors.emergency + '1A',
            }]}>
              <Text style={styles.profitLabel}>Estimated Profit</Text>
              <Text style={[styles.profitValue, {
                color: breakdown.profit >= 0 ? Colors.success : Colors.emergency,
              }]}>
                {fmt(breakdown.profit)}
              </Text>
            </View>

            <View style={styles.resultDividerH} />

            {/* Breakdown table */}
            <Text style={styles.breakdownHeading}>COST BREAKDOWN</Text>
            <BkRow label="Flights" value={breakdown.plane} />
            <BkRow label="Hotel" value={breakdown.hotel1} />
            <BkRow label="Dive Fees" value={breakdown.diveFee} />
            {breakdown.tankRent > 0  && <BkRow label="Tank Rentals"    value={breakdown.tankRent} />}
            {breakdown.nitrox > 0    && <BkRow label="Nitrox Upgrades" value={breakdown.nitrox} />}
            {breakdown.equipRent > 0 && <BkRow label="Equipment Rental" value={breakdown.equipRent} />}
            {breakdown.meals > 0     && <BkRow label="Meals / Per Diem" value={breakdown.meals} />}
            {breakdown.marinePk > 0  && <BkRow label="Marine Park Fees" value={breakdown.marinePk} />}
            {breakdown.ground > 0    && <BkRow label="Ground Transport" value={breakdown.ground} />}
            {breakdown.insurance > 0 && <BkRow label="Dive Insurance"   value={breakdown.insurance} />}
            {breakdown.gas > 0       && <BkRow label="Fuel / Gas"        value={breakdown.gas} />}
            {breakdown.tips > 0      && <BkRow label="Tips & Gratuity"   value={breakdown.tips} />}

            <View style={styles.resultDividerH} />

            {/* Summary note */}
            <Text style={styles.resultNote}>
              {`${numCustomers} paying customers · ${numLeaders} leader${numLeaders !== 1 ? 's' : ''} (free) · ${numAll} total · Leaders' costs spread across customers`}
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

function CounterRow({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <View style={cr.row}>
      <Text style={cr.label}>{label}</Text>
      <View style={cr.controls}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          style={[cr.btn, value <= min && cr.btnDisabled]}
          hitSlop={8}
        >
          <Text style={[cr.btnText, value <= min && cr.btnTextDisabled]}>−</Text>
        </Pressable>
        <Text style={cr.value}>{value}</Text>
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          style={[cr.btn, value >= max && cr.btnDisabled]}
          hitSlop={8}
        >
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
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={[mc.btn, value <= min && mc.btnDisabled]}
        hitSlop={8}
      >
        <Text style={[mc.btnText, value <= min && mc.btnTextDisabled]}>−</Text>
      </Pressable>
      <Text style={mc.value}>{value}</Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={[mc.btn, value >= max && mc.btnDisabled]}
        hitSlop={8}
      >
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
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
});

const cr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: Spacing.xs,
  },
  label: { ...Typography.body, color: Colors.text, flex: 1 } as TextStyle,
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  btn: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.accentBlue, alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { borderColor: Colors.border },
  btnText: {
    fontSize: 20, lineHeight: 24, fontWeight: '500' as const, color: Colors.accentBlue,
  },
  btnTextDisabled: { color: Colors.border },
  value: {
    ...Typography.title3, fontWeight: '700' as const,
    color: Colors.text, minWidth: 28, textAlign: 'center',
    fontVariant: ['tabular-nums'],
  } as TextStyle,
});

const mc = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  btn: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    borderColor: Colors.accentBlue, alignItems: 'center', justifyContent: 'center',
  },
  btnDisabled: { borderColor: Colors.border },
  btnText: { fontSize: 18, lineHeight: 22, fontWeight: '500' as const, color: Colors.accentBlue },
  btnTextDisabled: { color: Colors.border },
  value: {
    ...Typography.subhead, fontWeight: '700' as const,
    color: Colors.text, minWidth: 22, textAlign: 'center',
    fontVariant: ['tabular-nums'],
  } as TextStyle,
});

const af = StyleSheet.create({
  container: { paddingVertical: Spacing.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  label: { ...Typography.body, color: Colors.text, flex: 1 } as TextStyle,
  note: { ...Typography.caption1, color: Colors.textSecondary } as TextStyle,
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dollar: { ...Typography.title3, color: Colors.textSecondary, fontWeight: '500' as const } as TextStyle,
  input: {
    flex: 1, ...Typography.title3, fontWeight: '600' as const,
    color: Colors.text, paddingVertical: Spacing.xs,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
});

const rb = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  label: {
    ...Typography.caption1, color: Colors.textSecondary,
    textAlign: 'center', marginBottom: 4,
  } as TextStyle,
  value: {
    ...Typography.subhead, fontWeight: '700' as const,
    color: Colors.text, textAlign: 'center',
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  valueAccent: { color: Colors.accentBlue, fontSize: 17 },
});

const bk = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 3,
  },
  label: { ...Typography.footnote, color: Colors.textSecondary, flex: 1 } as TextStyle,
  value: {
    ...Typography.footnote, fontWeight: '600' as const,
    color: Colors.text, fontVariant: ['tabular-nums'],
  } as TextStyle,
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerBtn: { minWidth: 60 },
  headerTitle: { ...Typography.headline, color: Colors.text, flex: 1, textAlign: 'center' } as TextStyle,
  headerBack: { ...Typography.body, color: Colors.accentBlue } as TextStyle,
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },

  // Hotel layout
  hotelRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
  hotelAmtField: { flex: 1 },
  hotelCounter: { alignItems: 'center', paddingBottom: Spacing.xs, gap: 4 },
  hotelCounterLabel: { ...Typography.caption1, color: Colors.textSecondary } as TextStyle,

  // Markup
  markupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  markupLabel: { ...Typography.body, color: Colors.text, flex: 1 } as TextStyle,
  markupInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  markupInput: {
    ...Typography.title3, fontWeight: '700' as const, color: Colors.text,
    minWidth: 60, textAlign: 'right', paddingVertical: Spacing.xs,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  markupSymbol: { ...Typography.title3, fontWeight: '700' as const, color: Colors.accentBlue } as TextStyle,
  markupPresets: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md,
  },
  markupPreset: {
    borderRadius: 99, paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  markupPresetActive: { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
  markupPresetText: { ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary } as TextStyle,
  markupPresetTextActive: { color: '#fff' },

  // Results
  resultGrid: { flexDirection: 'row', alignItems: 'stretch', gap: Spacing.sm },
  resultDividerV: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  resultDividerH: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.md },
  profitBanner: {
    borderRadius: Radius.sm, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  profitLabel: { ...Typography.subhead, fontWeight: '600' as const, color: Colors.text } as TextStyle,
  profitValue: { fontSize: 22, fontWeight: '800' as const, fontVariant: ['tabular-nums'] } as TextStyle,
  breakdownHeading: {
    ...Typography.caption2, fontWeight: '700' as const, color: Colors.textSecondary,
    letterSpacing: 0.5, marginBottom: Spacing.xs,
  } as TextStyle,
  resultNote: {
    ...Typography.caption2, color: Colors.textSecondary,
    textAlign: 'center', marginTop: 2,
  } as TextStyle,
});
