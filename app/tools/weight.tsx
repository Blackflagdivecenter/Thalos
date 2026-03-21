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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/src/ui/components/Card';
import { SliderWithInput } from '@/src/ui/components/SliderWithInput';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { DisclaimerText } from '@/src/ui/components/DisclaimerText';

const KG_TO_LBS = 2.20462;

const SUITS = [
  { id: 'none',    label: 'No Suit / Rashguard', baseWeightKg: 0.0 },
  { id: 'shorty3', label: '3mm Shorty',           baseWeightKg: 0.5 },
  { id: 'full3',   label: '3mm Full Suit',        baseWeightKg: 1.5 },
  { id: 'full5',   label: '5mm Full Suit',        baseWeightKg: 2.5 },
  { id: 'full7',   label: '7mm Full Suit',        baseWeightKg: 3.5 },
  { id: 'semidry', label: 'Semi-Dry 6–7mm',       baseWeightKg: 4.0 },
  { id: 'dry',     label: 'Drysuit',              baseWeightKg: 5.0 },
] as const;

const TANKS = [
  { id: 'al80',  label: 'Aluminum 80 (AL80)',  buoyancyOffsetKg:  0.8 },
  { id: 'al63',  label: 'Aluminum 63',         buoyancyOffsetKg:  0.5 },
  { id: 'hp80',  label: 'Steel 80 (HP80)',     buoyancyOffsetKg: -1.0 },
  { id: 'hp100', label: 'Steel 100 (HP100)',   buoyancyOffsetKg: -1.4 },
  { id: 'hp120', label: 'Steel 120 (HP120)',   buoyancyOffsetKg: -1.8 },
] as const;

type SuitId = typeof SUITS[number]['id'];
type TankId = typeof TANKS[number]['id'];

