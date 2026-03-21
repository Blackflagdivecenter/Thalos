/**
 * ModePills — horizontal scroll mode selector (Gas Planner, Turn Pressure, etc.)
 * Active: AccentBlue tint background + border + text. Inactive: border only.
 * Matches the deco planner gas configuration pill style.
 */
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
} from 'react-native';
import { Colors, Spacing, Typography } from '@/src/ui/theme';

interface Mode<T extends string> {
  label: string;
  value: T;
}

interface ModePillsProps<T extends string> {
  modes: Mode<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function ModePills<T extends string>({ modes, selected, onSelect }: ModePillsProps<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <View style={styles.row}>
        {modes.map(m => {
          const active = m.value === selected;
          return (
            <Pressable
              key={m.value}
              style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}
              onPress={() => onSelect(m.value)}
            >
              <Text style={[styles.label, active && styles.labelActive] as TextStyle[]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.sm },
  pill: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  pillActive: {
    borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlue + '26',
  },
  pressed: { opacity: 0.7 },
  label: {
    ...(Typography.caption1 as TextStyle),
    fontWeight: '500' as TextStyle['fontWeight'],
    color: Colors.textSecondary,
  },
  labelActive: {
    fontWeight: '600' as TextStyle['fontWeight'],
    color: Colors.accentBlue,
  },
});
