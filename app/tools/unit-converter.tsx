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
import { BlurView } from 'expo-blur';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';

const M_TO_FT    = 3.28084;
const BAR_TO_PSI = 14.5038;
const KG_TO_LBS  = 2.20462;

type Category = 'depth' | 'temperature' | 'pressure' | 'weight';

interface QuickRef { left: string; right: string; }

const QUICK_REFS: Record<Category, QuickRef[]> = {
  depth:       [{ left: '10 m', right: '33 ft' }, { left: '18 m', right: '59 ft' }, { left: '30 m', right: '98 ft' }, { left: '40 m', right: '131 ft' }],
  temperature: [{ left: '0 °C', right: '32 °F' }, { left: '20 °C', right: '68 °F' }, { left: '28 °C', right: '82 °F' }, { left: '37 °C', right: '99 °F' }],
  pressure:    [{ left: '50 bar', right: '725 psi' }, { left: '100 bar', right: '1,450 psi' }, { left: '200 bar', right: '2,901 psi' }, { left: '232 bar', right: '3,365 psi' }],
  weight:      [{ left: '1 kg', right: '2.2 lbs' }, { left: '5 kg', right: '11 lbs' }, { left: '10 kg', right: '22 lbs' }, { left: '15 kg', right: '33 lbs' }],
};

function parseN(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}
function fmt(n: number, dec = 2): string { return n.toFixed(dec); }

