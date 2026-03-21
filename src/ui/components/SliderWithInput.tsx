/**
 * SliderWithInput
 * ─────────────────────────────────────────────────────────────────────────────
 * A slider row with a tappable value display that switches to an inline
 * text field for manual entry.
 *
 * Normal state:
 *   Label (subheadline, left)  ←→  Value + Suffix (subheadline bold, monospaced, AccentBlue)
 *   Slider below, tinted AccentBlue
 *
 * Editing state (tap the value):
 *   Label (left)  ←→  TextField (70pt) + Suffix + ✓ button (AccentBlue)
 */
import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors, Spacing, Typography } from '@/src/ui/theme';

interface SliderWithInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  decimals?: number;
  onChange: (v: number) => void;
}

export function SliderWithInput({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  decimals = 0,
  onChange,
}: SliderWithInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<TextInput>(null);

  function startEditing() {
    setDraft(value.toFixed(decimals));
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function commit() {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) {
      onChange(Math.min(max, Math.max(min, parsed)));
    }
    setEditing(false);
  }

  const displayVal = value.toFixed(decimals);

  return (
    <View style={styles.root}>
      {/* Label row */}
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={commit}
              selectTextOnFocus
            />
            {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
            <Pressable onPress={commit} style={styles.checkBtn} hitSlop={8}>
              <Text style={styles.checkIcon}>✓</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={startEditing} hitSlop={8}>
            <Text style={styles.value}>
              {displayVal}
              {suffix ? <Text style={styles.valueSuffix}> {suffix}</Text> : null}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Slider */}
      <Slider
        style={styles.slider}
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={Colors.accentBlue}
        maximumTrackTintColor={Colors.border}
        thumbTintColor={Colors.accentBlue}
        onValueChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...(Typography.subhead as TextStyle),
    color: Colors.textSecondary,
  },
  value: {
    ...(Typography.subhead as TextStyle),
    fontWeight: '700',
    color: Colors.accentBlue,
    fontVariant: ['tabular-nums'],
  } as TextStyle,
  valueSuffix: {
    fontWeight: '400',
    color: Colors.accentBlue,
  } as TextStyle,
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    width: 70,
    ...(Typography.subhead as TextStyle),
    fontWeight: '700',
    color: Colors.accentBlue,
    fontVariant: ['tabular-nums'],
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.accentBlue,
    textAlign: 'right',
    paddingVertical: 2,
  } as TextStyle,
  suffix: {
    ...(Typography.subhead as TextStyle),
    color: Colors.textSecondary,
  },
  checkBtn: {
    padding: 4,
    borderRadius: 12,
  },
  checkIcon: {
    fontSize: 18,
    color: Colors.accentBlue,
    fontWeight: '700',
  } as TextStyle,
  slider: { marginTop: Spacing.xs, height: 32 },
});
