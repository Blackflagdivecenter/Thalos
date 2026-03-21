import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { Colors, Spacing, Typography } from '@/src/ui/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected, onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : styles.unselected,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected] as TextStyle[]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  selected: {
    borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlue + '26',
  },
  unselected: {
    borderColor: Colors.border,
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...(Typography.caption1 as TextStyle),
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  labelSelected:   { color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  labelUnselected: { color: Colors.textSecondary },
});