function fmtOffset(v: number, metric: boolean): string {
  const val  = metric ? v : v * KG_TO_LBS;
  const unit = metric ? 'kg' : 'lbs';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(1)} ${unit}`;
}

export default function WeightCalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [useMetric, setUseMetric] = useState(true);
  const imp = !useMetric;

  const [bodyKg, setBodyKg]       = useState(75);
  const [suitId, setSuitId]       = useState<SuitId>('full5');
  const [tankId, setTankId]       = useState<TankId>('al80');
  const [saltwater, setSaltwater] = useState(true);

  const suit        = SUITS.find(s => s.id === suitId)!;
  const tank        = TANKS.find(t => t.id === tankId)!;
  const waterOffset = saltwater ? 0 : -2.0;

  const bodyFactor = bodyKg * 0.02;
  const raw        = bodyFactor + suit.baseWeightKg + waterOffset + tank.buoyancyOffsetKg;
  const resultKg   = Math.max(0, Math.round(raw * 10) / 10);
  const resultLbs  = Math.round(resultKg * KG_TO_LBS);

  const bodyDisplay = imp ? Math.round(bodyKg * KG_TO_LBS) : bodyKg;

  function handleBodyChange(v: number) {
    setBodyKg(imp ? v / KG_TO_LBS : v);
  }

  const loKg  = Math.max(0, resultKg - 1);
  const hiKg  = resultKg + 1;
  const loLbs = Math.round(loKg  * KG_TO_LBS);
  const hiLbs = Math.round(hiKg  * KG_TO_LBS);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Weight Calculator</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Metric / Imperial toggle */}
          <SegPicker
            options={[{ v: true, l: 'Metric' }, { v: false, l: 'Imperial' }]}
            selected={useMetric}
            onSelect={setUseMetric}
          />

          {/* Body Weight */}
          <SectionLabel label="Body Weight" />
          <Card variant="input">
            <SliderWithInput
              label="Weight"
              value={bodyDisplay}
              min={imp ? 88 : 40}
              max={imp ? 309 : 140}
              step={1}
              suffix={imp ? 'lbs' : 'kg'}
              decimals={0}
              onChange={handleBodyChange}
            />
          </Card>

          {/* Exposure Suit */}
          <SectionLabel label="Exposure Suit" />
          <Card variant="input">
            {SUITS.map((s, i) => (
              <SelectionRow
                key={s.id}
                label={s.label}
                detail={fmtOffset(s.baseWeightKg, useMetric)}
                selected={suitId === s.id}
                onPress={() => setSuitId(s.id)}
                last={i === SUITS.length - 1}
              />
            ))}
          </Card>

          {/* Cylinder / Tank */}
          <SectionLabel label="Cylinder / Tank" />
          <Card variant="input">
            {TANKS.map((t, i) => (
              <SelectionRow
                key={t.id}
                label={t.label}
                detail={fmtOffset(t.buoyancyOffsetKg, useMetric)}
                selected={tankId === t.id}
                onPress={() => setTankId(t.id)}
                last={i === TANKS.length - 1}
              />
            ))}
          </Card>

          {/* Water Type */}
          <SectionLabel label="Water Type" />
          <Card variant="input">
            <SelectionRow
              label="Salt Water"
              detail={fmtOffset(0, useMetric)}
              selected={saltwater}
              onPress={() => setSaltwater(true)}
              last={false}
            />
            <SelectionRow
              label="Fresh Water"
              detail={fmtOffset(-2.0, useMetric)}
              selected={!saltwater}
              onPress={() => setSaltwater(false)}
              last
            />
          </Card>

          {/* Result */}
          <SectionLabel label="Recommended Weight" />
          <Card variant="result">
            {/* Big number */}
            <View style={res.bigRow}>
              <Text style={res.bigNum}>{imp ? resultLbs : resultKg.toFixed(1)}</Text>
              <Text style={res.bigUnit}>{imp ? 'lbs' : 'kg'}</Text>
            </View>
            <Text style={res.secondary}>
              {imp ? `${resultKg.toFixed(1)} kg` : `${resultLbs} lbs`}
            </Text>

            <View style={res.divider} />

            {/* Range */}
            <Text style={res.range}>
              {imp
                ? `Suggested range: ${loLbs}–${hiLbs} lbs  (${loKg.toFixed(1)}–${hiKg.toFixed(1)} kg)`
                : `Suggested range: ${loKg.toFixed(1)}–${hiKg.toFixed(1)} kg  (${loLbs}–${hiLbs} lbs)`
              }
            </Text>

            <View style={res.divider} />

            {/* Breakdown */}
            <BreakdownRow label="Body factor (2% BW)"      value={bodyFactor}           metric={useMetric} />
            <BreakdownRow label={`Suit (${suit.label})`}   value={suit.baseWeightKg}    metric={useMetric} />
            <BreakdownRow label={saltwater ? 'Salt water' : 'Fresh water'} value={waterOffset} metric={useMetric} />
            <BreakdownRow label={`Tank (${tank.label})`}   value={tank.buoyancyOffsetKg} metric={useMetric} />
          </Card>

          <DisclaimerText />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return <Text style={sub.label}>{label}</Text>;
}

function SelectionRow({
  label, detail, selected, onPress, last,
}: {
  label: string; detail: string; selected: boolean; onPress: () => void; last: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[row.container, !last && row.border]}>
      <Text style={[row.name, selected && row.nameSelected]}>{label}</Text>
      <Text style={row.detail}>{detail}</Text>
      <View style={row.checkCell}>
        {selected && <Text style={row.checkIcon}>✓</Text>}
      </View>
    </Pressable>
  );
}

function BreakdownRow({
  label, value, metric,
}: {
  label: string; value: number; metric: boolean;
}) {
  const display = metric ? value : value * KG_TO_LBS;
  const unit    = metric ? 'kg' : 'lbs';
  const sign    = display >= 0 ? '+' : '';
  const color   = display < 0 ? Colors.success : Colors.text;
  return (
    <View style={bk.row}>
      <Text style={bk.label}>{label}</Text>
      <Text style={[bk.value, { color }]}>{sign}{display.toFixed(1)} {unit}</Text>
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
        <Pressable
          key={String(o.v)}
          style={[sp.option, selected === o.v && sp.optionActive]}
          onPress={() => onSelect(o.v)}
        >
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
  option: {
    flex: 1, paddingVertical: Spacing.xs + 2,
    alignItems: 'center', borderRadius: Radius.sm - 2,
  },
  optionActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10, shadowRadius: 2, elevation: 2,
  },
  optLabel: { ...Typography.footnote, fontWeight: '500' as const, color: Colors.textSecondary },
  optLabelActive: { fontWeight: '700' as const, color: Colors.text },
});

const sub = StyleSheet.create({
  label: {
    ...Typography.footnote, fontWeight: '600' as const, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.xl, marginBottom: Spacing.sm, marginHorizontal: 2,
  },
});

const row = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md, gap: Spacing.sm,
  },
  border: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  name: { flex: 1, ...Typography.body, color: Colors.text } as TextStyle,
  nameSelected: { fontWeight: '600' as const, color: Colors.accentBlue },
  detail: {
    ...Typography.footnote, color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  checkCell: { width: 20, alignItems: 'center' },
  checkIcon: { fontSize: 16, color: Colors.accentBlue, fontWeight: '700' as const },
});

const res = StyleSheet.create({
  bigRow: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'center', gap: 6,
  },
  bigNum: {
    fontSize: 48, fontWeight: '700' as const,
    color: Colors.accentBlue, fontVariant: ['tabular-nums'],
  } as TextStyle,
  bigUnit: { ...Typography.title3, color: Colors.accentBlue } as TextStyle,
  secondary: {
    ...Typography.subhead, color: Colors.textSecondary,
    textAlign: 'center', marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  range: {
    ...Typography.footnote, color: Colors.textSecondary,
    textAlign: 'center',
  },
});

const bk = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 3,
  },
  label: { ...Typography.footnote, color: Colors.textSecondary, flex: 1 },
  value: {
    ...Typography.footnote, fontWeight: '600' as const,
    fontVariant: ['tabular-nums'],
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
  headerTitle: { ...Typography.headline, color: Colors.text, flex: 1, textAlign: 'center' },
  headerBack: { ...Typography.body, color: Colors.accentBlue },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
});