export default function UnitConverterScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [category, setCategory] = useState<Category>('depth');

  const [left,  setLeft]  = useState('');
  const [right, setRight] = useState('');

  function changeCategory(c: Category) {
    setCategory(c);
    setLeft('');
    setRight('');
  }

  function onLeft(v: string) {
    setLeft(v);
    const n = parseN(v);
    if (n == null) { setRight(''); return; }
    switch (category) {
      case 'depth':       setRight(fmt(n * M_TO_FT, 1));        break;
      case 'temperature': setRight(fmt(n * 9 / 5 + 32, 1));     break;
      case 'pressure':    setRight(fmt(n * BAR_TO_PSI, 1));      break;
      case 'weight':      setRight(fmt(n * KG_TO_LBS, 1));       break;
    }
  }
  function onRight(v: string) {
    setRight(v);
    const n = parseN(v);
    if (n == null) { setLeft(''); return; }
    switch (category) {
      case 'depth':       setLeft(fmt(n / M_TO_FT));             break;
      case 'temperature': setLeft(fmt((n - 32) * 5 / 9));        break;
      case 'pressure':    setLeft(fmt(n / BAR_TO_PSI));          break;
      case 'weight':      setLeft(fmt(n / KG_TO_LBS));           break;
    }
  }

  const labels: Record<Category, { left: string; right: string; leftUnit: string; rightUnit: string }> = {
    depth:       { left: 'Meters', right: 'Feet',       leftUnit: 'm',   rightUnit: 'ft'  },
    temperature: { left: 'Celsius', right: 'Fahrenheit', leftUnit: '°C',  rightUnit: '°F'  },
    pressure:    { left: 'Bar',     right: 'PSI',        leftUnit: 'bar', rightUnit: 'psi' },
    weight:      { left: 'Kilograms', right: 'Pounds',   leftUnit: 'kg',  rightUnit: 'lbs' },
  };
  const lbl = labels[category];
  const refs = QUICK_REFS[category];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn}>
          <Text style={styles.headerBack}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Unit Converter</Text>
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
          {/* Category picker */}
          <View style={cat.container}>
            {(['depth', 'temperature', 'pressure', 'weight'] as Category[]).map((c) => (
              <Pressable
                key={c}
                style={[cat.option, category === c && cat.optionActive]}
                onPress={() => changeCategory(c)}
              >
                <Text style={[cat.label, category === c && cat.labelActive]}>
                  {c === 'depth' ? 'Depth' : c === 'temperature' ? 'Temp' : c === 'pressure' ? 'Pressure' : 'Weight'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Converter card */}
          <View style={{ marginTop: Spacing.xl }}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={80} tint="regular" style={conv.card}>
                <ConverterRow
                  leftLabel={lbl.left} leftValue={left} onChangeLeft={onLeft} leftUnit={lbl.leftUnit}
                  rightLabel={lbl.right} rightValue={right} onChangeRight={onRight} rightUnit={lbl.rightUnit}
                />
              </BlurView>
            ) : (
              <View style={[conv.card, conv.cardAndroid]}>
                <ConverterRow
                  leftLabel={lbl.left} leftValue={left} onChangeLeft={onLeft} leftUnit={lbl.leftUnit}
                  rightLabel={lbl.right} rightValue={right} onChangeRight={onRight} rightUnit={lbl.rightUnit}
                />
              </View>
            )}
          </View>

          {/* Quick Reference */}
          <Text style={styles.qrTitle}>Quick Reference</Text>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="regular" style={conv.refCard}>
              {refs.map((r, i) => (
                <View key={i}>
                  {i > 0 && <View style={conv.refDivider} />}
                  <View style={conv.refRow}>
                    <Text style={conv.refLeft}>{r.left}</Text>
                    <Text style={conv.refEq}>=</Text>
                    <Text style={conv.refRight}>{r.right}</Text>
                  </View>
                </View>
              ))}
            </BlurView>
          ) : (
            <View style={[conv.refCard, conv.cardAndroid]}>
              {refs.map((r, i) => (
                <View key={i}>
                  {i > 0 && <View style={conv.refDivider} />}
                  <View style={conv.refRow}>
                    <Text style={conv.refLeft}>{r.left}</Text>
                    <Text style={conv.refEq}>=</Text>
                    <Text style={conv.refRight}>{r.right}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function ConverterRow({
  leftLabel, leftValue, onChangeLeft, leftUnit,
  rightLabel, rightValue, onChangeRight, rightUnit,
}: {
  leftLabel: string; leftValue: string; onChangeLeft: (v: string) => void; leftUnit: string;
  rightLabel: string; rightValue: string; onChangeRight: (v: string) => void; rightUnit: string;
}) {
  return (
    <View style={conv.row}>
      <View style={conv.field}>
        <Text style={conv.fieldLabel}>{leftLabel}</Text>
        <View style={conv.inputRow}>
          <TextInput
            style={conv.input}
            value={leftValue}
            onChangeText={onChangeLeft}
            placeholder="0"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
          />
          <Text style={conv.unit}>{leftUnit}</Text>
        </View>
      </View>
      <Text style={conv.arrow}>⇄</Text>
      <View style={conv.field}>
        <Text style={conv.fieldLabel}>{rightLabel}</Text>
        <View style={conv.inputRow}>
          <TextInput
            style={conv.input}
            value={rightValue}
            onChangeText={onChangeRight}
            placeholder="0"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="decimal-pad"
          />
          <Text style={conv.unit}>{rightUnit}</Text>
        </View>
      </View>
    </View>
  );
}

const cat = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: Colors.border,
    borderRadius: Radius.sm, padding: 2, marginTop: Spacing.lg,
  },
  option: { flex: 1, paddingVertical: Spacing.xs + 2, alignItems: 'center', borderRadius: Radius.sm - 2 },
  optionActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 2, elevation: 2,
  },
  label: { ...Typography.caption2, fontWeight: '500' as const, color: Colors.textSecondary },
  labelActive: { fontWeight: '700' as const, color: Colors.text },
});

const conv = StyleSheet.create({
  card: { borderRadius: Radius.md, padding: Spacing.lg, overflow: 'hidden' },
  cardAndroid: { backgroundColor: 'rgba(255,255,255,0.92)' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.md },
  field: { flex: 1 },
  fieldLabel: { ...Typography.caption1, color: Colors.textSecondary, marginBottom: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  input: {
    ...Typography.body, color: Colors.text,
    flex: 1, paddingVertical: Spacing.xs, minHeight: 36,
  },
  unit: { ...Typography.caption1, color: Colors.textSecondary, width: 30 },
  arrow: { fontSize: 18, color: Colors.textTertiary, paddingBottom: Spacing.sm },
  refCard: { borderRadius: Radius.md, overflow: 'hidden' },
  refDivider: { height: 1, backgroundColor: Colors.border },
  refRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
  },
  refLeft: { ...Typography.subhead, color: Colors.text, fontVariant: ['tabular-nums'] } as any,
  refEq: { ...Typography.subhead, color: Colors.textSecondary },
  refRight: { ...Typography.subhead, color: Colors.accentBlue, fontVariant: ['tabular-nums'] } as any,
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
  qrTitle: {
    ...Typography.subhead, fontWeight: '700' as const, color: Colors.text,
    marginTop: Spacing.xl, marginBottom: Spacing.sm,
  },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg },
});
