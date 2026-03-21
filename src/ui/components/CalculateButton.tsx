/**
 * CalculateButton — full-width primary action button.
 * AccentBlue background, white text, 12pt radius.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';

interface CalculateButtonProps {
  label?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function CalculateButton({ label = 'Calculate', onPress, style }: CalculateButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
      onPress={onPress}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.accentBlue,
    borderRadius: Radius.md,
    paddingVertical: 14,
    marginHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  pressed: { opacity: 0.8 },
  label: {
    ...(Typography.headline as TextStyle),
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
